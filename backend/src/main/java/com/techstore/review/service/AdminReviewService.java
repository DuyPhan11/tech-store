package com.techstore.review.service;

import com.techstore.review.dto.admin.AdminReviewResponse;

import java.util.List;

public interface AdminReviewService {
    List<AdminReviewResponse> listReviews(String status, String q);

    AdminReviewResponse hideReview(Long adminId, Long reviewId, String reason);
}
