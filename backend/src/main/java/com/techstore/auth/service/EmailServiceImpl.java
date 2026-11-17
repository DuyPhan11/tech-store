package com.techstore.auth.service;

import jakarta.mail.internet.MimeMessage;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
public class EmailServiceImpl implements EmailService {

    private static final Logger log = LoggerFactory.getLogger(EmailServiceImpl.class);

    @Autowired(required = false)
    private JavaMailSender mailSender;

    @Value("${spring.mail.username:}")
    private String mailUsername;

    @Override
    public void sendRegistrationOtp(String toEmail, String otp) {
        log.info("=================================================");
        log.info("[EMAIL SERVICE] Gửi mã OTP đăng ký tới: {}", toEmail);
        log.info("[EMAIL SERVICE] Mã OTP 6 chữ số: {}", otp);
        log.info("[EMAIL SERVICE] Hiệu lực: 5 phút");
        log.info("=================================================");

        // Nếu đã cấu hình tài khoản Gmail thực tế và có JavaMailSender bean
        if (mailSender != null && mailUsername != null && !mailUsername.isBlank()) {
            try {
                MimeMessage message = mailSender.createMimeMessage();
                MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

                helper.setFrom(mailUsername, "Tech Store");
                helper.setTo(toEmail);
                helper.setSubject("[Tech Store] Mã xác thực đăng ký tài khoản (OTP)");

                String htmlContent = buildOtpHtmlContent(otp);
                helper.setText(htmlContent, true);

                mailSender.send(message);
                log.info("[EMAIL SERVICE] Đã gửi thành công email OTP thực tế tới {}", toEmail);
            } catch (Exception e) {
                log.error("[EMAIL SERVICE] Không thể gửi email thực tế qua SMTP ({}): {}. Mã OTP vẫn được lưu trữ và có hiệu lực.",
                        toEmail, e.getMessage());
            }
        } else {
            log.info("[EMAIL SERVICE] Chưa cấu hình MAIL_USERNAME trong .env.local -> Đang chạy ở chế độ Console Log tiện lợi.");
        }
    }

    private String buildOtpHtmlContent(String otp) {
        return "<div style=\"font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 580px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 8px; background-color: #ffffff;\">"
                + "  <div style=\"text-align: center; margin-bottom: 24px;\">"
                + "    <h2 style=\"color: #0b57d0; margin: 0; font-size: 24px; font-weight: 700;\">Tech Store</h2>"
                + "    <p style=\"color: #64748b; font-size: 14px; margin-top: 4px;\">Hệ thống công nghệ & thiết bị điện tử</p>"
                + "  </div>"
                + "  <p style=\"font-size: 15px; color: #1e293b; line-height: 1.5;\">Xin chào,</p>"
                + "  <p style=\"font-size: 15px; color: #1e293b; line-height: 1.5;\">Bạn đang thực hiện đăng ký tài khoản mới tại <strong>Tech Store</strong>. Dưới đây là mã xác thực OTP của bạn:</p>"
                + "  <div style=\"text-align: center; margin: 28px 0;\">"
                + "    <div style=\"display: inline-block; background-color: #f0f7ff; border: 1px dashed #0b57d0; border-radius: 8px; padding: 12px 32px;\">"
                + "      <span style=\"font-size: 32px; font-weight: 800; letter-spacing: 8px; color: #0b57d0; font-family: monospace;\">" + otp + "</span>"
                + "    </div>"
                + "  </div>"
                + "  <p style=\"font-size: 14px; color: #475569; line-height: 1.5;\">Mã OTP này có hiệu lực trong vòng <strong>5 phút</strong>. Vì lý do bảo mật, vui lòng không chia sẻ mã này cho bất kỳ ai.</p>"
                + "  <hr style=\"border: none; border-top: 1px solid #f1f5f9; margin: 24px 0;\" />"
                + "  <p style=\"font-size: 12px; color: #94a3b8; text-align: center; margin: 0;\">Nếu bạn không yêu cầu mã này, vui lòng bỏ qua email này.<br/>Đây là email tự động, vui lòng không trả lời thư này.</p>"
                + "</div>";
    }
}
