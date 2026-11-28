package com.techstore.product.service;

import com.techstore.product.dto.CatalogPageResponse;
import com.techstore.product.dto.ProductDetailDto;

import java.math.BigDecimal;

public interface ProductService {
    CatalogPageResponse getProducts(String q, String category, String brand,
                                    BigDecimal min, BigDecimal max,
                                    String sort, Integer page);

    default CatalogPageResponse getProducts(String q, String category, String brand,
                                            BigDecimal min, BigDecimal max,
                                            String sort, Integer page, Integer size) {
        return getProducts(q, category, brand, min, max, sort, page);
    }

    ProductDetailDto getProductDetail(String slug);
}
