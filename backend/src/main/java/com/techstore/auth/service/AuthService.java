package com.techstore.auth.service;

import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;

public interface AuthService {

    LoginResponse login(LoginRequest request);
}
