package com.techstore.product.repository;

import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Inventory;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface InventoryRepository extends JpaRepository<Inventory, Long> {
    List<Inventory> findByProductId(Long productId);
    Optional<Inventory> findByProductIdAndBranchId(Long productId, Long branchId);

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("SELECT i FROM Inventory i WHERE i.product.id = :productId AND i.branch.id = :branchId")
    Optional<Inventory> findByProductIdAndBranchIdForUpdate(@Param("productId") Long productId, @Param("branchId") Long branchId);

    /**
     * Danh sách tồn quản trị (UC18): lọc chi nhánh và từ khóa (pattern '%x%' đã lowercase) theo tên hoặc SKU.
     */
    @Query("SELECT i FROM Inventory i JOIN FETCH i.product p JOIN FETCH i.branch b "
            + "WHERE (:branchId IS NULL OR b.id = :branchId) "
            + "AND (:pattern IS NULL OR LOWER(p.name) LIKE :pattern OR LOWER(p.sku) LIKE :pattern) "
            + "ORDER BY p.name ASC, b.id ASC")
    List<Inventory> searchForAdmin(@Param("branchId") Long branchId, @Param("pattern") String pattern);

    /** Tổng tồn theo sản phẩm ở các chi nhánh có trạng thái cho trước (UC11, chỉ đọc). Mỗi phần tử: [productId, sum]. */
    @Query("SELECT i.product.id, SUM(i.quantity) FROM Inventory i WHERE i.branch.status = :status GROUP BY i.product.id")
    List<Object[]> sumQuantityGroupByProductId(@Param("status") ActiveStatus status);
}
