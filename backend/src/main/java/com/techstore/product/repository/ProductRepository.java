package com.techstore.product.repository;

import com.techstore.product.entity.Product;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsBySku(String sku);

    /** Số sản phẩm (mọi trạng thái) theo danh mục trực tiếp — dùng cho Admin Catalog (UC12). Mỗi phần tử: [categoryId, count]. */
    @Query("select p.category.id, count(p) from Product p group by p.category.id")
    List<Object[]> countGroupByCategoryId();

    /** Số sản phẩm (mọi trạng thái) theo thương hiệu — dùng cho Admin Catalog (UC12). Mỗi phần tử: [brandId, count]. */
    @Query("select p.brand.id, count(p) from Product p group by p.brand.id")
    List<Object[]> countGroupByBrandId();
}
