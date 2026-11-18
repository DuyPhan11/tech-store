package com.techstore.order.dto;

import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderItem;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Collectors;

public class OrderResponse {

    private Long id;
    private String orderCode;
    private OrderStatus status;
    private String statusLabel;
    private PaymentMethod paymentMethod;
    private PaymentStatus paymentStatus;
    private String paymentStatusLabel;
    private String recipientName;
    private String recipientPhone;
    private String shippingAddress;
    private Long branchId;
    private String branchName;
    private BigDecimal totalItemsAmount;
    private BigDecimal discountAmount;
    private BigDecimal finalAmount;
    private String notes;
    private String cancelReason;
    private LocalDateTime cancelledAt;
    private boolean canCancel;
    private String itemSummary;
    private List<OrderItemDto> items = new ArrayList<>();
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public OrderResponse() {
    }

    public static OrderResponse fromEntity(Order order) {
        OrderResponse response = new OrderResponse();
        response.setId(order.getId());
        response.setOrderCode(order.getOrderCode());
        response.setStatus(order.getStatus());
        response.setStatusLabel(mapStatusLabel(order.getStatus()));
        response.setPaymentMethod(order.getPaymentMethod());
        response.setPaymentStatus(order.getPaymentStatus());
        response.setPaymentStatusLabel(mapPaymentStatusLabel(order.getPaymentStatus()));
        response.setRecipientName(order.getRecipientName());
        response.setRecipientPhone(order.getRecipientPhone());
        response.setShippingAddress(order.getShippingAddress());
        if (order.getBranch() != null) {
            response.setBranchId(order.getBranch().getId());
            response.setBranchName(order.getBranch().getName());
        }
        response.setTotalItemsAmount(order.getTotalItemsAmount());
        response.setDiscountAmount(order.getDiscountAmount());
        response.setFinalAmount(order.getFinalAmount());
        response.setNotes(order.getNotes());
        response.setCancelReason(order.getCancelReason());
        response.setCancelledAt(order.getCancelledAt());
        response.setCanCancel(order.getStatus() == OrderStatus.PENDING || order.getStatus() == OrderStatus.CONFIRMED);
        response.setCreatedAt(order.getCreatedAt());
        response.setUpdatedAt(order.getUpdatedAt());

        if (order.getItems() != null && !order.getItems().isEmpty()) {
            response.setItems(order.getItems().stream().map(i -> new OrderItemDto(
                    i.getId(),
                    i.getProduct() != null ? i.getProduct().getId() : null,
                    i.getProductName(),
                    i.getProductSku(),
                    i.getProductImage(),
                    i.getUnitPrice(),
                    i.getQuantity(),
                    i.getSubtotalAmount()
            )).collect(Collectors.toList()));

            // Build item summary
            OrderItem first = order.getItems().get(0);
            int totalQty = order.getItems().stream().mapToInt(OrderItem::getQuantity).sum();
            if (order.getItems().size() == 1) {
                response.setItemSummary(first.getProductName() + " (x" + first.getQuantity() + ")");
            } else {
                response.setItemSummary(first.getProductName() + " (+" + (order.getItems().size() - 1) + " sản phẩm khác)");
            }
        }

        return response;
    }

    private static String mapStatusLabel(OrderStatus status) {
        if (status == null) return "Không xác định";
        switch (status) {
            case PENDING:
                return "Chờ xác nhận";
            case CONFIRMED:
                return "Đã xác nhận";
            case SHIPPING:
                return "Đang giao hàng";
            case COMPLETED:
                return "Đã hoàn thành";
            case CANCELLED:
                return "Đã hủy";
            default:
                return status.name();
        }
    }

    private static String mapPaymentStatusLabel(PaymentStatus status) {
        if (status == null) return "Không xác định";
        switch (status) {
            case UNPAID:
                return "Chưa thanh toán";
            case PAID:
                return "Đã thanh toán";
            case CANCELLED:
                return "Đã hủy thanh toán";
            case REFUNDED:
                return "Đã hoàn tiền";
            case FAILED:
                return "Thanh toán thất bại";
            default:
                return status.name();
        }
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getOrderCode() {
        return orderCode;
    }

    public void setOrderCode(String orderCode) {
        this.orderCode = orderCode;
    }

    public OrderStatus getStatus() {
        return status;
    }

    public void setStatus(OrderStatus status) {
        this.status = status;
    }

    public String getStatusLabel() {
        return statusLabel;
    }

    public void setStatusLabel(String statusLabel) {
        this.statusLabel = statusLabel;
    }

    public PaymentMethod getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(PaymentMethod paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public PaymentStatus getPaymentStatus() {
        return paymentStatus;
    }

    public void setPaymentStatus(PaymentStatus paymentStatus) {
        this.paymentStatus = paymentStatus;
    }

    public String getPaymentStatusLabel() {
        return paymentStatusLabel;
    }

    public void setPaymentStatusLabel(String paymentStatusLabel) {
        this.paymentStatusLabel = paymentStatusLabel;
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

    public Long getBranchId() {
        return branchId;
    }

    public void setBranchId(Long branchId) {
        this.branchId = branchId;
    }

    public String getBranchName() {
        return branchName;
    }

    public void setBranchName(String branchName) {
        this.branchName = branchName;
    }

    public BigDecimal totalItemsAmount() {
        return totalItemsAmount;
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

    public String getNotes() {
        return notes;
    }

    public void setNotes(String notes) {
        this.notes = notes;
    }

    public String getCancelReason() {
        return cancelReason;
    }

    public void setCancelReason(String cancelReason) {
        this.cancelReason = cancelReason;
    }

    public LocalDateTime getCancelledAt() {
        return cancelledAt;
    }

    public void setCancelledAt(LocalDateTime cancelledAt) {
        this.cancelledAt = cancelledAt;
    }

    public boolean isCanCancel() {
        return canCancel;
    }

    public void setCanCancel(boolean canCancel) {
        this.canCancel = canCancel;
    }

    public String getItemSummary() {
        return itemSummary;
    }

    public void setItemSummary(String itemSummary) {
        this.itemSummary = itemSummary;
    }

    public List<OrderItemDto> getItems() {
        return items;
    }

    public void setItems(List<OrderItemDto> items) {
        this.items = items;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
