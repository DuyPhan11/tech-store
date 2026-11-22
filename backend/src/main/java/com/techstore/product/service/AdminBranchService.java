package com.techstore.product.service;

import com.techstore.product.dto.admin.AdminBranchRequest;
import com.techstore.product.dto.admin.AdminBranchResponse;

import java.util.List;

/**
 * UC19 — Quản trị chi nhánh (ROLE_ADMIN, ADR-020). Không xóa vật lý: vô hiệu hóa qua trạng thái.
 */
public interface AdminBranchService {

    List<AdminBranchResponse> listBranches();

    AdminBranchResponse createBranch(AdminBranchRequest request);

    AdminBranchResponse updateBranch(Long id, AdminBranchRequest request);

    AdminBranchResponse updateStatus(Long id, String status);
}
