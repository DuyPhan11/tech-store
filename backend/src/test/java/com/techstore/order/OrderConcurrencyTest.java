package com.techstore.order;

import com.techstore.common.audit.AuditLogRepository;
import com.techstore.common.exception.OrderCannotBeCancelledException;
import com.techstore.common.exception.OrderStatusConflictException;
import com.techstore.order.OrderTestFixtures.Scenario;
import com.techstore.order.dto.admin.OrderStatusUpdateRequest;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
import com.techstore.order.service.AdminOrderService;
import com.techstore.order.service.OrderService;
import com.techstore.user.entity.User;
import com.techstore.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.junit.jupiter.api.Assertions.*;

/**
 * UC14 — Kiểm thử đồng thời (ADR-023). H2 riêng, KHÔNG @Transactional: mỗi thao tác commit thật,
 * khóa PESSIMISTIC_WRITE trên dòng đơn tranh chấp giữa các luồng.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:uc14conc;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=USER;LOCK_TIMEOUT=20000")
class OrderConcurrencyTest {

    @Autowired private AdminOrderService adminOrderService;
    @Autowired private OrderService orderService;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private OrderTestFixtures fixtures;

    private Long staffId;
    private Long adminId;
    private User customer;

    @BeforeEach
    void setUp() {
        staffId = userRepository.findByEmail("staff@techstore.vn").orElseThrow().getId();
        adminId = userRepository.findByEmail("admin@techstore.vn").orElseThrow().getId();
        customer = userRepository.findByEmail("customer@techstore.vn").orElseThrow();
    }

    /** Chạy các tác vụ cùng lúc (cùng xuất phát nhờ latch), trả về kết quả hoặc exception của từng tác vụ. */
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

    @Test
    @DisplayName("2 admin cùng hủy một đơn: đúng 1 thành công, 1 bị 409, kho hoàn 1 lần, 1 audit")
    void twoAdminsCancelSameOrder() throws Exception {
        Scenario sc = fixtures.scenario(10);
        Order order = fixtures.order(sc, customer, OrderStatus.PENDING, PaymentMethod.COD, 3);
        long auditBefore = auditLogRepository.countByEntityName("orders");

        List<Object> results = runConcurrently(
                () -> adminOrderService.updateStatus(staffId, order.getId(), new OrderStatusUpdateRequest("CANCELLED", "Staff hủy")),
                () -> adminOrderService.updateStatus(adminId, order.getId(), new OrderStatusUpdateRequest("CANCELLED", "Admin hủy")));

        assertEquals(1, successes(results), "Kết quả: " + results);
        assertEquals(1, results.stream().filter(r -> r instanceof OrderStatusConflictException).count(), "Kết quả: " + results);
        assertEquals(13, fixtures.stock(sc), "kho chỉ hoàn 1 lần");
        assertEquals(OrderStatus.CANCELLED, orderRepository.findById(order.getId()).orElseThrow().getStatus());
        assertEquals(PaymentStatus.CANCELLED, paymentRepository.findByOrderId(order.getId()).orElseThrow().getStatus());
        assertEquals(auditBefore + 1, auditLogRepository.countByEntityName("orders"));
    }

    @Test
    @DisplayName("2 admin cùng xác nhận một đơn: đúng 1 thành công, 1 bị 409")
    void twoAdminsConfirmSameOrder() throws Exception {
        Scenario sc = fixtures.scenario(10);
        Order order = fixtures.order(sc, customer, OrderStatus.PENDING, PaymentMethod.COD, 1);
        long auditBefore = auditLogRepository.countByEntityName("orders");

        List<Object> results = runConcurrently(
                () -> adminOrderService.updateStatus(staffId, order.getId(), new OrderStatusUpdateRequest("CONFIRMED", null)),
                () -> adminOrderService.updateStatus(adminId, order.getId(), new OrderStatusUpdateRequest("CONFIRMED", null)));

        assertEquals(1, successes(results), "Kết quả: " + results);
        assertEquals(1, results.stream().filter(r -> r instanceof OrderStatusConflictException).count(), "Kết quả: " + results);
        assertEquals(OrderStatus.CONFIRMED, orderRepository.findById(order.getId()).orElseThrow().getStatus());
        assertEquals(auditBefore + 1, auditLogRepository.countByEntityName("orders"));
    }

    @Test
    @DisplayName("Admin hủy và khách hủy cùng lúc: đúng 1 thành công, kho hoàn 1 lần")
    void adminAndCustomerCancelTogether() throws Exception {
        Scenario sc = fixtures.scenario(10);
        Order order = fixtures.order(sc, customer, OrderStatus.CONFIRMED, PaymentMethod.ONLINE_MOCK, 2);

        List<Object> results = runConcurrently(
                () -> adminOrderService.updateStatus(staffId, order.getId(), new OrderStatusUpdateRequest("CANCELLED", "Shop hủy")),
                () -> orderService.cancelOrder(customer.getEmail(), order.getId(), "Khách hủy"));

        assertEquals(1, successes(results), "Kết quả: " + results);
        assertTrue(results.stream().allMatch(r -> !(r instanceof Exception)
                        || r instanceof OrderStatusConflictException || r instanceof OrderCannotBeCancelledException),
                "Lỗi ngoài dự kiến: " + results);
        assertEquals(12, fixtures.stock(sc), "kho chỉ hoàn 1 lần");
        assertEquals(PaymentStatus.REFUNDED, paymentRepository.findByOrderId(order.getId()).orElseThrow().getStatus());
    }
}
