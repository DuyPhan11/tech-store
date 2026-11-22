package com.techstore.product.controller;

import com.techstore.product.dto.admin.AdminProductRequest;
import com.techstore.product.dto.admin.AdminProductResponse;
import com.techstore.product.dto.admin.CatalogStatusRequest;
import com.techstore.product.service.AdminProductService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * UC11 — Quản trị sản phẩm (ROLE_STAFF, ADMIN kế thừa; ADR-019). Không có DELETE: ẩn qua /status.
 */
@RestController
@RequestMapping("/api/admin/products")
@PreAuthorize("hasRole('STAFF')")
public class AdminProductController {

    private final AdminProductService adminProductService;

    public AdminProductController(AdminProductService adminProductService) {
        this.adminProductService = adminProductService;
    }

    @GetMapping
    public ResponseEntity<List<AdminProductResponse>> list() {
        return ResponseEntity.ok(adminProductService.listProducts());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AdminProductResponse> get(@PathVariable Long id) {
        return ResponseEntity.ok(adminProductService.getProduct(id));
    }

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminProductResponse> create(@Valid @RequestPart("data") AdminProductRequest data,
                                                       @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return ResponseEntity.status(HttpStatus.CREATED).body(adminProductService.createProduct(data, files));
    }

    @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<AdminProductResponse> update(@PathVariable Long id,
                                                       @Valid @RequestPart("data") AdminProductRequest data,
                                                       @RequestPart(value = "files", required = false) List<MultipartFile> files) {
        return ResponseEntity.ok(adminProductService.updateProduct(id, data, files));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AdminProductResponse> updateStatus(@PathVariable Long id,
                                                             @Valid @RequestBody CatalogStatusRequest request) {
        return ResponseEntity.ok(adminProductService.updateStatus(id, request.status()));
    }
}
