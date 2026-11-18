package com.techstore.product.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.product.repository.BrandRepository;
import com.techstore.product.repository.CategoryRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * UC12 — Quản trị danh mục & thương hiệu (ADR-018).
 * Mỗi test chạy trong transaction và rollback để không ảnh hưởng dữ liệu demo dùng chung.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AdminCatalogControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private BrandRepository brandRepository;

    private String adminToken;
    private String staffToken;
    private String customerToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = login("admin@techstore.vn", "Admin@123");
        staffToken = login("staff@techstore.vn", "Staff@123");
        customerToken = login("customer@techstore.vn", "Customer@123");
    }

    private String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(identifier, password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class).getAccessToken();
    }

    private String json(Object body) throws Exception {
        return objectMapper.writeValueAsString(body);
    }

    private Map<String, Object> categoryBody(String name, String slug, Long parentId) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("slug", slug);
        body.put("description", "Mô tả " + name);
        body.put("parentId", parentId);
        return body;
    }

    private Map<String, Object> brandBody(String name, String slug, String country) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("slug", slug);
        body.put("country", country);
        body.put("description", "Thương hiệu " + name);
        return body;
    }

    private Long categoryId(String slug) {
        return categoryRepository.findBySlug(slug).orElseThrow().getId();
    }

    private Long brandId(String slug) {
        return brandRepository.findBySlug(slug).orElseThrow().getId();
    }

    // ---------------- RBAC ----------------

    @Test
    @DisplayName("Không token gọi admin catalog -> 401")
    void noToken_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/admin/categories")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/brands")).andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("STAFF và CUSTOMER không được quản trị danh mục/thương hiệu -> 403 (UC12 chỉ Admin)")
    void staffAndCustomer_ShouldReturn403() throws Exception {
        for (String token : new String[]{staffToken, customerToken}) {
            mockMvc.perform(get("/api/admin/categories").header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
            mockMvc.perform(get("/api/admin/brands").header("Authorization", "Bearer " + token))
                    .andExpect(status().isForbidden());
            mockMvc.perform(post("/api/admin/brands").header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(brandBody("Hack", "hack", null))))
                    .andExpect(status().isForbidden());
            mockMvc.perform(patch("/api/admin/categories/" + categoryId("laptop") + "/status")
                            .header("Authorization", "Bearer " + token)
                            .contentType(MediaType.APPLICATION_JSON)
                            .content(json(Map.of("status", "INACTIVE"))))
                    .andExpect(status().isForbidden());
        }
        org.junit.jupiter.api.Assertions.assertFalse(brandRepository.existsBySlug("hack"));
    }

    // ---------------- Categories ----------------

    @Test
    @DisplayName("ADMIN xem danh sách danh mục kèm parent và số sản phẩm, gồm cả INACTIVE")
    void admin_ListCategories_ShouldIncludeParentAndCounts() throws Exception {
        mockMvc.perform(patch("/api/admin/categories/" + categoryId("phu-kien") + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "INACTIVE"))))
                .andExpect(status().isOk());

        mockMvc.perform(get("/api/admin/categories").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[?(@.slug == 'laptop-gaming')].parentName", hasItem("Laptop")))
                .andExpect(jsonPath("$[?(@.slug == 'laptop')].productCount", hasItem(greaterThan(0))))
                .andExpect(jsonPath("$[?(@.slug == 'phu-kien')].status", hasItem("INACTIVE")));
    }

    @Test
    @DisplayName("ADMIN tạo danh mục con hợp lệ -> 201 và xuất hiện ở catalog công khai")
    void admin_CreateCategory_ShouldReturn201() throws Exception {
        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("Laptop AI", "laptop-ai", categoryId("laptop")))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.slug", is("laptop-ai")))
                .andExpect(jsonPath("$.parentName", is("Laptop")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.productCount", is(0)));

        mockMvc.perform(get("/api/categories"))
                .andExpect(jsonPath("$[*].slug", hasItem("laptop-ai")));
    }

    @Test
    @DisplayName("Tạo danh mục trùng slug -> 409")
    void createCategory_DuplicateSlug_ShouldReturn409() throws Exception {
        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("Laptop 2", "laptop", null))))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status", is(409)));
    }

    @Test
    @DisplayName("Slug sai định dạng / thiếu tên -> 400 kèm lỗi theo field")
    void createCategory_InvalidInput_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("", "Laptop Mới", null))))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.slug", notNullValue()))
                .andExpect(jsonPath("$.errors.name", notNullValue()));
    }

    @Test
    @DisplayName("Danh mục cha không tồn tại -> 400")
    void createCategory_ParentNotFound_ShouldReturn400() throws Exception {
        mockMvc.perform(post("/api/admin/categories")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("Mồ côi", "mo-coi", 999999L))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Cập nhật danh mục: đổi tên/mô tả thành công; slug trùng danh mục khác -> 409; giữ nguyên slug của chính nó -> 200")
    void updateCategory_SlugRules() throws Exception {
        Long gamingId = categoryId("laptop-gaming");

        mockMvc.perform(put("/api/admin/categories/" + gamingId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("Laptop Gaming RGB", "laptop-gaming", categoryId("laptop")))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name", is("Laptop Gaming RGB")))
                .andExpect(jsonPath("$.productCount", greaterThan(0)));

        mockMvc.perform(put("/api/admin/categories/" + gamingId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("Laptop Gaming", "dien-thoai", categoryId("laptop")))))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("Đặt danh mục cha là chính nó hoặc hậu duệ -> 400 (chống vòng lặp)")
    void updateCategory_Cycle_ShouldReturn400() throws Exception {
        Long laptopId = categoryId("laptop");

        mockMvc.perform(put("/api/admin/categories/" + laptopId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("Laptop", "laptop", laptopId))))
                .andExpect(status().isBadRequest());

        mockMvc.perform(put("/api/admin/categories/" + laptopId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("Laptop", "laptop", categoryId("laptop-gaming")))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Danh mục không tồn tại -> 404")
    void updateCategory_NotFound_ShouldReturn404() throws Exception {
        mockMvc.perform(put("/api/admin/categories/999999")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(categoryBody("X", "x-not-found", null))))
                .andExpect(status().isNotFound());

        mockMvc.perform(patch("/api/admin/categories/999999/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "INACTIVE"))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Không có xóa vật lý (ADR-018 A2): DELETE -> 405 và bản ghi vẫn còn")
    void delete_ShouldReturn405() throws Exception {
        Long laptopId = categoryId("laptop");
        mockMvc.perform(delete("/api/admin/categories/" + laptopId).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());
        mockMvc.perform(delete("/api/admin/brands/" + brandId("nova")).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());
        org.junit.jupiter.api.Assertions.assertTrue(categoryRepository.existsById(laptopId));
    }

    @Test
    @DisplayName("Trạng thái ngoài ACTIVE/INACTIVE -> 400")
    void updateStatus_InvalidValue_ShouldReturn400() throws Exception {
        mockMvc.perform(patch("/api/admin/categories/" + categoryId("laptop") + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "DELETED"))))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Vô hiệu hóa danh mục cha ẩn cả nhánh con và sản phẩm khỏi catalog công khai; kích hoạt lại hiển thị lại")
    void deactivateParentCategory_ShouldHideSubtreeFromPublicCatalog() throws Exception {
        Long laptopId = categoryId("laptop");

        mockMvc.perform(get("/api/products").param("category", "laptop-gaming"))
                .andExpect(jsonPath("$.total", greaterThan(0)));

        mockMvc.perform(patch("/api/admin/categories/" + laptopId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "INACTIVE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("INACTIVE")));

        mockMvc.perform(get("/api/categories"))
                .andExpect(jsonPath("$[*].slug", not(hasItem("laptop"))))
                .andExpect(jsonPath("$[*].slug", not(hasItem("laptop-gaming"))))
                .andExpect(jsonPath("$[*].slug", hasItem("dien-thoai")));
        mockMvc.perform(get("/api/categories/laptop-gaming")).andExpect(status().isNotFound());
        mockMvc.perform(get("/api/products").param("category", "laptop-gaming"))
                .andExpect(jsonPath("$.total", is(0)));
        mockMvc.perform(get("/api/products").param("category", "laptop"))
                .andExpect(jsonPath("$.total", is(0)));

        mockMvc.perform(patch("/api/admin/categories/" + laptopId + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "ACTIVE"))))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/products").param("category", "laptop-gaming"))
                .andExpect(jsonPath("$.total", greaterThan(0)));
    }

    // ---------------- Brands ----------------

    @Test
    @DisplayName("ADMIN tạo thương hiệu có quốc gia xuất xứ -> 201; trùng slug -> 409")
    void admin_CreateBrand() throws Exception {
        mockMvc.perform(post("/api/admin/brands")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(brandBody("Corsair", "corsair", "Mỹ"))))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.slug", is("corsair")))
                .andExpect(jsonPath("$.country", is("Mỹ")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.productCount", is(0)));

        mockMvc.perform(post("/api/admin/brands")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(brandBody("Corsair 2", "corsair", null))))
                .andExpect(status().isConflict());

        mockMvc.perform(get("/api/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].slug", hasItem("corsair")));
    }

    @Test
    @DisplayName("Cập nhật thương hiệu: đổi quốc gia, slug trùng -> 409, không tồn tại -> 404")
    void admin_UpdateBrand() throws Exception {
        Long novaId = brandId("nova");

        mockMvc.perform(put("/api/admin/brands/" + novaId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(brandBody("Nova", "nova", "Việt Nam"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country", is("Việt Nam")))
                .andExpect(jsonPath("$.productCount", greaterThan(0)));

        mockMvc.perform(put("/api/admin/brands/" + novaId)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(brandBody("Nova", "orbit", null))))
                .andExpect(status().isConflict());

        mockMvc.perform(put("/api/admin/brands/999999")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(brandBody("X", "x-brand", null))))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Vô hiệu hóa thương hiệu ẩn khỏi GET /api/brands và ẩn sản phẩm của hãng khỏi catalog công khai")
    void deactivateBrand_ShouldHideFromPublicCatalog() throws Exception {
        mockMvc.perform(get("/api/products").param("brand", "nova"))
                .andExpect(jsonPath("$.total", greaterThan(0)));

        mockMvc.perform(patch("/api/admin/brands/" + brandId("nova") + "/status")
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(json(Map.of("status", "INACTIVE"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("INACTIVE")));

        mockMvc.perform(get("/api/brands"))
                .andExpect(jsonPath("$[*].slug", not(hasItem("nova"))))
                .andExpect(jsonPath("$[*].slug", hasItem("orbit")));
        mockMvc.perform(get("/api/products").param("brand", "nova"))
                .andExpect(jsonPath("$.total", is(0)));
        mockMvc.perform(get("/api/admin/brands").header("Authorization", "Bearer " + adminToken))
                .andExpect(jsonPath("$[?(@.slug == 'nova')].status", hasItem("INACTIVE")));
    }

    @Test
    @DisplayName("GET /api/brands công khai không cần token, chỉ trả thương hiệu ACTIVE")
    void publicBrands_NoToken_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/brands"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].slug", hasItems("nova", "orbit", "vista", "echo")))
                .andExpect(jsonPath("$[0].name", notNullValue()));
    }
}
