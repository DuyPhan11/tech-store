package com.techstore.order.service;

import com.techstore.common.exception.OrderCannotBeCancelledException;
import com.techstore.common.exception.OrderNotFoundException;
import com.techstore.order.dto.OrderResponse;
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
import com.techstore.user.entity.User;
import com.techstore.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final InventoryRepository inventoryRepository;
    private final UserRepository userRepository;

    public OrderServiceImpl(OrderRepository orderRepository,
                            PaymentRepository paymentRepository,
                            InventoryRepository inventoryRepository,
                            UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.inventoryRepository = inventoryRepository;
        this.userRepository = userRepository;
    }

    private User getUserByEmail(String email) {
        return userRepository.findByEmail(email)
                .orElseThrow(() -> new UsernameNotFoundException("Không tìm thấy người dùng với email: " + email));
    }

    @Override
    @Transactional(readOnly = true)
    public List<OrderResponse> getMyOrders(String email) {
        User user = getUserByEmail(email);
        List<Order> orders = orderRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
        return orders.stream()
                .map(OrderResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getMyOrderDetail(String email, Long orderId) {
        User user = getUserByEmail(email);
        Order order = orderRepository.findByIdAndUserId(orderId, user.getId())
                .orElseThrow(() -> new OrderNotFoundException("Đơn hàng không tồn tại hoặc bạn không có quyền truy cập."));
        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional(readOnly = true)
    public OrderResponse getMyOrderDetailByCode(String email, String orderCode) {
        User user = getUserByEmail(email);
        Order order = orderRepository.findByOrderCodeAndUserId(orderCode, user.getId())
                .orElseThrow(() -> new OrderNotFoundException("Đơn hàng không tồn tại hoặc bạn không có quyền truy cập."));
        return OrderResponse.fromEntity(order);
    }

    @Override
    @Transactional
    public OrderResponse cancelOrder(String email, Long orderId, String cancelReason) {
        User user = getUserByEmail(email);

        // Khóa bi quan dòng đơn hàng để chống race condition / concurrent cancellation (BR48)
        Order order = orderRepository.findByIdAndUserIdForUpdate(orderId, user.getId())
                .orElseThrow(() -> new OrderNotFoundException("Đơn hàng không tồn tại hoặc bạn không có quyền thao tác."));

        // BR18: Chỉ PENDING / CONFIRMED được hủy
        if (order.getStatus() != OrderStatus.PENDING && order.getStatus() != OrderStatus.CONFIRMED) {
            throw new OrderCannotBeCancelledException(
                    "Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận hoặc Đã xác nhận. Trạng thái hiện tại: " + order.getStatus()
            );
        }

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

        // Cập nhật trạng thái đơn hàng thành CANCELLED
        order.setStatus(OrderStatus.CANCELLED);
        order.setCancelReason(cancelReason != null && !cancelReason.trim().isEmpty() ? cancelReason.trim() : "Khách hàng yêu cầu hủy đơn");
        order.setCancelledAt(LocalDateTime.now());

        Order saved = orderRepository.save(order);
        return OrderResponse.fromEntity(saved);
    }
}
