package com.techstore.order.repository;

import com.techstore.order.entity.OrderItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderItemRepository extends JpaRepository<OrderItem, Long> {
    List<OrderItem> findByOrderId(Long orderId);

    /** Ảnh còn được snapshot đơn hàng tham chiếu thì không được xóa trên Cloudinary (BUSINESS_RULES §6). */
    boolean existsByProductImage(String productImage);
}
