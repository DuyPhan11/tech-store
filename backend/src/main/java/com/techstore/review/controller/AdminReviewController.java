package com.techstore.review.controller;

import com.techstore.common.security.UserPrincipal;
import com.techstore.review.dto.admin.AdminHideReviewRequest;
import com.techstore.review.dto.admin.AdminReviewResponse;
import com.techstore.review.service.AdminReviewService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/reviews")
@PreAuthorize("hasRole('ADMIN')")
public class AdminReviewController {

    private final AdminReviewService adminReviewService;

    public AdminReviewController(AdminReviewService adminReviewService) {
        this.adminReviewService = adminReviewService;
    }

    @GetMapping
    public ResponseEntity<List<AdminReviewResponse>> listReviews(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(adminReviewService.listReviews(status, q));
    }

    @PatchMapping("/{id}/hide")
    public ResponseEntity<AdminReviewResponse> hideReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody AdminHideReviewRequest request) {
        return ResponseEntity.ok(adminReviewService.hideReview(currentUser.getId(), id, request.getReason()));
    }
}
