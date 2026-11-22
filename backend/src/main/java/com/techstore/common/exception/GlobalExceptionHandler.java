package com.techstore.common.exception;

import com.techstore.common.storage.ImageStorageException;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.validation.FieldError;
import org.springframework.web.HttpRequestMethodNotSupportedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;

import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<ErrorResponse> handleBadCredentials(BadCredentialsException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.UNAUTHORIZED.value(),
            "Unauthorized",
            ex.getMessage() != null ? ex.getMessage() : "Email/số điện thoại hoặc mật khẩu không chính xác",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(error);
    }

    @ExceptionHandler(AccountLockedException.class)
    public ResponseEntity<ErrorResponse> handleAccountLocked(AccountLockedException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.FORBIDDEN.value(),
            "Forbidden",
            ex.getMessage(),
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(AccessDeniedException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.FORBIDDEN.value(),
            "Forbidden",
            "Bạn không có quyền truy cập tài nguyên này",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(error);
    }

    @ExceptionHandler(ProductNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleProductNotFound(ProductNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage() != null ? ex.getMessage() : "Sản phẩm không tồn tại hoặc đã ngừng kinh doanh",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    /** Method không được hỗ trợ (vd. DELETE danh mục — ADR-018 A2) → 405 thay vì rơi vào handler 500 chung. */
    @ExceptionHandler(HttpRequestMethodNotSupportedException.class)
    public ResponseEntity<ErrorResponse> handleMethodNotSupported(HttpRequestMethodNotSupportedException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.METHOD_NOT_ALLOWED.value(),
            "Method Not Allowed",
            "Phương thức " + ex.getMethod() + " không được hỗ trợ cho tài nguyên này",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.METHOD_NOT_ALLOWED).body(error);
    }

    @ExceptionHandler(CatalogResourceNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCatalogResourceNotFound(CatalogResourceNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage(),
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(CartItemNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleCartItemNotFound(CartItemNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage() != null ? ex.getMessage() : "Mục giỏ hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(AddressNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleAddressNotFound(AddressNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage() != null ? ex.getMessage() : "Địa chỉ không tồn tại hoặc không thuộc quyền sở hữu của bạn",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(OrderNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleOrderNotFound(OrderNotFoundException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.NOT_FOUND.value(),
            "Not Found",
            ex.getMessage() != null ? ex.getMessage() : "Đơn hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.NOT_FOUND).body(error);
    }

    @ExceptionHandler(OrderCannotBeCancelledException.class)
    public ResponseEntity<ErrorResponse> handleOrderCannotBeCancelled(OrderCannotBeCancelledException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            ex.getMessage() != null ? ex.getMessage() : "Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận hoặc Đã xác nhận",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(InsufficientStockException.class)
    public ResponseEntity<ErrorResponse> handleInsufficientStock(InsufficientStockException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            "Conflict",
            ex.getMessage() != null ? ex.getMessage() : "Sản phẩm không đủ số lượng tồn kho",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(DuplicateResourceException.class)
    public ResponseEntity<ErrorResponse> handleDuplicateResource(DuplicateResourceException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.CONFLICT.value(),
            "Conflict",
            ex.getMessage() != null ? ex.getMessage() : "Tài nguyên đã tồn tại trong hệ thống",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.CONFLICT).body(error);
    }

    @ExceptionHandler(OtpCooldownException.class)
    public ResponseEntity<ErrorResponse> handleOtpCooldown(OtpCooldownException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.TOO_MANY_REQUESTS.value(),
            "Too Many Requests",
            ex.getMessage() != null ? ex.getMessage() : "Vui lòng đợi trước khi yêu cầu mã OTP mới",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS).body(error);
    }

    @ExceptionHandler(InvalidOtpException.class)
    public ResponseEntity<ErrorResponse> handleInvalidOtp(InvalidOtpException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            ex.getMessage() != null ? ex.getMessage() : "Mã OTP không hợp lệ",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(OtpExpiredException.class)
    public ResponseEntity<ErrorResponse> handleOtpExpired(OtpExpiredException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            ex.getMessage() != null ? ex.getMessage() : "Mã OTP đã hết hạn",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            ex.getMessage() != null ? ex.getMessage() : "Yêu cầu không hợp lệ",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidationErrors(MethodArgumentNotValidException ex, HttpServletRequest request) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError fieldError : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(fieldError.getField(), fieldError.getDefaultMessage());
        }

        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            "Dữ liệu gửi lên không hợp lệ",
            request.getRequestURI(),
            fieldErrors
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    /** Cloudinary lỗi hoặc chưa cấu hình (UC11, ADR-019) → 502 Bad Gateway. */
    @ExceptionHandler(ImageStorageException.class)
    public ResponseEntity<ErrorResponse> handleImageStorage(ImageStorageException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_GATEWAY.value(),
            "Bad Gateway",
            ex.getMessage() != null ? ex.getMessage() : "Dịch vụ lưu ảnh tạm thời không khả dụng",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY).body(error);
    }

    /** File/request vượt giới hạn multipart (5MB/ảnh) → 400. */
    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            "Ảnh vượt quá dung lượng cho phép (tối đa 5MB mỗi ảnh)",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(MissingServletRequestPartException.class)
    public ResponseEntity<ErrorResponse> handleMissingPart(MissingServletRequestPartException ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.BAD_REQUEST.value(),
            "Bad Request",
            "Thiếu phần dữ liệu bắt buộc: " + ex.getRequestPartName(),
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(error);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneralException(Exception ex, HttpServletRequest request) {
        ErrorResponse error = new ErrorResponse(
            HttpStatus.INTERNAL_SERVER_ERROR.value(),
            "Internal Server Error",
            ex.getMessage() != null ? ex.getMessage() : "Đã xảy ra lỗi máy chủ",
            request.getRequestURI()
        );
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(error);
    }
}
