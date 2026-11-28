package com.techstore.product.dto;

public class ProductSummaryDto {
    private String id;
    private String name;
    private String slug;
    private String categoryId;
    private String categorySlug;
    private String categoryName;
    private String parentCategorySlug;
    private String parentCategoryName;
    private String brandId;
    private String brandSlug;
    private String brandName;
    private Long priceVnd;
    private String image;
    private String specification;
    private String status;
    private double averageRating;
    private long reviewCount;

    public ProductSummaryDto() {
    }

    public ProductSummaryDto(String id, String name, String slug, String categoryId,
                             String categorySlug, String categoryName, String brandId,
                             String brandSlug, String brandName, Long priceVnd,
                             String image, String specification, String status) {
        this.id = id;
        this.name = name;
        this.slug = slug;
        this.categoryId = categoryId;
        this.categorySlug = categorySlug;
        this.categoryName = categoryName;
        this.brandId = brandId;
        this.brandSlug = brandSlug;
        this.brandName = brandName;
        this.priceVnd = priceVnd;
        this.image = image;
        this.specification = specification;
        this.status = status;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getSlug() {
        return slug;
    }

    public void setSlug(String slug) {
        this.slug = slug;
    }

    public String getCategoryId() {
        return categoryId;
    }

    public void setCategoryId(String categoryId) {
        this.categoryId = categoryId;
    }

    public String getCategorySlug() {
        return categorySlug;
    }

    public void setCategorySlug(String categorySlug) {
        this.categorySlug = categorySlug;
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

    public String getBrandSlug() {
        return brandSlug;
    }

    public void setBrandSlug(String brandSlug) {
        this.brandSlug = brandSlug;
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

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getSpecification() {
        return specification;
    }

    public void setSpecification(String specification) {
        this.specification = specification;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public double getAverageRating() {
        return averageRating;
    }

    public void setAverageRating(double averageRating) {
        this.averageRating = averageRating;
    }

    public long getReviewCount() {
        return reviewCount;
    }

    public void setReviewCount(long reviewCount) {
        this.reviewCount = reviewCount;
    }
}
