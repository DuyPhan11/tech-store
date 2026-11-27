package com.techstore.review.dto;

import java.time.LocalDateTime;

public record EligibleReviewOrderDto(
        Long orderId,
        String orderCode,
        LocalDateTime completedAt
) {
}
