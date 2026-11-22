package com.techstore.common.storage;

import org.springframework.web.multipart.MultipartFile;

/**
 * Lưu trữ ảnh phía backend (Cloudinary). Tách interface để test mock, không gọi dịch vụ thật.
 */
public interface ImageStorageService {

    /** Upload authenticated một ảnh đã được validate. Lỗi → {@link ImageStorageException}. */
    StoredImage upload(MultipartFile file);

    /** Xóa asset theo public ID. Lỗi → {@link ImageStorageException}. */
    void delete(String publicId);

    /** URL có thuộc kho ảnh này (chỉ những asset như vậy mới được phép destroy). */
    boolean isManagedUrl(String url);
}
