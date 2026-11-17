package com.techstore.auth.service;

import com.techstore.auth.dto.*;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    RegisterOtpResponse requestRegisterOtp(RegisterOtpRequest request);

    LoginResponse register(RegisterRequest request);

    ForgotPasswordResponse requestPasswordResetOtp(ForgotPasswordRequest request);

    ResetPasswordResponse resetPassword(ResetPasswordRequest request);
}
