package com.techstore.product.controller;

import com.techstore.product.dto.CatalogPageResponse;
import com.techstore.product.dto.ProductDetailDto;
import com.techstore.product.service.ProductService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;

@RestController
@RequestMapping("/api/products")
public class ProductController {

    private final ProductService productService;

    public ProductController(ProductService productService) {
        this.productService = productService;
    }

    @GetMapping
    public ResponseEntity<CatalogPageResponse> getProducts(
            @RequestParam(required = false) String q,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) String brand,
            @RequestParam(required = false) BigDecimal min,
            @RequestParam(required = false) BigDecimal max,
            @RequestParam(required = false, defaultValue = "default") String sort,
            @RequestParam(required = false, defaultValue = "1") Integer page,
            @RequestParam(required = false, defaultValue = "8") Integer size) {
        CatalogPageResponse response = productService.getProducts(q, category, brand, min, max, sort, page, size);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{slug}")
    public ResponseEntity<ProductDetailDto> getProductDetail(@PathVariable String slug) {
        ProductDetailDto response = productService.getProductDetail(slug);
        return ResponseEntity.ok(response);
    }
}
