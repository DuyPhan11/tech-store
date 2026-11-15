package com.techstore.product.controller;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
public class ProductControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/products danh sách mặc định: chỉ trả về sản phẩm ACTIVE, phân trang 8 sản phẩm")
    void getProducts_Default_ShouldReturnActiveProductsWithPageSize8() throws Exception {
        mockMvc.perform(get("/api/products")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page", is(1)))
                .andExpect(jsonPath("$.pageSize", is(8)))
                .andExpect(jsonPath("$.total", is(9))) // 9 sản phẩm ACTIVE (loại trừ nova-archived INACTIVE)
                .andExpect(jsonPath("$.totalPages", is(2)))
                .andExpect(jsonPath("$.products", hasSize(8)))
                .andExpect(jsonPath("$.products[0].slug", is("nova-14")))
                .andExpect(jsonPath("$.products[0].status", is("ACTIVE")))
                .andExpect(jsonPath("$.products[0].categoryId", is("laptop")))
                .andExpect(jsonPath("$.products[0].brandId", is("nova")));
    }

    @Test
    @DisplayName("GET /api/products?page=2 trang thứ 2: trả về 1 sản phẩm còn lại")
    void getProducts_Page2_ShouldReturnRemainingProducts() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("page", "2")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.page", is(2)))
                .andExpect(jsonPath("$.products", hasSize(1)));
    }

    @Test
    @DisplayName("GET /api/products?q=nova tìm kiếm case-insensitive, cắt khoảng trắng và loại bỏ INACTIVE")
    void getProducts_SearchKeyword_ShouldFilterByNameCaseInsensitive() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("q", "  NoVa  ")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(3))) // nova-14, nova-16, nova-out-of-stock (nova-archived bị loại bỏ)
                .andExpect(jsonPath("$.products", hasSize(3)))
                .andExpect(jsonPath("$.products[*].slug", not(hasItem("nova-archived"))));
    }

    @Test
    @DisplayName("GET /api/products?category=laptop lọc theo danh mục")
    void getProducts_FilterByCategory_ShouldReturnMatchingCategory() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("category", "laptop")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(3)))
                .andExpect(jsonPath("$.products[*].categorySlug", everyItem(is("laptop"))));
    }

    @Test
    @DisplayName("GET /api/products?brand=orbit lọc theo thương hiệu")
    void getProducts_FilterByBrand_ShouldReturnMatchingBrand() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("brand", "orbit")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(2)))
                .andExpect(jsonPath("$.products[*].brandSlug", everyItem(is("orbit"))));
    }

    @Test
    @DisplayName("GET /api/products?min=5000000&max=10000000 lọc theo khoảng giá VND")
    void getProducts_FilterByPriceRange_ShouldReturnProductsWithinRange() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("min", "5000000")
                        .param("max", "10000000")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total", is(3))) // Orbit 6 (8.99M), Orbit Mini (6.49M), Vista 27 (5.49M)
                .andExpect(jsonPath("$.products[*].priceVnd", everyItem(allOf(greaterThanOrEqualTo(5000000), lessThanOrEqualTo(10000000)))));
    }

    @Test
    @DisplayName("GET /api/products?sort=price-asc sắp xếp giá tăng dần")
    void getProducts_SortPriceAsc_ShouldReturnAscendingPrices() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("sort", "price-asc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products[0].slug", is("echo-air")))
                .andExpect(jsonPath("$.products[0].priceVnd", is(2490000)))
                .andExpect(jsonPath("$.products[1].slug", is("vista-24")))
                .andExpect(jsonPath("$.products[1].priceVnd", is(3290000)));
    }

    @Test
    @DisplayName("GET /api/products?sort=price-desc sắp xếp giá giảm dần")
    void getProducts_SortPriceDesc_ShouldReturnDescendingPrices() throws Exception {
        mockMvc.perform(get("/api/products")
                        .param("sort", "price-desc")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.products[0].slug", is("nova-16")))
                .andExpect(jsonPath("$.products[0].priceVnd", is(28990000)))
                .andExpect(jsonPath("$.products[1].slug", is("nova-14")))
                .andExpect(jsonPath("$.products[1].priceVnd", is(18990000)));
    }

    @Test
    @DisplayName("GET /api/products/nova-14 chi tiết sản phẩm: trả về đủ trường, tồn kho max chi nhánh ACTIVE")
    void getProductDetail_Success_ShouldReturnFullDetailAndActiveBranchStock() throws Exception {
        mockMvc.perform(get("/api/products/nova-14")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("nova-14")))
                .andExpect(jsonPath("$.sku", is("LAP-NOV-14")))
                .andExpect(jsonPath("$.name", is("Laptop Nova 14")))
                .andExpect(jsonPath("$.status", is("ACTIVE")))
                .andExpect(jsonPath("$.categoryId", is("laptop")))
                .andExpect(jsonPath("$.brandId", is("nova")))
                .andExpect(jsonPath("$.priceVnd", is(18990000)))
                .andExpect(jsonPath("$.inStock", is(true)))
                // Chi nhánh Q1 = 5, Chi nhánh Q7 = 8, Kho bảo trì (INACTIVE) = 20 -> maxBranchQuantity = 8
                .andExpect(jsonPath("$.maxBranchQuantity", is(8)))
                .andExpect(jsonPath("$.stock", is(8)))
                .andExpect(jsonPath("$.images", hasSize(2)))
                .andExpect(jsonPath("$.images[0].isPrimary", is(true)))
                .andExpect(jsonPath("$.images[0].displayOrder", is(1)))
                .andExpect(jsonPath("$.specifications", not(empty())))
                .andExpect(jsonPath("$.description", not(emptyString())));
    }

    @Test
    @DisplayName("GET /api/products/nova-out-of-stock sản phẩm hết hàng: inStock=false, maxBranchQuantity=0")
    void getProductDetail_OutOfStock_ShouldReturnInStockFalse() throws Exception {
        mockMvc.perform(get("/api/products/nova-out-of-stock")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("nova-out-of-stock")))
                .andExpect(jsonPath("$.inStock", is(false)))
                .andExpect(jsonPath("$.maxBranchQuantity", is(0)))
                .andExpect(jsonPath("$.stock", is(0)));
    }

    @Test
    @DisplayName("GET /api/products/not-found-slug sản phẩm không tồn tại -> 404 Not Found")
    void getProductDetail_NotFound_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/products/not-found-slug")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")));
    }

    @Test
    @DisplayName("GET /api/products/nova-archived sản phẩm INACTIVE -> 404 Not Found theo ADR-010")
    void getProductDetail_InactiveProduct_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/products/nova-archived")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status", is(404)))
                .andExpect(jsonPath("$.error", is("Not Found")));
    }
}
