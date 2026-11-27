package com.techstore.checkout;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
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
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
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
import org.springframework.test.web.servlet.ResultActions;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

import static com.techstore.coupon.CouponTestSupport.uniqueCode;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * ADR-024 — Áp coupon khi checkout và hoàn coupon khi hủy.
 * H2 riêng, KHÔNG @Transactional: checkout thất bại phải rollback THẬT (kho đã trừ trước bước kiểm mã)
 * để kiểm "kho / giỏ / đơn không đổi". Mỗi test dùng khách, sản phẩm, chi nhánh và mã riêng.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:uc07coupon;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=USER")
@AutoConfigureMockMvc
class CheckoutCouponTest {

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

    private User customer;
    private String token;
    private String staffToken;
    private Scenario sc; // sản phẩm 1.000.000đ, tồn 10

    @BeforeEach
    void setUp() throws Exception {
        customer = support.newCustomer();
        token = login(customer.getEmail(), CheckoutCouponSupport.PASSWORD);
        staffToken = login("staff@techstore.vn", "Staff@123");
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

    private ResultActions checkout(CheckoutRequest request) throws Exception {
        return mockMvc.perform(post("/api/checkout")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));
    }

    private JsonNode checkoutOk(CheckoutRequest request) throws Exception {
        MvcResult r = checkout(request).andExpect(status().isCreated()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString());
    }

