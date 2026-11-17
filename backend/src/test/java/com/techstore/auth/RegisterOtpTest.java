package com.techstore.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.RegisterOtpRequest;
import com.techstore.auth.dto.RegisterOtpResponse;
import com.techstore.auth.dto.RegisterRequest;
import com.techstore.auth.entity.EmailVerification;
import com.techstore.auth.repository.EmailVerificationRepository;
import com.techstore.cart.repository.CartRepository;
import com.techstore.user.entity.User;
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
import org.springframework.test.web.servlet.MvcResult;

import java.time.LocalDateTime;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class RegisterOtpTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private EmailVerificationRepository emailVerificationRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @BeforeEach
    void setUp() {
        emailVerificationRepository.deleteAll();
    }

    @Test
    @DisplayName("1. Gửi OTP email thành công: tạo bản ghi hash 6 số, hạn 5 phút, cooldown 60s")
    void requestOtp_Success() throws Exception {
        RegisterOtpRequest request = new RegisterOtpRequest("newuser1@techstore.vn");

        MvcResult result = mockMvc.perform(post("/api/auth/register/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("newuser1@techstore.vn")))
                .andExpect(jsonPath("$.expiresInSeconds", is(300)))
                .andExpect(jsonPath("$.resendCooldownSeconds", is(60)))
                .andReturn();

        EmailVerification verification = emailVerificationRepository
                .findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc("newuser1@techstore.vn")
                .orElseThrow();

        assertNotNull(verification.getOtpHash());
        assertTrue(verification.getOtpHash().startsWith("$2a$") || verification.getOtpHash().startsWith("$2b$"));
        assertFalse(verification.isUsed());
        assertEquals(0, verification.getFailedAttempts());
        assertTrue(verification.getExpiryDate().isAfter(LocalDateTime.now().plusMinutes(4)));
    }

    @Test
    @DisplayName("2. Gửi OTP với email đã tồn tại -> 409 Conflict")
    void requestOtp_DuplicateEmail_ShouldReturn409() throws Exception {
        RegisterOtpRequest request = new RegisterOtpRequest("customer@techstore.vn");

        mockMvc.perform(post("/api/auth/register/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Email này đã được sử dụng")));
    }

    @Test
    @DisplayName("3. Gửi OTP liên tục trong vòng 60 giây -> 429 Too Many Requests")
    void requestOtp_WithinCooldown_ShouldReturn429() throws Exception {
        RegisterOtpRequest request = new RegisterOtpRequest("cooldown@techstore.vn");

        // Lần 1: Thành công
        mockMvc.perform(post("/api/auth/register/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Lần 2: Quá nhanh (< 60s) -> 429
        mockMvc.perform(post("/api/auth/register/request-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isTooManyRequests())
                .andExpect(jsonPath("$.message", containsString("Vui lòng đợi")));
    }

    @Test
    @DisplayName("4. Đăng ký tài khoản với OTP chính xác: tạo User ROLE_CUSTOMER + Cart + đánh dấu OTP used")
    void register_ValidOtp_ShouldCreateUserAndCart() throws Exception {
        String email = "registered_ok@techstore.vn";
        String otpRaw = "654321";

        EmailVerification verification = new EmailVerification(
                email,
                passwordEncoder.encode(otpRaw),
                LocalDateTime.now().plusMinutes(5)
        );
        emailVerificationRepository.save(verification);

        RegisterRequest regReq = new RegisterRequest(
                email,
                otpRaw,
                "Trần Văn Khách",
                "0933111222",
                "Password@123"
        );

        mockMvc.perform(post("/api/auth/register/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accessToken", notNullValue()))
                .andExpect(jsonPath("$.tokenType", is("Bearer")))
                .andExpect(jsonPath("$.user.email", is(email)))
                .andExpect(jsonPath("$.user.fullName", is("Trần Văn Khách")))
                .andExpect(jsonPath("$.user.roles", hasItem("ROLE_CUSTOMER")));

        // Kiểm tra User trong DB
        User user = userRepository.findByEmail(email).orElseThrow();
        assertEquals("0933111222", user.getPhone());
        assertTrue(passwordEncoder.matches("Password@123", user.getPassword()));

        // Kiểm tra Cart tự động khởi tạo
        assertTrue(cartRepository.findByUserId(user.getId()).isPresent());

        // Kiểm tra OTP đã chuyển isUsed = true
        EmailVerification updatedOtp = emailVerificationRepository.findById(verification.getId()).orElseThrow();
        assertTrue(updatedOtp.isUsed());
    }

    @Test
    @DisplayName("5. Đăng ký với OTP sai -> 400 Bad Request và tăng failed_attempts")
    void register_WrongOtp_ShouldReturn400() throws Exception {
        String email = "wrong_otp@techstore.vn";
        EmailVerification verification = new EmailVerification(
                email,
                passwordEncoder.encode("111222"),
                LocalDateTime.now().plusMinutes(5)
        );
        emailVerificationRepository.save(verification);

        RegisterRequest regReq = new RegisterRequest(
                email,
                "999999", // OTP sai
                "Người Dùng Mới",
                "0944111222",
                "Password@123"
        );

        mockMvc.perform(post("/api/auth/register/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Mã OTP không chính xác")));

        EmailVerification after = emailVerificationRepository.findById(verification.getId()).orElseThrow();
        assertEquals(1, after.getFailedAttempts());
        assertFalse(after.isUsed());
    }

    @Test
    @DisplayName("6. Đăng ký với OTP đã hết hạn (> 5 phút) -> 400 Bad Request")
    void register_ExpiredOtp_ShouldReturn400() throws Exception {
        String email = "expired_otp@techstore.vn";
        EmailVerification verification = new EmailVerification(
                email,
                passwordEncoder.encode("333444"),
                LocalDateTime.now().minusMinutes(1) // Hết hạn
        );
        emailVerificationRepository.save(verification);

        RegisterRequest regReq = new RegisterRequest(
                email,
                "333444",
                "Người Hết Hạn",
                "0955111222",
                "Password@123"
        );

        mockMvc.perform(post("/api/auth/register/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("hết hạn")));
    }

    @Test
    @DisplayName("7. Đăng ký với số điện thoại đã tồn tại -> 409 Conflict")
    void register_DuplicatePhone_ShouldReturn409() throws Exception {
        String email = "phone_dup@techstore.vn";
        EmailVerification verification = new EmailVerification(
                email,
                passwordEncoder.encode("123123"),
                LocalDateTime.now().plusMinutes(5)
        );
        emailVerificationRepository.save(verification);

        // Số điện thoại của customer demo: 0903456789
        RegisterRequest regReq = new RegisterRequest(
                email,
                "123123",
                "Người Trùng Phone",
                "0903456789",
                "Password@123"
        );

        mockMvc.perform(post("/api/auth/register/verify-otp")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(regReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Số điện thoại này đã được sử dụng")));
    }
}
