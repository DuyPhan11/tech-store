package com.techstore.product.controller;

import com.techstore.product.dto.admin.AdminBranchRequest;
import com.techstore.product.dto.admin.AdminBranchResponse;
import com.techstore.product.dto.admin.CatalogStatusRequest;
import com.techstore.product.service.AdminBranchService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UC19 — Quản trị chi nhánh (ROLE_ADMIN, ADR-020). Không có DELETE: vô hiệu hóa qua /status.
 */
@RestController
@RequestMapping("/api/admin/branches")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBranchController {

    private final AdminBranchService adminBranchService;

    public AdminBranchController(AdminBranchService adminBranchService) {
        this.adminBranchService = adminBranchService;
    }

    @GetMapping
    public ResponseEntity<List<AdminBranchResponse>> list() {
        return ResponseEntity.ok(adminBranchService.listBranches());
    }

    @PostMapping
    public ResponseEntity<AdminBranchResponse> create(@Valid @RequestBody AdminBranchRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminBranchService.createBranch(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminBranchResponse> update(@PathVariable Long id,
                                                      @Valid @RequestBody AdminBranchRequest request) {
        return ResponseEntity.ok(adminBranchService.updateBranch(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminBranchResponse> updateStatus(@PathVariable Long id,
                                                            @Valid @RequestBody CatalogStatusRequest request) {
        return ResponseEntity.ok(adminBranchService.updateStatus(id, request.status()));
    }
}
