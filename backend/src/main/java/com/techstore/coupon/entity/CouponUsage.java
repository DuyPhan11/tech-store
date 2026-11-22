package com.techstore.coupon.entity;

import jakarta.persistence.*;

import java.time.LocalDateTime;

/**
 * Bảng {@code coupon_usages} (UC13, ADR-022). FS15 chỉ đọc; ghi usage / đảo usage là FS16.
 * Khóa ngoại lưu dạng id để tránh nạp Order/User không cần thiết.
 */
@Entity
@Table(name = "coupon_usages", uniqueConstraints = {
        @UniqueConstraint(name = "uq_coupon_usages_order_id", columnNames = "order_id")
}, indexes = {
        @Index(name = "idx_coupon_usages_coupon_user_status", columnList = "coupon_id, user_id, status")
})
public class CouponUsage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "coupon_id", nullable = false)
    private Long couponId;

    @Column(name = "user_id", nullable = false)
    private Long userId;

    @Column(name = "order_id", nullable = false)
    private Long orderId;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private CouponUsageStatus status = CouponUsageStatus.ACTIVE;

    @Column(name = "used_at", nullable = false)
    private LocalDateTime usedAt;

    @Column(name = "reversed_at")
    private LocalDateTime reversedAt;

    public CouponUsage() {
    }

    public CouponUsage(Long couponId, Long userId, Long orderId, CouponUsageStatus status) {
        this.couponId = couponId;
        this.userId = userId;
        this.orderId = orderId;
        this.status = status;
    }

    @PrePersist
    void onCreate() {
        if (usedAt == null) {
            usedAt = LocalDateTime.now();
        }
    }

    public Long getId() { return id; }
    public Long getCouponId() { return couponId; }
    public Long getUserId() { return userId; }
    public Long getOrderId() { return orderId; }
    public CouponUsageStatus getStatus() { return status; }
    public LocalDateTime getUsedAt() { return usedAt; }
    public LocalDateTime getReversedAt() { return reversedAt; }
}
