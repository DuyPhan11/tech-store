package com.techstore.product.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.common.exception.DuplicateResourceException;
import com.techstore.common.exception.ProductNotFoundException;
import com.techstore.common.storage.ImageStorageService;
import com.techstore.common.storage.StoredImage;
import com.techstore.order.repository.OrderItemRepository;
import com.techstore.product.dto.ProductSpecDto;
import com.techstore.product.dto.admin.AdminProductImageRef;
import com.techstore.product.dto.admin.AdminProductImageResponse;
import com.techstore.product.dto.admin.AdminProductRequest;
import com.techstore.product.dto.admin.AdminProductResponse;
import com.techstore.product.dto.admin.AdminProductSpecRequest;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Brand;
import com.techstore.product.entity.Category;
import com.techstore.product.entity.Product;
import com.techstore.product.entity.ProductImage;
import com.techstore.product.repository.BrandRepository;
import com.techstore.product.repository.CategoryRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductImageRepository;
import com.techstore.product.repository.ProductRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.transaction.support.TransactionTemplate;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.io.InputStream;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Luồng lưu sản phẩm (sequence UC11, ADR-019):
 * <ol>
 *   <li>Validate dữ liệu, danh mục/thương hiệu, SKU/slug, ảnh (định dạng, dung lượng, tối đa 8, tối đa 1 primary) — chưa gọi Cloudinary.</li>
 *   <li>Upload ảnh mới (ngoài transaction DB).</li>
 *   <li>Transaction MySQL: khóa sản phẩm, kiểm tra lại, lưu Product + ProductImage.</li>
 *   <li>Lỗi ở bước 3 → xóa bù các ảnh vừa upload. Ảnh cũ bị gỡ chỉ bị xóa trên Cloudinary sau commit
 *       và khi không còn snapshot order_items tham chiếu.</li>
 * </ol>
 */
@Service
public class AdminProductServiceImpl implements AdminProductService {

    private static final Logger log = LoggerFactory.getLogger(AdminProductServiceImpl.class);

