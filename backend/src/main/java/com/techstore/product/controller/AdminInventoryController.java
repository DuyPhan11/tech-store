package com.techstore.product.controller;

import com.techstore.common.security.UserPrincipal;
import com.techstore.product.dto.inventory.InventoryAdjustRequest;
import com.techstore.product.dto.inventory.InventoryBranchOption;
import com.techstore.product.dto.inventory.InventoryItemResponse;
import com.techstore.product.dto.inventory.InventoryTransferRequest;
import com.techstore.product.dto.inventory.InventoryTransferResponse;
import com.techstore.product.service.InventoryAdminService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UC18 — Tồn kho / chuyển kho (ROLE_STAFF, ADMIN kế thừa; ADR-021).
 */
@RestController
@RequestMapping("/api/admin/inventories")
@PreAuthorize("hasRole('STAFF')")
public class AdminInventoryController {

    private final InventoryAdminService inventoryAdminService;

    public AdminInventoryController(InventoryAdminService inventoryAdminService) {
        this.inventoryAdminService = inventoryAdminService;
    }

    @GetMapping
    public ResponseEntity<List<InventoryItemResponse>> list(@RequestParam(required = false) Long branchId,
                                                            @RequestParam(required = false) String q) {
        return ResponseEntity.ok(inventoryAdminService.listInventories(branchId, q));
    }

    @GetMapping("/branches")
    public ResponseEntity<List<InventoryBranchOption>> branches() {
        return ResponseEntity.ok(inventoryAdminService.listBranches());
    }

    @PostMapping("/adjust")
    public ResponseEntity<InventoryItemResponse> adjust(@AuthenticationPrincipal UserPrincipal currentUser,
                                                        @Valid @RequestBody InventoryAdjustRequest request) {
        return ResponseEntity.ok(inventoryAdminService.adjust(currentUser.getId(), request));
    }

    @PostMapping("/transfer")
    public ResponseEntity<InventoryTransferResponse> transfer(@AuthenticationPrincipal UserPrincipal currentUser,
                                                              @Valid @RequestBody InventoryTransferRequest request) {
        return ResponseEntity.ok(inventoryAdminService.transfer(currentUser.getId(), request));
    }
}
