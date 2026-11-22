package com.techstore.common.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Cấu hình Cloudinary đọc từ biến môi trường CLOUDINARY_CLOUD_NAME / CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.
 * Không có giá trị mặc định thật; thiếu cấu hình thì upload trả 502 thay vì làm app không khởi động được.
 */
@ConfigurationProperties(prefix = "app.cloudinary")
public record CloudinaryProperties(String cloudName, String apiKey, String apiSecret, String folder) {

    public boolean isConfigured() {
        return notBlank(cloudName) && notBlank(apiKey) && notBlank(apiSecret);
    }

    public String folderOrDefault() {
        return notBlank(folder) ? folder.trim() : "tech-store/products";
    }

    private static boolean notBlank(String value) {
        return value != null && !value.isBlank();
    }

    /** Không để lộ secret khi record bị log. */
    @Override
    public String toString() {
        return "CloudinaryProperties[cloudName=" + cloudName + ", configured=" + isConfigured() + "]";
    }
}
