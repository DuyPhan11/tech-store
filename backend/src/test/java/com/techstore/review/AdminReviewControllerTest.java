package com.techstore.review;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.checkout.CheckoutCouponSupport;
import com.techstore.common.audit.AuditLog;
import com.techstore.common.audit.AuditLogRepository;
import com.techstore.order.OrderTestFixtures;
import com.techstore.order.OrderTestFixtures.Scenario;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.review.entity.Review;
import com.techstore.review.entity.ReviewStatus;
import com.techstore.review.repository.ReviewRepository;
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

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:uc20adminreviews;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=USER")
@AutoConfigureMockMvc
class AdminReviewControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private OrderTestFixtures fixtures;
    @Autowired private CheckoutCouponSupport support;
    @Autowired private ReviewRepository reviewRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private UserRepository userRepository;

    private String adminToken;
    private String staffToken;
    private String customerToken;
    private User adminUser;
    private User customer;
    private Scenario sc;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = login("admin@techstore.vn", "Admin@123");
        staffToken = login("staff@techstore.vn", "Staff@123");
        adminUser = userRepository.findByEmail("admin@techstore.vn").orElseThrow();
        customer = support.newCustomer();
        customerToken = login(customer.getEmail(), CheckoutCouponSupport.PASSWORD);
        sc = fixtures.scenario(10);
    }

    @Test
    @DisplayName("RBAC UC20: chỉ ROLE_ADMIN truy cập được; STAFF/CUSTOMER → 403, Guest → 401")
    void rbac_OnlyAdminAllowed() throws Exception {
        mockMvc.perform(get("/api/admin/reviews"))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(get("/api/admin/reviews")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/reviews")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());

        mockMvc.perform(get("/api/admin/reviews")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Admin lọc review theo status & q; ẩn review vi phạm → HIDDEN_BY_ADMIN, loại khỏi public aggregate, giữ DB, ghi audit_logs")
    void listAndHideViolatingReview_ShouldPersistSoftHideAndAuditLog() throws Exception {
        Order order1 = fixtures.order(sc, customer, OrderStatus.COMPLETED, PaymentMethod.COD, PaymentStatus.PAID, 1, "Khách", "0901111111");
        Order order2 = fixtures.order(sc, customer, OrderStatus.COMPLETED, PaymentMethod.COD, PaymentStatus.PAID, 1, "Khách", "0901111111");

        Review visible = saveReview(customer, sc, order1, 2, "Bình luận spam quảng cáo link lạ", ReviewStatus.VISIBLE);
        Review ownerHidden = saveReview(customer, sc, order2, 5, "Tự ẩn trước đó", ReviewStatus.HIDDEN_BY_OWNER);

        // Trước khi ẩn: public aggregate có 1 review VISIBLE (2.0)
        mockMvc.perform(get("/api/products/" + sc.product().getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReviews").value(1))
                .andExpect(jsonPath("$.averageRating").value(2.0));

        // Lọc theo status=VISIBLE và q=quảng cáo
        mockMvc.perform(get("/api/admin/reviews")
                        .param("status", "VISIBLE")
                        .param("q", "quảng cáo")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id").value(visible.getId()));

        // Status không hợp lệ → 400
        mockMvc.perform(get("/api/admin/reviews")
                        .param("status", "APPROVED")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isBadRequest());

        long auditBefore = auditLogRepository.count();

        // Lý do trống → 400, không ghi audit
        mockMvc.perform(patch("/api/admin/reviews/" + visible.getId() + "/hide")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "   "))))
                .andExpect(status().isBadRequest());
        assertEquals(auditBefore, auditLogRepository.count());

        // Ẩn review VISIBLE thành công → 200, HIDDEN_BY_ADMIN, giữ nguyên bản ghi, ghi 1 audit_log
        mockMvc.perform(patch("/api/admin/reviews/" + visible.getId() + "/hide")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Chứa nội dung spam quảng cáo"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(visible.getId()))
                .andExpect(jsonPath("$.status").value("HIDDEN_BY_ADMIN"))
                .andExpect(jsonPath("$.hiddenReason").value("Chứa nội dung spam quảng cáo"))
                .andExpect(jsonPath("$.hiddenAt").isNotEmpty());

        Review persisted = reviewRepository.findById(visible.getId()).orElseThrow();
        assertEquals(ReviewStatus.HIDDEN_BY_ADMIN, persisted.getStatus());
        assertNotNull(persisted.getHiddenAt());

        // Sau khi ẩn: public aggregate cập nhật về 0 review
        mockMvc.perform(get("/api/products/" + sc.product().getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalReviews").value(0))
                .andExpect(jsonPath("$.averageRating").value(0.0));

        assertEquals(auditBefore + 1, auditLogRepository.count());
        List<AuditLog> logs = auditLogRepository.findAll();
        AuditLog last = logs.get(logs.size() - 1);
        assertEquals("REVIEW_HIDDEN_BY_ADMIN", last.getAction());
        assertEquals("reviews", last.getEntityName());
        assertEquals(visible.getId(), last.getEntityId());
        assertEquals(adminUser.getId(), last.getUserId());
        assertTrue(last.getDetails().contains("Chứa nội dung spam quảng cáo"));

        // Ẩn lại review đã HIDDEN_BY_ADMIN hoặc HIDDEN_BY_OWNER → 409 Conflict, không ghi thêm audit
        mockMvc.perform(patch("/api/admin/reviews/" + visible.getId() + "/hide")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Ẩn lần 2"))))
                .andExpect(status().isConflict());

        mockMvc.perform(patch("/api/admin/reviews/" + ownerHidden.getId() + "/hide")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Ẩn của owner"))))
                .andExpect(status().isConflict());

        assertEquals(auditBefore + 1, auditLogRepository.count());

        // Không tồn tại → 404
        mockMvc.perform(patch("/api/admin/reviews/999999/hide")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Không tồn tại"))))
                .andExpect(status().isNotFound());
    }

    private Review saveReview(User u, Scenario s, Order o, int rating, String comment, ReviewStatus status) {
        Review r = new Review();
        r.setUser(u);
        r.setProduct(s.product());
        r.setOrder(o);
        r.setRating(rating);
        r.setComment(comment);
        r.setStatus(status);
        if (status != ReviewStatus.VISIBLE) {
            r.setHiddenAt(LocalDateTime.now());
            r.setHiddenReason("Ẩn test");
        }
        return reviewRepository.saveAndFlush(r);
    }

    private String login(String email, String password) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(email, password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readTree(res.getResponse().getContentAsString()).get("accessToken").asText();
    }
}
