package com.techstore.product.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.common.exception.ProductNotFoundException;
import com.techstore.product.dto.*;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Brand;
import com.techstore.product.entity.Category;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.entity.ProductImage;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductImageRepository;
import com.techstore.product.repository.ProductRepository;
import jakarta.persistence.criteria.Join;
import jakarta.persistence.criteria.JoinType;
import jakarta.persistence.criteria.Predicate;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@Transactional(readOnly = true)
public class ProductServiceImpl implements ProductService {

    private static final Logger log = LoggerFactory.getLogger(ProductServiceImpl.class);
    private static final int PAGE_SIZE = 8;

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;
    private final ObjectMapper objectMapper;

    public ProductServiceImpl(ProductRepository productRepository,
                              ProductImageRepository productImageRepository,
                              InventoryRepository inventoryRepository,
                              ObjectMapper objectMapper) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.inventoryRepository = inventoryRepository;
        this.objectMapper = objectMapper;
    }

    @Override
    public CatalogPageResponse getProducts(String q, String category, String brand,
                                           BigDecimal min, BigDecimal max,
                                           String sort, Integer page) {
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> predicates = new ArrayList<>();

            Join<Product, Category> categoryJoin = root.join("category", JoinType.INNER);
            Join<Category, Category> parentCategoryJoin = categoryJoin.join("parent", JoinType.LEFT);
            Join<Product, Brand> brandJoin = root.join("brand", JoinType.INNER);

            // Chỉ lấy sản phẩm ACTIVE, danh mục ACTIVE và thương hiệu ACTIVE
            predicates.add(cb.equal(root.get("status"), ActiveStatus.ACTIVE));
            predicates.add(cb.equal(categoryJoin.get("status"), ActiveStatus.ACTIVE));
            predicates.add(cb.equal(brandJoin.get("status"), ActiveStatus.ACTIVE));

            // Tìm kiếm theo tên sản phẩm (không phân biệt hoa thường, cắt khoảng trắng đầu/cuối)
            if (q != null && !q.trim().isEmpty()) {
                String keyword = "%" + q.trim().toLowerCase() + "%";
                predicates.add(cb.like(cb.lower(root.get("name")), keyword));
            }

            // Lọc theo danh mục (hỗ trợ slug hoặc numeric id, hỗ trợ lọc cả danh mục cha và danh mục con)
            if (category != null && !category.trim().isEmpty()) {
                String cat = category.trim();
                if (cat.matches("^\\d+$")) {
                    Long catId = Long.valueOf(cat);
                    predicates.add(cb.or(
                        cb.equal(categoryJoin.get("id"), catId),
                        cb.equal(parentCategoryJoin.get("id"), catId),
                        cb.equal(categoryJoin.get("slug"), cat),
                        cb.equal(parentCategoryJoin.get("slug"), cat)
                    ));
                } else {
                    predicates.add(cb.or(
                        cb.equal(categoryJoin.get("slug"), cat),
                        cb.equal(parentCategoryJoin.get("slug"), cat)
                    ));
                }
            }

            // Lọc theo thương hiệu (hỗ trợ slug hoặc numeric id)
            if (brand != null && !brand.trim().isEmpty()) {
                String b = brand.trim();
                if (b.matches("^\\d+$")) {
                    Long brandId = Long.valueOf(b);
                    predicates.add(cb.or(
                        cb.equal(brandJoin.get("id"), brandId),
                        cb.equal(brandJoin.get("slug"), b)
                    ));
                } else {
                    predicates.add(cb.equal(brandJoin.get("slug"), b));
                }
            }

            // Khoảng giá
            if (min != null && min.compareTo(BigDecimal.ZERO) >= 0) {
                predicates.add(cb.greaterThanOrEqualTo(root.get("price"), min));
            }
            if (max != null && max.compareTo(BigDecimal.ZERO) >= 0) {
                predicates.add(cb.lessThanOrEqualTo(root.get("price"), max));
            }

            return cb.and(predicates.toArray(new Predicate[0]));
        };

        // Thứ tự sắp xếp
        Sort sortOrder;
        if ("price-asc".equalsIgnoreCase(sort)) {
            sortOrder = Sort.by(Sort.Direction.ASC, "price").and(Sort.by(Sort.Direction.ASC, "id"));
        } else if ("price-desc".equalsIgnoreCase(sort)) {
            sortOrder = Sort.by(Sort.Direction.DESC, "price").and(Sort.by(Sort.Direction.ASC, "id"));
        } else {
            sortOrder = Sort.by(Sort.Direction.ASC, "id");
        }

        int requestedPage = (page != null && page > 0) ? page : 1;
        Pageable pageable = PageRequest.of(requestedPage - 1, PAGE_SIZE, sortOrder);
        Page<Product> productPage = productRepository.findAll(spec, pageable);

        List<ProductSummaryDto> summaryList = productPage.getContent().stream()
                .map(this::mapToSummaryDto)
                .toList();

        return new CatalogPageResponse(
                summaryList,
                productPage.getTotalElements(),
                requestedPage,
                PAGE_SIZE,
                productPage.getTotalPages()
        );
    }

    @Override
    public ProductDetailDto getProductDetail(String slug) {
        if (slug == null || slug.trim().isEmpty()) {
            throw new ProductNotFoundException("Slug sản phẩm không hợp lệ");
        }

        Product product = productRepository.findBySlug(slug.trim())
                .orElseThrow(() -> new ProductNotFoundException("Không tìm thấy sản phẩm với slug: " + slug));

        // Kiểm tra tính khả dụng (ADR-010: chỉ trả về nếu status = ACTIVE)
        if (product.getStatus() != ActiveStatus.ACTIVE
                || product.getCategory().getStatus() != ActiveStatus.ACTIVE
                || product.getBrand().getStatus() != ActiveStatus.ACTIVE) {
            throw new ProductNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh: " + slug);
        }

        // Hình ảnh sản phẩm
        List<ProductImage> imageEntities = productImageRepository.findByProductIdOrderByDisplayOrderAsc(product.getId());
        List<ProductImageDto> imageDtos = imageEntities.stream()
                .map(img -> new ProductImageDto(
                        img.getId(),
                        img.getImageUrl(),
                        product.getName(),
                        img.isPrimary(),
                        img.getDisplayOrder()
                ))
                .toList();

        String primaryImageUrl = imageEntities.stream()
                .filter(ProductImage::isPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(imageEntities.isEmpty() ? "" : imageEntities.get(0).getImageUrl());

        // Tồn kho theo ADR-010:
        // inStock = true nếu có ít nhất 1 chi nhánh ACTIVE có quantity > 0
        // maxBranchQuantity = MAX(quantity) của một chi nhánh ACTIVE (không cộng dồn SUM)
        List<Inventory> inventories = inventoryRepository.findByProductId(product.getId());
        List<Inventory> activeInventories = inventories.stream()
                .filter(inv -> inv.getBranch() != null && inv.getBranch().getStatus() == ActiveStatus.ACTIVE)
                .toList();

        boolean inStock = activeInventories.stream().anyMatch(inv -> inv.getQuantity() > 0);
        int maxBranchQuantity = activeInventories.stream()
                .mapToInt(Inventory::getQuantity)
                .max()
                .orElse(0);

        // Thông số kỹ thuật
        SpecParseResult specResult = parseSpecifications(product.getSpecifications());

        ProductDetailDto detailDto = new ProductDetailDto();
        detailDto.setId(String.valueOf(product.getId()));
        detailDto.setSlug(product.getSlug());
        detailDto.setSku(product.getSku());
        detailDto.setName(product.getName());
        detailDto.setCategoryId(product.getCategory().getSlug());
        detailDto.setCategoryName(product.getCategory().getName());
        detailDto.setBrandId(product.getBrand().getSlug());
        detailDto.setBrandName(product.getBrand().getName());
        detailDto.setPriceVnd(product.getPrice().longValue());
        detailDto.setStatus(product.getStatus().name());
        detailDto.setImage(primaryImageUrl);
        detailDto.setImages(imageDtos);
        detailDto.setSpecification(specResult.summary);
        detailDto.setSpecifications(specResult.details);
        detailDto.setDescription(product.getDescription() != null ? product.getDescription() : "");
        detailDto.setInStock(inStock);
        detailDto.setMaxBranchQuantity(maxBranchQuantity);
        detailDto.setStock(maxBranchQuantity);

        if (product.getCategory().getParent() != null) {
            detailDto.setParentCategorySlug(product.getCategory().getParent().getSlug());
            detailDto.setParentCategoryName(product.getCategory().getParent().getName());
        }

        return detailDto;
    }

    private ProductSummaryDto mapToSummaryDto(Product product) {
        List<ProductImage> imageEntities = productImageRepository.findByProductIdOrderByDisplayOrderAsc(product.getId());
        String primaryImageUrl = imageEntities.stream()
                .filter(ProductImage::isPrimary)
                .findFirst()
                .map(ProductImage::getImageUrl)
                .orElse(imageEntities.isEmpty() ? "" : imageEntities.get(0).getImageUrl());

        SpecParseResult specResult = parseSpecifications(product.getSpecifications());

        ProductSummaryDto summaryDto = new ProductSummaryDto(
                String.valueOf(product.getId()),
                product.getName(),
                product.getSlug(),
                product.getCategory().getSlug(),
                product.getCategory().getSlug(),
                product.getCategory().getName(),
                product.getBrand().getSlug(),
                product.getBrand().getSlug(),
                product.getBrand().getName(),
                product.getPrice().longValue(),
                primaryImageUrl,
                specResult.summary,
                product.getStatus().name()
        );

        if (product.getCategory().getParent() != null) {
            summaryDto.setParentCategorySlug(product.getCategory().getParent().getSlug());
            summaryDto.setParentCategoryName(product.getCategory().getParent().getName());
        }

        return summaryDto;
    }

    private SpecParseResult parseSpecifications(String rawSpec) {
        if (rawSpec == null || rawSpec.trim().isEmpty()) {
            return new SpecParseResult("", Collections.emptyList());
        }

        String trimmed = rawSpec.trim();
        try {
            if (trimmed.startsWith("{")) {
                JsonNode rootNode = objectMapper.readTree(trimmed);
                String summary = rootNode.has("summary") ? rootNode.get("summary").asText() : "";
                List<ProductSpecDto> details = new ArrayList<>();

                JsonNode itemsNode = rootNode.has("items") ? rootNode.get("items")
                        : (rootNode.has("specifications") ? rootNode.get("specifications") : null);

                if (itemsNode != null && itemsNode.isArray()) {
                    for (JsonNode item : itemsNode) {
                        String label = item.has("label") ? item.get("label").asText() : "";
                        String value = item.has("value") ? item.get("value").asText() : "";
                        details.add(new ProductSpecDto(label, value));
                    }
                }

                if (summary.isEmpty() && !details.isEmpty()) {
                    summary = buildSummaryFromDetails(details);
                }

                return new SpecParseResult(summary, details);
            } else if (trimmed.startsWith("[")) {
                List<ProductSpecDto> details = objectMapper.readValue(trimmed, new TypeReference<List<ProductSpecDto>>() {});
                String summary = buildSummaryFromDetails(details);
                return new SpecParseResult(summary, details);
            } else {
                // Chuỗi văn bản thuần
                return new SpecParseResult(trimmed, List.of(new ProductSpecDto("Thông số", trimmed)));
            }
        } catch (Exception ex) {
            log.warn("Không thể parse specifications JSON: {}, dùng fallback văn bản thô", ex.getMessage());
            return new SpecParseResult(trimmed, Collections.emptyList());
        }
    }

    private String buildSummaryFromDetails(List<ProductSpecDto> details) {
        if (details == null || details.isEmpty()) {
            return "";
        }
        return details.stream()
                .limit(3)
                .map(ProductSpecDto::getValue)
                .reduce((a, b) -> a + " · " + b)
                .orElse("");
    }

    private record SpecParseResult(String summary, List<ProductSpecDto> details) {}
}
