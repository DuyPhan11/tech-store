package com.techstore.product.service;

import com.techstore.product.dto.CategoryDto;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Category;
import com.techstore.product.repository.CategoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

@Service
@Transactional(readOnly = true)
public class CategoryServiceImpl implements CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryServiceImpl(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Override
    public List<CategoryDto> getAllCategories() {
        return categoryRepository.findAll().stream()
                .filter(this::isPubliclyVisible)
                .map(this::mapToDtoFlat)
                .collect(Collectors.toList());
    }

    @Override
    public List<CategoryDto> getCategoryTree() {
        List<Category> rootCategories = categoryRepository.findByParentIsNullAndStatus(ActiveStatus.ACTIVE);
        return rootCategories.stream()
                .map(this::mapToDtoWithChildren)
                .collect(Collectors.toList());
    }

    @Override
    public CategoryDto getCategoryBySlug(String slug) {
        return categoryRepository.findBySlug(slug)
                .filter(this::isPubliclyVisible)
                .map(this::mapToDtoWithChildren)
                .orElse(null);
    }

    /**
     * Danh mục hiển thị công khai khi chính nó và mọi danh mục tổ tiên đều ACTIVE (ADR-018 A6).
     */
    private boolean isPubliclyVisible(Category cat) {
        Category cursor = cat;
        int guard = 0;
        while (cursor != null && guard++ < 32) {
            if (cursor.getStatus() != ActiveStatus.ACTIVE) {
                return false;
            }
            cursor = cursor.getParent();
        }
        return true;
    }

    private CategoryDto mapToDtoFlat(Category cat) {
        Long parentId = cat.getParent() != null ? cat.getParent().getId() : null;
        String parentSlug = cat.getParent() != null ? cat.getParent().getSlug() : null;
        return new CategoryDto(
                cat.getId(),
                cat.getName(),
                cat.getSlug(),
                cat.getDescription(),
                cat.getImageUrl(),
                parentId,
                parentSlug
        );
    }

    private CategoryDto mapToDtoWithChildren(Category cat) {
        CategoryDto dto = mapToDtoFlat(cat);
        if (cat.getChildren() != null && !cat.getChildren().isEmpty()) {
            List<CategoryDto> childrenDtos = cat.getChildren().stream()
                    .filter(c -> c.getStatus() == ActiveStatus.ACTIVE)
                    .map(this::mapToDtoWithChildren)
                    .collect(Collectors.toList());
            dto.setChildren(childrenDtos);
        }
        return dto;
    }
}
