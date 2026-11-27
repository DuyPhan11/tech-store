package com.techstore.review.service;

import com.techstore.review.dto.CreateReviewRequest;
import com.techstore.review.dto.EligibleReviewOrderDto;
import com.techstore.review.dto.ProductReviewsResponse;
import com.techstore.review.dto.ReviewResponse;
import com.techstore.review.dto.UpdateReviewRequest;

import java.util.List;

public interface ReviewService {
    ProductReviewsResponse getProductReviews(Long productId);

    List<EligibleReviewOrderDto> getEligibleOrders(Long userId, Long productId);

    List<ReviewResponse> getMyReviews(Long userId);

    ReviewResponse createReview(Long userId, CreateReviewRequest request);

    ReviewResponse updateReview(Long userId, Long reviewId, UpdateReviewRequest request);

    ReviewResponse hideReview(Long userId, Long reviewId, String reason);
}
