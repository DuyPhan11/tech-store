package com.techstore.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    @DisplayName("Đăng nhập thành công với email hợp lệ -> 200 OK và JWT Token")
    void loginWithValidEmail_ShouldReturnToken() throws Exception {
        LoginRequest request = new LoginRequest("admin@techstore.vn", "Admin@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(emptyOrNullString())))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.expiresIn", greaterThan(0)))
                .andExpect(jsonPath("$.user.email", is("admin@techstore.vn")))
                .andExpect(jsonPath("$.user.phone", is("0901234567")))
                .andExpect(jsonPath("$.user.roles", hasItem("ROLE_ADMIN")));
    }

    @Test
    @DisplayName("Đăng nhập thành công với số điện thoại hợp lệ -> 200 OK và JWT Token")
    void loginWithValidPhone_ShouldReturnToken() throws Exception {
        LoginRequest request = new LoginRequest("0902345678", "Staff@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken", not(emptyOrNullString())))
                .andExpect(jsonPath("$.user.email", is("staff@techstore.vn")))
                .andExpect(jsonPath("$.user.roles", hasItem("ROLE_STAFF")));
    }

    @Test
    @DisplayName("Đăng nhập sai mật khẩu -> 401 Unauthorized")
    void loginWithWrongPassword_ShouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest("admin@techstore.vn", "WrongPassword@999");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")))
                .andExpect(jsonPath("$.message", containsString("không chính xác")));
    }

    @Test
    @DisplayName("Đăng nhập với email không tồn tại -> 401 Unauthorized")
    void loginWithNonExistentUser_ShouldReturn401() throws Exception {
        LoginRequest request = new LoginRequest("notfound@techstore.vn", "AnyPassword@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.status", is(401)))
                .andExpect(jsonPath("$.error", is("Unauthorized")));
    }

    @Test
    @DisplayName("Đăng nhập với tài khoản bị khóa (status = LOCKED) -> 403 Forbidden")
    void loginWithLockedAccount_ShouldReturn403() throws Exception {
        LoginRequest request = new LoginRequest("locked@techstore.vn", "Customer@123");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden())
                .andExpect(jsonPath("$.status", is(403)))
                .andExpect(jsonPath("$.error", is("Forbidden")))
                .andExpect(jsonPath("$.message", containsString("bị khóa")));
    }

    @Test
    @DisplayName("Đăng nhập thiếu mật khẩu -> 400 Bad Request")
    void loginWithMissingPassword_ShouldReturn400() throws Exception {
        LoginRequest request = new LoginRequest("admin@techstore.vn", "");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status", is(400)))
                .andExpect(jsonPath("$.error", is("Bad Request")));
    }
}
