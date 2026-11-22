package com.techstore.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.hamcrest.Matchers.is;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class SecurityRbacTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    private String adminToken;
    private String staffToken;
    private String customerToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = obtainAccessToken("admin@techstore.vn", "Admin@123");
        staffToken = obtainAccessToken("staff@techstore.vn", "Staff@123");
        customerToken = obtainAccessToken("customer@techstore.vn", "Customer@123");
    }

    private String obtainAccessToken(String identifier, String password) throws Exception {
        LoginRequest request = new LoginRequest(identifier, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        return response.getAccessToken();
    }

    @Test
    @DisplayName("Truy cập endpoint công khai không cần token -> 200 OK")
    void publicEndpoint_WithoutToken_ShouldSucceed() throws Exception {
        mockMvc.perform(get("/api/products"))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Truy cập endpoint bảo vệ mà không gửi token -> 401 Unauthorized")
    void protectedEndpoint_WithoutToken_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/me/demo"))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("Tài khoản CUSTOMER truy cập endpoint Customer (/api/cart/demo) -> 200 OK")
    void customer_AccessCustomerEndpoint_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/cart/demo")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Khu vực giỏ hàng dành riêng cho Khách hàng!")));
    }

    @Test
    @DisplayName("Tài khoản CUSTOMER truy cập endpoint Admin (/api/admin/demo) -> 403 Forbidden")
    void customer_AccessAdminEndpoint_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/admin/demo")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")));
    }

    @Test
    @DisplayName("Tài khoản CUSTOMER truy cập endpoint Staff (/api/admin/staff-area) -> 403 Forbidden")
    void customer_AccessStaffEndpoint_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/admin/staff-area")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("Tài khoản STAFF truy cập endpoint Staff (/api/admin/staff-area) -> 200 OK")
    void staff_AccessStaffEndpoint_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/admin/staff-area")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Tài khoản STAFF truy cập endpoint Admin (/api/admin/demo) -> 403 Forbidden")
    void staff_AccessAdminEndpoint_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/admin/demo")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("Bất biến AGENTS.md: Tài khoản STAFF không có ROLE_CUSTOMER không gọi được endpoint Customer -> 403 Forbidden")
    void staff_AccessCustomerEndpoint_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/cart/demo")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("Tài khoản ADMIN truy cập endpoint Admin (/api/admin/demo) -> 200 OK")
    void admin_AccessAdminEndpoint_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/admin/demo")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", is("Chào mừng Quản trị viên!")));
    }

    @Test
    @DisplayName("Bất biến AGENTS.md: ROLE_ADMIN kế thừa quyền của STAFF (/api/admin/staff-area) -> 200 OK")
    void admin_AccessStaffEndpoint_ShouldReturn200_DueToHierarchy() throws Exception {
        mockMvc.perform(get("/api/admin/staff-area")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("Bất biến AGENTS.md: Quyền Customer yêu cầu ROLE_CUSTOMER; ADMIN đơn thuần không tự động có quyền Customer -> 403 Forbidden")
    void admin_AccessCustomerEndpoint_WithoutCustomerRole_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/cart/demo")
                        .header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)));
    }

    @Test
    @DisplayName("UC11: STAFF quản lý sản phẩm (/api/admin/products) -> 200; CUSTOMER -> 403; STAFF vẫn bị chặn ở UC12 -> 403")
    void staff_ManagesProducts_ButNotCatalogAdmin() throws Exception {
        mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/products")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/categories")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }
}
