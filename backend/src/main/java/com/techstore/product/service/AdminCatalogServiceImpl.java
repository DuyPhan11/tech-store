package com.techstore.product.service;

import com.techstore.common.exception.CatalogResourceNotFoundException;
import com.techstore.common.exception.DuplicateResourceException;
import com.techstore.product.dto.admin.AdminBrandRequest;
import com.techstore.product.dto.admin.AdminBrandResponse;
import com.techstore.product.dto.admin.AdminCategoryRequest;
import com.techstore.product.dto.admin.AdminCategoryResponse;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Brand;
import com.techstore.product.entity.Category;
import com.techstore.product.repository.BrandRepository;
import com.techstore.product.repository.CategoryRepository;
import com.techstore.product.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Service
@Transactional
public class AdminCatalogServiceImpl implements AdminCatalogService {

    private static final Logger log = LoggerFactory.getLogger(AdminCatalogServiceImpl.class);

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final ProductRepository productRepository;

    public AdminCatalogServiceImpl(CategoryRepository categoryRepository,
                                   BrandRepository brandRepository,
                                   ProductRepository productRepository) {
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.productRepository = productRepository;
    }

    // ===================== Categories =====================

    @Override
    @Transactional(readOnly = true)
    public List<AdminCategoryResponse> listCategories() {
        Map<Long, Long> counts = toCountMap(productRepository.countGroupByCategoryId());
        return categoryRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
                .map(c -> toCategoryResponse(c, counts.getOrDefault(c.getId(), 0L)))
                .toList();
    }

    @Override
    public AdminCategoryResponse createCategory(AdminCategoryRequest request) {
        String slug = request.slug().trim();
        if (categoryRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Slug danh mục đã tồn tại: " + slug);
        }
        Category category = new Category();
        applyCategory(category, request, slug);
        Category saved = saveCategory(category, slug);
        log.info("Admin tạo danh mục: id={}, slug={}", saved.getId(), saved.getSlug());
        return toCategoryResponse(saved, 0L);
    }

