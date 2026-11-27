package com.techstore.coupon.repository;

import com.techstore.coupon.entity.CouponUsage;
import com.techstore.coupon.entity.CouponUsageStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

/**
 * Lượt dùng coupon. Preview (UC13) chỉ đọc; checkout ghi usage ACTIVE và hủy đơn đảo sang REVERSED (ADR-024).
 */
@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    boolean existsByCouponId(Long couponId);

    boolean existsByCouponIdAndUserIdAndStatus(Long couponId, Long userId, CouponUsageStatus status);

    long countByCouponId(Long couponId);

    long countByCouponIdAndStatus(Long couponId, CouponUsageStatus status);

    /**
     * Đọc có khóa (SELECT … FOR UPDATE) các usage ACTIVE của user trên coupon — luôn thấy bản đã commit mới nhất,
     * kể cả dưới REPEATABLE READ (ADR-024). Chỉ dùng trong checkout, sau khi đã khóa coupon.
     */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from CouponUsage u where u.couponId = :couponId and u.userId = :userId and u.status = :status")
    List<CouponUsage> lockByCouponIdAndUserIdAndStatus(@Param("couponId") Long couponId,
                                                       @Param("userId") Long userId,
                                                       @Param("status") CouponUsageStatus status);

    /** Usage của một đơn theo trạng thái, có khóa — dùng khi hủy đơn để hoàn coupon đúng 1 lần (ADR-024). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select u from CouponUsage u where u.orderId = :orderId and u.status = :status")
    Optional<CouponUsage> findByOrderIdAndStatusForUpdate(@Param("orderId") Long orderId,
                                                         @Param("status") CouponUsageStatus status);

    Optional<CouponUsage> findByOrderId(Long orderId);
}
