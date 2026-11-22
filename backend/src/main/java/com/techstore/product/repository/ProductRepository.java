package com.techstore.product.repository;

import com.techstore.product.entity.Product;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Lock;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ProductRepository extends JpaRepository<Product, Long>, JpaSpecificationExecutor<Product> {
    Optional<Product> findBySlug(String slug);
    boolean existsBySlug(String slug);
    boolean existsBySku(String sku);
    boolean existsBySlugAndIdNot(String slug, Long id);
    boolean existsBySkuAndIdNot(String sku, Long id);

    /** Danh sách quản trị (UC11): mọi trạng thái, mới nhất trước, nạp sẵn danh mục/thương hiệu. */
    @EntityGraph(attributePaths = {"category", "brand"})
    List<Product> findAllByOrderByIdDesc();

    /** Khóa dòng sản phẩm khi sửa ảnh để hai request đồng thời không vượt 8 ảnh / sinh 2 primary (ADR-019). */
    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select p from Product p where p.id = :id")
    Optional<Product> findByIdForUpdate(@Param("id") Long id);

    /** Số sản phẩm (mọi trạng thái) theo danh mục trực tiếp — dùng cho Admin Catalog (UC12). Mỗi phần tử: [categoryId, count]. */
    @Query("select p.category.id, count(p) from Product p group by p.category.id")
    List<Object[]> countGroupByCategoryId();

    /** Số sản phẩm (mọi trạng thái) theo thương hiệu — dùng cho Admin Catalog (UC12). Mỗi phần tử: [brandId, count]. */
    @Query("select p.brand.id, count(p) from Product p group by p.brand.id")
    List<Object[]> countGroupByBrandId();
}
