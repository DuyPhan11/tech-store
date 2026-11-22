package com.techstore.coupon.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.cart.entity.Cart;
import com.techstore.cart.entity.CartItem;
import com.techstore.cart.repository.CartItemRepository;
import com.techstore.cart.repository.CartRepository;
import com.techstore.common.security.JwtTokenProvider;
import com.techstore.coupon.CouponTestSupport;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.entity.DiscountType;
import com.techstore.coupon.repository.CouponRepository;
import com.techstore.coupon.repository.CouponUsageRepository;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.BrandRepository;
import com.techstore.product.repository.CategoryRepository;
import com.techstore.product.repository.ProductRepository;
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

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static com.techstore.coupon.CouponTestSupport.uniqueCode;
import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** UC07/UC13 — Xem trước coupon (ADR-022 mục 5): không tiêu lượt, subtotal tính ở server. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class CouponPreviewControllerTest {

    private static final String URL = "/api/checkout/coupon-preview";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private UserRepository userRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private CartRepository cartRepository;
    @Autowired private CartItemRepository cartItemRepository;
    @Autowired private CouponRepository couponRepository;
    @Autowired private CouponUsageRepository couponUsageRepository;
    @Autowired private JwtTokenProvider jwtTokenProvider;
    @Autowired private CouponTestSupport support;

    private String customerToken;
    private String staffToken;
    private User customer;
    private Product laptop;   // 2.000.000đ
    private Product mouse;    // 350.000đ

    @BeforeEach
    void setUp() throws Exception {
        customerToken = login("customer@techstore.vn", "Customer@123");
        staffToken = login("staff@techstore.vn", "Staff@123");
        customer = userRepository.findByEmail("customer@techstore.vn").orElseThrow();
        laptop = product("2000000", ActiveStatus.ACTIVE);
        mouse = product("350000", ActiveStatus.ACTIVE);
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

    private Product product(String price, ActiveStatus status) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        return productRepository.save(new Product(
                categoryRepository.findBySlug("laptop").orElseThrow(),
                brandRepository.findBySlug("nova").orElseThrow(),
                "Preview " + suffix, "preview-" + suffix, "PRV-" + suffix.toUpperCase(),
                new BigDecimal(price), new BigDecimal("1"), null, null, status));
    }

    private CartItem cartItem(User owner, Product product, int qty) {
        Cart cart = cartRepository.findByUserId(owner.getId()).orElseGet(() -> cartRepository.save(new Cart(owner)));
        return cartItemRepository.saveAndFlush(new CartItem(cart, product, qty));
    }

    private ResultActions preview(String token, Map<String, Object> body) throws Exception {
        var builder = post(URL).contentType(MediaType.APPLICATION_JSON).content(objectMapper.writeValueAsString(body));
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(builder);
    }

    private Map<String, Object> buyNow(String code, Product product, int qty) {
        Map<String, Object> body = new HashMap<>();
        body.put("couponCode", code);
        body.put("source", "BUY_NOW");
        body.put("productId", product.getId());
        body.put("quantity", qty);
        return body;
    }

    private Map<String, Object> cart(String code, List<Long> itemIds) {
        Map<String, Object> body = new HashMap<>();
        body.put("couponCode", code);
        body.put("source", "CART");
        body.put("selectedCartItemIds", itemIds);
        return body;
    }

    // ===================== Hợp lệ =====================

    @Test
    @DisplayName("CART: subtotal theo giá server của các dòng được chọn; PERCENTAGE bị chặn bởi max")
    void cartPreview() throws Exception {
        Coupon c = support.activeCoupon(uniqueCode("PCT"), DiscountType.PERCENTAGE, "10", "0", "300000");
        CartItem a = cartItem(customer, laptop, 2);   // 4.000.000
        CartItem b = cartItem(customer, mouse, 1);    // 350.000
        cartItem(customer, product("9900000", ActiveStatus.ACTIVE), 1); // không chọn

        preview(customerToken, cart(c.getCode().toLowerCase(), List.of(a.getId(), b.getId())))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.couponCode").value(c.getCode()))
                .andExpect(jsonPath("$.subtotal").value(4350000))
                .andExpect(jsonPath("$.discountAmount").value(300000))
                .andExpect(jsonPath("$.finalAmount").value(4050000));

        // giá đổi ở server → preview dùng giá mới
        laptop.setPrice(new BigDecimal("1000000"));
        productRepository.saveAndFlush(laptop);
        preview(customerToken, cart(c.getCode(), List.of(a.getId())))
                .andExpect(jsonPath("$.subtotal").value(2000000))
                .andExpect(jsonPath("$.discountAmount").value(200000));
    }

    @Test
    @DisplayName("BUY_NOW: FIXED_AMOUNT lớn hơn subtotal → giảm đúng bằng subtotal, finalAmount 0")
    void buyNowFixedLargerThanSubtotal() throws Exception {
        Coupon c = support.activeCoupon(uniqueCode("FIX"), DiscountType.FIXED_AMOUNT, "500000", "0", null);
        preview(customerToken, buyNow(c.getCode(), mouse, 1))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.subtotal").value(350000))
                .andExpect(jsonPath("$.discountAmount").value(350000))
                .andExpect(jsonPath("$.finalAmount").value(0));
        preview(customerToken, buyNow(c.getCode(), laptop, 3))
                .andExpect(jsonPath("$.subtotal").value(6000000))
                .andExpect(jsonPath("$.discountAmount").value(500000))
                .andExpect(jsonPath("$.finalAmount").value(5500000));
    }

    @Test
    @DisplayName("Preview KHÔNG đổi used_count và KHÔNG tạo coupon_usages")
    void previewDoesNotConsume() throws Exception {
        Coupon c = support.coupon(uniqueCode("LAST"), DiscountType.PERCENTAGE, "5", "0", null, 1, 0,
                LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(1), true);
        long usagesBefore = couponUsageRepository.count();
        for (int i = 0; i < 3; i++) {
            preview(customerToken, buyNow(c.getCode(), laptop, 1)).andExpect(status().isOk());
        }
        assertEquals(0, couponRepository.findById(c.getId()).orElseThrow().getUsedCount());
        assertEquals(usagesBefore, couponUsageRepository.count());
        assertEquals(0, couponUsageRepository.countByCouponId(c.getId()));
    }

    // ===================== Từ chối =====================

    @Test
    @DisplayName("Từng lý do từ chối → 400 kèm errors.reason và thông báo tiếng Việt")
    void rejectionReasons() throws Exception {
        LocalDateTime now = LocalDateTime.now();
        Coupon disabled = support.coupon(uniqueCode("OFF"), DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.minusDays(1), now.plusDays(1), false);
        Coupon notStarted = support.coupon(uniqueCode("SOON"), DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.plusDays(1), now.plusDays(2), true);
        Coupon expired = support.coupon(uniqueCode("OLD"), DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.minusDays(3), now.minusDays(1), true);
        Coupon exhausted = support.coupon(uniqueCode("FULL"), DiscountType.PERCENTAGE, "10", "0", null, 2, 2, now.minusDays(1), now.plusDays(1), true);
        Coupon minOrder = support.activeCoupon(uniqueCode("MIN"), DiscountType.FIXED_AMOUNT, "500000", "10000000", null);
        Coupon used = support.activeCoupon(uniqueCode("ONCE"), DiscountType.PERCENTAGE, "10", "0", null);
        support.usage(used, customer, CouponUsageStatus.ACTIVE);

        Object[][] cases = {
                {"KHONGCOMA", "NOT_FOUND", "không tồn tại"},
                {disabled.getCode(), "DISABLED", "vô hiệu hóa"},
                {notStarted.getCode(), "NOT_STARTED", "chưa đến thời gian"},
                {expired.getCode(), "EXPIRED", "hết hạn"},
                {exhausted.getCode(), "EXHAUSTED", "hết lượt"},
                {minOrder.getCode(), "MIN_ORDER_NOT_MET", "10.000.000đ"},
                {used.getCode(), "ALREADY_USED", "đã sử dụng"},
        };
        for (Object[] c : cases) {
            preview(customerToken, buyNow((String) c[0], laptop, 1))
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors.reason").value(c[1]))
                    .andExpect(jsonPath("$.message", containsString((String) c[2])));
        }
    }

    @Test
    @DisplayName("Usage REVERSED không chặn khách dùng lại mã")
    void reversedUsageAllowsReuse() throws Exception {
        Coupon c = support.activeCoupon(uniqueCode("BACK"), DiscountType.PERCENTAGE, "10", "0", null);
        support.usage(c, customer, CouponUsageStatus.REVERSED);
        preview(customerToken, buyNow(c.getCode(), laptop, 1)).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Cart item của user khác → 404; sản phẩm INACTIVE → 400; thiếu dữ liệu → 400")
    void invalidItems() throws Exception {
        Coupon c = support.activeCoupon(uniqueCode("ITM"), DiscountType.PERCENTAGE, "10", "0", null);
        User other = userRepository.findByEmail("admin@techstore.vn").orElseThrow();
        CartItem foreign = cartItem(other, laptop, 1);
        CartItem mine = cartItem(customer, mouse, 1);

        preview(customerToken, cart(c.getCode(), List.of(mine.getId(), foreign.getId())))
                .andExpect(status().isNotFound());
        preview(customerToken, cart(c.getCode(), List.of(987654321L))).andExpect(status().isNotFound());
        preview(customerToken, cart(c.getCode(), List.of())).andExpect(status().isBadRequest());

        Product inactive = product("1000000", ActiveStatus.INACTIVE);
        preview(customerToken, buyNow(c.getCode(), inactive, 1)).andExpect(status().isBadRequest());
        preview(customerToken, buyNow(c.getCode(), laptop, 0)).andExpect(status().isBadRequest());

        Map<String, Object> badSource = buyNow(c.getCode(), laptop, 1);
        badSource.put("source", "WISHLIST");
        preview(customerToken, badSource).andExpect(status().isBadRequest());
        Map<String, Object> noCode = buyNow("", laptop, 1);
        preview(customerToken, noCode).andExpect(status().isBadRequest());
    }

    // ===================== Phân quyền =====================

    @Test
    @DisplayName("Không token → 401; Staff → 403; Customer bị khóa → 403")
    void rbac() throws Exception {
        Map<String, Object> body = buyNow("TECHSTORE10", laptop, 1);
        preview(null, body).andExpect(status().isUnauthorized());
        preview(staffToken, body).andExpect(status().isForbidden());

        User locked = userRepository.findByEmail("locked@techstore.vn").orElseThrow();
        String lockedToken = jwtTokenProvider.generateToken(locked.getId(), locked.getEmail(), locked.getFullName(),
                List.of("ROLE_CUSTOMER"));
        preview(lockedToken, body).andExpect(status().isForbidden());

        // Customer hợp lệ dùng mã seed
        preview(customerToken, body)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.discountAmount").value(200000));
    }
}
