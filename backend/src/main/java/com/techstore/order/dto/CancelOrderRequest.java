package com.techstore.order.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public class CancelOrderRequest {

    @NotBlank(message = "Lý do hủy đơn hàng không được để trống")
    @Size(max = 500, message = "Lý do hủy đơn hàng không được vượt quá 500 ký tự")
    private String cancelReason;

    public CancelOrderRequest() {
    }

    public CancelOrderRequest(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }
}
