package com.techstore.product.dto.admin;

/**
 * Một vị trí ảnh trong form sản phẩm (ADR-019): đúng một trong {@code imageId} (ảnh cũ giữ lại)
 * hoặc {@code fileIndex} (ảnh mới trong part {@code files}). Vị trí trong mảng = displayOrder.
 */
public record AdminProductImageRef(Long imageId, Integer fileIndex, Boolean primary) {

    public boolean isPrimary() {
        return Boolean.TRUE.equals(primary);
    }
}
