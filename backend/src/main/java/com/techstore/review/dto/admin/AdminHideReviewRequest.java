package com.techstore.review.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class AdminHideReviewRequest {

    @NotBlank(message = "Lý do ẩn đánh giá vi phạm không được để trống")
    @Size(max = 255, message = "Lý do ẩn đánh giá tối đa 255 ký tự")
    private String reason;

    public AdminHideReviewRequest() {
    }

    public String getReason() {
        return reason;
    }

    public void setReason(String reason) {
        this.reason = reason;
    }
}
