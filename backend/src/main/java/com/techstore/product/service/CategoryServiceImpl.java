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
                .filter(c -> c.getStatus() == ActiveStatus.ACTIVE)
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
                .filter(c -> c.getStatus() == ActiveStatus.ACTIVE)
                .map(this::mapToDtoWithChildren)
                .orElse(null);
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
