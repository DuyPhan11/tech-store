package com.techstore.order.service;

import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.repository.CouponRepository;
import com.techstore.coupon.repository.CouponUsageRepository;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderItem;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.Payment;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
import com.techstore.product.entity.Inventory;
import com.techstore.product.repository.InventoryRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;

/**
 * Lõi hủy đơn dùng chung cho khách (UC08) và quản trị (UC14) — ADR-023 mục 4.
 * <p>
 * Bên gọi PHẢI đã khóa dòng đơn (PESSIMISTIC_WRITE) và kiểm tra quyền/trạng thái trong cùng transaction
 * (propagation MANDATORY). Nội dung chuyển nguyên văn từ {@code OrderServiceImpl.cancelOrder} (UC08, PR #26).
 * Hoàn coupon (ADR-024) nằm sau bước hoàn kho, giữ thứ tự khóa order → inventory → coupon.
 */
@Service
public class OrderCancellationService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryRepository inventoryRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;

    public OrderCancellationService(OrderRepository orderRepository,
                                    PaymentRepository paymentRepository,
                                    InventoryRepository inventoryRepository,
                                    CouponRepository couponRepository,
                                    CouponUsageRepository couponUsageRepository) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.inventoryRepository = inventoryRepository;
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
    }

    /**
     * Hoàn kho, cập nhật thanh toán và đặt đơn sang CANCELLED.
     *
     * @param order  đơn đã được khóa và đã kiểm tra là PENDING/CONFIRMED
     * @param reason lý do hủy đã chuẩn hóa (không rỗng)
     * @return đơn sau khi lưu
     */
    @Transactional(propagation = Propagation.MANDATORY)
    public Order cancel(Order order, String reason) {
        // BR32 & BR48: Hoàn kho nguyên tử đúng 1 lần về chi nhánh gốc
        // Sắp xếp theo productId tăng dần để chống deadlock giữa các transaction khóa inventory
        List<OrderItem> items = new ArrayList<>(order.getItems());
        items.sort(Comparator.comparing(i -> i.getProduct() != null ? i.getProduct().getId() : 0L));

        for (OrderItem item : items) {
            if (item.getProduct() != null && order.getBranch() != null) {
                Inventory inventory = inventoryRepository.findByProductIdAndBranchIdForUpdate(
                        item.getProduct().getId(),
                        order.getBranch().getId()
                ).orElse(null);

                if (inventory != null) {
                    inventory.setQuantity(inventory.getQuantity() + item.getQuantity());
                    inventoryRepository.save(inventory);
                }
            }
        }

        // BR19 & BR21: Xử lý trạng thái thanh toán tương ứng
        Optional<Payment> paymentOpt = paymentRepository.findByOrderId(order.getId());
        if (paymentOpt.isPresent()) {
            Payment payment = paymentOpt.get();
            if (order.getPaymentMethod() == PaymentMethod.COD) {
                payment.setStatus(PaymentStatus.CANCELLED);
                order.setPaymentStatus(PaymentStatus.CANCELLED);
            } else if (order.getPaymentMethod() == PaymentMethod.ONLINE_MOCK) {
                payment.setStatus(PaymentStatus.REFUNDED);
                payment.setRefundedAt(LocalDateTime.now());
                order.setPaymentStatus(PaymentStatus.REFUNDED);
            }
            paymentRepository.save(payment);
        } else {
            if (order.getPaymentMethod() == PaymentMethod.COD) {
                order.setPaymentStatus(PaymentStatus.CANCELLED);
            }
        }

        // ADR-024: hoàn coupon đúng 1 lần — khóa coupon (sau inventory), usage ACTIVE của đơn → REVERSED,
        // used_count − 1 (không âm). Không còn usage ACTIVE (đã hoàn trước đó) → bỏ qua.
        if (order.getCouponId() != null) {
            reverseCouponUsage(order);
        }

        // Cập nhật trạng thái đơn hàng thành CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(reason);
        order.setCancelledAt(LocalDateTime.now());

        return orderRepository.save(order);
    }

    private void reverseCouponUsage(Order order) {
        Coupon coupon = couponRepository.findByIdForUpdate(order.getCouponId()).orElse(null);
        if (coupon == null) {
            return;
        }
        couponUsageRepository.findByOrderIdAndStatusForUpdate(order.getId(), CouponUsageStatus.ACTIVE)
                .ifPresent(usage -> {
                    usage.markReversed(LocalDateTime.now());
                    couponUsageRepository.save(usage);
                    coupon.setUsedCount(Math.max(0, coupon.getUsedCount() - 1));
                    couponRepository.save(coupon);
                });
    }
}
