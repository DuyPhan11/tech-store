package com.techstore.product.dto;

/**
 * Thương hiệu công khai cho bộ lọc catalog (GET /api/brands, ADR-018 A6).
 */
public record BrandDto(Long id, String name, String slug, String logoUrl) {
}
