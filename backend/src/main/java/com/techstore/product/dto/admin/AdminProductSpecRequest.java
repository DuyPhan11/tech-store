package com.techstore.product.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** Một dòng thông số kỹ thuật {label, value}, lưu dạng JSON array trong products.specifications. */
public record AdminProductSpecRequest(
        @NotBlank(message = "Tên thông số không được để trống")
        @Size(max = 100, message = "Tên thông số tối đa 100 ký tự")
        String label,

        @NotBlank(message = "Giá trị thông số không được để trống")
        @Size(max = 500, message = "Giá trị thông số tối đa 500 ký tự")
        String value
) {
}
