package com.techstore.coupon.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * Body tạo/sửa coupon (UC13, ADR-022). Mã được trim + UPPERCASE ở service.
 * Ràng buộc chéo trường (PERCENTAGE ≤ 100, endDate &gt; startDate) kiểm tra ở service.
 */
public record CouponRequest(
        @NotBlank(message = "Mã giảm giá không được để trống")
        @Pattern(regexp = "^\\s*[A-Za-z0-9_-]{3,50}\\s*$",
                message = "Mã chỉ gồm A-Z, 0-9, dấu _ hoặc -, dài 3–50 ký tự")
        String code,

        @NotBlank(message = "Vui lòng chọn hình thức giảm")
        @Pattern(regexp = "PERCENTAGE|FIXED_AMOUNT", message = "Hình thức giảm phải là PERCENTAGE hoặc FIXED_AMOUNT")
        String discountType,

        @NotNull(message = "Giá trị giảm không được để trống")
        @DecimalMin(value = "0", inclusive = false, message = "Giá trị giảm phải lớn hơn 0")
        @Digits(integer = 13, fraction = 2, message = "Giá trị giảm tối đa 13 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal discountValue,

        @DecimalMin(value = "0", message = "Giá trị đơn tối thiểu không được âm")
        @Digits(integer = 13, fraction = 2, message = "Giá trị đơn tối thiểu tối đa 13 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal minOrderAmount,

        @DecimalMin(value = "0", inclusive = false, message = "Mức giảm tối đa phải lớn hơn 0")
        @Digits(integer = 13, fraction = 2, message = "Mức giảm tối đa tối đa 13 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal maxDiscountAmount,

        @NotNull(message = "Giới hạn lượt dùng không được để trống")
        @Min(value = 1, message = "Giới hạn lượt dùng phải từ 1 trở lên")
        Integer usageLimit,

        @NotNull(message = "Ngày bắt đầu không được để trống")
        LocalDateTime startDate,

        @NotNull(message = "Ngày kết thúc không được để trống")
        LocalDateTime endDate
) {
}
