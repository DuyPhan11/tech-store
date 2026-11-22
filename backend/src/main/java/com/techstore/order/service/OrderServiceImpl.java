package com.techstore.order.service;

import com.techstore.common.exception.OrderCannotBeCancelledException;
import com.techstore.common.exception.OrderNotFoundException;
import com.techstore.order.dto.OrderResponse;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.user.entity.User;
import com.techstore.user.repository.UserRepository;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class OrderServiceImpl implements OrderService {

    private final OrderRepository orderRepository;
    private final UserRepository userRepository;
    private final OrderCancellationService orderCancellationService;

    public OrderServiceImpl(OrderRepository orderRepository,
                            UserRepository userRepository,
                            OrderCancellationService orderCancellationService) {
        this.orderRepository = orderRepository;
        this.userRepository = userRepository;
        this.orderCancellationService = orderCancellationService;
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

        // BR32/BR48/BR19/BR21: hoàn kho đúng 1 lần, cập nhật thanh toán và đặt CANCELLED —
        // lõi dùng chung với quản trị (UC14, ADR-023), chạy trong transaction đã khóa đơn ở trên.
        String reason = cancelReason != null && !cancelReason.trim().isEmpty() ? cancelReason.trim() : "Khách hàng yêu cầu hủy đơn";
        Order saved = orderCancellationService.cancel(order, reason);
        return OrderResponse.fromEntity(saved);
    }
}
