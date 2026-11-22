package com.techstore.product.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.common.storage.ImageStorageException;
import com.techstore.common.storage.ImageStorageService;
import com.techstore.common.storage.StoredImage;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Branch;
import com.techstore.product.entity.Brand;
import com.techstore.product.entity.Category;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.BranchRepository;
import com.techstore.product.repository.BrandRepository;
import com.techstore.product.repository.CategoryRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductImageRepository;
import com.techstore.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.test.web.servlet.request.MockMultipartHttpServletRequestBuilder;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * UC11 — Quản trị sản phẩm + Cloudinary (ADR-019).
 * Cloudinary luôn được mock ({@link ImageStorageService}); không gọi dịch vụ thật.
 * Dùng H2 riêng (uc11db) và KHÔNG bọc @Transactional để transaction commit thật —
 * cần cho việc kiểm tra xóa ảnh sau commit — mà không làm bẩn dữ liệu các test khác.
 */
@SpringBootTest(properties = "spring.datasource.url=jdbc:h2:mem:uc11db;DB_CLOSE_DELAY=-1;MODE=MySQL;NON_KEYWORDS=USER")
@AutoConfigureMockMvc
public class AdminProductControllerTest {

    private static final byte[] PNG = {(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0, 0, 0, 13};
    private static final byte[] JPEG = {(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0, 16, 'J', 'F', 'I', 'F'};
    private static final String CLOUD_PREFIX = "https://res.cloudinary.com/demo/image/upload/";

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private ProductImageRepository productImageRepository;
    @Autowired private InventoryRepository inventoryRepository;

    @MockBean private ImageStorageService imageStorageService;

    private final AtomicInteger uploadCounter = new AtomicInteger();
    private final List<String> uploadedIds = new ArrayList<>();

    private String adminToken;
    private String staffToken;
    private String customerToken;
    private Long categoryId;
    private Long brandId;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = login("admin@techstore.vn", "Admin@123");
        staffToken = login("staff@techstore.vn", "Staff@123");
        customerToken = login("customer@techstore.vn", "Customer@123");
        categoryId = categoryRepository.findBySlug("laptop-gaming").orElseThrow().getId();
        brandId = brandRepository.findBySlug("nova").orElseThrow().getId();

        reset(imageStorageService);
        uploadedIds.clear();
        when(imageStorageService.upload(any())).thenAnswer(inv -> nextStored());
        when(imageStorageService.isManagedUrl(anyString()))
                .thenAnswer(inv -> ((String) inv.getArgument(0)).startsWith("https://res.cloudinary.com/"));
    }

    private StoredImage nextStored() {
        String publicId = "tech-store-test/products/img-" + uploadCounter.incrementAndGet() + "-" + UUID.randomUUID();
        uploadedIds.add(publicId);
        return new StoredImage(CLOUD_PREFIX + publicId + ".png", publicId);
    }

    // ===================== Helpers =====================

    private String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(identifier, password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class).getAccessToken();
    }

    private static String unique(String prefix) {
        return prefix + "-" + UUID.randomUUID().toString().substring(0, 8);
    }

