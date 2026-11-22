package com.techstore.product.dto.inventory;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

/**
 * Điều chỉnh tồn một cặp (sản phẩm, chi nhánh) — UC18, ADR-021.
 * INBOUND/OUTBOUND cần quantity &gt; 0 (kiểm tra ở service); SET cho phép 0.
 */
public record InventoryAdjustRequest(
        @NotNull(message = "Vui lòng chọn sản phẩm")
        Long productId,

        @NotNull(message = "Vui lòng chọn chi nhánh")
        Long branchId,

        @NotBlank(message = "Loại điều chỉnh không được để trống")
        @Pattern(regexp = "^(INBOUND|OUTBOUND|SET)$", message = "Loại điều chỉnh chỉ nhận INBOUND, OUTBOUND hoặc SET")
        String type,

        @NotNull(message = "Số lượng không được để trống")
        @Min(value = 0, message = "Số lượng không được âm")
        Integer quantity,

        @Size(max = 255, message = "Lý do tối đa 255 ký tự")
        String reason
) {
}
