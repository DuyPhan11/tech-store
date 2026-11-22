package com.techstore.coupon.service;

import com.techstore.common.exception.InvalidCouponException;
import com.techstore.common.exception.InvalidCouponException.Reason;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponDisplayStatus;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.entity.DiscountType;
import com.techstore.coupon.repository.CouponUsageRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDateTime;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

/** UC13 — Quy tắc tính tiền và kiểm tra coupon dùng chung (ADR-022 mục 4). Unit test, không Spring. */
class CouponServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 22, 12, 0);

    private CouponUsageRepository usageRepository;
    private CouponService service;

    @BeforeEach
    void setUp() {
        usageRepository = mock(CouponUsageRepository.class);
        service = new CouponService(usageRepository);
    }

    private static Coupon coupon(DiscountType type, String value, String minOrder, String maxDiscount) {
        Coupon c = new Coupon();
        c.setId(7L);
        c.setCode("TEST");
        c.setDiscountType(type);
        c.setDiscountValue(new BigDecimal(value));
        c.setMinOrderAmount(new BigDecimal(minOrder));
        c.setMaxDiscountAmount(maxDiscount == null ? null : new BigDecimal(maxDiscount));
        c.setUsageLimit(10);
        c.setUsedCount(0);
        c.setStartDate(NOW.minusDays(1));
        c.setEndDate(NOW.plusDays(1));
        c.setActive(true);
        return c;
    }

    private static BigDecimal vnd(String v) {
        return new BigDecimal(v).setScale(2);
    }

    private static Reason reasonOf(Runnable call) {
        return assertThrows(InvalidCouponException.class, call::run).getReason();
    }

    @Test
    @DisplayName("PERCENTAGE không giới hạn: floor(subtotal × % / 100), làm tròn xuống đồng")
    void percentageWithoutCapRoundsDown() {
        Coupon c = coupon(DiscountType.PERCENTAGE, "15", "0", null);
        assertEquals(vnd("2848500"), service.calculateDiscount(c, new BigDecimal("18990000")));
        // 33333 × 15% = 4999.95 → 4999
        assertEquals(vnd("4999"), service.calculateDiscount(c, new BigDecimal("33333")));
        // phần trăm thập phân 12.5%
        c.setDiscountValue(new BigDecimal("12.5"));
        assertEquals(vnd("1249"), service.calculateDiscount(c, new BigDecimal("9999")));
    }

    @Test
    @DisplayName("PERCENTAGE có maxDiscountAmount: bị chặn bởi mức tối đa")
    void percentageWithCap() {
        Coupon c = coupon(DiscountType.PERCENTAGE, "10", "0", "2000000");
        assertEquals(vnd("2000000"), service.calculateDiscount(c, new BigDecimal("28990000")));
        assertEquals(vnd("1899000"), service.calculateDiscount(c, new BigDecimal("18990000")));
    }

    @Test
    @DisplayName("PERCENTAGE 100% giảm đúng bằng subtotal")
    void percentageHundred() {
        Coupon c = coupon(DiscountType.PERCENTAGE, "100", "0", null);
        assertEquals(vnd("2490000"), service.calculateDiscount(c, new BigDecimal("2490000")));
    }

    @Test
    @DisplayName("FIXED_AMOUNT: giảm đúng giá trị; lớn hơn subtotal thì giảm bằng subtotal")
    void fixedAmount() {
        Coupon c = coupon(DiscountType.FIXED_AMOUNT, "500000", "0", null);
        assertEquals(vnd("500000"), service.calculateDiscount(c, new BigDecimal("18990000")));
        assertEquals(vnd("300000"), service.calculateDiscount(c, new BigDecimal("300000")));
        assertEquals(vnd("0"), service.calculateDiscount(c, BigDecimal.ZERO));
    }

    @Test
    @DisplayName("validate: coupon hợp lệ không ném lỗi, kể cả đúng biên startDate/endDate và subtotal = minOrder")
    void validateBoundaries() {
        Coupon c = coupon(DiscountType.FIXED_AMOUNT, "100000", "1000000", null);
        assertDoesNotThrow(() -> service.validate(c, 1L, new BigDecimal("1000000"), NOW));
        assertDoesNotThrow(() -> service.validate(c, 1L, new BigDecimal("1000000"), c.getStartDate()));
        assertDoesNotThrow(() -> service.validate(c, 1L, new BigDecimal("1000000"), c.getEndDate()));
    }

    @Test
    @DisplayName("validate: từng lý do từ chối theo đúng thứ tự")
    void validateReasons() {
        BigDecimal subtotal = new BigDecimal("5000000");

        assertEquals(Reason.NOT_FOUND, reasonOf(() -> service.validate(null, 1L, subtotal, NOW)));

        Coupon disabled = coupon(DiscountType.PERCENTAGE, "10", "0", null);
        disabled.setActive(false);
        assertEquals(Reason.DISABLED, reasonOf(() -> service.validate(disabled, 1L, subtotal, NOW)));

        Coupon notStarted = coupon(DiscountType.PERCENTAGE, "10", "0", null);
        notStarted.setStartDate(NOW.plusSeconds(1));
        assertEquals(Reason.NOT_STARTED, reasonOf(() -> service.validate(notStarted, 1L, subtotal, NOW)));

        Coupon expired = coupon(DiscountType.PERCENTAGE, "10", "0", null);
        expired.setEndDate(NOW.minusSeconds(1));
        assertEquals(Reason.EXPIRED, reasonOf(() -> service.validate(expired, 1L, subtotal, NOW)));

        Coupon exhausted = coupon(DiscountType.PERCENTAGE, "10", "0", null);
        exhausted.setUsedCount(10);
        assertEquals(Reason.EXHAUSTED, reasonOf(() -> service.validate(exhausted, 1L, subtotal, NOW)));

        Coupon minOrder = coupon(DiscountType.PERCENTAGE, "10", "10000000", null);
        InvalidCouponException ex = assertThrows(InvalidCouponException.class,
                () -> service.validate(minOrder, 1L, subtotal, NOW));
        assertEquals(Reason.MIN_ORDER_NOT_MET, ex.getReason());
        assertTrue(ex.getMessage().contains("10.000.000đ"), ex.getMessage());

        Coupon used = coupon(DiscountType.PERCENTAGE, "10", "0", null);
        when(usageRepository.existsByCouponIdAndUserIdAndStatus(eq(7L), eq(1L), eq(CouponUsageStatus.ACTIVE))).thenReturn(true);
        assertEquals(Reason.ALREADY_USED, reasonOf(() -> service.validate(used, 1L, subtotal, NOW)));
        // user khác vẫn dùng được
        assertDoesNotThrow(() -> service.validate(used, 2L, subtotal, NOW));
    }

    @Test
    @DisplayName("Usage REVERSED không chặn user (chỉ ACTIVE mới bị tính)")
    void reversedUsageDoesNotBlock() {
        when(usageRepository.existsByCouponIdAndUserIdAndStatus(any(), any(), eq(CouponUsageStatus.REVERSED))).thenReturn(true);
        Coupon c = coupon(DiscountType.PERCENTAGE, "10", "0", null);
        assertDoesNotThrow(() -> service.validate(c, 1L, new BigDecimal("1000000"), NOW));
    }

    @Test
    @DisplayName("displayStatus theo thứ tự ưu tiên DISABLED > EXPIRED > EXHAUSTED > SCHEDULED > ACTIVE")
    void displayStatusPriority() {
        Coupon c = coupon(DiscountType.PERCENTAGE, "10", "0", null);
        assertEquals(CouponDisplayStatus.ACTIVE, service.displayStatus(c, NOW));

        c.setStartDate(NOW.plusDays(1));
        c.setEndDate(NOW.plusDays(2));
        assertEquals(CouponDisplayStatus.SCHEDULED, service.displayStatus(c, NOW));

        c.setUsedCount(10);
        assertEquals(CouponDisplayStatus.EXHAUSTED, service.displayStatus(c, NOW));

        c.setStartDate(NOW.minusDays(3));
        c.setEndDate(NOW.minusDays(1));
        assertEquals(CouponDisplayStatus.EXPIRED, service.displayStatus(c, NOW));

        c.setActive(false);
        assertEquals(CouponDisplayStatus.DISABLED, service.displayStatus(c, NOW));
    }
}
