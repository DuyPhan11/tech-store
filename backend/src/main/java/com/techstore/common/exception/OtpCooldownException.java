package com.techstore.common.exception;

public class OtpCooldownException extends RuntimeException {

    private final int remainingSeconds;

    public OtpCooldownException(String message, int remainingSeconds) {
        super(message);
        this.remainingSeconds = remainingSeconds;
    }

    public int getRemainingSeconds() {
        return remainingSeconds;
    }
}
