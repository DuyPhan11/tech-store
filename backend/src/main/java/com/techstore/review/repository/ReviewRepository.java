package com.techstore.review.repository;

import com.techstore.review.entity.Review;
import com.techstore.review.entity.ReviewStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.product JOIN FETCH r.order "
            + "WHERE r.product.id = :productId AND r.status = :status ORDER BY r.createdAt DESC")
    List<Review> findByProductIdAndStatusOrderByCreatedAtDesc(@Param("productId") Long productId,
                                                              @Param("status") ReviewStatus status);

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.product JOIN FETCH r.order "
            + "WHERE r.user.id = :userId ORDER BY r.createdAt DESC")
    List<Review> findByUserIdOrderByCreatedAtDesc(@Param("userId") Long userId);

    Optional<Review> findByIdAndUserId(Long id, Long userId);

    boolean existsByUserIdAndProductIdAndOrderId(Long userId, Long productId, Long orderId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT r FROM Review r WHERE r.id = :id")
    Optional<Review> findByIdForUpdate(@Param("id") Long id);

    @Query("SELECT r FROM Review r JOIN FETCH r.user JOIN FETCH r.product JOIN FETCH r.order "
            + "WHERE (:status IS NULL OR r.status = :status) "
            + "AND (:pattern IS NULL OR LOWER(r.product.name) LIKE :pattern "
            + "OR LOWER(r.user.fullName) LIKE :pattern OR LOWER(r.user.email) LIKE :pattern "
            + "OR LOWER(r.comment) LIKE :pattern) "
            + "ORDER BY r.createdAt DESC")
    List<Review> searchForAdmin(@Param("status") ReviewStatus status, @Param("pattern") String pattern);
}