    private JsonNode previewBuyNow(String code, int qty) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("couponCode", code);
        body.put("source", "BUY_NOW");
        body.put("productId", sc.product().getId());
        body.put("quantity", qty);
        MvcResult r = mockMvc.perform(post("/api/checkout/coupon-preview")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body)))
                .andExpect(status().isOk()).andReturn();
        return objectMapper.readTree(r.getResponse().getContentAsString());
    }

    private CheckoutRequest buyNow(int qty, String code) {
        return CheckoutCouponSupport.buyNow(sc.product().getId(), qty, sc.branch().getId(), code);
    }

    private Coupon reload(Coupon c) {
        return couponRepository.findById(c.getId()).orElseThrow();
    }

    private CartItem addToCart(int qty) {
        Cart cart = cartRepository.findByUserId(customer.getId()).orElseGet(() -> cartRepository.save(new Cart(customer)));
        return cartItemRepository.save(new CartItem(cart, sc.product(), qty));
    }

    /** Checkout có mã thành công: khớp preview, lưu coupon_id, payment = final, usage ACTIVE, used_count + 1. */
    private void assertAppliedLikePreview(Coupon coupon, int qty, String expectedDiscount) throws Exception {
        JsonNode preview = previewBuyNow(coupon.getCode(), qty);
        JsonNode res = checkoutOk(buyNow(qty, "  " + coupon.getCode().toLowerCase() + " "));

        assertEquals(0, preview.get("discountAmount").decimalValue().compareTo(res.get("discountAmount").decimalValue()));
        assertEquals(0, preview.get("finalAmount").decimalValue().compareTo(res.get("finalAmount").decimalValue()));
        assertEquals(0, new BigDecimal(expectedDiscount).compareTo(res.get("discountAmount").decimalValue()));

        Long orderId = res.get("orderId").asLong();
        Order order = orderRepository.findById(orderId).orElseThrow();
        assertEquals(coupon.getId(), order.getCouponId());
        assertEquals(0, order.getFinalAmount().compareTo(order.getTotalItemsAmount().subtract(order.getDiscountAmount())));
        assertEquals(0, paymentRepository.findByOrderId(orderId).orElseThrow().getAmount().compareTo(order.getFinalAmount()));

        CouponUsage usage = usageRepository.findByOrderId(orderId).orElseThrow();
        assertEquals(CouponUsageStatus.ACTIVE, usage.getStatus());
        assertEquals(customer.getId(), usage.getUserId());
        assertEquals(coupon.getId(), usage.getCouponId());
        assertEquals(1, reload(coupon).getUsedCount());
    }

    // ===================== Áp mã thành công =====================

    @Test
    @DisplayName("PERCENTAGE không max / có max và FIXED: khớp preview, coupon_id, payment.amount, usage ACTIVE, used_count + 1")
    void appliesCouponsLikePreview() throws Exception {
        assertAppliedLikePreview(coupons.activeCoupon(uniqueCode("PCT"), DiscountType.PERCENTAGE, "10", "0", null), 3, "300000");
        assertAppliedLikePreview(coupons.activeCoupon(uniqueCode("CAP"), DiscountType.PERCENTAGE, "10", "0", "150000"), 2, "150000");
        assertAppliedLikePreview(coupons.activeCoupon(uniqueCode("FIX"), DiscountType.FIXED_AMOUNT, "500000", "1000000", null), 1, "500000");
        assertEquals(4, fixtures.stock(sc));
    }

    @Test
    @DisplayName("FIXED lớn hơn subtotal: giảm bằng subtotal, final 0")
    void fixedLargerThanSubtotal() throws Exception {
        Coupon c = coupons.activeCoupon(uniqueCode("BIG"), DiscountType.FIXED_AMOUNT, "5000000", "0", null);
        checkout(buyNow(1, c.getCode()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.discountAmount").value(1000000))
                .andExpect(jsonPath("$.finalAmount").value(0));
    }

    @Test
    @DisplayName("Không gửi mã / mã toàn khoảng trắng: như checkout cũ (giảm 0, không coupon_id, không usage)")
    void withoutCouponUnchanged() throws Exception {
        for (String code : new String[]{null, "", "   "}) {
            JsonNode res = checkoutOk(buyNow(1, code));
            assertEquals(0, res.get("discountAmount").decimalValue().signum());
            assertEquals(0, res.get("finalAmount").decimalValue().compareTo(new BigDecimal("1000000")));
            Long orderId = res.get("orderId").asLong();
            assertNull(orderRepository.findById(orderId).orElseThrow().getCouponId());
            assertTrue(usageRepository.findByOrderId(orderId).isEmpty());
        }
        assertEquals(7, fixtures.stock(sc));
    }

    // ===================== Mã không hợp lệ =====================

    @Test
    @DisplayName("Từng lý do mã không hợp lệ → 400 + errors.reason; kho, đơn, used_count không đổi (BUY_NOW)")
    void invalidReasonsRollBackEverything() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        Coupon used = coupons.activeCoupon(uniqueCode("ONCE"), DiscountType.PERCENTAGE, "5", "0", null);
        checkoutOk(buyNow(1, used.getCode())); // khách đã dùng mã này 1 lần → tồn còn 9

        Object[][] cases = {
                {"KHONGCO" + uniqueCode(""), "NOT_FOUND"},
                {coupons.coupon(uniqueCode("OFF"), DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.minusDays(1), now.plusDays(1), false).getCode(), "DISABLED"},
                {coupons.coupon(uniqueCode("SOON"), DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.plusDays(1), now.plusDays(2), true).getCode(), "NOT_STARTED"},
                {coupons.coupon(uniqueCode("OLD"), DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.minusDays(3), now.minusDays(1), true).getCode(), "EXPIRED"},
                {coupons.coupon(uniqueCode("FULL"), DiscountType.PERCENTAGE, "10", "0", null, 2, 2, now.minusDays(1), now.plusDays(1), true).getCode(), "EXHAUSTED"},
                {coupons.activeCoupon(uniqueCode("MIN"), DiscountType.FIXED_AMOUNT, "100000", "5000000", null).getCode(), "MIN_ORDER_NOT_MET"},
                {used.getCode(), "ALREADY_USED"},
        };
        long orders = orderRepository.count();
        for (Object[] c : cases) {
            Coupon before = couponRepository.findByCode((String) c[0]).orElse(null);
            checkout(buyNow(2, (String) c[0]))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.reason").value(c[1]));
            assertEquals(9, fixtures.stock(sc), "kho không đổi với " + c[1]);
            assertEquals(orders, orderRepository.count(), "không tạo đơn với " + c[1]);
            if (before != null) {
                assertEquals(before.getUsedCount(), reload(before).getUsedCount(), "used_count không đổi với " + c[1]);
            }
        }
        assertEquals(1, usageRepository.countByCouponIdAndStatus(used.getId(), CouponUsageStatus.ACTIVE));
    }

    @Test
    @DisplayName("CART với mã không hợp lệ → 400; giỏ còn nguyên, kho không đổi; mã hợp lệ thì xóa dòng đã đặt")
    void cartKeepsItemsOnInvalidCoupon() throws Exception {
        CartItem item = addToCart(2);
        Coupon off = coupons.coupon(uniqueCode("OFF"), DiscountType.PERCENTAGE, "10", "0", null, 10, 0,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(1), false);

        checkout(CheckoutCouponSupport.cart(List.of(item.getId()), sc.branch().getId(), off.getCode()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.reason").value("DISABLED"));
        assertTrue(cartItemRepository.findById(item.getId()).isPresent(), "giỏ còn nguyên");
        assertEquals(10, fixtures.stock(sc));

        Coupon ok = coupons.activeCoupon(uniqueCode("CART"), DiscountType.PERCENTAGE, "20", "0", null);
        checkout(CheckoutCouponSupport.cart(List.of(item.getId()), sc.branch().getId(), ok.getCode()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.discountAmount").value(400000))
                .andExpect(jsonPath("$.finalAmount").value(1600000));
        assertFalse(cartItemRepository.findById(item.getId()).isPresent());
        assertEquals(8, fixtures.stock(sc));
    }

    // ===================== Hoàn coupon khi hủy =====================

    @Test
    @DisplayName("Khách hủy đơn có mã → REVERSED + reversedAt, used_count − 1; hủy lần 2 không hoàn thêm; dùng lại mã được")
    void customerCancelReversesOnceAndAllowsReuse() throws Exception {
        Coupon c = coupons.activeCoupon(uniqueCode("BACK"), DiscountType.PERCENTAGE, "10", "0", null);
        Long orderId = checkoutOk(buyNow(1, c.getCode())).get("orderId").asLong();
        assertEquals(1, reload(c).getUsedCount());

        mockMvc.perform(post("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cancelReason\":\"Đổi ý\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        CouponUsage usage = usageRepository.findByOrderId(orderId).orElseThrow();
        assertEquals(CouponUsageStatus.REVERSED, usage.getStatus());
        assertNotNull(usage.getReversedAt());
        assertEquals(0, reload(c).getUsedCount());

        mockMvc.perform(post("/api/orders/" + orderId + "/cancel")
                        .header("Authorization", "Bearer " + token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"cancelReason\":\"Lần 2\"}"))
                .andExpect(status().isBadRequest());
        assertEquals(0, reload(c).getUsedCount(), "không âm, không hoàn lần 2");

        // dùng lại mã sau khi hủy
        Long again = checkoutOk(buyNow(1, c.getCode())).get("orderId").asLong();
        assertEquals(1, reload(c).getUsedCount());
        assertEquals(1, usageRepository.countByCouponIdAndStatus(c.getId(), CouponUsageStatus.ACTIVE));
        assertEquals(CouponUsageStatus.ACTIVE, usageRepository.findByOrderId(again).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("Admin hủy đơn có mã → REVERSED, used_count − 1; hủy lần 2 → 409, không hoàn thêm")
    void adminCancelReverses() throws Exception {
        Coupon c = coupons.activeCoupon(uniqueCode("ADM"), DiscountType.FIXED_AMOUNT, "200000", "0", null);
        Long orderId = checkoutOk(buyNow(2, c.getCode())).get("orderId").asLong();
        assertEquals(8, fixtures.stock(sc));

        String body = "{\"status\":\"CANCELLED\",\"reason\":\"Shop hủy\"}";
        mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("CANCELLED"));
        assertEquals(CouponUsageStatus.REVERSED, usageRepository.findByOrderId(orderId).orElseThrow().getStatus());
        assertEquals(0, reload(c).getUsedCount());
        assertEquals(10, fixtures.stock(sc));

        mockMvc.perform(patch("/api/admin/orders/" + orderId + "/status")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().isConflict());
        assertEquals(0, reload(c).getUsedCount());
        assertEquals(OrderStatus.CANCELLED, orderRepository.findById(orderId).orElseThrow().getStatus());
    }
}
