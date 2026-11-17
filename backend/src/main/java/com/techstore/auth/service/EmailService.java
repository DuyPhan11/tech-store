package com.techstore.auth.service;

public interface EmailService {

    void sendRegistrationOtp(String toEmail, String otp);

    void sendPasswordResetOtp(String toEmail, String otp);
}
