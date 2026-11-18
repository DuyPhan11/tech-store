package com.techstore.product.dto.admin;

/**
 * Quy tắc slug dùng chung cho danh mục và thương hiệu (ADR-018 A3).
 */
public final class CatalogSlug {
    public static final String PATTERN = "^[a-z0-9]+(-[a-z0-9]+)*$";
    public static final String MESSAGE = "Slug chỉ gồm chữ thường a-z, số 0-9 và dấu gạch ngang giữa các từ";

    private CatalogSlug() {
    }
}
