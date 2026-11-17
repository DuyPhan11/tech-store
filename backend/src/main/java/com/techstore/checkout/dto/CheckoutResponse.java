package com.techstore.checkout.dto;

import java.math.BigDecimal;
import java.util.List;

public class CheckoutResponse {

    private Long orderId;
    private String orderCode;
    private String status;
    private String paymentMethod;
    private String paymentStatus;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private BigDecimal totalItemsAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private List<OrderItemResponse> items;

    public CheckoutResponse() {
    }

    public CheckoutResponse(Long orderId, String orderCode, String status, String paymentMethod,
                            String paymentStatus, String recipientName, String recipientPhone,
                            String shippingAddress, BigDecimal totalItemsAmount, BigDecimal discountAmount,
                            BigDecimal finalAmount, List<OrderItemResponse> items) {
        this.orderId = orderId;
        this.orderCode = orderCode;
        this.status = status;
        this.paymentMethod = paymentMethod;
        this.paymentStatus = paymentStatus;
        this.recipientName = recipientName;
        this.recipientPhone = recipientPhone;
        this.shippingAddress = shippingAddress;
        this.totalItemsAmount = totalItemsAmount;
        this.discountAmount = discountAmount;
        this.finalAmount = finalAmount;
        this.items = items;
    }

    public Long getOrderId() {
        return orderId;
    }

    public void setOrderId(Long orderId) {
        this.orderId = orderId;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(String paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getRecipientPhone() {
        return recipientPhone;
    }

    public void setRecipientPhone(String recipientPhone) {
        this.recipientPhone = recipientPhone;
    }

    public String getShippingAddress() {
        return shippingAddress;
    }

    public void setShippingAddress(String shippingAddress) {
        this.shippingAddress = shippingAddress;
    }

    public BigDecimal getTotalItemsAmount() {
        return totalItemsAmount;
    }

    public void setTotalItemsAmount(BigDecimal totalItemsAmount) {
        this.totalItemsAmount = totalItemsAmount;
    }

    public BigDecimal getDiscountAmount() {
        return discountAmount;
    }

    public void setDiscountAmount(BigDecimal discountAmount) {
        this.discountAmount = discountAmount;
    }

    public BigDecimal getFinalAmount() {
        return finalAmount;
    }

    public void setFinalAmount(BigDecimal finalAmount) {
        this.finalAmount = finalAmount;
    }

    public List<OrderItemResponse> getItems() {
        return items;
    }

    public void setItems(List<OrderItemResponse> items) {
        this.items = items;
    }
}
