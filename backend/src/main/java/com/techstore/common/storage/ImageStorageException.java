package com.techstore.common.storage;

/**
 * Lỗi khi giao tiếp với dịch vụ lưu ảnh (upload/xóa thất bại hoặc chưa cấu hình) → HTTP 502.
 */
public class ImageStorageException extends RuntimeException {
    public ImageStorageException(String message) {
        super(message);
    }

    public ImageStorageException(String message, Throwable cause) {
        super(message, cause);
    }
}
