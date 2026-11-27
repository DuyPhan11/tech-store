package com.techstore.checkout;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.cart.entity.Cart;
import com.techstore.cart.entity.CartItem;
import com.techstore.cart.repository.CartItemRepository;
import com.techstore.cart.repository.CartRepository;
import com.techstore.checkout.dto.CheckoutRequest;
import com.techstore.coupon.CouponTestSupport;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponUsage;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.entity.DiscountType;
import com.techstore.coupon.repository.CouponRepository;
import com.techstore.coupon.repository.CouponUsageRepository;
import com.techstore.order.OrderTestFixtures;
import com.techstore.order.OrderTestFixtures.Scenario;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.Payment;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
import com.techstore.product.repository.InventoryRepository;
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

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.techstore.coupon.CouponTestSupport.uniqueCode;
import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * UC07 (ADR-025) — Kiểm thử thanh toán ONLINE_MOCK: thành công PAID, thất bại rollback toàn bộ
 * (không tạo Order/Payment/CouponUsage, không trừ kho, không xóa giỏ, không cache idempotency).
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:uc07onlinemock;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=USER")
@AutoConfigureMockMvc
class CheckoutOnlineMockTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private OrderTestFixtures fixtures;
    @Autowired private CouponTestSupport coupons;
    @Autowired private CheckoutCouponSupport support;
    @Autowired private CouponRepository couponRepository;
    @Autowired private CouponUsageRepository usageRepository;
    @Autowired private OrderRepository orderRepository;
    @Autowired private PaymentRepository paymentRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private InventoryRepository inventoryRepository;

    private User customer;
    private String token;
    private Scenario sc;

    @BeforeEach
    void setUp() throws Exception {
        customer = support.newCustomer();
        token = login(customer.getEmail(), CheckoutCouponSupport.PASSWORD);
        sc = fixtures.scenario(10);
    }

    @Test
    @DisplayName("ONLINE_MOCK thành công (CART + coupon): tạo đơn PENDING, Payment PAID + paidAt, trừ kho, xóa giỏ, ghi usage")
    void onlineMockSuccess_CartWithCoupon_ShouldPersistPaidOrderAndDeductAll() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer));
        CartItem cartItem = cartItemRepository.save(new CartItem(cart, sc.product(), 2));

        Coupon coupon = coupons.activeCoupon(uniqueCode("MOCKOK"), DiscountType.PERCENTAGE, "10", "0", "500000");

        CheckoutRequest req = CheckoutCouponSupport.cart(List.of(cartItem.getId()), sc.branch().getId(), coupon.getCode());
        req.setPaymentMethod("ONLINE_MOCK");
        req.setMockPaymentSuccess(true);
        req.setIdempotencyKey("online-ok-" + UUID.randomUUID());

        MvcResult res = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status").value("PENDING"))
                .andExpect(jsonPath("$.paymentMethod").value("ONLINE_MOCK"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.totalItemsAmount").value(2000000))
                .andExpect(jsonPath("$.discountAmount").value(200000))
                .andExpect(jsonPath("$.finalAmount").value(1800000))
                .andReturn();

        JsonNode json = objectMapper.readTree(res.getResponse().getContentAsString());
        long orderId = json.get("orderId").asLong();

        Order savedOrder = orderRepository.findById(orderId).orElseThrow();
        assertEquals(OrderStatus.PENDING, savedOrder.getStatus());
        assertEquals(PaymentMethod.ONLINE_MOCK, savedOrder.getPaymentMethod());
        assertEquals(PaymentStatus.PAID, savedOrder.getPaymentStatus());
        assertEquals(coupon.getId(), savedOrder.getCouponId());

        Payment payment = paymentRepository.findByOrderId(orderId).orElseThrow();
        assertEquals(PaymentMethod.ONLINE_MOCK, payment.getPaymentMethod());
        assertEquals(PaymentStatus.PAID, payment.getStatus());
        assertNotNull(payment.getPaidAt());
        assertTrue(payment.getTransactionCode().startsWith("MOCK-"));
        assertEquals(0, BigDecimal.valueOf(1_800_000).compareTo(payment.getAmount()));

        assertEquals(8, stockOf(sc));
        assertTrue(cartItemRepository.findByCartIdOrderByIdAsc(cart.getId()).isEmpty());

        Coupon refreshedCoupon = couponRepository.findById(coupon.getId()).orElseThrow();
        assertEquals(1, refreshedCoupon.getUsedCount());
        CouponUsage usage = usageRepository.findByOrderId(orderId).orElseThrow();
        assertEquals(CouponUsageStatus.ACTIVE, usage.getStatus());
    }

    @Test
    @DisplayName("ONLINE_MOCK mặc định (mockPaymentSuccess = null, BUY_NOW): thành công PAID và giữ nguyên giỏ hàng")
    void onlineMockDefaultNull_BuyNow_ShouldSucceedPaidAndKeepCart() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer));
        cartItemRepository.save(new CartItem(cart, sc.product(), 1));

        CheckoutRequest req = CheckoutCouponSupport.buyNow(sc.product().getId(), 2, sc.branch().getId(), null);
        req.setPaymentMethod("ONLINE_MOCK");
        req.setMockPaymentSuccess(null);

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentMethod").value("ONLINE_MOCK"))
                .andExpect(jsonPath("$.paymentStatus").value("PAID"))
                .andExpect(jsonPath("$.finalAmount").value(2000000));

        assertEquals(8, stockOf(sc));
        assertEquals(1, cartItemRepository.findByCartIdOrderByIdAsc(cart.getId()).size());
    }

    @Test
    @DisplayName("ONLINE_MOCK thất bại (mockPaymentSuccess = false): 400 + rollback hoàn toàn (đơn/payment/kho/coupon/giỏ/idempotency)")
    void onlineMockFailed_ShouldRollbackEverythingAndAllowRetryWithSameIdempotencyKey() throws Exception {
        Cart cart = cartRepository.save(new Cart(customer));
        CartItem cartItem = cartItemRepository.save(new CartItem(cart, sc.product(), 3));

        Coupon coupon = coupons.activeCoupon(uniqueCode("MOCKFAIL"), DiscountType.FIXED_AMOUNT, "200000", "0", null);

        long ordersBefore = orderRepository.count();
        long paymentsBefore = paymentRepository.count();
        long usagesBefore = usageRepository.count();
        String sharedKey = "retry-after-fail-" + UUID.randomUUID();

        CheckoutRequest failReq = CheckoutCouponSupport.cart(List.of(cartItem.getId()), sc.branch().getId(), coupon.getCode());
        failReq.setPaymentMethod("ONLINE_MOCK");
        failReq.setMockPaymentSuccess(false);
        failReq.setIdempotencyKey(sharedKey);

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(failReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message").value(containsString("thất bại")));

        // Verify 100% rollback
        assertEquals(ordersBefore, orderRepository.count());
        assertEquals(paymentsBefore, paymentRepository.count());
        assertEquals(usagesBefore, usageRepository.count());
        assertEquals(10, stockOf(sc));
        assertEquals(0, couponRepository.findById(coupon.getId()).orElseThrow().getUsedCount());
        assertEquals(1, cartItemRepository.findByCartIdOrderByIdAsc(cart.getId()).size());

        // Retry with same idempotencyKey and mockPaymentSuccess = true MUST succeed (failed attempt was not cached)
        failReq.setMockPaymentSuccess(true);
        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(failReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.paymentStatus").value("PAID"));

        assertEquals(ordersBefore + 1, orderRepository.count());
        assertEquals(7, stockOf(sc));
        assertEquals(1, couponRepository.findById(coupon.getId()).orElseThrow().getUsedCount());
        assertTrue(cartItemRepository.findByCartIdOrderByIdAsc(cart.getId()).isEmpty());
    }

    @Test
    @DisplayName("ONLINE_MOCK hủy đơn sau khi PAID: hoàn kho, hoàn coupon và chuyển Payment sang REFUNDED")
    void onlineMockPaidOrder_WhenCancelled_ShouldRefundAndRestoreStockAndCoupon() throws Exception {
        Coupon coupon = coupons.activeCoupon(uniqueCode("MOCKREFUND"), DiscountType.FIXED_AMOUNT, "100000", "0", null);

        CheckoutRequest req = CheckoutCouponSupport.buyNow(sc.product().getId(), 2, sc.branch().getId(), coupon.getCode());
        req.setPaymentMethod("ONLINE_MOCK");
        req.setMockPaymentSuccess(true);

        MvcResult res = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isCreated())
                .andReturn();

        long orderId = objectMapper.readTree(res.getResponse().getContentAsString()).get("orderId").asLong();
        assertEquals(8, stockOf(sc));

        mockMvc.perform(post("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(Map.of("cancelReason", "Đổi ý không mua nữa"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"))
                .andExpect(jsonPath("$.paymentStatus").value("REFUNDED"));

        Payment payment = paymentRepository.findByOrderId(orderId).orElseThrow();
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        assertNotNull(payment.getRefundedAt());
        assertEquals(10, stockOf(sc));
        assertEquals(0, couponRepository.findById(coupon.getId()).orElseThrow().getUsedCount());
    }

    @Test
    @DisplayName("Phương thức thanh toán không hợp lệ → 400 Bad Request")
    void unsupportedPaymentMethod_ShouldReturn400() throws Exception {
        CheckoutRequest req = CheckoutCouponSupport.buyNow(sc.product().getId(), 1, sc.branch().getId(), null);
        req.setPaymentMethod("PAYPAL");

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest());

        assertEquals(10, stockOf(sc));
    }

    private int stockOf(Scenario s) {
        return inventoryRepository.findByProductIdAndBranchId(s.product().getId(), s.branch().getId())
                .orElseThrow()
                .getQuantity();
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
