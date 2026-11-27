package com.techstore.review.service;

import com.techstore.common.exception.AccountLockedException;
import com.techstore.common.exception.OrderNotFoundException;
import com.techstore.common.exception.ProductNotFoundException;
import com.techstore.common.exception.ReviewConflictException;
import com.techstore.common.exception.ReviewNotFoundException;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.ProductRepository;
import com.techstore.review.dto.CreateReviewRequest;
import com.techstore.review.dto.EligibleReviewOrderDto;
import com.techstore.review.dto.ProductReviewsResponse;
import com.techstore.review.dto.ReviewResponse;
import com.techstore.review.dto.UpdateReviewRequest;
import com.techstore.review.entity.Review;
import com.techstore.review.entity.ReviewStatus;
import com.techstore.review.repository.ReviewRepository;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.UserRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
public class ReviewServiceImpl implements ReviewService {

    private static final String DEFAULT_OWNER_HIDE_REASON = "Chủ sở hữu tự ẩn đánh giá";

    private final ReviewRepository reviewRepository;
    private final OrderRepository orderRepository;
    private final ProductRepository productRepository;
    private final UserRepository userRepository;

    public ReviewServiceImpl(ReviewRepository reviewRepository,
                             OrderRepository orderRepository,
                             ProductRepository productRepository,
                             UserRepository userRepository) {
        this.reviewRepository = reviewRepository;
        this.orderRepository = orderRepository;
        this.productRepository = productRepository;
        this.userRepository = userRepository;
    }

    @Override
    @Transactional(readOnly = true)
    public ProductReviewsResponse getProductReviews(Long productId) {
        if (!productRepository.existsById(productId)) {
            throw new ProductNotFoundException("Sản phẩm không tồn tại");
        }
        List<Review> visible = reviewRepository.findByProductIdAndStatusOrderByCreatedAtDesc(productId, ReviewStatus.VISIBLE);
        int totalReviews = visible.size();
        double averageRating = totalReviews == 0
                ? 0.0
                : Math.round((visible.stream().mapToInt(Review::getRating).average().orElse(0.0)) * 10.0) / 10.0;

        List<ReviewResponse> items = visible.stream().map(this::toResponse).toList();
        return new ProductReviewsResponse(productId, averageRating, totalReviews, items);
    }

    @Override
    @Transactional(readOnly = true)
    public List<EligibleReviewOrderDto> getEligibleOrders(Long userId, Long productId) {
        requireActiveUser(userId);
        if (!productRepository.existsById(productId)) {
            throw new ProductNotFoundException("Sản phẩm không tồn tại");
        }
        return orderRepository.findEligibleCompletedOrdersForReview(userId, productId)
                .stream()
                .map(o -> new EligibleReviewOrderDto(o.getId(), o.getOrderCode(), o.getUpdatedAt()))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ReviewResponse> getMyReviews(Long userId) {
        requireActiveUser(userId);
        return reviewRepository.findByUserIdOrderByCreatedAtDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public ReviewResponse createReview(Long userId, CreateReviewRequest request) {
        User user = requireActiveUser(userId);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ProductNotFoundException("Sản phẩm không tồn tại"));

        Order order = orderRepository.findByIdAndUserId(request.getOrderId(), userId)
                .orElseThrow(() -> new OrderNotFoundException("Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn"));

        if (order.getStatus() != OrderStatus.COMPLETED) {
            throw new ReviewConflictException("Chỉ có thể đánh giá sản phẩm từ đơn hàng đã hoàn tất (COMPLETED)");
        }

        boolean productInOrder = order.getItems().stream()
                .anyMatch(item -> item.getProduct() != null && item.getProduct().getId().equals(product.getId()));
        if (!productInOrder) {
            throw new IllegalArgumentException("Sản phẩm không nằm trong đơn hàng đã chọn");
        }

        if (reviewRepository.existsByUserIdAndProductIdAndOrderId(userId, product.getId(), order.getId())) {
            throw new ReviewConflictException("Bạn đã đánh giá sản phẩm này cho đơn hàng #" + order.getOrderCode() + " rồi");
        }

        Review review = new Review();
        review.setUser(user);
        review.setProduct(product);
        review.setOrder(order);
        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());
        review.setStatus(ReviewStatus.VISIBLE);

        try {
            Review saved = reviewRepository.saveAndFlush(review);
            return toResponse(saved);
        } catch (DataIntegrityViolationException ex) {
            throw new ReviewConflictException("Bạn đã đánh giá sản phẩm này cho đơn hàng #" + order.getOrderCode() + " rồi");
        }
    }

    @Override
    @Transactional
    public ReviewResponse updateReview(Long userId, Long reviewId, UpdateReviewRequest request) {
        requireActiveUser(userId);
        Review review = reviewRepository.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new ReviewNotFoundException("Đánh giá không tồn tại hoặc không thuộc quyền sở hữu của bạn"));

        if (review.getStatus() == ReviewStatus.HIDDEN_BY_ADMIN) {
            throw new ReviewConflictException("Đánh giá đã bị quản trị viên ẩn, không thể chỉnh sửa");
        }
        if (review.getStatus() == ReviewStatus.HIDDEN_BY_OWNER) {
            throw new ReviewConflictException("Đánh giá đã bị ẩn, không thể chỉnh sửa");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment().trim());
        return toResponse(reviewRepository.save(review));
    }

    @Override
    @Transactional
    public ReviewResponse hideReview(Long userId, Long reviewId, String reason) {
        requireActiveUser(userId);
        Review review = reviewRepository.findByIdAndUserId(reviewId, userId)
                .orElseThrow(() -> new ReviewNotFoundException("Đánh giá không tồn tại hoặc không thuộc quyền sở hữu của bạn"));

        if (review.getStatus() == ReviewStatus.HIDDEN_BY_ADMIN) {
            throw new ReviewConflictException("Đánh giá đã bị quản trị viên ẩn");
        }
        if (review.getStatus() == ReviewStatus.HIDDEN_BY_OWNER) {
            throw new ReviewConflictException("Đánh giá đã được ẩn trước đó");
        }

        review.setStatus(ReviewStatus.HIDDEN_BY_OWNER);
        review.setHiddenAt(LocalDateTime.now());
        String normalizedReason = (reason != null && !reason.isBlank()) ? reason.trim() : DEFAULT_OWNER_HIDE_REASON;
        review.setHiddenReason(normalizedReason);
        return toResponse(reviewRepository.save(review));
    }

    private User requireActiveUser(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AccountLockedException("Tài khoản của bạn đã bị khóa");
        }
        return user;
    }

    private ReviewResponse toResponse(Review r) {
        return new ReviewResponse(
                r.getId(),
                r.getUser().getId(),
                r.getUser().getFullName(),
                r.getProduct().getId(),
                r.getProduct().getName(),
                r.getProduct().getSlug(),
                r.getOrder().getId(),
                r.getOrder().getOrderCode(),
                r.getRating(),
                r.getComment(),
                r.getStatus().name(),
                r.getHiddenAt(),
                r.getHiddenReason(),
                r.getCreatedAt(),
                r.getUpdatedAt()
        );
    }
}
