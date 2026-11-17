package com.techstore.cart.dto;

public class CartItemResponse {

    private Long id;
    private Long productId;
    private String productName;
    private String productSlug;
    private String productSku;
    private String productImage;
    private Long priceVnd;
    private Integer quantity;
    private Long subtotalVnd;
    private Boolean inStock;

    public CartItemResponse() {
    }

    public CartItemResponse(Long id, Long productId, String productName, String productSlug,
                            String productSku, String productImage, Long priceVnd,
                            Integer quantity, Long subtotalVnd, Boolean inStock) {
        this.id = id;
        this.productId = productId;
        this.productName = productName;
        this.productSlug = productSlug;
        this.productSku = productSku;
        this.productImage = productImage;
        this.priceVnd = priceVnd;
        this.quantity = quantity;
        this.subtotalVnd = subtotalVnd;
        this.inStock = inStock;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public String getProductName() {
        return productName;
    }

    public void setProductName(String productName) {
        this.productName = productName;
    }

    public String getProductSlug() {
        return productSlug;
    }

    public void setProductSlug(String productSlug) {
        this.productSlug = productSlug;
    }

    public String getProductSku() {
        return productSku;
    }

    public void setProductSku(String productSku) {
        this.productSku = productSku;
    }

    public String getProductImage() {
        return productImage;
    }

    public void setProductImage(String productImage) {
        this.productImage = productImage;
    }

    public Long getPriceVnd() {
        return priceVnd;
    }

    public void setPriceVnd(Long priceVnd) {
        this.priceVnd = priceVnd;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }

    public Long getSubtotalVnd() {
        return subtotalVnd;
    }

    public void setSubtotalVnd(Long subtotalVnd) {
        this.subtotalVnd = subtotalVnd;
    }

    public Boolean getInStock() {
        return inStock;
    }

    public void setInStock(Boolean inStock) {
        this.inStock = inStock;
    }
}
