package com.techstore.review;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.checkout.CheckoutCouponSupport;
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
import java.util.Map;

import static org.hamcrest.Matchers.hasSize;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:uc09reviews;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=USER")
@AutoConfigureMockMvc
class ReviewControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private OrderTestFixtures fixtures;
    @Autowired private CheckoutCouponSupport support;
    @Autowired private ReviewRepository reviewRepository;

    private User customer1;
    private User customer2;
    private String token1;
    private String token2;
    private String staffToken;
    private Scenario sc;
    private Scenario otherScenario;

    @BeforeEach
    void setUp() throws Exception {
        customer1 = support.newCustomer();
        customer2 = support.newCustomer();
        token1 = login(customer1.getEmail(), CheckoutCouponSupport.PASSWORD);
        token2 = login(customer2.getEmail(), CheckoutCouponSupport.PASSWORD);
        staffToken = login("staff@techstore.vn", "Staff@123");
        sc = fixtures.scenario(10);
        otherScenario = fixtures.scenario(5);
    }

    @Test
    @DisplayName("Customer tạo review cho đơn COMPLETED của mình → 201, tính vào aggregate VISIBLE, không còn trong eligible")
    void createReview_CompletedOrder_ShouldSucceedAndAggregateVisible() throws Exception {
        Order completed = fixtures.order(sc, customer1, OrderStatus.COMPLETED, PaymentMethod.COD, PaymentStatus.PAID, 1, "Khách 1", "0901111111");

        // Trước khi đánh giá: có 1 đơn eligible
        mockMvc.perform(get("/api/reviews/eligible")
                        .param("productId", String.valueOf(sc.product().getId()))
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].orderId").value(completed.getId()));

        MvcResult res = mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", sc.product().getId(),
                                "orderId", completed.getId(),
                                "rating", 5,
                                "comment", "Sản phẩm tuyệt vời!"
                        ))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rating").value(5))
                .andExpect(jsonPath("$.status").value("VISIBLE"))
                .andExpect(jsonPath("$.orderId").value(completed.getId()))
                .andReturn();

        long reviewId = objectMapper.readTree(res.getResponse().getContentAsString()).get("id").asLong();
        assertNotNull(reviewRepository.findById(reviewId).orElseThrow());

        // Public aggregate
        mockMvc.perform(get("/api/products/" + sc.product().getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(5.0))
                .andExpect(jsonPath("$.totalReviews").value(1))
                .andExpect(jsonPath("$.reviews", hasSize(1)));

        // Eligible rỗng sau khi đã đánh giá
        mockMvc.perform(get("/api/reviews/eligible")
                        .param("productId", String.valueOf(sc.product().getId()))
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(0)));

        // Trùng (user, product, order) → 409 Conflict
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", sc.product().getId(),
                                "orderId", completed.getId(),
                                "rating", 4,
                                "comment", "Đánh giá lần 2"
                        ))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Chặn tạo review: đơn PENDING/CANCELLED (409), đơn người khác (404), sản phẩm không thuộc đơn (400), Staff/Guest (403/401)")
    void createReview_ValidationAndPermissions() throws Exception {
        Order pending = fixtures.order(sc, customer1, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 1, "Khách 1", "0901111111");
        Order completedOtherUser = fixtures.order(sc, customer2, OrderStatus.COMPLETED, PaymentMethod.COD, PaymentStatus.PAID, 1, "Khách 2", "0902222222");
        Order completedOtherProd = fixtures.order(otherScenario, customer1, OrderStatus.COMPLETED, PaymentMethod.COD, PaymentStatus.PAID, 1, "Khách 1", "0901111111");

        // Đơn PENDING → 409
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", sc.product().getId(),
                                "orderId", pending.getId(),
                                "rating", 5,
                                "comment", "Chưa giao xong"
                        ))))
                .andExpect(status().isConflict());

        // Đơn của người khác → 404
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", sc.product().getId(),
                                "orderId", completedOtherUser.getId(),
                                "rating", 5,
                                "comment", "IDOR test"
                        ))))
                .andExpect(status().isNotFound());

        // Sản phẩm không có trong đơn → 400
        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", sc.product().getId(),
                                "orderId", completedOtherProd.getId(),
                                "rating", 5,
                                "comment", "Sai sản phẩm"
                        ))))
                .andExpect(status().isBadRequest());

        // Guest → 401, Staff (không có ROLE_CUSTOMER) → 403
        mockMvc.perform(post("/api/reviews")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", sc.product().getId(),
                                "orderId", completedOtherProd.getId(),
                                "rating", 5,
                                "comment", "Guest"
                        ))))
                .andExpect(status().isUnauthorized());

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", sc.product().getId(),
                                "orderId", completedOtherProd.getId(),
                                "rating", 5,
                                "comment", "Staff"
                        ))))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Sửa, ẩn mềm (HIDDEN_BY_OWNER), không thể tạo lại khi đã ẩn, và aggregate chỉ tính VISIBLE")
    void updateAndSoftHideReview_ShouldUpdateAggregateAndPreserveUniqueness() throws Exception {
        Order order1 = fixtures.order(sc, customer1, OrderStatus.COMPLETED, PaymentMethod.COD, PaymentStatus.PAID, 1, "Khách 1", "0901111111");
        Order order2 = fixtures.order(sc, customer2, OrderStatus.COMPLETED, PaymentMethod.COD, PaymentStatus.PAID, 1, "Khách 2", "0902222222");

        // Customer 1 đánh giá 4 sao, Customer 2 đánh giá 2 sao → TB = 3.0
        long r1Id = createViaApi(token1, sc.product().getId(), order1.getId(), 4, "Ổn");
        long r2Id = createViaApi(token2, sc.product().getId(), order2.getId(), 2, "Tạm");

        mockMvc.perform(get("/api/products/" + sc.product().getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(3.0))
                .andExpect(jsonPath("$.totalReviews").value(2));

        // Customer 1 sửa thành 5 sao → TB = 3.5
        mockMvc.perform(put("/api/reviews/" + r1Id)
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "rating", 5,
                                "comment", "Dùng vài ngày thấy rất tốt!"
                        ))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rating").value(5));

        mockMvc.perform(get("/api/products/" + sc.product().getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(3.5))
                .andExpect(jsonPath("$.totalReviews").value(2));

        // Người khác không sửa/ẩn được → 404
        mockMvc.perform(put("/api/reviews/" + r1Id)
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rating", 1, "comment", "Hack"))))
                .andExpect(status().isNotFound());

        // Customer 2 ẩn mềm review của mình → HIDDEN_BY_OWNER, TB chỉ còn 5.0 (1 review VISIBLE)
        mockMvc.perform(patch("/api/reviews/" + r2Id + "/hide")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("reason", "Không muốn hiển thị"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("HIDDEN_BY_OWNER"))
                .andExpect(jsonPath("$.hiddenAt").isNotEmpty());

        mockMvc.perform(get("/api/products/" + sc.product().getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(5.0))
                .andExpect(jsonPath("$.totalReviews").value(1));

        // Không được ẩn lại lần 2 → 409; không được sửa sau khi ẩn → 409; không được tạo mới cho cùng (user, product, order) → 409
        mockMvc.perform(patch("/api/reviews/" + r2Id + "/hide")
                        .header("Authorization", "Bearer " + token2))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/reviews/" + r2Id)
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rating", 5, "comment", "Sửa sau khi ẩn"))))
                .andExpect(status().isConflict());

        mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token2)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", sc.product().getId(),
                                "orderId", order2.getId(),
                                "rating", 5,
                                "comment", "Tạo lại sau khi ẩn"
                        ))))
                .andExpect(status().isConflict());

        // Kiểm tra review bị HIDDEN_BY_ADMIN cũng không cho sửa/ẩn và không tính vào aggregate
        Review r1 = reviewRepository.findById(r1Id).orElseThrow();
        r1.setStatus(ReviewStatus.HIDDEN_BY_ADMIN);
        r1.setHiddenAt(LocalDateTime.now());
        r1.setHiddenReason("Vi phạm quy định");
        reviewRepository.saveAndFlush(r1);

        mockMvc.perform(put("/api/reviews/" + r1Id)
                        .header("Authorization", "Bearer " + token1)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("rating", 5, "comment", "Sửa sau admin ẩn"))))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/products/" + sc.product().getId() + "/reviews"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.averageRating").value(0.0))
                .andExpect(jsonPath("$.totalReviews").value(0));

        // GET /api/reviews/me vẫn trả về đánh giá đã ẩn của chính user
        mockMvc.perform(get("/api/reviews/me")
                        .header("Authorization", "Bearer " + token1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].status").value("HIDDEN_BY_ADMIN"));
    }

    private long createViaApi(String token, Long productId, Long orderId, int rating, String comment) throws Exception {
        MvcResult res = mockMvc.perform(post("/api/reviews")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of(
                                "productId", productId,
                                "orderId", orderId,
                                "rating", rating,
                                "comment", comment
                        ))))
                .andExpect(status().isCreated())
                .andReturn();
        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        return json.get("id").asLong();
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
