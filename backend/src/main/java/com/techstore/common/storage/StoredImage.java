package com.techstore.common.storage;

/**
 * Kết quả upload ảnh: secure URL + public ID lưu vào MySQL (BUSINESS_RULES §6).
 */
public record StoredImage(String secureUrl, String publicId) {
}
