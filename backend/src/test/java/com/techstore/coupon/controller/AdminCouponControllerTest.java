package com.techstore.coupon.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.coupon.CouponTestSupport;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.entity.DiscountType;
import com.techstore.coupon.repository.CouponRepository;
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

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

import static com.techstore.coupon.CouponTestSupport.uniqueCode;
import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** UC13 — Quản trị coupon (ADR-022). Mỗi test chạy trong transaction và rollback. */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminCouponControllerTest {

    private static final String BASE = "/api/admin/coupons";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CouponRepository couponRepository;
    @Autowired private UserRepository userRepository;
    @Autowired private CouponTestSupport support;

    private String adminToken;
    private String staffToken;
    private String customerToken;
    private User customer;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = login("admin@techstore.vn", "Admin@123");
        staffToken = login("staff@techstore.vn", "Staff@123");
        customerToken = login("customer@techstore.vn", "Customer@123");
        customer = userRepository.findByEmail("customer@techstore.vn").orElseThrow();
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

    private Map<String, Object> body(String code, String type, Object value) {
        Map<String, Object> body = new HashMap<>();
        body.put("code", code);
        body.put("discountType", type);
        body.put("discountValue", value);
        body.put("minOrderAmount", 1000000);
        body.put("maxDiscountAmount", 500000);
        body.put("usageLimit", 20);
        body.put("startDate", "2026-01-01T00:00");
        body.put("endDate", "2030-12-31T23:59");
        return body;
    }

    private ResultActions send(String method, String url, String token, Object body) throws Exception {
        var builder = switch (method) {
            case "POST" -> post(url);
            case "PUT" -> put(url);
            case "PATCH" -> patch(url);
            default -> throw new IllegalArgumentException(method);
        };
        if (token != null) {
            builder.header("Authorization", "Bearer " + token);
        }
        return mockMvc.perform(builder.contentType(MediaType.APPLICATION_JSON)
                .content(body instanceof String s ? s : objectMapper.writeValueAsString(body)));
    }

    private ResultActions getAs(String token, String url) throws Exception {
        return mockMvc.perform(get(url).header("Authorization", "Bearer " + token));
    }

    private JsonNode json(ResultActions actions) throws Exception {
        return objectMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    private Coupon usedCoupon(int usedCount) {
        Coupon c = support.coupon(uniqueCode("USED"), DiscountType.PERCENTAGE, "10", "0", "300000",
                50, usedCount, LocalDateTime.now().minusDays(1), LocalDateTime.now().plusDays(10), true);
        support.usage(c, customer, CouponUsageStatus.ACTIVE);
        return c;
    }

    // ===================== Tạo =====================

    @Test
    @DisplayName("Staff tạo coupon: 201, mã chuẩn hóa UPPERCASE, active, ACTIVE, usedCount 0")
    void createCoupon() throws Exception {
        String code = uniqueCode("new_");
        send("POST", BASE, staffToken, body("  " + code.toLowerCase() + " ", "PERCENTAGE", 15))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.code").value(code.toUpperCase()))
                .andExpect(jsonPath("$.discountType").value("PERCENTAGE"))
                .andExpect(jsonPath("$.discountValue").value(15))
                .andExpect(jsonPath("$.maxDiscountAmount").value(500000))
                .andExpect(jsonPath("$.usedCount").value(0))
                .andExpect(jsonPath("$.active").value(true))
                .andExpect(jsonPath("$.displayStatus").value("ACTIVE"))
                .andExpect(jsonPath("$.startDate").value("2026-01-01T00:00:00"));
        assertTrue(couponRepository.findByCode(code.toUpperCase()).isPresent());
    }

    @Test
    @DisplayName("FIXED_AMOUNT bỏ qua maxDiscountAmount (lưu null); minOrderAmount trống → 0")
    void fixedAmountIgnoresMaxDiscount() throws Exception {
        Map<String, Object> b = body(uniqueCode("FIX"), "FIXED_AMOUNT", 200000);
        b.remove("minOrderAmount");
        send("POST", BASE, adminToken, b)
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.maxDiscountAmount").value(nullValue()))
                .andExpect(jsonPath("$.minOrderAmount").value(0));
    }

    @Test
    @DisplayName("Trùng mã (kể cả khác hoa thường) → 409")
    void duplicateCode() throws Exception {
        String code = uniqueCode("DUP");
        send("POST", BASE, staffToken, body(code, "PERCENTAGE", 10)).andExpect(status().isCreated());
        send("POST", BASE, staffToken, body(code.toLowerCase(), "FIXED_AMOUNT", 1000))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("đã tồn tại")));
    }

    @Test
    @DisplayName("Các lỗi validation → 400")
    void validationErrors() throws Exception {
        String code = uniqueCode("VAL");
        Object[][] cases = {
                {"code", "AB"}, {"code", "CÓ DẤU"}, {"code", "A".repeat(51)}, {"code", ""},
                {"discountType", "PERCENT"}, {"discountValue", 0}, {"discountValue", -5},
                {"minOrderAmount", -1}, {"maxDiscountAmount", 0}, {"usageLimit", 0},
                {"startDate", null}, {"discountValue", "12.345"},
        };
        for (Object[] c : cases) {
            Map<String, Object> b = body(code, "PERCENTAGE", 10);
            b.put((String) c[0], c[1]);
            send("POST", BASE, staffToken, b)
                    .andExpect(status().isBadRequest())
                    .andExpect(jsonPath("$.errors." + c[0]).exists());
        }
        // ràng buộc chéo trường
        send("POST", BASE, staffToken, body(code, "PERCENTAGE", 101))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("100%")));
        Map<String, Object> sameDates = body(code, "FIXED_AMOUNT", 1000);
        sameDates.put("endDate", "2026-01-01T00:00");
        send("POST", BASE, staffToken, sameDates)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Ngày kết thúc")));
        Map<String, Object> reversed = body(code, "FIXED_AMOUNT", 1000);
        reversed.put("endDate", "2025-12-31T23:59");
        send("POST", BASE, staffToken, reversed).andExpect(status().isBadRequest());
        // ngày sai định dạng / JSON hỏng → 400 chứ không 500
        Map<String, Object> badDate = body(code, "FIXED_AMOUNT", 1000);
        badDate.put("startDate", "31/12/2026");
        send("POST", BASE, staffToken, badDate).andExpect(status().isBadRequest());
        send("POST", BASE, staffToken, "{ not json").andExpect(status().isBadRequest());
        // PERCENTAGE = 100 hợp lệ
        send("POST", BASE, staffToken, body(code, "PERCENTAGE", 100)).andExpect(status().isCreated());
        assertFalse(couponRepository.findByCode("AB").isPresent());
    }

    // ===================== Sửa =====================

    @Test
    @DisplayName("Sửa coupon chưa có usage: đổi được mã, loại và giá trị")
    void updateUnusedCoupon() throws Exception {
        Coupon c = support.activeCoupon(uniqueCode("UPD"), DiscountType.PERCENTAGE, "10", "0", null);
        String newCode = uniqueCode("RENAMED");
        send("PUT", BASE + "/" + c.getId(), staffToken, body(newCode, "FIXED_AMOUNT", 250000))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(newCode))
                .andExpect(jsonPath("$.discountType").value("FIXED_AMOUNT"))
                .andExpect(jsonPath("$.discountValue").value(250000))
                .andExpect(jsonPath("$.maxDiscountAmount").value(nullValue()))
                .andExpect(jsonPath("$.usageLimit").value(20));
    }

    @Test
    @DisplayName("Sửa sang mã của coupon khác → 409")
    void updateToExistingCode() throws Exception {
        Coupon a = support.activeCoupon(uniqueCode("AAA"), DiscountType.PERCENTAGE, "10", "0", null);
        Coupon b = support.activeCoupon(uniqueCode("BBB"), DiscountType.PERCENTAGE, "10", "0", null);
        send("PUT", BASE + "/" + b.getId(), staffToken, body(a.getCode(), "PERCENTAGE", 10))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Coupon đã có usage: đổi code/type/value → 409; đổi hạn, usageLimit, minOrder, maxDiscount → 200")
    void lockedFieldsAfterUsage() throws Exception {
        Coupon c = usedCoupon(1);
        String url = BASE + "/" + c.getId();

        send("PUT", url, staffToken, body(uniqueCode("OTHER"), "PERCENTAGE", 10))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("đã được sử dụng")));
        send("PUT", url, staffToken, body(c.getCode(), "FIXED_AMOUNT", 10)).andExpect(status().isConflict());
        send("PUT", url, staffToken, body(c.getCode(), "PERCENTAGE", 20)).andExpect(status().isConflict());

        Map<String, Object> ok = body(c.getCode().toLowerCase(), "PERCENTAGE", "10.00");
        ok.put("usageLimit", 5);
        ok.put("minOrderAmount", 2000000);
        ok.put("maxDiscountAmount", 800000);
        ok.put("endDate", "2031-06-30T12:00");
        send("PUT", url, staffToken, ok)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.usageLimit").value(5))
                .andExpect(jsonPath("$.minOrderAmount").value(2000000))
                .andExpect(jsonPath("$.maxDiscountAmount").value(800000))
                .andExpect(jsonPath("$.endDate").value("2031-06-30T12:00:00"))
                .andExpect(jsonPath("$.usedCount").value(1));
    }

    @Test
    @DisplayName("Usage REVERSED cũng khóa code/type/value (đã có usage bất kỳ trạng thái)")
    void reversedUsageAlsoLocks() throws Exception {
        Coupon c = support.activeCoupon(uniqueCode("REV"), DiscountType.PERCENTAGE, "10", "0", null);
        support.usage(c, customer, CouponUsageStatus.REVERSED);
        send("PUT", BASE + "/" + c.getId(), staffToken, body(c.getCode(), "PERCENTAGE", 30))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("usageLimit nhỏ hơn usedCount → 409; bằng usedCount → 200 (EXHAUSTED)")
    void usageLimitBelowUsedCount() throws Exception {
        Coupon c = usedCoupon(3);
        Map<String, Object> b = body(c.getCode(), "PERCENTAGE", 10);
        b.put("usageLimit", 2);
        send("PUT", BASE + "/" + c.getId(), staffToken, b)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("không được nhỏ hơn")));
        b.put("usageLimit", 3);
        send("PUT", BASE + "/" + c.getId(), staffToken, b)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayStatus").value("EXHAUSTED"));
    }

    // ===================== Bật/tắt, đọc, lọc =====================

    @Test
    @DisplayName("PATCH status bật/tắt; thiếu active → 400; id không tồn tại → 404")
    void toggleStatus() throws Exception {
        Coupon c = usedCoupon(1);
        send("PATCH", BASE + "/" + c.getId() + "/status", staffToken, Map.of("active", false))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.active").value(false))
                .andExpect(jsonPath("$.displayStatus").value("DISABLED"));
        send("PATCH", BASE + "/" + c.getId() + "/status", adminToken, Map.of("active", true))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayStatus").value("ACTIVE"));
        send("PATCH", BASE + "/" + c.getId() + "/status", staffToken, Map.of())
                .andExpect(status().isBadRequest());
        send("PATCH", BASE + "/999999/status", staffToken, Map.of("active", true)).andExpect(status().isNotFound());
        send("PUT", BASE + "/999999", staffToken, body(uniqueCode("X"), "PERCENTAGE", 10)).andExpect(status().isNotFound());
        getAs(staffToken, BASE + "/999999").andExpect(status().isNotFound());
        getAs(staffToken, BASE + "/abc").andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("GET danh sách: displayStatus đủ 5 giá trị, lọc q (không phân biệt hoa thường) và status; status sai → 400")
    void listAndFilter() throws Exception {
        String tag = uniqueCode("LST");
        LocalDateTime now = LocalDateTime.now();
        Coupon active = support.coupon(tag + "A", DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.minusDays(1), now.plusDays(1), true);
        Coupon scheduled = support.coupon(tag + "S", DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.plusDays(1), now.plusDays(2), true);
        Coupon expired = support.coupon(tag + "E", DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.minusDays(3), now.minusDays(1), true);
        Coupon exhausted = support.coupon(tag + "X", DiscountType.PERCENTAGE, "10", "0", null, 2, 2, now.minusDays(1), now.plusDays(1), true);
        Coupon disabled = support.coupon(tag + "D", DiscountType.PERCENTAGE, "10", "0", null, 10, 0, now.minusDays(1), now.plusDays(1), false);

        JsonNode all = json(getAs(staffToken, BASE + "?q=" + tag.toLowerCase()).andExpect(status().isOk()));
        assertEquals(5, all.size());
        assertEquals(disabled.getId(), all.get(0).get("id").asLong(), "sắp id giảm dần");
        Map<String, String> statuses = new HashMap<>();
        all.forEach(n -> statuses.put(n.get("code").asText(), n.get("displayStatus").asText()));
        assertEquals(Map.of(active.getCode(), "ACTIVE", scheduled.getCode(), "SCHEDULED", expired.getCode(), "EXPIRED",
                exhausted.getCode(), "EXHAUSTED", disabled.getCode(), "DISABLED"), statuses);

        getAs(staffToken, BASE + "?q=" + tag + "&status=expired")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].code").value(expired.getCode()));
        getAs(adminToken, BASE + "?status=DISABLED")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].displayStatus", everyItem(is("DISABLED"))));
        getAs(staffToken, BASE + "?status=UNKNOWN").andExpect(status().isBadRequest());
        getAs(staffToken, BASE + "/" + scheduled.getId())
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.displayStatus").value("SCHEDULED"));
    }

    @Test
    @DisplayName("Seed demo có TECHSTORE10, GIAM500K, HETHAN2025 (EXPIRED)")
    void demoSeed() throws Exception {
        getAs(staffToken, BASE + "?q=HETHAN2025")
                .andExpect(jsonPath("$[0].displayStatus").value("EXPIRED"));
        assertTrue(couponRepository.findByCode("TECHSTORE10").isPresent());
        assertTrue(couponRepository.findByCode("GIAM500K").isPresent());
    }

    // ===================== Phân quyền =====================

    @Test
    @DisplayName("RBAC: không token 401, Customer 403, Staff/Admin 200; DELETE → 405")
    void rbac() throws Exception {
        mockMvc.perform(get(BASE)).andExpect(status().isUnauthorized());
        send("POST", BASE, null, body(uniqueCode("NOAUTH"), "PERCENTAGE", 10)).andExpect(status().isUnauthorized());
        getAs(customerToken, BASE).andExpect(status().isForbidden());
        send("POST", BASE, customerToken, body(uniqueCode("CUST"), "PERCENTAGE", 10)).andExpect(status().isForbidden());
        getAs(staffToken, BASE).andExpect(status().isOk());
        getAs(adminToken, BASE).andExpect(status().isOk());

        Coupon c = support.activeCoupon(uniqueCode("DEL"), DiscountType.PERCENTAGE, "10", "0", null);
        mockMvc.perform(delete(BASE + "/" + c.getId()).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());
        assertTrue(couponRepository.findById(c.getId()).isPresent());
    }
}
