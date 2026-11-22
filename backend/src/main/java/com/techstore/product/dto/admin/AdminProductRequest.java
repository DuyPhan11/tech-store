package com.techstore.product.dto.admin;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

/**
 * Part {@code data} của request tạo/sửa sản phẩm (UC11, ADR-019).
 */
public record AdminProductRequest(
        @NotBlank(message = "Tên sản phẩm không được để trống")
        @Size(max = 200, message = "Tên sản phẩm tối đa 200 ký tự")
        String name,

        @NotBlank(message = "Slug không được để trống")
        @Size(max = 255, message = "Slug tối đa 255 ký tự")
        @Pattern(regexp = CatalogSlug.PATTERN, message = CatalogSlug.MESSAGE)
        String slug,

        @NotBlank(message = "Mã SKU không được để trống")
        @Size(max = 50, message = "Mã SKU tối đa 50 ký tự")
        @Pattern(regexp = SKU_PATTERN, message = "SKU chỉ gồm chữ in hoa A-Z, số 0-9 và dấu gạch ngang giữa các cụm")
        String sku,

        @NotNull(message = "Vui lòng chọn danh mục")
        Long categoryId,

        @NotNull(message = "Vui lòng chọn thương hiệu")
        Long brandId,

        @NotNull(message = "Giá bán không được để trống")
        @DecimalMin(value = "0", message = "Giá bán không được âm")
        @Digits(integer = 13, fraction = 2, message = "Giá bán tối đa 13 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal price,

        @NotNull(message = "Giá vốn không được để trống")
        @DecimalMin(value = "0", message = "Giá vốn không được âm")
        @Digits(integer = 13, fraction = 2, message = "Giá vốn tối đa 13 chữ số nguyên và 2 chữ số thập phân")
        BigDecimal costPrice,

        @Size(max = 20000, message = "Mô tả tối đa 20000 ký tự")
        String description,

        @Size(max = 50, message = "Tối đa 50 dòng thông số")
        List<@Valid AdminProductSpecRequest> specifications,

        List<AdminProductImageRef> images
) {
    public static final String SKU_PATTERN = "^[A-Z0-9]+(-[A-Z0-9]+)*$";
}
