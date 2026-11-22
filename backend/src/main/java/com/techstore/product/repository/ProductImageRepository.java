package com.techstore.product.repository;

import com.techstore.product.entity.ProductImage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ProductImageRepository extends JpaRepository<ProductImage, Long> {
    List<ProductImage> findByProductIdOrderByDisplayOrderAsc(Long productId);
    boolean existsByCloudinaryPublicId(String cloudinaryPublicId);
    List<ProductImage> findAllByOrderByDisplayOrderAsc();
}
