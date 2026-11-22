package com.techstore.coupon.service;

import com.techstore.common.exception.AccountLockedException;
import com.techstore.common.exception.CartItemNotFoundException;
import com.techstore.common.exception.InvalidCouponException;
import com.techstore.common.exception.InvalidCouponException.Reason;
import com.techstore.common.exception.ProductNotFoundException;
import com.techstore.cart.entity.Cart;
import com.techstore.cart.entity.CartItem;
import com.techstore.cart.repository.CartItemRepository;
import com.techstore.cart.repository.CartRepository;
import com.techstore.coupon.dto.CouponPreviewRequest;
import com.techstore.coupon.dto.CouponPreviewResponse;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.repository.CouponRepository;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.ProductRepository;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * UC07/UC13 — Xem trước mã giảm giá (ADR-022 mục 5). Subtotal tính ở server theo giá hiện tại.
 * Chỉ đọc: KHÔNG khóa, KHÔNG tạo coupon_usages, KHÔNG tăng used_count.
 */
@Service
public class CouponPreviewService {

    private final UserRepository userRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final ProductRepository productRepository;
    private final CouponRepository couponRepository;
    private final CouponService couponService;

    public CouponPreviewService(UserRepository userRepository, CartRepository cartRepository,
                                CartItemRepository cartItemRepository, ProductRepository productRepository,
                                CouponRepository couponRepository, CouponService couponService) {
        this.userRepository = userRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.productRepository = productRepository;
        this.couponRepository = couponRepository;
        this.couponService = couponService;
    }

    @Transactional(readOnly = true)
    public CouponPreviewResponse preview(Long userId, CouponPreviewRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng"));
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AccountLockedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.");
        }

        BigDecimal subtotal = "CART".equals(request.source())
                ? cartSubtotal(userId, request.selectedCartItemIds())
                : buyNowSubtotal(request.productId(), request.quantity());

        String code = request.couponCode().trim().toUpperCase(Locale.ROOT);
        Coupon coupon = couponRepository.findByCode(code)
                .orElseThrow(() -> new InvalidCouponException(Reason.NOT_FOUND, "Mã giảm giá " + code + " không tồn tại"));

        couponService.validate(coupon, userId, subtotal, LocalDateTime.now());
        BigDecimal discount = couponService.calculateDiscount(coupon, subtotal);
        return new CouponPreviewResponse(coupon.getCode(), subtotal, discount, subtotal.subtract(discount));
    }

    /** Giống checkout: cart item phải thuộc giỏ của user (khác → 404), sản phẩm phải ACTIVE (→ 400). */
    private BigDecimal cartSubtotal(Long userId, List<Long> selectedIds) {
        if (selectedIds == null || selectedIds.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn ít nhất một sản phẩm từ giỏ hàng");
        }
        Set<Long> remaining = new HashSet<>(selectedIds);
        BigDecimal subtotal = BigDecimal.ZERO;
        Cart cart = cartRepository.findByUserId(userId).orElse(null);
        if (cart != null) {
            for (CartItem item : cartItemRepository.findByCartIdOrderByIdAsc(cart.getId())) {
                if (!remaining.remove(item.getId())) {
                    continue;
                }
                subtotal = subtotal.add(linePrice(item.getProduct(), item.getQuantity()));
            }
        }
        if (!remaining.isEmpty()) {
            throw new CartItemNotFoundException("Một số mục giỏ hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn");
        }
        return subtotal.setScale(2);
    }

    private BigDecimal buyNowSubtotal(Long productId, Integer quantity) {
        if (productId == null) {
            throw new IllegalArgumentException("Sản phẩm mua ngay không hợp lệ (thiếu productId)");
        }
        if (quantity == null || quantity < 1) {
            throw new IllegalArgumentException("Số lượng mua phải lớn hơn hoặc bằng 1");
        }
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ProductNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh"));
        return linePrice(product, quantity).setScale(2);
    }

    private BigDecimal linePrice(Product product, int quantity) {
        if (product == null || product.getStatus() != ActiveStatus.ACTIVE) {
            throw new IllegalArgumentException("Sản phẩm "
                    + (product != null ? "'" + product.getName() + "' " : "") + "đã ngừng kinh doanh");
        }
        return product.getPrice().multiply(BigDecimal.valueOf(quantity));
    }
}
