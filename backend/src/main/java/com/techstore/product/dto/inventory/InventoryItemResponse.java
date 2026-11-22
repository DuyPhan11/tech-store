package com.techstore.product.dto.inventory;

import com.techstore.product.entity.Inventory;

import java.time.LocalDateTime;

/** Một dòng tồn kho (sản phẩm × chi nhánh) — UC18, ADR-021. */
public record InventoryItemResponse(
        Long inventoryId,
        Long productId,
        String productName,
        String sku,
        Long branchId,
        String branchName,
        String branchStatus,
        int quantity,
        int minStockAlert,
        LocalDateTime updatedAt
) {
    public static InventoryItemResponse of(Inventory inv) {
        return new InventoryItemResponse(
                inv.getId(),
                inv.getProduct().getId(),
                inv.getProduct().getName(),
                inv.getProduct().getSku(),
                inv.getBranch().getId(),
                inv.getBranch().getName(),
                inv.getBranch().getStatus().name(),
                inv.getQuantity(),
                inv.getMinStockAlert(),
                inv.getUpdatedAt()
        );
    }
}
