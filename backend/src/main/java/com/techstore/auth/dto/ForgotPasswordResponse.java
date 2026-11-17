package com.techstore.auth.dto;

public class ForgotPasswordResponse {

    private String message;
    private int resendCooldownSeconds;

    public ForgotPasswordResponse() {
    }

    public ForgotPasswordResponse(String message, int resendCooldownSeconds) {
        this.message = message;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public int getResendCooldownSeconds() {
        return resendCooldownSeconds;
    }

    public void setResendCooldownSeconds(int resendCooldownSeconds) {
        this.resendCooldownSeconds = resendCooldownSeconds;
    }
}
