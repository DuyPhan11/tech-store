package com.techstore.coupon.service;

import com.techstore.common.exception.InvalidCouponException;
import com.techstore.common.exception.InvalidCouponException.Reason;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponDisplayStatus;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.entity.DiscountType;
import com.techstore.coupon.repository.CouponUsageRepository;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.text.DecimalFormat;
import java.text.DecimalFormatSymbols;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * Quy tắc coupon dùng chung (UC13, ADR-022 mục 4). Preview (FS15) và checkout (FS16) cùng gọi.
 * Lớp này không khóa, không ghi usage và không đổi used_count.
 */
@Service
public class CouponService {

    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);
    private static final DateTimeFormatter DATE_FMT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    private final CouponUsageRepository couponUsageRepository;

    public CouponService(CouponUsageRepository couponUsageRepository) {
        this.couponUsageRepository = couponUsageRepository;
    }

    /**
     * Kiểm tra coupon áp dụng được cho user với subtotal tại thời điểm {@code now}.
     * Thứ tự: tắt → chưa tới hạn → quá hạn → hết lượt → dưới đơn tối thiểu → user đã có usage ACTIVE.
     *
     * @throws InvalidCouponException (400) kèm lý do cụ thể
     */
    public void validate(Coupon coupon, Long userId, BigDecimal subtotal, LocalDateTime now) {
        if (coupon == null) {
            throw new InvalidCouponException(Reason.NOT_FOUND, "Mã giảm giá không tồn tại");
        }
        String code = coupon.getCode();
        if (!coupon.isActive()) {
            throw new InvalidCouponException(Reason.DISABLED, "Mã giảm giá " + code + " đã bị vô hiệu hóa");
        }
        if (now.isBefore(coupon.getStartDate())) {
            throw new InvalidCouponException(Reason.NOT_STARTED,
                    "Mã giảm giá " + code + " chưa đến thời gian áp dụng (từ " + coupon.getStartDate().format(DATE_FMT) + ")");
        }
        if (now.isAfter(coupon.getEndDate())) {
            throw new InvalidCouponException(Reason.EXPIRED,
                    "Mã giảm giá " + code + " đã hết hạn (đến " + coupon.getEndDate().format(DATE_FMT) + ")");
        }
        if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
            throw new InvalidCouponException(Reason.EXHAUSTED, "Mã giảm giá " + code + " đã hết lượt sử dụng");
        }
        BigDecimal minOrder = coupon.getMinOrderAmount() != null ? coupon.getMinOrderAmount() : BigDecimal.ZERO;
        if (subtotal.compareTo(minOrder) < 0) {
            throw new InvalidCouponException(Reason.MIN_ORDER_NOT_MET,
                    "Đơn hàng chưa đạt giá trị tối thiểu " + formatVnd(minOrder) + " để dùng mã " + code);
        }
        if (userId != null && couponUsageRepository.existsByCouponIdAndUserIdAndStatus(
                coupon.getId(), userId, CouponUsageStatus.ACTIVE)) {
            throw new InvalidCouponException(Reason.ALREADY_USED, "Bạn đã sử dụng mã giảm giá " + code);
        }
    }

    /**
     * Số tiền giảm, làm tròn xuống đồng và luôn ≤ subtotal.
     * PERCENTAGE = floor(subtotal × value / 100), giới hạn bởi maxDiscountAmount; FIXED_AMOUNT = value.
     */
    public BigDecimal calculateDiscount(Coupon coupon, BigDecimal subtotal) {
        if (subtotal == null || subtotal.signum() <= 0) {
            return BigDecimal.ZERO.setScale(2);
        }
        BigDecimal discount;
        if (coupon.getDiscountType() == DiscountType.PERCENTAGE) {
            discount = subtotal.multiply(coupon.getDiscountValue()).divide(HUNDRED, 0, RoundingMode.FLOOR);
            BigDecimal max = coupon.getMaxDiscountAmount();
            if (max != null && discount.compareTo(max) > 0) {
                discount = max;
            }
        } else {
            discount = coupon.getDiscountValue();
        }
        discount = discount.setScale(0, RoundingMode.FLOOR);
        BigDecimal cap = subtotal.setScale(0, RoundingMode.FLOOR);
        if (discount.compareTo(cap) > 0) {
            discount = cap;
        }
        return discount.setScale(2);
    }

    /** Trạng thái hiển thị (ADR-022): DISABLED > EXPIRED > EXHAUSTED > SCHEDULED > ACTIVE. */
    public CouponDisplayStatus displayStatus(Coupon coupon, LocalDateTime now) {
        if (!coupon.isActive()) {
            return CouponDisplayStatus.DISABLED;
        }
        if (now.isAfter(coupon.getEndDate())) {
            return CouponDisplayStatus.EXPIRED;
        }
        if (coupon.getUsedCount() >= coupon.getUsageLimit()) {
            return CouponDisplayStatus.EXHAUSTED;
        }
        if (now.isBefore(coupon.getStartDate())) {
            return CouponDisplayStatus.SCHEDULED;
        }
        return CouponDisplayStatus.ACTIVE;
    }

    static String formatVnd(BigDecimal amount) {
        DecimalFormat format = new DecimalFormat("#,##0", DecimalFormatSymbols.getInstance(Locale.GERMANY));
        return format.format(amount.setScale(0, RoundingMode.FLOOR)) + "đ";
    }
}
