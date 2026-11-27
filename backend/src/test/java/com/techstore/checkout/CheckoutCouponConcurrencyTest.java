package com.techstore.checkout;

import com.techstore.checkout.dto.CheckoutResponse;
import com.techstore.checkout.service.CheckoutService;
import com.techstore.common.exception.InvalidCouponException;
import com.techstore.common.exception.OrderCannotBeCancelledException;
import com.techstore.common.exception.OrderStatusConflictException;
import com.techstore.coupon.CouponTestSupport;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.entity.DiscountType;
import com.techstore.coupon.repository.CouponRepository;
import com.techstore.coupon.repository.CouponUsageRepository;
import com.techstore.order.OrderTestFixtures;
import com.techstore.order.OrderTestFixtures.Scenario;
import com.techstore.order.dto.admin.OrderStatusUpdateRequest;
import com.techstore.order.service.AdminOrderService;
import com.techstore.order.service.OrderService;
import com.techstore.user.entity.User;
import com.techstore.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static com.techstore.coupon.CouponTestSupport.uniqueCode;
import static org.junit.jupiter.api.Assertions.*;

/**
 * ADR-024 — Kiểm thử đồng thời coupon. H2 riêng, KHÔNG @Transactional: mỗi thao tác commit thật,
 * khóa PESSIMISTIC_WRITE (inventory → coupon, order → inventory → coupon) tranh chấp giữa các luồng.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:uc07conc;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=USER;LOCK_TIMEOUT=20000")
class CheckoutCouponConcurrencyTest {

    @Autowired private CheckoutService checkoutService;
    @Autowired private OrderService orderService;
    @Autowired private AdminOrderService adminOrderService;
    @Autowired private CouponRepository couponRepository;
    @Autowired private CouponUsageRepository usageRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private OrderTestFixtures fixtures;
    @Autowired private CouponTestSupport coupons;
    @Autowired private CheckoutCouponSupport support;

    @SafeVarargs
    private List<Object> runConcurrently(Callable<Object>... tasks) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(tasks.length);
        CountDownLatch ready = new CountDownLatch(tasks.length);
        CountDownLatch start = new CountDownLatch(1);
        try {
            List<Future<Object>> futures = new ArrayList<>();
            for (Callable<Object> task : tasks) {
                futures.add(pool.submit(() -> {
                    ready.countDown();
                    start.await();
                    try {
                        return task.call();
                    } catch (Exception ex) {
                        return ex;
                    }
                }));
            }
            assertTrue(ready.await(10, TimeUnit.SECONDS));
            start.countDown();
            List<Object> results = new ArrayList<>();
            for (Future<Object> f : futures) {
                results.add(f.get(60, TimeUnit.SECONDS));
            }
            return results;
        } finally {
            pool.shutdownNow();
        }
    }

    private static long successes(List<Object> results) {
        return results.stream().filter(r -> !(r instanceof Exception)).count();
    }

    private static InvalidCouponException.Reason rejectReason(List<Object> results) {
        return results.stream().filter(r -> r instanceof InvalidCouponException)
                .map(r -> ((InvalidCouponException) r).getReason()).findFirst().orElse(null);
    }

    @Test
    @DisplayName("(a) Mã còn 1 lượt, 2 khách cùng đặt: đúng 1 đơn, 1 bị EXHAUSTED, used_count = 1 ≤ limit, kho trừ 1 lần")
    void lastUseTwoCustomers() throws Exception {
        Scenario sc = fixtures.scenario(10);
        LocalDateTime now = LocalDateTime.now();
        Coupon c = coupons.coupon(uniqueCode("LAST"), DiscountType.PERCENTAGE, "10", "0", null, 1, 0,
                now.minusDays(1), now.plusDays(1), true);
        User a = support.newCustomer();
        User b = support.newCustomer();

        List<Object> results = runConcurrently(
                () -> checkoutService.checkout(a.getId(), CheckoutCouponSupport.buyNow(sc.product().getId(), 1, sc.branch().getId(), c.getCode())),
                () -> checkoutService.checkout(b.getId(), CheckoutCouponSupport.buyNow(sc.product().getId(), 1, sc.branch().getId(), c.getCode())));

        assertEquals(1, successes(results), "Kết quả: " + results);
        assertEquals(InvalidCouponException.Reason.EXHAUSTED, rejectReason(results), "Kết quả: " + results);
        Coupon after = couponRepository.findById(c.getId()).orElseThrow();
        assertEquals(1, after.getUsedCount());
        assertTrue(after.getUsedCount() <= after.getUsageLimit());
        assertEquals(1, usageRepository.countByCouponIdAndStatus(c.getId(), CouponUsageStatus.ACTIVE));
        assertEquals(9, fixtures.stock(sc), "kho chỉ trừ cho đơn thành công");
    }

    @Test
    @DisplayName("(b) Cùng 1 khách gửi 2 request cùng mã: đúng 1 usage ACTIVE, request kia ALREADY_USED")
    void sameCustomerTwoRequests() throws Exception {
        Scenario sc = fixtures.scenario(10);
        Coupon c = coupons.activeCoupon(uniqueCode("DUP"), DiscountType.FIXED_AMOUNT, "100000", "0", null);
        User u = support.newCustomer();

        List<Object> results = runConcurrently(
                () -> checkoutService.checkout(u.getId(), CheckoutCouponSupport.buyNow(sc.product().getId(), 1, sc.branch().getId(), c.getCode())),
                () -> checkoutService.checkout(u.getId(), CheckoutCouponSupport.buyNow(sc.product().getId(), 1, sc.branch().getId(), c.getCode())));

        assertEquals(1, successes(results), "Kết quả: " + results);
        assertEquals(InvalidCouponException.Reason.ALREADY_USED, rejectReason(results), "Kết quả: " + results);
        assertEquals(1, usageRepository.countByCouponIdAndStatus(c.getId(), CouponUsageStatus.ACTIVE));
        assertEquals(1, couponRepository.findById(c.getId()).orElseThrow().getUsedCount());
        assertEquals(9, fixtures.stock(sc));
    }

    @Test
    @DisplayName("(c) Khách và admin cùng hủy đơn có mã: đúng 1 thành công, mã hoàn 1 lần, used_count giảm đúng 1")
    void customerAndAdminCancelOrderWithCoupon() throws Exception {
        Scenario sc = fixtures.scenario(10);
        Coupon c = coupons.activeCoupon(uniqueCode("CNL"), DiscountType.PERCENTAGE, "10", "0", null);
        User u = support.newCustomer();
        Long staffId = userRepository.findByEmail("staff@techstore.vn").orElseThrow().getId();
        CheckoutResponse placed = checkoutService.checkout(u.getId(),
                CheckoutCouponSupport.buyNow(sc.product().getId(), 2, sc.branch().getId(), c.getCode()));
        assertEquals(1, couponRepository.findById(c.getId()).orElseThrow().getUsedCount());

        List<Object> results = runConcurrently(
                () -> orderService.cancelOrder(u.getEmail(), placed.getOrderId(), "Khách hủy"),
                () -> adminOrderService.updateStatus(staffId, placed.getOrderId(), new OrderStatusUpdateRequest("CANCELLED", "Shop hủy")));

        assertEquals(1, successes(results), "Kết quả: " + results);
        assertTrue(results.stream().allMatch(r -> !(r instanceof Exception)
                        || r instanceof OrderCannotBeCancelledException || r instanceof OrderStatusConflictException),
                "Lỗi ngoài dự kiến: " + results);
        assertEquals(0, couponRepository.findById(c.getId()).orElseThrow().getUsedCount());
        assertEquals(0, usageRepository.countByCouponIdAndStatus(c.getId(), CouponUsageStatus.ACTIVE));
        assertEquals(1, usageRepository.countByCouponIdAndStatus(c.getId(), CouponUsageStatus.REVERSED));
        assertEquals(10, fixtures.stock(sc), "kho hoàn đúng 1 lần");
    }
}
