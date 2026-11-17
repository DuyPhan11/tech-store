package com.techstore.auth.controller;

import com.techstore.auth.dto.*;
import com.techstore.auth.service.AuthService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/register/request-otp")
    public ResponseEntity<RegisterOtpResponse> requestRegisterOtp(@Valid @RequestBody RegisterOtpRequest request) {
        RegisterOtpResponse response = authService.requestRegisterOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/register/verify-otp", "/register"})
    public ResponseEntity<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PostMapping({"/password/request-otp", "/forgot-password"})
    public ResponseEntity<ForgotPasswordResponse> requestPasswordResetOtp(@Valid @RequestBody ForgotPasswordRequest request) {
        ForgotPasswordResponse response = authService.requestPasswordResetOtp(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping({"/password/reset", "/reset-password"})
    public ResponseEntity<ResetPasswordResponse> resetPassword(@Valid @RequestBody ResetPasswordRequest request) {
        ResetPasswordResponse response = authService.resetPassword(request);
        return ResponseEntity.ok(response);
    }
}
