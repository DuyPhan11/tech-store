package com.techstore.security;

import com.techstore.common.security.JwtProperties;
import com.techstore.common.security.JwtTokenProvider;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider tokenProvider;

    @BeforeEach
    void setUp() {
        JwtProperties properties = new JwtProperties();
        properties.setSecret("586e3272357538782f413f4428472b4b6250645367566b597033733676397924");
        properties.setExpirationMs(3600000L); // 1 hour
        tokenProvider = new JwtTokenProvider(properties);
    }

    @Test
    @DisplayName("Tạo token JWT hợp lệ và trích xuất đúng thông tin claims")
    void generateToken_ShouldContainCorrectClaims() {
        Long userId = 100L;
        String email = "test@techstore.vn";
        String fullName = "Test User";
        List<String> roles = List.of("ROLE_CUSTOMER");

        String token = tokenProvider.generateToken(userId, email, fullName, roles);

        assertNotNull(token);
        assertTrue(tokenProvider.validateToken(token));
        assertEquals(userId, tokenProvider.getUserIdFromToken(token));
        assertEquals(email, tokenProvider.getEmailFromToken(token));
        assertEquals(roles, tokenProvider.getRolesFromToken(token));
    }

    @Test
    @DisplayName("Token bị sửa đổi trái phép (tampered token) -> validateToken trả về false")
    void validateToken_WithTamperedToken_ShouldReturnFalse() {
        String token = tokenProvider.generateToken(1L, "user@techstore.vn", "User", List.of("ROLE_CUSTOMER"));
        String tamperedToken = token + "corrupted";

        assertFalse(tokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("Token rỗng hoặc chuỗi bất kỳ -> validateToken trả về false")
    void validateToken_WithInvalidString_ShouldReturnFalse() {
        assertFalse(tokenProvider.validateToken("invalid.token.string"));
        assertFalse(tokenProvider.validateToken(""));
        assertFalse(tokenProvider.validateToken(null));
    }
}
