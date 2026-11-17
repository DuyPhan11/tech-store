package com.techstore.auth.dto;

public class RegisterOtpResponse {

    private String message;
    private String email;
    private int expiresInSeconds;
    private int resendCooldownSeconds;

    public RegisterOtpResponse() {
    }

    public RegisterOtpResponse(String message, String email, int expiresInSeconds, int resendCooldownSeconds) {
        this.message = message;
        this.email = email;
        this.expiresInSeconds = expiresInSeconds;
        this.resendCooldownSeconds = resendCooldownSeconds;
    }

    public String getMessage() {
        return message;
    }

    public void setMessage(String message) {
        this.message = message;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public int getExpiresInSeconds() {
        return expiresInSeconds;
    }

    public void setExpiresInSeconds(int expiresInSeconds) {
        this.expiresInSeconds = expiresInSeconds;
    }

    public int getResendCooldownSeconds() {
        return resendCooldownSeconds;
    }

    public void setResendCooldownSeconds(int resendCooldownSeconds) {
        this.resendCooldownSeconds = resendCooldownSeconds;
    }
}
