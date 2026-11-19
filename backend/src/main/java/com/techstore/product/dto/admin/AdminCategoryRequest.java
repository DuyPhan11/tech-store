package com.techstore.product.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Body tạo/cập nhật danh mục (UC12, ADR-018 A1/A3).
 */
public record AdminCategoryRequest(
        @NotBlank(message = "Tên danh mục không được để trống")
        @Size(max = 100, message = "Tên danh mục tối đa 100 ký tự")
        String name,

        @NotBlank(message = "Slug không được để trống")
        @Size(max = 100, message = "Slug tối đa 100 ký tự")
        @Pattern(regexp = CatalogSlug.PATTERN, message = CatalogSlug.MESSAGE)
        String slug,

        @Size(max = 2000, message = "Mô tả tối đa 2000 ký tự")
        String description,

        Long parentId
) {
}
