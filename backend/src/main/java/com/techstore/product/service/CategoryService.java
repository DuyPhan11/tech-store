package com.techstore.product.service;

import com.techstore.product.dto.CategoryDto;

import java.util.List;

public interface CategoryService {
    List<CategoryDto> getAllCategories();
    List<CategoryDto> getCategoryTree();
    CategoryDto getCategoryBySlug(String slug);
}
