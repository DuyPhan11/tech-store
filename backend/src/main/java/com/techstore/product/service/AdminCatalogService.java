package com.techstore.product.service;

import com.techstore.product.dto.admin.AdminBrandRequest;
import com.techstore.product.dto.admin.AdminBrandResponse;
import com.techstore.product.dto.admin.AdminCategoryRequest;
import com.techstore.product.dto.admin.AdminCategoryResponse;

import java.util.List;

/**
 * Nghiệp vụ quản trị danh mục và thương hiệu (UC12, ADR-018). Chỉ ROLE_ADMIN.
 * Không xóa vật lý: vô hiệu hóa bằng trạng thái INACTIVE (ADR-018 A2).
 */
public interface AdminCatalogService {

    List<AdminCategoryResponse> listCategories();

    AdminCategoryResponse createCategory(AdminCategoryRequest request);

    AdminCategoryResponse updateCategory(Long id, AdminCategoryRequest request);

    AdminCategoryResponse updateCategoryStatus(Long id, String status);

    List<AdminBrandResponse> listBrands();

    AdminBrandResponse createBrand(AdminBrandRequest request);

    AdminBrandResponse updateBrand(Long id, AdminBrandRequest request);

    AdminBrandResponse updateBrandStatus(Long id, String status);
}
