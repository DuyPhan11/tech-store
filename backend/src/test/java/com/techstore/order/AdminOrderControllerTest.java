package com.techstore.order;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.common.audit.AuditLog;
import com.techstore.common.audit.AuditLogRepository;
import com.techstore.order.OrderTestFixtures.Scenario;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.Payment;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.order.repository.PaymentRepository;
import com.techstore.user.entity.User;
import com.techstore.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** UC14 — Quản trị đơn hàng (ADR-023). Mỗi test chạy trong transaction và rollback. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminOrderControllerTest {

    private static final String BASE = "/api/admin/orders";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private OrderTestFixtures fixtures;

    private String adminToken;
    private String staffToken;
    private String customerToken;
    private Long staffId;
    private User customer;
    private Scenario sc;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = login("admin@techstore.vn", "Admin@123");
        staffToken = login("staff@techstore.vn", "Staff@123");
        customerToken = login("customer@techstore.vn", "Customer@123");
        staffId = userRepository.findByEmail("staff@techstore.vn").orElseThrow().getId();
        customer = userRepository.findByEmail("customer@techstore.vn").orElseThrow();
        sc = fixtures.scenario(10);
    }

    // ===================== Helpers =====================

    private String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(identifier, password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class).getAccessToken();
    }

    private ResultActions changeStatus(String token, Long orderId, String target, String reason) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("status", target);
        body.put("reason", reason);
        var builder = patch(BASE + "/" + orderId + "/status").contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body));
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(builder);
    }

    private ResultActions getAs(String token, String url) throws Exception {
        return mockMvc.perform(get(url).header("Authorization", "Bearer " + token));
    }

    private Order pendingCod(int qty) {
        return fixtures.order(sc, customer, OrderStatus.PENDING, PaymentMethod.COD, qty);
    }

    private Payment paymentOf(Order order) {
        return paymentRepository.findByOrderId(order.getId()).orElseThrow();
    }

    private long auditCount() {
        return auditLogRepository.countByEntityName("orders");
    }

    // ===================== Chuyển trạng thái hợp lệ =====================

    @Test
    @DisplayName("Đi đủ luồng PENDING→CONFIRMED→SHIPPING→COMPLETED; COD hoàn tất → payment PAID + paidAt; mỗi bước 1 audit")
    void fullFlowCodCompletedMarksPaid() throws Exception {
        Order order = pendingCod(2);
        long before = auditCount();

        changeStatus(staffToken, order.getId(), "CONFIRMED", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CONFIRMED"))
                .andExpect(jsonPath("$.paymentStatus").value("UNPAID"));
        changeStatus(staffToken, order.getId(), "SHIPPING", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("SHIPPING"))
                .andExpect(jsonPath("$.canCancel").value(false));
        changeStatus(adminToken, order.getId(), "COMPLETED", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("COMPLETED"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.payment.status").value("PAID"))
                .andExpect(jsonPath("$.payment.paidAt").isNotEmpty());

        Payment payment = paymentOf(order);
        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertNotNull(payment.getPaidAt());
        assertEquals(10, fixtures.stock(sc), "chuyển trạng thái thường không đổi kho");

        assertEquals(before + 3, auditCount());
        List<AuditLog> logs = auditLogRepository.findByEntityNameOrderByIdAsc("orders");
        AuditLog last = logs.get(logs.size() - 1);
        assertEquals("ORDER_COMPLETED", last.getAction());
        assertEquals(order.getId(), last.getEntityId());
        JsonNode details = objectMapper.readTree(last.getDetails());
        assertEquals("SHIPPING", details.get("from").asText());
        assertEquals("COMPLETED", details.get("to").asText());
        assertEquals("UNPAID", details.get("paymentStatusBefore").asText());
        assertEquals("PAID", details.get("paymentStatusAfter").asText());
        assertEquals(order.getOrderCode(), details.get("orderCode").asText());
        assertEquals("ORDER_CONFIRMED", logs.get(logs.size() - 3).getAction());
        assertEquals(staffId, logs.get(logs.size() - 3).getUserId());
    }

    @Test
    @DisplayName("ONLINE_MOCK hoàn tất vẫn giữ PAID, paidAt không đổi")
    void onlineMockCompletedKeepsPaid() throws Exception {
        Order order = fixtures.order(sc, customer, OrderStatus.SHIPPING, PaymentMethod.ONLINE_MOCK, 1);
        changeStatus(staffToken, order.getId(), "COMPLETED", null)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.payment.status").value("PAID"));
        assertNull(paymentOf(order).getPaidAt());
    }

    // ===================== Hủy =====================

    @Test
    @DisplayName("Hủy COD PENDING: hoàn kho đúng số lượng, payment CANCELLED, lưu lý do; audit ORDER_CANCELLED")
    void cancelCodRestoresStock() throws Exception {
        Order order = pendingCod(3);
        long before = auditCount();
        changeStatus(staffToken, order.getId(), "CANCELLED", "  Khách gọi điện hủy  ")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.paymentStatus").value("CANCELLED"))
                .andExpect(jsonPath("$.cancelReason").value("Khách gọi điện hủy"))
                .andExpect(jsonPath("$.cancelledAt").isNotEmpty());
        assertEquals(13, fixtures.stock(sc));
        assertEquals(PaymentStatus.CANCELLED, paymentOf(order).getStatus());
        assertEquals(before + 1, auditCount());
        List<AuditLog> logs = auditLogRepository.findByEntityNameOrderByIdAsc("orders");
        JsonNode details = objectMapper.readTree(logs.get(logs.size() - 1).getDetails());
        assertEquals("ORDER_CANCELLED", logs.get(logs.size() - 1).getAction());
        assertEquals("Khách gọi điện hủy", details.get("reason").asText());
        assertEquals("CANCELLED", details.get("paymentStatusAfter").asText());
    }

    @Test
    @DisplayName("Hủy ONLINE_MOCK CONFIRMED: hoàn kho, payment REFUNDED + refundedAt")
    void cancelOnlineMockRefunds() throws Exception {
        Order order = fixtures.order(sc, customer, OrderStatus.CONFIRMED, PaymentMethod.ONLINE_MOCK, 2);
        changeStatus(adminToken, order.getId(), "CANCELLED", "Hết hàng thực tế")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"))
                .andExpect(jsonPath("$.payment.status").value("REFUNDED"))
                .andExpect(jsonPath("$.payment.refundedAt").isNotEmpty());
        assertEquals(12, fixtures.stock(sc));
        assertNotNull(paymentOf(order).getRefundedAt());
    }

    @Test
    @DisplayName("Hủy 2 lần: lần 2 bị 409, kho chỉ hoàn 1 lần, chỉ 1 audit")
    void cancelTwiceRestoresOnce() throws Exception {
        Order order = pendingCod(4);
        long before = auditCount();
        changeStatus(staffToken, order.getId(), "CANCELLED", "Lần 1").andExpect(status().isOk());
        changeStatus(staffToken, order.getId(), "CANCELLED", "Lần 2").andExpect(status().isConflict());
        assertEquals(14, fixtures.stock(sc));
        assertEquals(before + 1, auditCount());
    }

    @Test
    @DisplayName("Admin hủy rồi khách hủy (UC08) → khách nhận 400 như cũ, kho hoàn 1 lần")
    void adminThenCustomerCancel() throws Exception {
        Order order = pendingCod(1);
        changeStatus(staffToken, order.getId(), "CANCELLED", "Shop hủy").andExpect(status().isOk());
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cancelReason\":\"Khách hủy\"}"))
                .andExpect(status().isBadRequest());
        assertEquals(11, fixtures.stock(sc));
    }

    @Test
    @DisplayName("Hủy thiếu lý do / lý do toàn khoảng trắng / > 500 ký tự → 400, không đổi gì, không audit")
    void cancelReasonValidation() throws Exception {
        Order order = pendingCod(2);
        long before = auditCount();
        changeStatus(staffToken, order.getId(), "CANCELLED", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("lý do")));
        changeStatus(staffToken, order.getId(), "CANCELLED", "   ").andExpect(status().isBadRequest());
        changeStatus(staffToken, order.getId(), "CANCELLED", "x".repeat(501))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.reason").exists());
        changeStatus(staffToken, order.getId(), "CANCELLED", "x".repeat(500)).andExpect(status().isOk());
        assertEquals(before + 1, auditCount());
    }

    // ===================== Sai luồng / dữ liệu sai =====================

    @Test
    @DisplayName("Nhảy cóc, lùi, giữ nguyên, về PENDING, hủy đơn đã giao/hoàn tất → 409; không đổi gì, không audit")
    void invalidTransitions() throws Exception {
        Object[][] cases = {
                {OrderStatus.PENDING, "SHIPPING"}, {OrderStatus.PENDING, "COMPLETED"}, {OrderStatus.PENDING, "PENDING"},
                {OrderStatus.CONFIRMED, "COMPLETED"}, {OrderStatus.CONFIRMED, "PENDING"}, {OrderStatus.CONFIRMED, "CONFIRMED"},
                {OrderStatus.SHIPPING, "CONFIRMED"}, {OrderStatus.SHIPPING, "CANCELLED"}, {OrderStatus.SHIPPING, "PENDING"},
                {OrderStatus.COMPLETED, "CANCELLED"}, {OrderStatus.COMPLETED, "SHIPPING"},
                {OrderStatus.CANCELLED, "CONFIRMED"}, {OrderStatus.CANCELLED, "PENDING"},
        };
        long before = auditCount();
        for (Object[] c : cases) {
            Order order = fixtures.order(sc, customer, (OrderStatus) c[0], PaymentMethod.COD, 1);
            changeStatus(staffToken, order.getId(), (String) c[1], "lý do")
                    .andExpect(status().isConflict())
                    .andExpect(jsonPath("$.message", containsString("Không thể chuyển")));
            getAs(staffToken, BASE + "/" + order.getId()).andExpect(jsonPath("$.status").value(((OrderStatus) c[0]).name()));
        }
        assertEquals(10, fixtures.stock(sc));
        assertEquals(before, auditCount());
    }

    @Test
    @DisplayName("Trạng thái không hợp lệ / thiếu → 400; đơn không tồn tại → 404; id sai kiểu → 400")
    void badInput() throws Exception {
        Order order = pendingCod(1);
        changeStatus(staffToken, order.getId(), "DELIVERED", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.status").exists());
        changeStatus(staffToken, order.getId(), null, null).andExpect(status().isBadRequest());
        changeStatus(staffToken, 99999999L, "CONFIRMED", null).andExpect(status().isNotFound());
        getAs(staffToken, BASE + "/99999999").andExpect(status().isNotFound());
        getAs(staffToken, BASE + "/abc").andExpect(status().isBadRequest());
    }

    // ===================== Danh sách / chi tiết =====================

    @Test
    @DisplayName("Lọc status, tìm q theo mã / tên / SĐT, phân trang, counts theo q, sắp mới nhất trước")
    void listFilterSearchPaginate() throws Exception {
        String tag = "Khách " + UUID.randomUUID().toString().substring(0, 6);
        Order p1 = fixtures.order(sc, customer, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 1, tag + " An", "0977000111");
        Order p2 = fixtures.order(sc, customer, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 1, tag + " Bình", "0977000222");
        Order c1 = fixtures.order(sc, customer, OrderStatus.CONFIRMED, PaymentMethod.COD, PaymentStatus.UNPAID, 1, tag + " Chi", "0977000333");
        Order x1 = fixtures.order(sc, customer, OrderStatus.CANCELLED, PaymentMethod.COD, PaymentStatus.CANCELLED, 1, tag + " Dũng", "0977000444");
        String q = tag.toUpperCase();

        MvcResult res = getAs(staffToken, BASE + "?q=" + q + "&size=3")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(3)))
                .andExpect(jsonPath("$.page").value(0))
                .andExpect(jsonPath("$.size").value(3))
                .andExpect(jsonPath("$.totalElements").value(4))
                .andExpect(jsonPath("$.totalPages").value(2))
                .andExpect(jsonPath("$.counts.ALL").value(4))
                .andExpect(jsonPath("$.counts.PENDING").value(2))
                .andExpect(jsonPath("$.counts.CONFIRMED").value(1))
                .andExpect(jsonPath("$.counts.SHIPPING").value(0))
                .andExpect(jsonPath("$.counts.CANCELLED").value(1))
                .andReturn();
        JsonNode first = objectMapper.readTree(res.getResponse().getContentAsString()).get("items").get(0);
        assertEquals(x1.getId(), first.get("id").asLong(), "mới nhất trước");
        assertEquals("customer@techstore.vn", first.get("customer").get("email").asText());
        assertEquals(1, first.get("items").size());

        getAs(staffToken, BASE + "?q=" + q + "&size=3&page=1")
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].id").value(p1.getId()));

        // status lọc danh sách nhưng counts vẫn tính theo q
        getAs(staffToken, BASE + "?q=" + q + "&status=pending")
                .andExpect(jsonPath("$.items[*].id", containsInAnyOrder(p1.getId().intValue(), p2.getId().intValue())))
                .andExpect(jsonPath("$.counts.ALL").value(4));

        // q theo SĐT và mã đơn
        getAs(adminToken, BASE + "?q=0977000333").andExpect(jsonPath("$.items[0].id").value(c1.getId()));
        getAs(adminToken, BASE + "?q=" + p2.getOrderCode().toLowerCase())
                .andExpect(jsonPath("$.totalElements").value(1))
                .andExpect(jsonPath("$.items[0].orderCode").value(p2.getOrderCode()));

        // tham số sai
        getAs(staffToken, BASE + "?status=DELIVERED").andExpect(status().isBadRequest());
        getAs(staffToken, BASE + "?size=0").andExpect(status().isBadRequest());
        getAs(staffToken, BASE + "?size=101").andExpect(status().isBadRequest());
        getAs(staffToken, BASE + "?page=-1").andExpect(status().isBadRequest());
        getAs(staffToken, BASE + "?page=abc").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Chi tiết đơn: items, payment, customer, chi nhánh")
    void detail() throws Exception {
        Order order = pendingCod(2);
        getAs(staffToken, BASE + "/" + order.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.orderCode").value(order.getOrderCode()))
                .andExpect(jsonPath("$.branchName").value(sc.branch().getName()))
                .andExpect(jsonPath("$.items[0].quantity").value(2))
                .andExpect(jsonPath("$.items[0].productSku").value(sc.product().getSku()))
                .andExpect(jsonPath("$.finalAmount").value(2000000))
                .andExpect(jsonPath("$.customer.id").value(customer.getId()))
                .andExpect(jsonPath("$.customer.fullName").value(customer.getFullName()))
                .andExpect(jsonPath("$.payment.method").value("COD"))
                .andExpect(jsonPath("$.payment.status").value("UNPAID"))
                .andExpect(jsonPath("$.payment.amount").value(2000000));
    }

    @Test
    @DisplayName("/api/orders/me vẫn trả OrderResponse cũ (không có customer/payment)")
    void customerResponseUnchanged() throws Exception {
        pendingCod(1);
        getAs(customerToken, "/api/orders/me")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].customer").doesNotExist())
                .andExpect(jsonPath("$[0].payment").doesNotExist());
    }

    // ===================== Phân quyền =====================

    @Test
    @DisplayName("RBAC: không token 401, Customer 403, Staff/Admin 200")
    void rbac() throws Exception {
        Order order = pendingCod(1);
        mockMvc.perform(get(BASE)).andExpect(status().isUnauthorized());
        changeStatus(null, order.getId(), "CONFIRMED", null).andExpect(status().isUnauthorized());
        getAs(customerToken, BASE).andExpect(status().isForbidden());
        getAs(customerToken, BASE + "/" + order.getId()).andExpect(status().isForbidden());
        changeStatus(customerToken, order.getId(), "CONFIRMED", null).andExpect(status().isForbidden());
        getAs(staffToken, BASE).andExpect(status().isOk());
        getAs(adminToken, BASE).andExpect(status().isOk());
        getAs(staffToken, BASE + "/" + order.getId()).andExpect(jsonPath("$.status").value("PENDING"));
    }
}
