package com.techstore.product.dto;

import java.util.ArrayList;
import java.util.List;

public class ProductDetailDto {
    private String id;
    private String slug;
    private String sku;
    private String name;
    private String categoryId;
    private String categoryName;
    private String parentCategorySlug;
    private String parentCategoryName;
    private String brandId;
    private String brandName;
    private Long priceVnd;
    private String status;
    private String image;
    private List<ProductImageDto> images = new ArrayList<>();
    private String specification;
    private List<ProductSpecDto> specifications = new ArrayList<>();
    private String description;
    private boolean inStock;
    private int maxBranchQuantity;
    private int stock;

    public ProductDetailDto() {
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getSku() {
        return sku;
    }

    public void setSku(String sku) {
        this.sku = sku;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategoryName() {
        return categoryName;
    }

    public void setCategoryName(String categoryName) {
        this.categoryName = categoryName;
    }

    public String getParentCategorySlug() {
        return parentCategorySlug;
    }

    public void setParentCategorySlug(String parentCategorySlug) {
        this.parentCategorySlug = parentCategorySlug;
    }

    public String getParentCategoryName() {
        return parentCategoryName;
    }

    public void setParentCategoryName(String parentCategoryName) {
        this.parentCategoryName = parentCategoryName;
    }

    public String getBrandId() {
        return brandId;
    }

    public void setBrandId(String brandId) {
        this.brandId = brandId;
    }

    public String getBrandName() {
        return brandName;
    }

    public void setBrandName(String brandName) {
        this.brandName = brandName;
    }

    public Long getPriceVnd() {
        return priceVnd;
    }

    public void setPriceVnd(Long priceVnd) {
        this.priceVnd = priceVnd;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public List<ProductImageDto> getImages() {
        return images;
    }

    public void setImages(List<ProductImageDto> images) {
        this.images = images;
    }

    public String getSpecification() {
        return specification;
    }

    public void setSpecification(String specification) {
        this.specification = specification;
    }

    public List<ProductSpecDto> getSpecifications() {
        return specifications;
    }

    public void setSpecifications(List<ProductSpecDto> specifications) {
        this.specifications = specifications;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public boolean isInStock() {
        return inStock;
    }

    public void setInStock(boolean inStock) {
        this.inStock = inStock;
    }

    public int getMaxBranchQuantity() {
        return maxBranchQuantity;
    }

    public void setMaxBranchQuantity(int maxBranchQuantity) {
        this.maxBranchQuantity = maxBranchQuantity;
    }

    public int getStock() {
        return stock;
    }

    public void setStock(int stock) {
        this.stock = stock;
    }
}
