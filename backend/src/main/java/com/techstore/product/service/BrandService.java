package com.techstore.product.service;

import com.techstore.product.dto.BrandDto;

import java.util.List;

public interface BrandService {
    /** Danh sách thương hiệu ACTIVE cho bộ lọc catalog công khai (ADR-018 A6). */
    List<BrandDto> getActiveBrands();
}
