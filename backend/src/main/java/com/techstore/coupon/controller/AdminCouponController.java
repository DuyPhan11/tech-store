package com.techstore.coupon.controller;

import com.techstore.coupon.dto.CouponRequest;
import com.techstore.coupon.dto.CouponResponse;
import com.techstore.coupon.dto.CouponStatusRequest;
import com.techstore.coupon.service.CouponAdminService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** UC13 — Quản trị coupon (ROLE_STAFF, ADMIN kế thừa; ADR-022). Không có DELETE. */
@RestController
@RequestMapping("/api/admin/coupons")
@PreAuthorize("hasRole('STAFF')")
public class AdminCouponController {

    private final CouponAdminService couponAdminService;

    public AdminCouponController(CouponAdminService couponAdminService) {
        this.couponAdminService = couponAdminService;
    }

    @GetMapping
    public List<CouponResponse> list(@RequestParam(required = false) String q,
                                     @RequestParam(required = false) String status) {
        return couponAdminService.list(q, status);
    }

    @GetMapping("/{id}")
    public CouponResponse get(@PathVariable Long id) {
        return couponAdminService.get(id);
    }

    @PostMapping
    public ResponseEntity<CouponResponse> create(@Valid @RequestBody CouponRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(couponAdminService.create(request));
    }

    @PutMapping("/{id}")
    public CouponResponse update(@PathVariable Long id, @Valid @RequestBody CouponRequest request) {
        return couponAdminService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public CouponResponse setStatus(@PathVariable Long id, @Valid @RequestBody CouponStatusRequest request) {
        return couponAdminService.setActive(id, request.active());
    }
}
