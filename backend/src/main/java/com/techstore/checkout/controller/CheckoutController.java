package com.techstore.checkout.controller;

import com.techstore.checkout.dto.CheckoutRequest;
import com.techstore.checkout.dto.CheckoutResponse;
import com.techstore.checkout.service.CheckoutService;
import com.techstore.common.security.UserPrincipal;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/checkout")
public class CheckoutController {

    private final CheckoutService checkoutService;

    public CheckoutController(CheckoutService checkoutService) {
        this.checkoutService = checkoutService;
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<CheckoutResponse> checkout(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestHeader(value = "Idempotency-Key", required = false) String idempotencyHeader,
            @Valid @RequestBody CheckoutRequest request) {

        if ((request.getIdempotencyKey() == null || request.getIdempotencyKey().isBlank())
                && idempotencyHeader != null && !idempotencyHeader.isBlank()) {
            request.setIdempotencyKey(idempotencyHeader.trim());
        }

        CheckoutResponse response = checkoutService.checkout(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
