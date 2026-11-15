package com.techstore.demo;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api")
public class DemoSecuredController {

    @GetMapping("/products")
    public ResponseEntity<Map<String, String>> publicProducts() {
        return ResponseEntity.ok(Map.of("message", "Public catalog endpoint"));
    }

    @GetMapping("/admin/demo")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Map<String, String>> adminEndpoint(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "message", "Chào mừng Quản trị viên!",
            "user", authentication.getName()
        ));
    }

    @GetMapping("/admin/staff-area")
    @PreAuthorize("hasRole('STAFF')")
    public ResponseEntity<Map<String, String>> staffEndpoint(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "message", "Khu vực dành cho Nhân viên hoặc Quản trị viên (thừa kế quyền)!",
            "user", authentication.getName()
        ));
    }

    @GetMapping("/cart/demo")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<Map<String, String>> customerEndpoint(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "message", "Khu vực giỏ hàng dành riêng cho Khách hàng!",
            "user", authentication.getName()
        ));
    }

    @GetMapping("/me/demo")
    public ResponseEntity<Map<String, Object>> meEndpoint(Authentication authentication) {
        return ResponseEntity.ok(Map.of(
            "user", authentication.getName(),
            "authorities", authentication.getAuthorities()
        ));
    }
}
