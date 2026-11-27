package com.techstore.review.dto;

import java.util.List;

public record ProductReviewsResponse(
        Long productId,
        double averageRating,
        int totalReviews,
        List<ReviewResponse> reviews
) {
}
