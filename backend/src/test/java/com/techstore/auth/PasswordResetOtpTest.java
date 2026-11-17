package com.techstore.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.ForgotPasswordRequest;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.ResetPasswordRequest;
import com.techstore.auth.entity.PasswordResetToken;
import com.techstore.auth.repository.PasswordResetTokenRepository;
import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.RoleRepository;
import com.techstore.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;

import java.time.LocalDateTime;
import java.util.Optional;
import java.util.Set;

import static org.hamcrest.Matchers.containsString;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class PasswordResetOtpTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordResetTokenRepository passwordResetTokenRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private User testUser;

    @BeforeEach
    void setUp() {
        passwordResetTokenRepository.deleteAll();

        String testEmail = "reset_user_test@techstore.vn";
        Optional<User> existing = userRepository.findByEmail(testEmail);
        if (existing.isPresent()) {
            testUser = existing.get();
            testUser.setPassword(passwordEncoder.encode("OldPassword@123"));
            userRepository.save(testUser);
        } else {
            Role roleCustomer = roleRepository.findByName("ROLE_CUSTOMER").orElseThrow();
            testUser = new User();
            testUser.setEmail(testEmail);
            testUser.setPhone("0987112233");
            testUser.setFullName("User Test Reset");
            testUser.setPassword(passwordEncoder.encode("OldPassword@123"));
            testUser.setStatus(UserStatus.ACTIVE);
            testUser.setRoles(Set.of(roleCustomer));
            testUser = userRepository.save(testUser);
        }
    }

    @Test
    @DisplayName("Yêu cầu OTP với email hợp lệ -> 200 OK, lưu token hash và hạn 15 phút")
    void requestOtp_ValidEmail_ShouldReturn200AndSaveToken() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest(testUser.getEmail());

        mockMvc.perform(post("/api/auth/password/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("mã xác thực OTP đã được gửi")));

        Optional<PasswordResetToken> tokenOpt = passwordResetTokenRepository
                .findTopByUserIdAndIsUsedFalseOrderByCreatedAtDesc(testUser.getId());
        assertTrue(tokenOpt.isPresent());

        PasswordResetToken token = tokenOpt.get();
        assertFalse(token.isUsed());
        assertEquals(0, token.getFailedAttempts());
        assertTrue(token.getExpiryDate().isAfter(LocalDateTime.now().plusMinutes(14)));
        assertTrue(token.getExpiryDate().isBefore(LocalDateTime.now().plusMinutes(16)));
    }

    @Test
    @DisplayName("Yêu cầu OTP với email không tồn tại -> 200 OK (Bảo mật: Không tiết lộ email tồn tại)")
    void requestOtp_NonExistentEmail_ShouldReturn200WithoutRevealing() throws Exception {
        ForgotPasswordRequest request = new ForgotPasswordRequest("nonexistent_user_xyz@techstore.vn");

        mockMvc.perform(post("/api/auth/password/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("mã xác thực OTP đã được gửi")));
    }

    @Test
    @DisplayName("Yêu cầu OTP liên tục trong vòng 60 giây -> 429 Too Many Requests (Cooldown chống spam)")
    void requestOtp_CooldownWithin60Seconds_ShouldReturn429() throws Exception {
        PasswordResetToken recentToken = new PasswordResetToken(testUser, passwordEncoder.encode("123456"), LocalDateTime.now().plusMinutes(15));
        recentToken.setCreatedAt(LocalDateTime.now().minusSeconds(10));
        passwordResetTokenRepository.save(recentToken);

        ForgotPasswordRequest request = new ForgotPasswordRequest(testUser.getEmail());

        mockMvc.perform(post("/api/auth/password/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Vui lòng đợi")));
    }

    @Test
    @DisplayName("Đặt lại mật khẩu với OTP hợp lệ -> 200 OK, mật khẩu đổi, OTP đánh dấu is_used=true")
    void resetPassword_ValidOtp_ShouldUpdatePassword() throws Exception {
        String rawOtp = "654321";
        PasswordResetToken token = new PasswordResetToken(testUser, passwordEncoder.encode(rawOtp), LocalDateTime.now().plusMinutes(15));
        passwordResetTokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest(testUser.getEmail(), rawOtp, "NewPassword@456");

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message", containsString("Đặt lại mật khẩu thành công")));

        // Kiểm tra token đã đánh dấu is_used = true
        PasswordResetToken updatedToken = passwordResetTokenRepository.findById(token.getId()).orElseThrow();
        assertTrue(updatedToken.isUsed());

        // Kiểm tra user có thể đăng nhập bằng mật khẩu mới
        User updatedUser = userRepository.findById(testUser.getId()).orElseThrow();
        assertTrue(passwordEncoder.matches("NewPassword@456", updatedUser.getPassword()));

        // Kiểm tra đăng nhập với mật khẩu mới qua /api/auth/login
        LoginRequest loginReq = new LoginRequest(testUser.getEmail(), "NewPassword@456");
        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(loginReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.accessToken").isNotEmpty());
    }

    @Test
    @DisplayName("Nhập sai OTP -> 400 Bad Request, tăng failed_attempts")
    void resetPassword_WrongOtp_ShouldReturn400AndIncrementFailedAttempts() throws Exception {
        String rawOtp = "654321";
        PasswordResetToken token = new PasswordResetToken(testUser, passwordEncoder.encode(rawOtp), LocalDateTime.now().plusMinutes(15));
        passwordResetTokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest(testUser.getEmail(), "999999", "NewPassword@456");

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Mã OTP không chính xác")));

        PasswordResetToken updatedToken = passwordResetTokenRepository.findById(token.getId()).orElseThrow();
        assertEquals(1, updatedToken.getFailedAttempts());
        assertFalse(updatedToken.isUsed());
    }

    @Test
    @DisplayName("Nhập sai quá 5 lần -> 400 Bad Request, OTP bị vô hiệu hóa (Anti-abuse)")
    void resetPassword_Exceeding5Attempts_ShouldBeDisabled() throws Exception {
        String rawOtp = "654321";
        PasswordResetToken token = new PasswordResetToken(testUser, passwordEncoder.encode(rawOtp), LocalDateTime.now().plusMinutes(15));
        token.setFailedAttempts(5);
        passwordResetTokenRepository.save(token);

        // Kể cả nhập đúng mã OTP lúc này cũng bị từ chối vì đã quá 5 lần sai
        ResetPasswordRequest request = new ResetPasswordRequest(testUser.getEmail(), rawOtp, "NewPassword@456");

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("quá 5 lần")));
    }

    @Test
    @DisplayName("OTP hết hạn (quá 15 phút) -> 400 Bad Request")
    void resetPassword_ExpiredOtp_ShouldReturn400() throws Exception {
        String rawOtp = "654321";
        PasswordResetToken token = new PasswordResetToken(testUser, passwordEncoder.encode(rawOtp), LocalDateTime.now().minusMinutes(1));
        passwordResetTokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest(testUser.getEmail(), rawOtp, "NewPassword@456");

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("hết hạn")));
    }

    @Test
    @DisplayName("OTP đã sử dụng (is_used = true) không thể tái sử dụng -> 400 Bad Request")
    void resetPassword_UsedOtp_ShouldReturn400() throws Exception {
        String rawOtp = "654321";
        PasswordResetToken token = new PasswordResetToken(testUser, passwordEncoder.encode(rawOtp), LocalDateTime.now().plusMinutes(15));
        token.setUsed(true);
        passwordResetTokenRepository.save(token);

        ResetPasswordRequest request = new ResetPasswordRequest(testUser.getEmail(), rawOtp, "NewPassword@456");

        mockMvc.perform(post("/api/auth/password/reset")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Không tìm thấy yêu cầu")));
    }
}
