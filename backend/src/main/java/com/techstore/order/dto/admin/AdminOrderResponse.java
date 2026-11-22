package com.techstore.order.dto.admin;

import com.fasterxml.jackson.annotation.JsonUnwrapped;
import com.techstore.order.dto.OrderResponse;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.Payment;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.user.entity.User;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * DTO quản trị đơn hàng (UC14, ADR-023): mọi trường của {@link OrderResponse} (trải phẳng)
 * cộng thông tin khách và thanh toán. Không thay đổi response của /api/orders/me.
 */
public class AdminOrderResponse {

    public record CustomerInfo(Long id, String fullName, String email, String phone) {
    }

    public record PaymentInfo(PaymentMethod method, PaymentStatus status, String transactionCode,
                              BigDecimal amount, LocalDateTime paidAt, LocalDateTime refundedAt) {
    }

    @JsonUnwrapped
    private final OrderResponse order;
    private final CustomerInfo customer;
    private final PaymentInfo payment;

    public AdminOrderResponse(OrderResponse order, CustomerInfo customer, PaymentInfo payment) {
        this.order = order;
        this.customer = customer;
        this.payment = payment;
    }

    public static AdminOrderResponse of(Order order, Payment payment) {
        User user = order.getUser();
        CustomerInfo customer = user == null ? null
                : new CustomerInfo(user.getId(), user.getFullName(), user.getEmail(), user.getPhone());
        PaymentInfo paymentInfo = payment == null ? null
                : new PaymentInfo(payment.getPaymentMethod(), payment.getStatus(), payment.getTransactionCode(),
                        payment.getAmount(), payment.getPaidAt(), payment.getRefundedAt());
        return new AdminOrderResponse(OrderResponse.fromEntity(order), customer, paymentInfo);
    }

    public OrderResponse getOrder() {
        return order;
    }

    public CustomerInfo getCustomer() {
        return customer;
    }

    public PaymentInfo getPayment() {
        return payment;
    }
}
