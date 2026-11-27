package com.techstore.review.controller;

import com.techstore.common.security.UserPrincipal;
import com.techstore.review.dto.CreateReviewRequest;
import com.techstore.review.dto.EligibleReviewOrderDto;
import com.techstore.review.dto.HideReviewRequest;
import com.techstore.review.dto.ProductReviewsResponse;
import com.techstore.review.dto.ReviewResponse;
import com.techstore.review.dto.UpdateReviewRequest;
import com.techstore.review.service.ReviewService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api")
public class ReviewController {

    private final ReviewService reviewService;

    public ReviewController(ReviewService reviewService) {
        this.reviewService = reviewService;
    }

    /** Public: lấy danh sách đánh giá VISIBLE và điểm trung bình của sản phẩm. */
    @GetMapping("/products/{productId}/reviews")
    public ResponseEntity<ProductReviewsResponse> getProductReviews(@PathVariable Long productId) {
        return ResponseEntity.ok(reviewService.getProductReviews(productId));
    }

    /** Customer: lấy các đơn COMPLETED chứa sản phẩm chưa được đánh giá. */
    @GetMapping("/reviews/eligible")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<EligibleReviewOrderDto>> getEligibleOrders(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @RequestParam Long productId) {
        return ResponseEntity.ok(reviewService.getEligibleOrders(currentUser.getId(), productId));
    }

    /** Customer: lấy toàn bộ đánh giá của bản thân (mọi trạng thái). */
    @GetMapping("/reviews/me")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<List<ReviewResponse>> getMyReviews(
            @AuthenticationPrincipal UserPrincipal currentUser) {
        return ResponseEntity.ok(reviewService.getMyReviews(currentUser.getId()));
    }

    /** Customer: tạo đánh giá cho sản phẩm trong đơn COMPLETED của chính mình. */
    @PostMapping("/reviews")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> createReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @Valid @RequestBody CreateReviewRequest request) {
        ReviewResponse created = reviewService.createReview(currentUser.getId(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(created);
    }

    /** Customer: sửa đánh giá VISIBLE của chính mình. */
    @PutMapping("/reviews/{id}")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> updateReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody UpdateReviewRequest request) {
        return ResponseEntity.ok(reviewService.updateReview(currentUser.getId(), id, request));
    }

    /** Customer: ẩn mềm đánh giá của chính mình (HIDDEN_BY_OWNER, không xóa vật lý). */
    @PatchMapping("/reviews/{id}/hide")
    @PreAuthorize("hasRole('CUSTOMER')")
    public ResponseEntity<ReviewResponse> hideReview(
            @AuthenticationPrincipal UserPrincipal currentUser,
            @PathVariable Long id,
            @Valid @RequestBody(required = false) HideReviewRequest request) {
        String reason = request != null ? request.getReason() : null;
        return ResponseEntity.ok(reviewService.hideReview(currentUser.getId(), id, reason));
    }
}
