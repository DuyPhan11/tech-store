package com.techstore.common.storage;

import com.cloudinary.Cloudinary;
import com.cloudinary.utils.ObjectUtils;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.net.URI;
import java.util.Map;

/**
 * Upload authenticated (signed) lên Cloudinary từ backend (ADR-003, ADR-019). Secret không bao giờ rời backend.
 */
@Service
@EnableConfigurationProperties(CloudinaryProperties.class)
public class CloudinaryImageStorageService implements ImageStorageService {

    private static final Logger log = LoggerFactory.getLogger(CloudinaryImageStorageService.class);
    private static final String CLOUDINARY_HOST = "res.cloudinary.com";

    private final CloudinaryProperties properties;
    private final Cloudinary cloudinary;

    public CloudinaryImageStorageService(CloudinaryProperties properties) {
        this.properties = properties;
        if (properties.isConfigured()) {
            this.cloudinary = new Cloudinary(ObjectUtils.asMap(
                    "cloud_name", properties.cloudName().trim(),
                    "api_key", properties.apiKey().trim(),
                    "api_secret", properties.apiSecret().trim(),
                    "secure", true));
        } else {
            this.cloudinary = null;
            log.warn("Cloudinary chưa được cấu hình (CLOUDINARY_*); upload ảnh sản phẩm sẽ trả về 502");
        }
    }

    @Override
    public StoredImage upload(MultipartFile file) {
        Cloudinary client = requireClient();
        try {
            Map<?, ?> result = client.uploader().upload(file.getBytes(), ObjectUtils.asMap(
                    "folder", properties.folderOrDefault(),
                    "resource_type", "image",
                    "use_filename", false,
                    "unique_filename", true,
                    "overwrite", false));
            Object secureUrl = result.get("secure_url");
            Object publicId = result.get("public_id");
            if (secureUrl == null || publicId == null) {
                throw new ImageStorageException("Cloudinary không trả về secure_url/public_id");
            }
            log.info("Đã upload ảnh lên Cloudinary: publicId={}", publicId);
            return new StoredImage(secureUrl.toString(), publicId.toString());
        } catch (IOException | RuntimeException ex) {
            if (ex instanceof ImageStorageException ise) {
                throw ise;
            }
            log.error("Upload Cloudinary thất bại: {}", ex.getMessage());
            throw new ImageStorageException("Không thể tải ảnh lên Cloudinary. Vui lòng thử lại sau.", ex);
        }
    }

    @Override
    public void delete(String publicId) {
        Cloudinary client = requireClient();
        try {
            Map<?, ?> result = client.uploader().destroy(publicId, ObjectUtils.asMap("resource_type", "image", "invalidate", true));
            log.info("Đã xóa ảnh Cloudinary: publicId={}, result={}", publicId, result.get("result"));
        } catch (IOException | RuntimeException ex) {
            log.error("Xóa ảnh Cloudinary thất bại: publicId={}, lỗi={}", publicId, ex.getMessage());
            throw new ImageStorageException("Không thể xóa ảnh trên Cloudinary", ex);
        }
    }

    @Override
    public boolean isManagedUrl(String url) {
        if (url == null || url.isBlank()) {
            return false;
        }
        try {
            URI uri = URI.create(url.trim());
            return "https".equalsIgnoreCase(uri.getScheme()) && CLOUDINARY_HOST.equalsIgnoreCase(uri.getHost());
        } catch (IllegalArgumentException ex) {
            return false;
        }
    }

    private Cloudinary requireClient() {
        if (cloudinary == null) {
            throw new ImageStorageException("Dịch vụ lưu ảnh Cloudinary chưa được cấu hình trên máy chủ");
        }
        return cloudinary;
    }
}
