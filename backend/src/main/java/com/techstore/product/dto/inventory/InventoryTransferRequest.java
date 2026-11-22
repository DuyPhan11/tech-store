package com.techstore.product.dto.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Chuyển kho giữa hai chi nhánh — UC18, ADR-021. */
public record InventoryTransferRequest(
        @NotNull(message = "Vui lòng chọn sản phẩm")
        Long productId,

        @NotNull(message = "Vui lòng chọn chi nhánh xuất")
        Long fromBranchId,

        @NotNull(message = "Vui lòng chọn chi nhánh nhận")
        Long toBranchId,

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 1, message = "Số lượng chuyển phải lớn hơn 0")
        Integer quantity,

        @Size(max = 255, message = "Lý do tối đa 255 ký tự")
        String reason
) {
}
