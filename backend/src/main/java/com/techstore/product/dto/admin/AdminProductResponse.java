package com.techstore.product.dto.admin;

import com.techstore.product.dto.ProductSpecDto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * DTO quản trị sản phẩm (UC11, ADR-019). {@code totalStock} = tổng tồn ở chi nhánh ACTIVE, chỉ đọc.
 */
public record AdminProductResponse(
        Long id,
        String name,
        String slug,
        String sku,
        Long categoryId,
        String categoryName,
        Long brandId,
        String brandName,
        BigDecimal price,
        BigDecimal costPrice,
        String description,
        List<ProductSpecDto> specifications,
        String status,
        long totalStock,
        String primaryImageUrl,
        List<AdminProductImageResponse> images,
        LocalDateTime createdAt,
        LocalDateTime updatedAt
) {
}