    private Map<String, Object> body(String slug, String sku, List<Map<String, Object>> images) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", "Laptop thử nghiệm " + slug);
        body.put("slug", slug);
        body.put("sku", sku);
        body.put("categoryId", categoryId);
        body.put("brandId", brandId);
        body.put("price", 19990000);
        body.put("costPrice", 15000000);
        body.put("description", "Mô tả thử nghiệm");
        body.put("specifications", List.of(Map.of("label", "CPU", "value", "Core i7"), Map.of("label", "RAM", "value", "16GB")));
        body.put("images", images);
        return body;
    }

    private static Map<String, Object> fileRef(int index, boolean primary) {
        Map<String, Object> ref = new HashMap<>();
        ref.put("fileIndex", index);
        ref.put("primary", primary);
        return ref;
    }

    private static Map<String, Object> imageRef(long imageId, boolean primary) {
        Map<String, Object> ref = new HashMap<>();
        ref.put("imageId", imageId);
        ref.put("primary", primary);
        return ref;
    }

    private static MockMultipartFile png(String name) {
        return new MockMultipartFile("files", name, "image/png", PNG);
    }

    private MockMultipartHttpServletRequestBuilder withData(MockMultipartHttpServletRequestBuilder builder,
                                                           Map<String, Object> body,
                                                           MockMultipartFile... files) throws Exception {
        builder.file(new MockMultipartFile("data", "", MediaType.APPLICATION_JSON_VALUE, objectMapper.writeValueAsBytes(body)));
        for (MockMultipartFile file : files) {
            builder.file(file);
        }
        return builder;
    }

    private ResultActions create(String token, Map<String, Object> body, MockMultipartFile... files) throws Exception {
        return mockMvc.perform(withData(multipart("/api/admin/products"), body, files)
                .header("Authorization", "Bearer " + token));
    }

    private ResultActions update(String token, long id, Map<String, Object> body, MockMultipartFile... files) throws Exception {
        return mockMvc.perform(withData(multipart(HttpMethod.PUT, "/api/admin/products/{id}", id), body, files)
                .header("Authorization", "Bearer " + token));
    }

    private JsonNode json(ResultActions actions) throws Exception {
        return objectMapper.readTree(actions.andReturn().getResponse().getContentAsString());
    }

    // ===================== Create =====================

    @Test
    @DisplayName("Staff tạo sản phẩm kèm 2 ảnh → 201, ảnh được upload, primary/displayOrder đúng, specs lưu đúng")
    void staffCreatesProductWithImages() throws Exception {
        String slug = unique("laptop-uc11");
        String sku = unique("UC11").toUpperCase();
        JsonNode created = json(create(staffToken, body(slug, sku, List.of(fileRef(0, false), fileRef(1, true))),
                png("a.png"), new MockMultipartFile("files", "b.jpg", "image/jpeg", JPEG))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug").value(slug))
                .andExpect(jsonPath("$.sku").value(sku))
                .andExpect(jsonPath("$.status").value("ACTIVE"))
                .andExpect(jsonPath("$.costPrice").value(15000000))
                .andExpect(jsonPath("$.specifications", hasSize(2)))
                .andExpect(jsonPath("$.images", hasSize(2)))
                .andExpect(jsonPath("$.images[0].primary").value(false))
                .andExpect(jsonPath("$.images[1].primary").value(true))
                .andExpect(jsonPath("$.images[1].displayOrder").value(1))
                .andExpect(jsonPath("$.totalStock").value(0)));

        verify(imageStorageService, times(2)).upload(any());
        verify(imageStorageService, never()).delete(anyString());
        assertEquals(created.get("images").get(1).get("url").asText(), created.get("primaryImageUrl").asText());

        // Sản phẩm mới xuất hiện trên catalog công khai và list admin
        mockMvc.perform(get("/api/products/{slug}", slug))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.specifications[0].label").value("CPU"))
                .andExpect(jsonPath("$.images", hasSize(2)));
        mockMvc.perform(get("/api/admin/products").header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].slug").value(slug));
    }

    @Test
    @DisplayName("Tạo sản phẩm không chỉ định primary → ảnh đầu tiên là primary; không ảnh → hợp lệ")
    void firstImageBecomesPrimaryAndNoImageAllowed() throws Exception {
        create(staffToken, body(unique("p-auto"), unique("AUTO").toUpperCase(), List.of(fileRef(0, false), fileRef(1, false))),
                png("a.png"), png("b.png"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.images[0].primary").value(true))
                .andExpect(jsonPath("$.images[1].primary").value(false));

        create(adminToken, body(unique("p-none"), unique("NONE").toUpperCase(), List.of()))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.images", hasSize(0)))
                .andExpect(jsonPath("$.primaryImageUrl").doesNotExist());
    }

    @Test
    @DisplayName("Trùng slug hoặc SKU → 409, không upload ảnh")
    void duplicateSlugOrSkuReturns409() throws Exception {
        Product existing = productRepository.findAll().get(0);
        create(staffToken, body(existing.getSlug(), unique("DUP").toUpperCase(), List.of(fileRef(0, true))), png("a.png"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("Slug sản phẩm đã tồn tại")));
        create(staffToken, body(unique("dup-sku"), existing.getSku(), List.of(fileRef(0, true))), png("a.png"))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("SKU")));
        verify(imageStorageService, never()).upload(any());
    }

    @Test
    @DisplayName("Validate dữ liệu: slug/SKU sai định dạng, giá âm, thiếu danh mục → 400 với errors.{field}")
    void invalidFieldsReturn400() throws Exception {
        Map<String, Object> bad = body("Laptop Mới", "abc lower", List.of());
        bad.put("price", -1);
        bad.put("categoryId", null);
        create(staffToken, bad)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.slug").exists())
                .andExpect(jsonPath("$.errors.sku").exists())
                .andExpect(jsonPath("$.errors.price").exists())
                .andExpect(jsonPath("$.errors.categoryId").exists());
        verify(imageStorageService, never()).upload(any());
    }

    @Test
    @DisplayName("Ảnh không hợp lệ (quá 8, 2 primary, sai định dạng, file không được tham chiếu) → 400 và KHÔNG gọi Cloudinary")
    void invalidImagesRejectedBeforeUpload() throws Exception {
        List<Map<String, Object>> nine = new ArrayList<>();
        MockMultipartFile[] nineFiles = new MockMultipartFile[9];
        for (int i = 0; i < 9; i++) {
            nine.add(fileRef(i, i == 0));
            nineFiles[i] = png("f" + i + ".png");
        }
        create(staffToken, body(unique("p9"), unique("NINE").toUpperCase(), nine), nineFiles)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("tối đa 8")));

        create(staffToken, body(unique("p2"), unique("TWO").toUpperCase(), List.of(fileRef(0, true), fileRef(1, true))),
                png("a.png"), png("b.png"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("một ảnh đại diện")));

        // Nội dung văn bản giả mạo content-type PNG
        create(staffToken, body(unique("pfake"), unique("FAKE").toUpperCase(), List.of(fileRef(0, true))),
                new MockMultipartFile("files", "evil.png", "image/png", "not an image".getBytes()))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("JPEG, PNG hoặc WebP")));

        create(staffToken, body(unique("pgif"), unique("GIF").toUpperCase(), List.of(fileRef(0, true))),
                new MockMultipartFile("files", "a.gif", "image/gif", "GIF89a".getBytes()))
                .andExpect(status().isBadRequest());

        // File gửi lên nhưng không có trong danh sách images
        create(staffToken, body(unique("porphan"), unique("ORPHAN").toUpperCase(), List.of(fileRef(0, true))),
                png("a.png"), png("b.png"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("phải được tham chiếu")));

        verify(imageStorageService, never()).upload(any());
    }

    @Test
    @DisplayName("Danh mục/thương hiệu INACTIVE hoặc không tồn tại → 400, không upload")
    void inactiveOrMissingCatalogRejected() throws Exception {
        Category inactiveCat = new Category("Danh mục tạm ngưng", unique("cat-off"), null);
        inactiveCat.setStatus(ActiveStatus.INACTIVE);
        inactiveCat = categoryRepository.save(inactiveCat);
        Brand inactiveBrand = new Brand("Hãng tạm ngưng", unique("brand-off"), null);
        inactiveBrand.setStatus(ActiveStatus.INACTIVE);
        inactiveBrand = brandRepository.save(inactiveBrand);

        Map<String, Object> b1 = body(unique("p-cat"), unique("CAT").toUpperCase(), List.of(fileRef(0, true)));
        b1.put("categoryId", inactiveCat.getId());
        create(staffToken, b1, png("a.png"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Danh mục đang bị vô hiệu hóa")));

        Map<String, Object> b2 = body(unique("p-brand"), unique("BRAND").toUpperCase(), List.of());
        b2.put("brandId", inactiveBrand.getId());
        create(staffToken, b2)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Thương hiệu đang bị vô hiệu hóa")));

        Map<String, Object> b3 = body(unique("p-miss"), unique("MISS").toUpperCase(), List.of());
        b3.put("categoryId", 999999);
        create(staffToken, b3).andExpect(status().isBadRequest());

        verify(imageStorageService, never()).upload(any());
    }

    // ===================== Cloudinary failure & compensation =====================

    @Test
    @DisplayName("Upload Cloudinary lỗi giữa chừng → 502, dọn ảnh đã upload, không tạo sản phẩm")
    void uploadFailureReturns502AndCleansUp() throws Exception {
        AtomicInteger calls = new AtomicInteger();
        // doAnswer(...).when(...) để không kích hoạt answer cũ khi stub lại
        doAnswer(inv -> {
            if (calls.incrementAndGet() == 2) {
                throw new ImageStorageException("Không thể tải ảnh lên Cloudinary. Vui lòng thử lại sau.");
            }
            return nextStored();
        }).when(imageStorageService).upload(any());
        String slug = unique("p-502");
        create(staffToken, body(slug, unique("BAD").toUpperCase(), List.of(fileRef(0, true), fileRef(1, false))),
                png("a.png"), png("b.png"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message", containsString("Cloudinary")));

        assertEquals(1, uploadedIds.size());
        verify(imageStorageService).delete(uploadedIds.get(0));
        assertTrue(productRepository.findBySlug(slug).isEmpty());
    }

    @Test
    @DisplayName("DB lỗi SAU khi upload (race trùng SKU) → 409 và xóa bù đúng các ảnh vừa upload")
    void databaseFailureAfterUploadCompensates() throws Exception {
        String sku = unique("RACE").toUpperCase();
        Category category = categoryRepository.findById(categoryId).orElseThrow();
        Brand brand = brandRepository.findById(brandId).orElseThrow();
        // Trong lúc upload, một request khác đã lưu sản phẩm cùng SKU → bước ghi DB thất bại
        doAnswer(inv -> {
            if (!productRepository.existsBySku(sku)) {
                productRepository.save(new Product(category, brand, "Race", unique("race-other"), sku,
                        BigDecimal.ONE, BigDecimal.ONE, null, null, ActiveStatus.ACTIVE));
            }
            return nextStored();
        }).when(imageStorageService).upload(any());
        String slug = unique("p-race");
        create(staffToken, body(slug, sku, List.of(fileRef(0, true), fileRef(1, false))), png("a.png"), png("b.png"))
                .andExpect(status().isConflict());

        assertEquals(2, uploadedIds.size());
        for (String publicId : uploadedIds) {
            verify(imageStorageService).delete(publicId);
        }
        assertTrue(productRepository.findBySlug(slug).isEmpty());
    }

    @Test
    @DisplayName("Chưa cấu hình Cloudinary / không có ảnh thì vẫn tạo được sản phẩm; có ảnh mà Cloudinary lỗi → 502")
    void storageNotConfiguredOnlyAffectsUploads() throws Exception {
        doThrow(new ImageStorageException("Dịch vụ lưu ảnh Cloudinary chưa được cấu hình trên máy chủ"))
                .when(imageStorageService).upload(any());
        create(staffToken, body(unique("p-noimg"), unique("NOIMG").toUpperCase(), List.of()))
                .andExpect(status().isCreated());
        create(staffToken, body(unique("p-img"), unique("IMG").toUpperCase(), List.of(fileRef(0, true))), png("a.png"))
                .andExpect(status().isBadGateway())
                .andExpect(jsonPath("$.message", containsString("chưa được cấu hình")));
    }

    // ===================== Update =====================

    @Test
    @DisplayName("Sửa: giữ/sắp lại ảnh, đổi primary, thêm ảnh mới; ảnh bị gỡ được xóa trên Cloudinary sau commit")
    void updateReordersAndRemovesImagesAfterCommit() throws Exception {
        JsonNode created = json(create(staffToken,
                body(unique("p-edit"), unique("EDIT").toUpperCase(), List.of(fileRef(0, true), fileRef(1, false), fileRef(2, false))),
                png("a.png"), png("b.png"), png("c.png")).andExpect(status().isCreated()));
        long id = created.get("id").asLong();
        long img0 = created.get("images").get(0).get("id").asLong();
        long img2 = created.get("images").get(2).get("id").asLong();
        String removedPublicId = uploadedIds.get(1);

        Map<String, Object> edit = body(created.get("slug").asText(), created.get("sku").asText(),
                List.of(imageRef(img2, true), fileRef(0, false), imageRef(img0, false)));
        edit.put("name", "Tên đã sửa");
        edit.put("price", 17990000);
        JsonNode updated = json(update(staffToken, id, edit, png("d.png"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Tên đã sửa"))
                .andExpect(jsonPath("$.price").value(17990000))
                .andExpect(jsonPath("$.images", hasSize(3)))
                .andExpect(jsonPath("$.images[0].id").value(img2))
                .andExpect(jsonPath("$.images[0].primary").value(true))
                .andExpect(jsonPath("$.images[2].id").value(img0))
                .andExpect(jsonPath("$.images[2].primary").value(false)));

        assertEquals(updated.get("images").get(0).get("url").asText(), updated.get("primaryImageUrl").asText());
        verify(imageStorageService).delete(removedPublicId);
        verify(imageStorageService, times(1)).delete(anyString());
        assertEquals(1, productImageRepository.findByProductIdOrderByDisplayOrderAsc(id).stream().filter(i -> i.isPrimary()).count());
    }

    @Test
    @DisplayName("Sửa: imageId của sản phẩm khác / tổng vượt 8 ảnh → 400 và không upload")
    void updateRejectsForeignImageAndOverLimit() throws Exception {
        JsonNode a = json(create(staffToken, body(unique("p-a"), unique("PA").toUpperCase(), List.of(fileRef(0, true))), png("a.png")));
        JsonNode b = json(create(staffToken, body(unique("p-b"), unique("PB").toUpperCase(), List.of(fileRef(0, true))), png("b.png")));
        reset(imageStorageService);

        long foreignImage = b.get("images").get(0).get("id").asLong();
        update(staffToken, a.get("id").asLong(), body(a.get("slug").asText(), a.get("sku").asText(), List.of(imageRef(foreignImage, true))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("không thuộc sản phẩm")));

        List<Map<String, Object>> refs = new ArrayList<>();
        refs.add(imageRef(a.get("images").get(0).get("id").asLong(), true));
        MockMultipartFile[] eight = new MockMultipartFile[8];
        for (int i = 0; i < 8; i++) {
            refs.add(fileRef(i, false));
            eight[i] = png("n" + i + ".png");
        }
        update(staffToken, a.get("id").asLong(), body(a.get("slug").asText(), a.get("sku").asText(), refs), eight)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("tối đa 8")));

        verify(imageStorageService, never()).upload(any());
        verify(imageStorageService, never()).delete(anyString());
    }

    @Test
    @DisplayName("Sửa: trùng slug/SKU sản phẩm khác → 409; giữ nguyên slug/SKU của chính nó → 200; id không tồn tại → 404")
    void updateDuplicateAndNotFound() throws Exception {
        JsonNode a = json(create(staffToken, body(unique("p-x"), unique("PX").toUpperCase(), List.of())));
        JsonNode b = json(create(staffToken, body(unique("p-y"), unique("PY").toUpperCase(), List.of())));
        long id = a.get("id").asLong();

        update(staffToken, id, body(b.get("slug").asText(), a.get("sku").asText(), List.of()))
                .andExpect(status().isConflict());
        update(staffToken, id, body(a.get("slug").asText(), b.get("sku").asText(), List.of()))
                .andExpect(status().isConflict());
        update(staffToken, id, body(a.get("slug").asText(), a.get("sku").asText(), List.of()))
                .andExpect(status().isOk());
        update(staffToken, 999999, body(unique("p-z"), unique("PZ").toUpperCase(), List.of()))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Sửa sản phẩm đang thuộc danh mục đã bị vô hiệu hóa: giữ nguyên danh mục → 200")
    void updateKeepsExistingInactiveCategory() throws Exception {
        Category cat = categoryRepository.save(new Category("Danh mục sắp tắt", unique("cat-later"), null));
        Map<String, Object> b = body(unique("p-keep"), unique("KEEP").toUpperCase(), List.of());
        b.put("categoryId", cat.getId());
        JsonNode created = json(create(staffToken, b).andExpect(status().isCreated()));

        cat.setStatus(ActiveStatus.INACTIVE);
        categoryRepository.save(cat);

        Map<String, Object> edit = body(created.get("slug").asText(), created.get("sku").asText(), List.of());
        edit.put("categoryId", cat.getId());
        update(staffToken, created.get("id").asLong(), edit).andExpect(status().isOk());
    }

    @Test
    @DisplayName("Ảnh bị gỡ nhưng snapshot order_items còn tham chiếu → KHÔNG xóa trên Cloudinary (BUSINESS_RULES §6)")
    void removedImageReferencedByOrderSnapshotIsKept() throws Exception {
        String slug = unique("p-order");
        JsonNode created = json(create(staffToken, body(slug, unique("ORD").toUpperCase(), List.of(fileRef(0, true))), png("a.png"))
                .andExpect(status().isCreated()));
        long id = created.get("id").asLong();
        String publicId = uploadedIds.get(0);

        Branch branch = branchRepository.findFirstByNameOrderByIdAsc("Chi nhánh Quận 1").orElseThrow();
        inventoryRepository.save(new Inventory(productRepository.findById(id).orElseThrow(), branch, 5, 1));
        mockMvc.perform(get("/api/admin/products/{id}", id).header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalStock").value(5));

        Map<String, Object> checkout = new HashMap<>();
        checkout.put("source", "BUY_NOW");
        checkout.put("productId", id);
        checkout.put("quantity", 1);
        checkout.put("branchId", branch.getId());
        checkout.put("paymentMethod", "COD");
        checkout.put("recipientName", "Khách hàng Thử nghiệm");
        checkout.put("recipientPhone", "0903456789");
        checkout.put("shippingAddress", "123 Lê Lợi, Quận 1, TP.HCM");
        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkout)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.items[0].productImage").value(created.get("primaryImageUrl").asText()));

        update(staffToken, id, body(slug, created.get("sku").asText(), List.of()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.images", hasSize(0)));

        verify(imageStorageService, never()).delete(publicId);
        assertTrue(productImageRepository.findByProductIdOrderByDisplayOrderAsc(id).isEmpty());
    }

    @Test
    @DisplayName("Gỡ ảnh demo không thuộc Cloudinary → chỉ xóa bản ghi DB, không gọi destroy")
    void removingNonCloudinaryImageDoesNotCallDestroy() throws Exception {
        Product seeded = productRepository.findBySlug("nova-14").orElseThrow();
        Map<String, Object> edit = body(seeded.getSlug(), seeded.getSku(), List.of());
        edit.put("categoryId", categoryRepository.findBySlug("laptop").orElseThrow().getId());
        update(adminToken, seeded.getId(), edit).andExpect(status().isOk());
        verify(imageStorageService, never()).delete(anyString());
    }

    // ===================== Status, read, RBAC =====================

    @Test
    @DisplayName("PATCH status: INACTIVE ẩn khỏi catalog công khai, ACTIVE hiện lại; giá trị sai → 400")
    void updateStatusTogglesPublicVisibility() throws Exception {
        String slug = unique("p-status");
        long id = json(create(staffToken, body(slug, unique("ST").toUpperCase(), List.of()))).get("id").asLong();

        mockMvc.perform(patch("/api/admin/products/{id}/status", id)
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"INACTIVE\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
        mockMvc.perform(get("/api/products/{slug}", slug)).andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/admin/products/{id}/status", id)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"ACTIVE\"}"))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/products/{slug}", slug)).andExpect(status().isOk());

        mockMvc.perform(patch("/api/admin/products/{id}/status", id)
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"status\":\"DELETED\"}"))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("List admin gồm cả sản phẩm INACTIVE và tồn kho chỉ tính chi nhánh ACTIVE")
    void listIncludesInactiveProducts() throws Exception {
        mockMvc.perform(get("/api/admin/products").header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].status", hasItem("INACTIVE")))
                .andExpect(jsonPath("$[*].sku", hasItem(productRepository.findBySlug("nova-14").orElseThrow().getSku())));
        mockMvc.perform(get("/api/admin/products/{id}", 999999).header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("RBAC: không token 401, Customer 403, Staff/Admin 200; DELETE không hỗ trợ → 405")
    void rbacAndNoDelete() throws Exception {
        mockMvc.perform(get("/api/admin/products")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/products").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        create(customerToken, body(unique("p-cus"), unique("CUS").toUpperCase(), List.of()))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/products").header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/products").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());

        long id = productRepository.findAll().get(0).getId();
        mockMvc.perform(delete("/api/admin/products/{id}", id).header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isMethodNotAllowed());
        assertTrue(productRepository.existsById(id));
        verify(imageStorageService, never()).upload(any());
    }

    @Test
    @DisplayName("Thiếu part data → 400")
    void missingDataPartReturns400() throws Exception {
        mockMvc.perform(multipart("/api/admin/products").file(png("a.png"))
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("data")));
    }
}
