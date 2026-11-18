package com.techstore.product.controller;

import com.techstore.product.dto.admin.AdminCategoryRequest;
import com.techstore.product.dto.admin.AdminCategoryResponse;
import com.techstore.product.dto.admin.CatalogStatusRequest;
import com.techstore.product.service.AdminCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UC12 — Quản trị danh mục (ROLE_ADMIN). Không có DELETE: vô hiệu hóa qua /status (ADR-018 A2).
 */
@RestController
@RequestMapping("/api/admin/categories")
@PreAuthorize("hasRole('ADMIN')")
public class AdminCategoryController {

    private final AdminCatalogService adminCatalogService;

    public AdminCategoryController(AdminCatalogService adminCatalogService) {
        this.adminCatalogService = adminCatalogService;
    }

    @GetMapping
    public ResponseEntity<List<AdminCategoryResponse>> list() {
        return ResponseEntity.ok(adminCatalogService.listCategories());
    }

    @PostMapping
    public ResponseEntity<AdminCategoryResponse> create(@Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminCatalogService.createCategory(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminCategoryResponse> update(@PathVariable Long id,
                                                        @Valid @RequestBody AdminCategoryRequest request) {
        return ResponseEntity.ok(adminCatalogService.updateCategory(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminCategoryResponse> updateStatus(@PathVariable Long id,
                                                              @Valid @RequestBody CatalogStatusRequest request) {
        return ResponseEntity.ok(adminCatalogService.updateCategoryStatus(id, request.status()));
    }
}
