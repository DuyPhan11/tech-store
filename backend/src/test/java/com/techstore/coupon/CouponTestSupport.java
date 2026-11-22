package com.techstore.coupon;

import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponUsage;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.entity.DiscountType;
import com.techstore.coupon.repository.CouponRepository;
import com.techstore.coupon.repository.CouponUsageRepository;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.product.repository.BranchRepository;
import com.techstore.user.entity.User;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.UUID;

/** Dữ liệu dùng chung cho test UC13: tạo coupon và usage (usage cần Order thật để thỏa FK). */
@Component
public class CouponTestSupport {

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final OrderRepository orderRepository;
    private final BranchRepository branchRepository;

    public CouponTestSupport(CouponRepository couponRepository, CouponUsageRepository couponUsageRepository,
                             OrderRepository orderRepository, BranchRepository branchRepository) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.orderRepository = orderRepository;
        this.branchRepository = branchRepository;
    }

    public static String uniqueCode(String prefix) {
        return prefix + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase();
    }

    public Coupon coupon(String code, DiscountType type, String value, String minOrder, String maxDiscount,
                         int usageLimit, int usedCount, LocalDateTime start, LocalDateTime end, boolean active) {
        Coupon c = new Coupon();
        c.setCode(code);
        c.setDiscountType(type);
        c.setDiscountValue(new BigDecimal(value));
        c.setMinOrderAmount(new BigDecimal(minOrder));
        c.setMaxDiscountAmount(maxDiscount == null ? null : new BigDecimal(maxDiscount));
        c.setUsageLimit(usageLimit);
        c.setUsedCount(usedCount);
        c.setStartDate(start);
        c.setEndDate(end);
        c.setActive(active);
        return couponRepository.saveAndFlush(c);
    }

    /** Coupon đang hiệu lực (từ hôm qua đến 30 ngày sau). */
    public Coupon activeCoupon(String code, DiscountType type, String value, String minOrder, String maxDiscount) {
        LocalDateTime now = LocalDateTime.now();
        return coupon(code, type, value, minOrder, maxDiscount, 100, 0, now.minusDays(1), now.plusDays(30), true);
    }

    /** Tạo 1 dòng coupon_usages (kèm Order tối thiểu để thỏa FK). */
    public CouponUsage usage(Coupon coupon, User user, CouponUsageStatus status) {
        Order order = new Order();
        order.setOrderCode("CPN-" + UUID.randomUUID().toString().substring(0, 12).toUpperCase());
        order.setUser(user);
        order.setBranch(branchRepository.findFirstByNameOrderByIdAsc("Chi nhánh Quận 1").orElseThrow());
        order.setRecipientName("Người nhận test");
        order.setRecipientPhone("0901234567");
        order.setShippingAddress("1 Test, TP.HCM");
        order.setTotalItemsAmount(new BigDecimal("1000000"));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setFinalAmount(new BigDecimal("1000000"));
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(PaymentMethod.COD);
        order.setPaymentStatus(PaymentStatus.UNPAID);
        Order saved = orderRepository.saveAndFlush(order);
        return couponUsageRepository.saveAndFlush(new CouponUsage(coupon.getId(), user.getId(), saved.getId(), status));
    }
}
