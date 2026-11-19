package com.techstore.product.controller;

import com.techstore.product.dto.admin.AdminBrandRequest;
import com.techstore.product.dto.admin.AdminBrandResponse;
import com.techstore.product.dto.admin.CatalogStatusRequest;
import com.techstore.product.service.AdminCatalogService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * UC12 — Quản trị thương hiệu (ROLE_ADMIN). Không có DELETE: vô hiệu hóa qua /status (ADR-018 A2).
 */
@RestController
@RequestMapping("/api/admin/brands")
@PreAuthorize("hasRole('ADMIN')")
public class AdminBrandController {

    private final AdminCatalogService adminCatalogService;

    public AdminBrandController(AdminCatalogService adminCatalogService) {
        this.adminCatalogService = adminCatalogService;
    }

    @GetMapping
    public ResponseEntity<List<AdminBrandResponse>> list() {
        return ResponseEntity.ok(adminCatalogService.listBrands());
    }

    @PostMapping
    public ResponseEntity<AdminBrandResponse> create(@Valid @RequestBody AdminBrandRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminCatalogService.createBrand(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AdminBrandResponse> update(@PathVariable Long id,
                                                     @Valid @RequestBody AdminBrandRequest request) {
        return ResponseEntity.ok(adminCatalogService.updateBrand(id, request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminBrandResponse> updateStatus(@PathVariable Long id,
                                                           @Valid @RequestBody CatalogStatusRequest request) {
        return ResponseEntity.ok(adminCatalogService.updateBrandStatus(id, request.status()));
    }
}
