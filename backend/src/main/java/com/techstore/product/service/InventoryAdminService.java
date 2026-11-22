package com.techstore.product.service;

import com.techstore.product.dto.inventory.InventoryAdjustRequest;
import com.techstore.product.dto.inventory.InventoryBranchOption;
import com.techstore.product.dto.inventory.InventoryItemResponse;
import com.techstore.product.dto.inventory.InventoryTransferRequest;
import com.techstore.product.dto.inventory.InventoryTransferResponse;

import java.util.List;

/**
 * UC18 — Quản lý tồn kho / chuyển kho (ROLE_STAFF, ADMIN kế thừa; ADR-021).
 */
public interface InventoryAdminService {

    List<InventoryItemResponse> listInventories(Long branchId, String keyword);

    List<InventoryBranchOption> listBranches();

    InventoryItemResponse adjust(Long actorUserId, InventoryAdjustRequest request);

    InventoryTransferResponse transfer(Long actorUserId, InventoryTransferRequest request);
}
