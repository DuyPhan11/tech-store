package com.techstore.auth.service;

import com.techstore.auth.dto.*;
import com.techstore.auth.entity.EmailVerification;
import com.techstore.auth.entity.PasswordResetToken;
import com.techstore.auth.repository.EmailVerificationRepository;
import com.techstore.auth.repository.PasswordResetTokenRepository;
import com.techstore.cart.entity.Cart;
import com.techstore.cart.repository.CartRepository;
import com.techstore.common.exception.*;
import com.techstore.common.security.JwtProperties;
import com.techstore.common.security.JwtTokenProvider;
import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.RoleRepository;
import com.techstore.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class AuthServiceImpl implements AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthServiceImpl.class);
    private static final SecureRandom secureRandom = new SecureRandom();

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final CartRepository cartRepository;
    private final EmailVerificationRepository emailVerificationRepository;
    private final PasswordResetTokenRepository passwordResetTokenRepository;
    private final EmailService emailService;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider tokenProvider;
    private final JwtProperties jwtProperties;

    public AuthServiceImpl(UserRepository userRepository,
                           RoleRepository roleRepository,
                           CartRepository cartRepository,
                           EmailVerificationRepository emailVerificationRepository,
                           PasswordResetTokenRepository passwordResetTokenRepository,
                           EmailService emailService,
                           PasswordEncoder passwordEncoder,
                           JwtTokenProvider tokenProvider,
                           JwtProperties jwtProperties) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.cartRepository = cartRepository;
        this.emailVerificationRepository = emailVerificationRepository;
        this.passwordResetTokenRepository = passwordResetTokenRepository;
        this.emailService = emailService;
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

        List<String> roleNames = user.getRoles().stream()
                .map(Role::getName)
                .collect(Collectors.toList());

        String accessToken = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getFullName(), roleNames);
        long expiresInSeconds = jwtProperties.getExpirationMs() / 1000;

        UserSummaryDto userSummary = new UserSummaryDto(
                user.getId(),
                user.getEmail(),
                user.getPhone(),
                user.getFullName(),
                user.getAvatarUrl(),
                roleNames
        );

        return new LoginResponse(accessToken, expiresInSeconds, userSummary);
    }

    @Override
    @Transactional
    public RegisterOtpResponse requestRegisterOtp(RegisterOtpRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        // 1. Kiểm tra email đã đăng ký chưa
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.");
        }

        // 2. Kiểm tra thời gian chờ gửi lại (cooldown 60 giây)
        Optional<EmailVerification> latestOpt = emailVerificationRepository.findTopByEmailOrderByCreatedAtDesc(email);
        if (latestOpt.isPresent()) {
            LocalDateTime lastCreated = latestOpt.get().getCreatedAt();
            long secondsPassed = ChronoUnit.SECONDS.between(lastCreated, LocalDateTime.now());
            if (secondsPassed < 60) {
                int remaining = (int) (60 - secondsPassed);
                throw new OtpCooldownException("Vui lòng đợi " + remaining + " giây trước khi yêu cầu mã OTP mới.", remaining);
            }
        }

        // 3. Tạo mã OTP 6 chữ số ngẫu nhiên
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));

        // 4. Hash mã OTP bằng BCrypt trước khi lưu vào DB
        String otpHash = passwordEncoder.encode(otp);

        // 5. Thiết lập thời hạn 5 phút (300 giây)
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(5);

        EmailVerification verification = new EmailVerification(email, otpHash, expiryDate);
        emailVerificationRepository.save(verification);

        // 6. Gửi OTP qua Email
        emailService.sendRegistrationOtp(email, otp);

        log.info("Yêu cầu mã OTP đăng ký thành công cho email: {}", email);

        return new RegisterOtpResponse(
                "Mã xác thực OTP đã được gửi đến email của bạn.",
                email,
                300,
                60
        );
    }

    @Override
    @Transactional(noRollbackFor = InvalidOtpException.class)
    public LoginResponse register(RegisterRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String phone = request.getPhone().trim();
        String fullName = request.getFullName().trim();

        // 1. Kiểm tra trùng lặp email và số điện thoại trong bảng users
        if (userRepository.existsByEmail(email)) {
            throw new DuplicateResourceException("Email này đã được sử dụng. Vui lòng đăng nhập hoặc sử dụng email khác.");
        }
        if (userRepository.existsByPhone(phone)) {
            throw new DuplicateResourceException("Số điện thoại này đã được sử dụng. Vui lòng sử dụng số điện thoại khác.");
        }

        // 2. Tìm mã OTP chưa sử dụng gần nhất của email này
        EmailVerification verification = emailVerificationRepository.findTopByEmailAndIsUsedFalseOrderByCreatedAtDesc(email)
                .orElseThrow(() -> new InvalidOtpException("Không tìm thấy mã OTP hợp lệ cho email này. Vui lòng yêu cầu mã OTP mới."));

        // 3. Kiểm tra thời hạn hiệu lực (5 phút)
        if (verification.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new OtpExpiredException("Mã OTP đã hết hạn (sau 5 phút). Vui lòng yêu cầu mã OTP mới.");
        }

        // 4. Kiểm tra mã OTP khớp với hash
        if (!passwordEncoder.matches(request.getOtp(), verification.getOtpHash())) {
            verification.setFailedAttempts(verification.getFailedAttempts() + 1);
            emailVerificationRepository.saveAndFlush(verification);
            throw new InvalidOtpException("Mã OTP không chính xác. Vui lòng kiểm tra lại.");
        }

        // 5. Đánh dấu OTP đã được sử dụng (dùng 1 lần)
        verification.setUsed(true);
        emailVerificationRepository.save(verification);

        // 6. Lấy vai trò ROLE_CUSTOMER
        Role roleCustomer = roleRepository.findByName("ROLE_CUSTOMER")
                .orElseThrow(() -> new IllegalStateException("Hệ thống chưa thiết lập vai trò ROLE_CUSTOMER"));

        // 7. Tạo mới người dùng với mật khẩu mã hóa BCrypt
        User user = new User();
        user.setEmail(email);
        user.setPhone(phone);
        user.setFullName(fullName);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setStatus(UserStatus.ACTIVE);
        user.setRoles(Set.of(roleCustomer));

        User savedUser = userRepository.save(user);

        // 8. Tự động khởi tạo giỏ hàng trống cho khách hàng mới
        cartRepository.save(new Cart(savedUser));

        log.info("Đăng ký tài khoản khách hàng thành công: userId={}, email={}", savedUser.getId(), savedUser.getEmail());

        // 9. Sinh JWT token và trả về thông tin đăng nhập thành công
        List<String> roleNames = List.of(roleCustomer.getName());
        String accessToken = tokenProvider.generateToken(savedUser.getId(), savedUser.getEmail(), savedUser.getFullName(), roleNames);
        long expiresInSeconds = jwtProperties.getExpirationMs() / 1000;

        UserSummaryDto userSummary = new UserSummaryDto(
                savedUser.getId(),
                savedUser.getEmail(),
                savedUser.getPhone(),
                savedUser.getFullName(),
                savedUser.getAvatarUrl(),
                roleNames
        );

        return new LoginResponse(accessToken, expiresInSeconds, userSummary);
    }

    @Override
    @Transactional
    public ForgotPasswordResponse requestPasswordResetOtp(ForgotPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();

        Optional<User> userOpt = userRepository.findByEmail(email);
        if (userOpt.isEmpty()) {
            // Quy tắc bảo mật: Không tiết lộ email có tồn tại trong hệ thống hay không
            log.info("[PASSWORD RESET] Yêu cầu OTP cho email không tồn tại trong hệ thống: {}", email);
            return new ForgotPasswordResponse(
                    "Nếu email của bạn tồn tại trong hệ thống, mã xác thực OTP đã được gửi đến hộp thư (hiệu lực 15 phút).",
                    60
            );
        }

        User user = userOpt.get();

        // Kiểm tra thời gian chờ gửi lại (cooldown 60 giây)
        Optional<PasswordResetToken> latestOpt = passwordResetTokenRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId());
        if (latestOpt.isPresent()) {
            LocalDateTime lastCreated = latestOpt.get().getCreatedAt();
            long secondsPassed = ChronoUnit.SECONDS.between(lastCreated, LocalDateTime.now());
            if (secondsPassed < 60) {
                int remaining = (int) (60 - secondsPassed);
                throw new OtpCooldownException("Vui lòng đợi " + remaining + " giây trước khi yêu cầu mã OTP mới.", remaining);
            }
        }

        // Tạo mã OTP ngẫu nhiên 6 chữ số
        String otp = String.format("%06d", secureRandom.nextInt(1_000_000));

        // Băm mã OTP bằng BCrypt
        String otpHash = passwordEncoder.encode(otp);

        // Thời hạn hiệu lực 15 phút
        LocalDateTime expiryDate = LocalDateTime.now().plusMinutes(15);

        PasswordResetToken resetToken = new PasswordResetToken(user, otpHash, expiryDate);
        passwordResetTokenRepository.save(resetToken);

        // Gửi mã OTP qua Email
        emailService.sendPasswordResetOtp(user.getEmail(), otp);

        log.info("[PASSWORD RESET] Yêu cầu mã OTP khôi phục mật khẩu thành công cho email: {}", email);

        return new ForgotPasswordResponse(
                "Nếu email của bạn tồn tại trong hệ thống, mã xác thực OTP đã được gửi đến hộp thư (hiệu lực 15 phút).",
                60
        );
    }

    @Override
    @Transactional(noRollbackFor = InvalidOtpException.class)
    public ResetPasswordResponse resetPassword(ResetPasswordRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        String otp = request.getOtp().trim();
        String newPassword = request.getNewPassword();

        // 1. Tìm người dùng theo email
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new InvalidOtpException("Yêu cầu đặt lại mật khẩu không hợp lệ hoặc mã OTP không chính xác."));

        // 2. Tìm mã OTP chưa sử dụng gần nhất của người dùng này
        PasswordResetToken resetToken = passwordResetTokenRepository.findTopByUserIdAndIsUsedFalseOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new InvalidOtpException("Không tìm thấy yêu cầu đặt lại mật khẩu hợp lệ. Vui lòng yêu cầu mã OTP mới."));

        // 3. Kiểm tra số lần nhập sai (tối đa 5 lần)
        if (resetToken.getFailedAttempts() >= 5) {
            throw new InvalidOtpException("Mã OTP đã bị vô hiệu hóa do nhập sai quá 5 lần. Vui lòng yêu cầu mã mới.");
        }

        // 4. Kiểm tra thời hạn hiệu lực (15 phút)
        if (resetToken.getExpiryDate().isBefore(LocalDateTime.now())) {
            throw new OtpExpiredException("Mã OTP đã hết hạn (quá 15 phút). Vui lòng yêu cầu mã mới.");
        }

        // 5. Kiểm tra mã OTP khớp với hash
        if (!passwordEncoder.matches(otp, resetToken.getOtpHash())) {
            resetToken.setFailedAttempts(resetToken.getFailedAttempts() + 1);
            passwordResetTokenRepository.saveAndFlush(resetToken);
            int remaining = 5 - resetToken.getFailedAttempts();
            if (remaining <= 0) {
                throw new InvalidOtpException("Mã OTP không chính xác. Mã đã bị vô hiệu hóa do nhập sai 5 lần. Vui lòng yêu cầu mã mới.");
            } else {
                throw new InvalidOtpException("Mã OTP không chính xác. Bạn còn " + remaining + " lần thử.");
            }
        }

        // 6. Đánh dấu OTP đã được sử dụng
        resetToken.setUsed(true);
        passwordResetTokenRepository.save(resetToken);

        // 7. Cập nhật mật khẩu mới mã hóa BCrypt
        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        log.info("[PASSWORD RESET] Đặt lại mật khẩu thành công cho tài khoản: userId={}, email={}", user.getId(), user.getEmail());

        return new ResetPasswordResponse("Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới.");
    }
}
