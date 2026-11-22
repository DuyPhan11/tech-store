package com.techstore.coupon.repository;

import com.techstore.coupon.entity.CouponUsage;
import com.techstore.coupon.entity.CouponUsageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

/** FS15 (UC13) chỉ đọc bảng coupon_usages; việc ghi thuộc FS16. */
@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {

    boolean existsByCouponId(Long couponId);

    boolean existsByCouponIdAndUserIdAndStatus(Long couponId, Long userId, CouponUsageStatus status);

    long countByCouponId(Long couponId);
}
