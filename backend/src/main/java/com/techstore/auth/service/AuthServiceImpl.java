package com.techstore.auth.service;

import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.auth.dto.UserSummaryDto;
import com.techstore.common.exception.AccountLockedException;
import com.techstore.common.security.JwtProperties;
import com.techstore.common.security.JwtTokenProvider;
import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;

    public AuthServiceImpl(UserRepository userRepository,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider,
                           JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.tokenProvider = tokenProvider;
        this.jwtProperties = jwtProperties;
    }

    @Override
    @Transactional(readOnly = true)
    public LoginResponse login(LoginRequest request) {
        String identifier = request.getLoginIdentifier();
        if (identifier.isEmpty()) {
            throw new BadCredentialsException("Email/số điện thoại hoặc mật khẩu không chính xác");
        }

        // 1. Tìm người dùng theo email hoặc số điện thoại
        User user = userRepository.findByEmailOrPhone(identifier)
                .orElseThrow(() -> new BadCredentialsException("Email/số điện thoại hoặc mật khẩu không chính xác"));

        // 2. Kiểm tra mật khẩu mã hóa BCrypt
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BadCredentialsException("Email/số điện thoại hoặc mật khẩu không chính xác");
        }

        // 3. Kiểm tra trạng thái tài khoản: LOCKED trả về 403 Forbidden
        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AccountLockedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        // 4. Lấy danh sách quyền và tạo JWT token
        List<String> roles = user.getRoles().stream()
                .map(Role::getName)
                .sorted()
                .collect(Collectors.toList());

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getFullName(), roles);

        UserSummaryDto userSummary = new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getPhone(),
                user.getFullName(),
                user.getAvatarUrl(),
                roles
        );

        long expiresInSeconds = jwtProperties.getExpirationMs() / 1000;
        return new LoginResponse(token, expiresInSeconds, userSummary);
    }
}
