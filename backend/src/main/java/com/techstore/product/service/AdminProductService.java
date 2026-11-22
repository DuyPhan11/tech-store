package com.techstore.product.service;

import com.techstore.product.dto.admin.AdminProductRequest;
import com.techstore.product.dto.admin.AdminProductResponse;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

/**
 * UC11 — Quản trị sản phẩm và ảnh Cloudinary (ROLE_STAFF, ADMIN kế thừa; ADR-019).
 */
public interface AdminProductService {

    List<AdminProductResponse> listProducts();

    AdminProductResponse getProduct(Long id);

    AdminProductResponse createProduct(AdminProductRequest request, List<MultipartFile> files);

    AdminProductResponse updateProduct(Long id, AdminProductRequest request, List<MultipartFile> files);

    AdminProductResponse updateStatus(Long id, String status);
}
