package com.techstore.product.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body tạo/cập nhật chi nhánh (UC19, ADR-020). Phone rỗng được lưu là null.
 */
public record AdminBranchRequest(
        @NotBlank(message = "Tên chi nhánh không được để trống")
        @Size(max = 150, message = "Tên chi nhánh tối đa 150 ký tự")
        String name,

        @Size(max = 20, message = "Số điện thoại tối đa 20 ký tự")
        @Pattern(regexp = "^\\s*$|" + PHONE_PATTERN, message = "Số điện thoại chỉ gồm số, khoảng trắng, + ( ) . - và dài 8-20 ký tự")
        String phone,

        @NotBlank(message = "Địa chỉ chi nhánh không được để trống")
        @Size(max = 255, message = "Địa chỉ tối đa 255 ký tự")
        String address
) {
    public static final String PHONE_PATTERN = "^[0-9+() .-]{8,20}$";
}
