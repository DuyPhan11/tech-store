package com.techstore.product.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body tạo/cập nhật thương hiệu (UC12, ADR-018 A1/A3/A5).
 */
public record AdminBrandRequest(
        @NotBlank(message = "Tên thương hiệu không được để trống")
        @Size(max = 100, message = "Tên thương hiệu tối đa 100 ký tự")
        String name,

        @NotBlank(message = "Slug không được để trống")
        @Size(max = 100, message = "Slug tối đa 100 ký tự")
        @Pattern(regexp = CatalogSlug.PATTERN, message = CatalogSlug.MESSAGE)
        String slug,

        @Size(max = 100, message = "Quốc gia xuất xứ tối đa 100 ký tự")
        String country,

        @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
        String description
) {
}
