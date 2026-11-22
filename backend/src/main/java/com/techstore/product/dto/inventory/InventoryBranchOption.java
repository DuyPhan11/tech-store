package com.techstore.product.dto.inventory;

/** Chi nhánh để lọc/chọn trên màn hình kho (Staff đọc được; ADR-021). */
public record InventoryBranchOption(Long id, String name, String status) {
}
