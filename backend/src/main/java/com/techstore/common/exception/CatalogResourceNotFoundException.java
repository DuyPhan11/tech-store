package com.techstore.common.exception;

/**
 * Danh mục / thương hiệu không tồn tại (UC12) → 404.
 */
public class CatalogResourceNotFoundException extends RuntimeException {
    public CatalogResourceNotFoundException(String message) {
        super(message);
    }
}
