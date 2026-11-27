package com.techstore.review.service;

import com.techstore.common.audit.AuditLogService;
import com.techstore.common.exception.ReviewConflictException;
import com.techstore.common.exception.ReviewNotFoundException;
import com.techstore.review.dto.admin.AdminReviewResponse;
import com.techstore.review.entity.Review;
import com.techstore.review.entity.ReviewStatus;
import com.techstore.review.repository.ReviewRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Map;

@Service
public class AdminReviewServiceImpl implements AdminReviewService {

    private final ReviewRepository reviewRepository;
    private final AuditLogService auditLogService;

    public AdminReviewServiceImpl(ReviewRepository reviewRepository, AuditLogService auditLogService) {
        this.reviewRepository = reviewRepository;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<AdminReviewResponse> listReviews(String status, String q) {
        ReviewStatus statusFilter = parseStatus(status);
        String pattern = (q != null && !q.isBlank()) ? "%" + q.trim().toLowerCase(Locale.ROOT) + "%" : null;
        return reviewRepository.searchForAdmin(statusFilter, pattern)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional
    public AdminReviewResponse hideReview(Long adminId, Long reviewId, String reason) {
        Review review = reviewRepository.findByIdForUpdate(reviewId)
                .orElseThrow(() -> new ReviewNotFoundException("Đánh giá không tồn tại"));

        if (review.getStatus() != ReviewStatus.VISIBLE) {
            throw new ReviewConflictException("Chỉ có thể ẩn đánh giá đang ở trạng thái hiển thị (VISIBLE)");
        }

        String normalizedReason = reason.trim();
        review.setStatus(ReviewStatus.HIDDEN_BY_ADMIN);
        review.setHiddenAt(LocalDateTime.now());
        review.setHiddenReason(normalizedReason);
        Review saved = reviewRepository.save(review);

        auditLogService.record(
                adminId,
                "REVIEW_HIDDEN_BY_ADMIN",
                "reviews",
                saved.getId(),
                Map.of(
                        "productId", saved.getProduct().getId(),
                        "orderId", saved.getOrder().getId(),
                        "previousStatus", ReviewStatus.VISIBLE.name(),
                        "newStatus", ReviewStatus.HIDDEN_BY_ADMIN.name(),
                        "reason", normalizedReason
                )
        );

        return toResponse(saved);
    }

    private static ReviewStatus parseStatus(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        try {
            return ReviewStatus.valueOf(raw.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Trạng thái đánh giá không hợp lệ: " + raw);
        }
    }

    private AdminReviewResponse toResponse(Review r) {
        return new AdminReviewResponse(
                r.getId(),
                r.getProduct().getId(),
                r.getProduct().getName(),
                r.getProduct().getSlug(),
                r.getUser().getId(),
                r.getUser().getFullName(),
                r.getUser().getEmail(),
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
