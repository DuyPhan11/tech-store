package com.techstore.product.dto.admin;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * Body đổi trạng thái danh mục/thương hiệu. Chỉ chấp nhận ACTIVE hoặc INACTIVE (ADR-018 A1/A2).
 */
public record CatalogStatusRequest(
        @NotBlank(message = "Trạng thái không được để trống")
        @Pattern(regexp = "^(ACTIVE|INACTIVE)$", message = "Trạng thái chỉ nhận ACTIVE hoặc INACTIVE")
        String status
) {
}
