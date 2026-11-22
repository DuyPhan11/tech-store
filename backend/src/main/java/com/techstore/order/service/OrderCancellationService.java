package com.techstore.order.service;

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
 * Hoàn coupon sẽ được bổ sung tại đây bởi issue coupon-checkout.
 */
@Service
public class OrderCancellationService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryRepository inventoryRepository;

    public OrderCancellationService(OrderRepository orderRepository,
                                    PaymentRepository paymentRepository,
                                    InventoryRepository inventoryRepository) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.inventoryRepository = inventoryRepository;
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

        // TODO(coupon-checkout): đảo CouponUsage ACTIVE → REVERSED và giảm used_count đúng 1 lần tại đây.

        // Cập nhật trạng thái đơn hàng thành CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(reason);
        order.setCancelledAt(LocalDateTime.now());

        return orderRepository.save(order);
    }
}
