package com.techstore.auth.service;

import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.auth.dto.RegisterOtpRequest;
import com.techstore.auth.dto.RegisterOtpResponse;
import com.techstore.auth.dto.RegisterRequest;

public interface AuthService {

    LoginResponse login(LoginRequest request);

    RegisterOtpResponse requestRegisterOtp(RegisterOtpRequest request);

    LoginResponse register(RegisterRequest request);
}
