package com.techstore.product.dto;

public class ProductImageDto {
    private Long id;
    private String url;
    private String alt;
    private Boolean isPrimary;
    private Integer displayOrder;

    public ProductImageDto() {
    }

    public ProductImageDto(Long id, String url, String alt, Boolean isPrimary, Integer displayOrder) {
        this.id = id;
        this.url = url;
        this.alt = alt;
        this.isPrimary = isPrimary;
        this.displayOrder = displayOrder;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getUrl() {
        return url;
    }

    public void setUrl(String url) {
        this.url = url;
    }

    public String getAlt() {
        return alt;
    }

    public void setAlt(String alt) {
        this.alt = alt;
    }

    public Boolean getIsPrimary() {
        return isPrimary;
    }

    public void setIsPrimary(Boolean primary) {
        isPrimary = primary;
    }

    public Integer getDisplayOrder() {
        return displayOrder;
    }

    public void setDisplayOrder(Integer displayOrder) {
        this.displayOrder = displayOrder;
    }
}
