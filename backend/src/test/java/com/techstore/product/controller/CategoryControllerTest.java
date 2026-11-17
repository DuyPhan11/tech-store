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
public class CategoryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    @DisplayName("GET /api/categories trả về toàn bộ danh mục đang hoạt động")
    void getAllCategories_ShouldReturnActiveCategories() throws Exception {
        mockMvc.perform(get("/api/categories")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[*].slug", hasItems("laptop", "laptop-gaming", "laptop-van-phong", "dien-thoai")));
    }

    @Test
    @DisplayName("GET /api/categories/tree trả về cây phân cấp danh mục cha - con (ADR-017)")
    void getCategoryTree_ShouldReturnHierarchyWithChildren() throws Exception {
        mockMvc.perform(get("/api/categories/tree")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].slug", hasItem("laptop")))
                .andExpect(jsonPath("$[?(@.slug == 'laptop')].children", not(empty())))
                .andExpect(jsonPath("$[?(@.slug == 'laptop')].children[*].slug",
                        hasItems("laptop-gaming", "laptop-van-phong", "laptop-mong-nhe")));
    }

    @Test
    @DisplayName("GET /api/categories/{slug} trả về chi tiết danh mục theo slug")
    void getCategoryBySlug_ShouldReturnDetail() throws Exception {
        mockMvc.perform(get("/api/categories/laptop")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.slug", is("laptop")))
                .andExpect(jsonPath("$.name", is("Laptop")))
                .andExpect(jsonPath("$.children", not(empty())));
    }

    @Test
    @DisplayName("GET /api/categories/not-found-slug trả về 404 khi không tồn tại")
    void getCategoryBySlug_NotFound_ShouldReturn404() throws Exception {
        mockMvc.perform(get("/api/categories/non-existent-category")
                        .contentType(MediaType.APPLICATION_JSON))
                .andExpect(status().isNotFound());
    }
}
