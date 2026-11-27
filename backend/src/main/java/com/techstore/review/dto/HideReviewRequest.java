package com.techstore.review.dto;

import jakarta.validation.constraints.Size;

public class HideReviewRequest {

    @Size(max = 255, message = "Lý do ẩn đánh giá tối đa 255 ký tự")
    private String reason;

    public HideReviewRequest() {
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