    @Override
    public AdminCategoryResponse updateCategory(Long id, AdminCategoryRequest request) {
        Category category = findCategory(id);
        String slug = request.slug().trim();
        categoryRepository.findBySlug(slug)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new DuplicateResourceException("Slug danh mục đã tồn tại: " + slug);
                });
        applyCategory(category, request, slug);
        Category saved = saveCategory(category, slug);
        log.info("Admin cập nhật danh mục: id={}, slug={}", saved.getId(), saved.getSlug());
        return toCategoryResponse(saved, countForCategory(saved.getId()));
    }

    @Override
    public AdminCategoryResponse updateCategoryStatus(Long id, String status) {
        Category category = findCategory(id);
        category.setStatus(parseStatus(status));
        Category saved = categoryRepository.saveAndFlush(category);
        log.info("Admin đổi trạng thái danh mục: id={}, status={}", saved.getId(), saved.getStatus());
        return toCategoryResponse(saved, countForCategory(saved.getId()));
    }

    private void applyCategory(Category category, AdminCategoryRequest request, String slug) {
        category.setName(request.name().trim());
        category.setSlug(slug);
        category.setDescription(blankToNull(request.description()));
        category.setParent(resolveParent(category.getId(), request.parentId()));
    }

    /**
     * Danh mục cha phải tồn tại, không phải chính nó và không phải hậu duệ của nó (chống vòng, ADR-018 A3).
     */
    private Category resolveParent(Long selfId, Long parentId) {
        if (parentId == null) {
            return null;
        }
        if (parentId.equals(selfId)) {
            throw new IllegalArgumentException("Danh mục không thể là danh mục cha của chính nó");
        }
        Category parent = categoryRepository.findById(parentId)
                .orElseThrow(() -> new IllegalArgumentException("Danh mục cha không tồn tại: " + parentId));
        if (selfId != null) {
            Set<Long> visited = new HashSet<>();
            Category cursor = parent;
            while (cursor != null && visited.add(cursor.getId())) {
                if (cursor.getId().equals(selfId)) {
                    throw new IllegalArgumentException("Không thể chọn danh mục con làm danh mục cha (tạo vòng lặp)");
                }
                cursor = cursor.getParent();
            }
        }
        return parent;
    }

    private Category saveCategory(Category category, String slug) {
        try {
            return categoryRepository.saveAndFlush(category);
        } catch (DataIntegrityViolationException ex) {
            // Chặn race condition hai request cùng slug: unique key uq_categories_slug
            throw new DuplicateResourceException("Slug danh mục đã tồn tại: " + slug);
        }
    }

    private Category findCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new CatalogResourceNotFoundException("Không tìm thấy danh mục: " + id));
    }

    private long countForCategory(Long categoryId) {
        return toCountMap(productRepository.countGroupByCategoryId()).getOrDefault(categoryId, 0L);
    }

    private AdminCategoryResponse toCategoryResponse(Category c, long productCount) {
        Category parent = c.getParent();
        return new AdminCategoryResponse(
                c.getId(),
                c.getName(),
                c.getSlug(),
                c.getDescription(),
                c.getImageUrl(),
                parent != null ? parent.getId() : null,
                parent != null ? parent.getName() : null,
                c.getStatus().name(),
                productCount,
                c.getCreatedAt(),
                c.getUpdatedAt()
        );
    }

    // ===================== Brands =====================

    @Override
    @Transactional(readOnly = true)
    public List<AdminBrandResponse> listBrands() {
        Map<Long, Long> counts = toCountMap(productRepository.countGroupByBrandId());
        return brandRepository.findAll(Sort.by(Sort.Direction.ASC, "id")).stream()
                .map(b -> toBrandResponse(b, counts.getOrDefault(b.getId(), 0L)))
                .toList();
    }

    @Override
    public AdminBrandResponse createBrand(AdminBrandRequest request) {
        String slug = request.slug().trim();
        if (brandRepository.existsBySlug(slug)) {
            throw new DuplicateResourceException("Slug thương hiệu đã tồn tại: " + slug);
        }
        Brand brand = new Brand();
        applyBrand(brand, request, slug);
        Brand saved = saveBrand(brand, slug);
        log.info("Admin tạo thương hiệu: id={}, slug={}", saved.getId(), saved.getSlug());
        return toBrandResponse(saved, 0L);
    }

    @Override
    public AdminBrandResponse updateBrand(Long id, AdminBrandRequest request) {
        Brand brand = findBrand(id);
        String slug = request.slug().trim();
        brandRepository.findBySlug(slug)
                .filter(other -> !other.getId().equals(id))
                .ifPresent(other -> {
                    throw new DuplicateResourceException("Slug thương hiệu đã tồn tại: " + slug);
                });
        applyBrand(brand, request, slug);
        Brand saved = saveBrand(brand, slug);
        log.info("Admin cập nhật thương hiệu: id={}, slug={}", saved.getId(), saved.getSlug());
        return toBrandResponse(saved, countForBrand(saved.getId()));
    }

    @Override
    public AdminBrandResponse updateBrandStatus(Long id, String status) {
        Brand brand = findBrand(id);
        brand.setStatus(parseStatus(status));
        Brand saved = brandRepository.saveAndFlush(brand);
        log.info("Admin đổi trạng thái thương hiệu: id={}, status={}", saved.getId(), saved.getStatus());
        return toBrandResponse(saved, countForBrand(saved.getId()));
    }

    private void applyBrand(Brand brand, AdminBrandRequest request, String slug) {
        brand.setName(request.name().trim());
        brand.setSlug(slug);
        brand.setCountry(blankToNull(request.country()));
        brand.setDescription(blankToNull(request.description()));
    }

    private Brand saveBrand(Brand brand, String slug) {
        try {
            return brandRepository.saveAndFlush(brand);
        } catch (DataIntegrityViolationException ex) {
            throw new DuplicateResourceException("Slug thương hiệu đã tồn tại: " + slug);
        }
    }

    private Brand findBrand(Long id) {
        return brandRepository.findById(id)
                .orElseThrow(() -> new CatalogResourceNotFoundException("Không tìm thấy thương hiệu: " + id));
    }

    private long countForBrand(Long brandId) {
        return toCountMap(productRepository.countGroupByBrandId()).getOrDefault(brandId, 0L);
    }

    private AdminBrandResponse toBrandResponse(Brand b, long productCount) {
        return new AdminBrandResponse(
                b.getId(),
                b.getName(),
                b.getSlug(),
                b.getCountry(),
                b.getDescription(),
                b.getLogoUrl(),
                b.getStatus().name(),
                productCount,
                b.getCreatedAt(),
                b.getUpdatedAt()
        );
    }

    // ===================== Helpers =====================

    private static ActiveStatus parseStatus(String status) {
        try {
            return ActiveStatus.valueOf(status.trim());
        } catch (IllegalArgumentException | NullPointerException ex) {
            throw new IllegalArgumentException("Trạng thái chỉ nhận ACTIVE hoặc INACTIVE");
        }
    }

    private static String blankToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private static Map<Long, Long> toCountMap(List<Object[]> rows) {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : rows) {
            map.put((Long) row[0], ((Number) row[1]).longValue());
        }
        return map;
    }
}