    static final int MAX_IMAGES = 8;
    static final long MAX_FILE_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_TYPES = Set.of("image/jpeg", "image/png", "image/webp");
    private static final byte[] PNG_SIGNATURE = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};

    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderItemRepository orderItemRepository;
    private final ImageStorageService imageStorageService;
    private final ObjectMapper objectMapper;
    private final TransactionTemplate transactionTemplate;

    public AdminProductServiceImpl(ProductRepository productRepository,
                                   ProductImageRepository productImageRepository,
                                   CategoryRepository categoryRepository,
                                   BrandRepository brandRepository,
                                   InventoryRepository inventoryRepository,
                                   OrderItemRepository orderItemRepository,
                                   ImageStorageService imageStorageService,
                                   ObjectMapper objectMapper,
                                   PlatformTransactionManager transactionManager) {
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderItemRepository = orderItemRepository;
        this.imageStorageService = imageStorageService;
        this.objectMapper = objectMapper;
        this.transactionTemplate = new TransactionTemplate(transactionManager);
    }

    // ===================== Read =====================

    @Override
    @Transactional(readOnly = true)
    public List<AdminProductResponse> listProducts() {
        Map<Long, Long> stock = activeStockMap();
        Map<Long, List<ProductImage>> imagesByProduct = productImageRepository.findAllByOrderByDisplayOrderAsc().stream()
                .collect(Collectors.groupingBy(img -> img.getProduct().getId()));
        return productRepository.findAllByOrderByIdDesc().stream()
                .map(p -> toResponse(p, imagesByProduct.getOrDefault(p.getId(), List.of()), stock, false))
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public AdminProductResponse getProduct(Long id) {
        Product product = findProduct(id);
        return toResponse(product, sortedImages(product), activeStockMap(), true);
    }

    @Override
    @Transactional
    public AdminProductResponse updateStatus(Long id, String status) {
        Product product = findProduct(id);
        product.setStatus(parseStatus(status));
        Product saved = productRepository.saveAndFlush(product);
        log.info("Đổi trạng thái sản phẩm: id={}, status={}", saved.getId(), saved.getStatus());
        return toResponse(saved, sortedImages(saved), activeStockMap(), true);
    }

    // ===================== Create / Update =====================

    @Override
    public AdminProductResponse createProduct(AdminProductRequest request, List<MultipartFile> files) {
        List<MultipartFile> newFiles = files != null ? files : List.of();
        validateFiles(newFiles);
        List<AdminProductImageRef> refs = resolveImageRefs(request.images(), newFiles.size(), List.of());

        String slug = request.slug().trim();
        String sku = request.sku().trim();
        if (productRepository.existsBySlug(slug)) {
            throw duplicateSlug(slug);
        }
        if (productRepository.existsBySku(sku)) {
            throw duplicateSku(sku);
        }
        resolveCategory(request.categoryId(), null);
        resolveBrand(request.brandId(), null);

        List<StoredImage> uploaded = uploadAll(newFiles);
        try {
            return transactionTemplate.execute(tx -> {
                // Kiểm tra lại trong transaction (chống race giữa bước validate và bước lưu)
                if (productRepository.existsBySlug(slug)) {
                    throw duplicateSlug(slug);
                }
                if (productRepository.existsBySku(sku)) {
                    throw duplicateSku(sku);
                }
                Product product = new Product();
                product.setStatus(ActiveStatus.ACTIVE);
                applyFields(product, request, slug, sku);
                applyImages(product, refs, uploaded);
                Product saved = productRepository.saveAndFlush(product);
                log.info("Tạo sản phẩm: id={}, sku={}, images={}", saved.getId(), saved.getSku(), saved.getImages().size());
                return toResponse(saved, sortedImages(saved), activeStockMap(), true);
            });
        } catch (RuntimeException ex) {
            compensateUploads(uploaded);
            throw translate(ex, slug, sku);
        }
    }

    @Override
    public AdminProductResponse updateProduct(Long id, AdminProductRequest request, List<MultipartFile> files) {
        List<MultipartFile> newFiles = files != null ? files : List.of();
        validateFiles(newFiles);

        Product current = productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Không tìm thấy sản phẩm: " + id));
        List<Long> existingIds = productImageRepository.findByProductIdOrderByDisplayOrderAsc(id).stream()
                .map(ProductImage::getId).toList();
        List<AdminProductImageRef> refs = resolveImageRefs(request.images(), newFiles.size(), existingIds);

        String slug = request.slug().trim();
        String sku = request.sku().trim();
        if (productRepository.existsBySlugAndIdNot(slug, id)) {
            throw duplicateSlug(slug);
        }
        if (productRepository.existsBySkuAndIdNot(sku, id)) {
            throw duplicateSku(sku);
        }
        resolveCategory(request.categoryId(), currentCategoryId(current));
        resolveBrand(request.brandId(), currentBrandId(current));

        List<StoredImage> uploaded = uploadAll(newFiles);
        try {
            return transactionTemplate.execute(tx -> {
                Product product = productRepository.findByIdForUpdate(id)
                        .orElseThrow(() -> new ProductNotFoundException("Không tìm thấy sản phẩm: " + id));
                if (productRepository.existsBySlugAndIdNot(slug, id)) {
                    throw duplicateSlug(slug);
                }
                if (productRepository.existsBySkuAndIdNot(sku, id)) {
                    throw duplicateSku(sku);
                }
                // Ảnh có thể đã bị request đồng thời thay đổi: xác thực lại tham chiếu trên dữ liệu đã khóa
                List<Long> lockedIds = product.getImages().stream().map(ProductImage::getId).toList();
                resolveImageRefs(refs, uploaded.size(), lockedIds);

                applyFields(product, request, slug, sku);
                List<ProductImage> removed = applyImages(product, refs, uploaded);
                Product saved = productRepository.saveAndFlush(product);
                scheduleRemovedAssetCleanup(removed);
                log.info("Cập nhật sản phẩm: id={}, images={}, removed={}", saved.getId(), saved.getImages().size(), removed.size());
                return toResponse(saved, sortedImages(saved), activeStockMap(), true);
            });
        } catch (RuntimeException ex) {
            compensateUploads(uploaded);
            throw translate(ex, slug, sku);
        }
    }

    // ===================== Validation =====================

    /** Định dạng (content-type + magic bytes) và dung lượng — kiểm tra TRƯỚC khi upload (BUSINESS_RULES §6). */
    void validateFiles(List<MultipartFile> files) {
        if (files.size() > MAX_IMAGES) {
            throw new IllegalArgumentException("Mỗi sản phẩm tối đa " + MAX_IMAGES + " ảnh");
        }
        for (MultipartFile file : files) {
            String name = file.getOriginalFilename() != null ? file.getOriginalFilename() : "ảnh";
            if (file.isEmpty()) {
                throw new IllegalArgumentException("Tệp " + name + " rỗng");
            }
            if (file.getSize() > MAX_FILE_BYTES) {
                throw new IllegalArgumentException("Ảnh " + name + " vượt quá 5MB");
            }
            String type = file.getContentType() != null ? file.getContentType().toLowerCase() : "";
            if (!ALLOWED_TYPES.contains(type) || !matchesMagicBytes(file, type)) {
                throw new IllegalArgumentException("Ảnh " + name + " phải là JPEG, PNG hoặc WebP hợp lệ");
            }
        }
    }

    private static boolean matchesMagicBytes(MultipartFile file, String type) {
        byte[] head = new byte[12];
        int read;
        try (InputStream in = file.getInputStream()) {
            read = in.readNBytes(head, 0, head.length);
        } catch (IOException ex) {
            return false;
        }
        return switch (type) {
            case "image/jpeg" -> read >= 3 && (head[0] & 0xFF) == 0xFF && (head[1] & 0xFF) == 0xD8 && (head[2] & 0xFF) == 0xFF;
            case "image/png" -> read >= 8 && Arrays.equals(Arrays.copyOf(head, 8), PNG_SIGNATURE);
            case "image/webp" -> read >= 12 && head[0] == 'R' && head[1] == 'I' && head[2] == 'F' && head[3] == 'F'
                    && head[8] == 'W' && head[9] == 'E' && head[10] == 'B' && head[11] == 'P';
            default -> false;
        };
    }

    /**
     * Chuẩn hóa danh sách ảnh: mỗi phần tử đúng một khóa, ảnh cũ phải thuộc sản phẩm, mọi file mới được tham chiếu
     * đúng một lần, tổng tối đa 8, có ảnh thì đúng 1 primary (không chỉ định → ảnh đầu).
     * {@code images == null}: giữ ảnh cũ theo thứ tự hiện tại và thêm file mới vào cuối.
     */
    List<AdminProductImageRef> resolveImageRefs(List<AdminProductImageRef> images, int fileCount, List<Long> existingIds) {
        List<AdminProductImageRef> refs = new ArrayList<>();
        if (images == null) {
            existingIds.forEach(imageId -> refs.add(new AdminProductImageRef(imageId, null, false)));
            for (int i = 0; i < fileCount; i++) {
                refs.add(new AdminProductImageRef(null, i, false));
            }
        } else {
            refs.addAll(images);
        }

        if (refs.size() > MAX_IMAGES) {
            throw new IllegalArgumentException("Mỗi sản phẩm tối đa " + MAX_IMAGES + " ảnh");
        }
        Set<Long> existing = new HashSet<>(existingIds);
        Set<Long> seenIds = new HashSet<>();
        Set<Integer> seenFiles = new HashSet<>();
        int primaryCount = 0;
        for (AdminProductImageRef ref : refs) {
            if (ref == null || (ref.imageId() == null) == (ref.fileIndex() == null)) {
                throw new IllegalArgumentException("Mỗi ảnh phải có đúng một trong imageId hoặc fileIndex");
            }
            if (ref.imageId() != null) {
                if (!existing.contains(ref.imageId()) || !seenIds.add(ref.imageId())) {
                    throw new IllegalArgumentException("Ảnh không thuộc sản phẩm hoặc bị lặp: " + ref.imageId());
                }
            } else if (ref.fileIndex() < 0 || ref.fileIndex() >= fileCount || !seenFiles.add(ref.fileIndex())) {
                throw new IllegalArgumentException("fileIndex không hợp lệ hoặc bị lặp: " + ref.fileIndex());
            }
            if (ref.isPrimary()) {
                primaryCount++;
            }
        }
        if (seenFiles.size() != fileCount) {
            throw new IllegalArgumentException("Mọi tệp ảnh tải lên phải được tham chiếu trong danh sách ảnh");
        }
        if (primaryCount > 1) {
            throw new IllegalArgumentException("Chỉ được chọn một ảnh đại diện (primary)");
        }
        if (primaryCount == 0 && !refs.isEmpty()) {
            AdminProductImageRef first = refs.get(0);
            refs.set(0, new AdminProductImageRef(first.imageId(), first.fileIndex(), true));
        }
        return Collections.unmodifiableList(refs);
    }

    /** Danh mục phải ACTIVE và danh mục cha (nếu có) ACTIVE; giữ nguyên danh mục cũ thì bỏ qua kiểm tra trạng thái. */
    private Category resolveCategory(Long categoryId, Long currentCategoryId) {
        Category category = categoryRepository.findById(categoryId)
                .orElseThrow(() -> new IllegalArgumentException("Danh mục không tồn tại: " + categoryId));
        if (!categoryId.equals(currentCategoryId)) {
            boolean active = category.getStatus() == ActiveStatus.ACTIVE
                    && (category.getParent() == null || category.getParent().getStatus() == ActiveStatus.ACTIVE);
            if (!active) {
                throw new IllegalArgumentException("Danh mục đang bị vô hiệu hóa, không thể chọn: " + category.getName());
            }
        }
        return category;
    }

    private Brand resolveBrand(Long brandId, Long currentBrandId) {
        Brand brand = brandRepository.findById(brandId)
                .orElseThrow(() -> new IllegalArgumentException("Thương hiệu không tồn tại: " + brandId));
        if (!brandId.equals(currentBrandId) && brand.getStatus() != ActiveStatus.ACTIVE) {
            throw new IllegalArgumentException("Thương hiệu đang bị vô hiệu hóa, không thể chọn: " + brand.getName());
        }
        return brand;
    }

    // ===================== Persistence helpers =====================

    private void applyFields(Product product, AdminProductRequest request, String slug, String sku) {
        Long currentCategoryId = product.getId() != null ? currentCategoryId(product) : null;
        Long currentBrandId = product.getId() != null ? currentBrandId(product) : null;
        product.setCategory(resolveCategory(request.categoryId(), currentCategoryId));
        product.setBrand(resolveBrand(request.brandId(), currentBrandId));
        product.setName(request.name().trim());
        product.setSlug(slug);
        product.setSku(sku);
        product.setPrice(request.price());
        product.setCostPrice(request.costPrice());
        product.setDescription(blankToNull(request.description()));
        product.setSpecifications(serializeSpecs(request.specifications()));
    }

    /**
     * Đồng bộ tập ảnh theo {@code refs}: giữ/sắp lại ảnh cũ, thêm ảnh mới đã upload, gỡ ảnh không còn trong danh sách.
     * Trả về các ảnh bị gỡ (để dọn Cloudinary sau commit).
     */
    private List<ProductImage> applyImages(Product product, List<AdminProductImageRef> refs, List<StoredImage> uploaded) {
        Map<Long, ProductImage> byId = new HashMap<>();
        product.getImages().forEach(img -> byId.put(img.getId(), img));

        List<ProductImage> next = new ArrayList<>();
        for (int order = 0; order < refs.size(); order++) {
            AdminProductImageRef ref = refs.get(order);
            ProductImage image;
            if (ref.imageId() != null) {
                image = byId.remove(ref.imageId());
            } else {
                StoredImage stored = uploaded.get(ref.fileIndex());
                image = new ProductImage(product, stored.secureUrl(), stored.publicId(), false, 0);
            }
            image.setPrimary(ref.isPrimary());
            image.setDisplayOrder(order);
            next.add(image);
        }
        List<ProductImage> removed = new ArrayList<>(byId.values());
        product.getImages().removeAll(removed);
        for (ProductImage image : next) {
            if (!product.getImages().contains(image)) {
                product.getImages().add(image);
            }
        }
        return removed;
    }

    /**
     * Ảnh bị gỡ: chỉ destroy trên Cloudinary SAU commit, khi là URL Cloudinary và không còn snapshot order_items tham chiếu.
     */
    private void scheduleRemovedAssetCleanup(List<ProductImage> removed) {
        List<String> publicIds = removed.stream()
                .filter(img -> imageStorageService.isManagedUrl(img.getImageUrl()))
                .filter(img -> {
                    boolean referenced = orderItemRepository.existsByProductImage(img.getImageUrl());
                    if (referenced) {
                        log.info("Giữ asset Cloudinary vì snapshot đơn hàng còn tham chiếu: publicId={}", img.getCloudinaryPublicId());
                    }
                    return !referenced;
                })
                .map(ProductImage::getCloudinaryPublicId)
                .toList();
        if (publicIds.isEmpty() || !TransactionSynchronizationManager.isSynchronizationActive()) {
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                publicIds.forEach(AdminProductServiceImpl.this::safeDelete);
            }
        });
    }

    private List<StoredImage> uploadAll(List<MultipartFile> files) {
        List<StoredImage> uploaded = new ArrayList<>();
        try {
            for (MultipartFile file : files) {
                uploaded.add(imageStorageService.upload(file));
            }
            return uploaded;
        } catch (RuntimeException ex) {
            compensateUploads(uploaded);
            throw ex;
        }
    }

    /** Dọn bù ảnh mới đã upload khi bước sau lỗi (best-effort, không che lỗi gốc). */
    private void compensateUploads(List<StoredImage> uploaded) {
        for (StoredImage image : uploaded) {
            safeDelete(image.publicId());
        }
    }

    private void safeDelete(String publicId) {
        try {
            imageStorageService.delete(publicId);
        } catch (RuntimeException ex) {
            log.error("Không dọn được ảnh Cloudinary publicId={}: {}", publicId, ex.getMessage());
        }
    }

    private RuntimeException translate(RuntimeException ex, String slug, String sku) {
        if (ex instanceof DataIntegrityViolationException dive) {
            // Race hai request cùng slug/SKU: unique key uq_products_slug / uq_products_sku
            Throwable cause = dive.getMostSpecificCause();
            String detail = cause.getMessage() != null ? cause.getMessage().toLowerCase() : "";
            if (detail.contains("sku")) {
                return duplicateSku(sku);
            }
            if (detail.contains("slug")) {
                return duplicateSlug(slug);
            }
            return new DuplicateResourceException("Dữ liệu sản phẩm bị xung đột với bản ghi khác, vui lòng tải lại và thử lại");
        }
        return ex;
    }

    // ===================== Mapping =====================

    private AdminProductResponse toResponse(Product p, List<ProductImage> images, Map<Long, Long> stock, boolean withDetails) {
        List<AdminProductImageResponse> imageDtos = images.stream()
                .map(img -> new AdminProductImageResponse(img.getId(), img.getImageUrl(), img.isPrimary(), img.getDisplayOrder()))
                .toList();
        String primaryUrl = images.stream().filter(ProductImage::isPrimary).findFirst()
                .or(() -> images.stream().findFirst())
                .map(ProductImage::getImageUrl)
                .orElse(null);
        return new AdminProductResponse(
                p.getId(),
                p.getName(),
                p.getSlug(),
                p.getSku(),
                p.getCategory().getId(),
                p.getCategory().getName(),
                p.getBrand().getId(),
                p.getBrand().getName(),
                p.getPrice(),
                p.getCostPrice(),
                withDetails ? p.getDescription() : null,
                withDetails ? parseSpecs(p.getSpecifications()) : List.of(),
                p.getStatus().name(),
                stock.getOrDefault(p.getId(), 0L),
                primaryUrl,
                imageDtos,
                p.getCreatedAt(),
                p.getUpdatedAt()
        );
    }

    private static List<ProductImage> sortedImages(Product product) {
        return product.getImages().stream()
                .sorted(Comparator.comparingInt(ProductImage::getDisplayOrder))
                .toList();
    }

    private Map<Long, Long> activeStockMap() {
        Map<Long, Long> map = new HashMap<>();
        for (Object[] row : inventoryRepository.sumQuantityGroupByProductId(ActiveStatus.ACTIVE)) {
            map.put((Long) row[0], row[1] != null ? ((Number) row[1]).longValue() : 0L);
        }
        return map;
    }

    private String serializeSpecs(List<AdminProductSpecRequest> specs) {
        if (specs == null || specs.isEmpty()) {
            return null;
        }
        List<ProductSpecDto> list = specs.stream()
                .map(s -> new ProductSpecDto(s.label().trim(), s.value().trim()))
                .toList();
        try {
            return objectMapper.writeValueAsString(list);
        } catch (JsonProcessingException ex) {
            throw new IllegalArgumentException("Thông số kỹ thuật không hợp lệ");
        }
    }

    /** Đọc thông số đã lưu (JSON array, JSON object {items|specifications} hoặc văn bản thuần). */
    private List<ProductSpecDto> parseSpecs(String raw) {
        if (raw == null || raw.isBlank()) {
            return List.of();
        }
        String trimmed = raw.trim();
        try {
            if (trimmed.startsWith("[")) {
                return objectMapper.readValue(trimmed, new TypeReference<List<ProductSpecDto>>() {});
            }
            if (trimmed.startsWith("{")) {
                JsonNode root = objectMapper.readTree(trimmed);
                JsonNode items = root.has("items") ? root.get("items") : root.get("specifications");
                List<ProductSpecDto> result = new ArrayList<>();
                if (items != null && items.isArray()) {
                    for (JsonNode item : items) {
                        result.add(new ProductSpecDto(item.path("label").asText(""), item.path("value").asText("")));
                    }
                }
                return result;
            }
        } catch (JsonProcessingException ex) {
            log.warn("Không parse được specifications của sản phẩm: {}", ex.getOriginalMessage());
        }
        return List.of(new ProductSpecDto("Thông số", trimmed));
    }

    // ===================== Misc =====================

    private Product findProduct(Long id) {
        return productRepository.findById(id)
                .orElseThrow(() -> new ProductNotFoundException("Không tìm thấy sản phẩm: " + id));
    }

    private static Long currentCategoryId(Product product) {
        return product.getCategory() != null ? product.getCategory().getId() : null;
    }

    private static Long currentBrandId(Product product) {
        return product.getBrand() != null ? product.getBrand().getId() : null;
    }

    private static DuplicateResourceException duplicateSlug(String slug) {
        return new DuplicateResourceException("Slug sản phẩm đã tồn tại: " + slug);
    }

    private static DuplicateResourceException duplicateSku(String sku) {
        return new DuplicateResourceException("Mã SKU đã tồn tại: " + sku);
    }

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
}
