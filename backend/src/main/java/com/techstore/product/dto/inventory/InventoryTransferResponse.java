package com.techstore.product.dto.inventory;

/** Kết quả chuyển kho: dòng tồn nguồn và đích sau khi chuyển. */
public record InventoryTransferResponse(InventoryItemResponse from, InventoryItemResponse to) {
}
