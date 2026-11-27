package com.techstore.order.repository;

import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import jakarta.persistence.LockModeType;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Collection;
import java.util.List;
import java.util.Optional;

@Repository
public interface OrderRepository extends JpaRepository<Order, Long> {
    Optional<Order> findByOrderCode(String orderCode);
    List<Order> findByUserIdOrderByCreatedAtDesc(Long userId);
    Optional<Order> findByIdAndUserId(Long id, Long userId);
    Optional<Order> findByOrderCodeAndUserId(String orderCode, Long userId);

    /** Số đơn của chi nhánh theo nhóm trạng thái — dùng chặn vô hiệu hóa chi nhánh còn đơn chưa kết thúc (UC19). */
    long countByBranchIdAndStatusIn(Long branchId, Collection<OrderStatus> statuses);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id AND o.user.id = :userId")
    Optional<Order> findByIdAndUserIdForUpdate(@Param("id") Long id, @Param("userId") Long userId);

    /** Khóa dòng đơn theo id cho quản trị (UC14, ADR-023) — cùng khóa với luồng khách hủy. */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT o FROM Order o WHERE o.id = :id")
    Optional<Order> findByIdForUpdate(@Param("id") Long id);

    /** Danh sách đơn cho quản trị: lọc trạng thái + từ khóa (mã đơn, tên/SĐT người nhận, đã lowercase + %...%). */
    @Query(value = "SELECT o FROM Order o WHERE (:status IS NULL OR o.status = :status) "
            + "AND (:pattern IS NULL OR LOWER(o.orderCode) LIKE :pattern OR LOWER(o.recipientName) LIKE :pattern "
            + "OR LOWER(o.recipientPhone) LIKE :pattern)",
            countQuery = "SELECT COUNT(o) FROM Order o WHERE (:status IS NULL OR o.status = :status) "
            + "AND (:pattern IS NULL OR LOWER(o.orderCode) LIKE :pattern OR LOWER(o.recipientName) LIKE :pattern "
            + "OR LOWER(o.recipientPhone) LIKE :pattern)")
    Page<Order> searchForAdmin(@Param("status") OrderStatus status, @Param("pattern") String pattern, Pageable pageable);

    /** Số đơn theo trạng thái với cùng điều kiện từ khóa — cho số đếm trên các tab (UC14). */
    @Query("SELECT o.status, COUNT(o) FROM Order o WHERE (:pattern IS NULL OR LOWER(o.orderCode) LIKE :pattern "
            + "OR LOWER(o.recipientName) LIKE :pattern OR LOWER(o.recipientPhone) LIKE :pattern) GROUP BY o.status")
    List<Object[]> countByStatusForAdmin(@Param("pattern") String pattern);

    /** Các đơn COMPLETED của user chứa productId và chưa từng tạo review (UC09). */
    @Query("SELECT DISTINCT o FROM Order o JOIN o.items i WHERE o.user.id = :userId AND o.status = 'COMPLETED' "
            + "AND i.product.id = :productId AND NOT EXISTS ("
            + "SELECT r.id FROM Review r WHERE r.user.id = :userId AND r.product.id = :productId AND r.order.id = o.id"
            + ") ORDER BY o.createdAt DESC")
    List<Order> findEligibleCompletedOrdersForReview(@Param("userId") Long userId, @Param("productId") Long productId);
}

