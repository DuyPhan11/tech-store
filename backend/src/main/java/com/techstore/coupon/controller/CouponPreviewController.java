package com.techstore.coupon.controller;

import com.techstore.common.security.UserPrincipal;
import com.techstore.coupon.dto.CouponPreviewRequest;
import com.techstore.coupon.dto.CouponPreviewResponse;
import com.techstore.coupon.service.CouponPreviewService;
import jakarta.validation.Valid;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

/** POST /api/checkout/coupon-preview (ROLE_CUSTOMER; ADR-022). Tách khỏi CheckoutController (FS16). */
@RestController
public class CouponPreviewController {

    private final CouponPreviewService couponPreviewService;

    public CouponPreviewController(CouponPreviewService couponPreviewService) {
        this.couponPreviewService = couponPreviewService;
    }

    @PostMapping("/api/checkout/coupon-preview")
    @PreAuthorize("hasRole('CUSTOMER')")
    public CouponPreviewResponse preview(@AuthenticationPrincipal UserPrincipal currentUser,
                                         @Valid @RequestBody CouponPreviewRequest request) {
        return couponPreviewService.preview(currentUser.getId(), request);
    }
}
