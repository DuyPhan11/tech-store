package com.techstore.order.service;

import com.techstore.common.audit.AuditLogService;
import com.techstore.common.exception.OrderNotFoundException;
import com.techstore.common.exception.OrderStatusConflictException;
import com.techstore.order.dto.admin.AdminOrderPageResponse;
import com.techstore.order.dto.admin.AdminOrderResponse;
import com.techstore.order.dto.admin.OrderStatusUpdateRequest;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.Payment;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.EnumMap;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * UC14 — Quản trị đơn hàng (ADR-023). Khóa dòng đơn trước khi kiểm tra luồng; hủy dùng chung
 * {@link OrderCancellationService} với luồng khách (UC08); mỗi lần đổi trạng thái thành công ghi 1 audit.
 */
@Service
public class AdminOrderServiceImpl implements AdminOrderService {

    private static final int MAX_PAGE_SIZE = 100;
    private static final int MAX_REASON_LENGTH = 500;

    /** Luồng hợp lệ (ADR-023 mục 2). */
    private static final Map<OrderStatus, Set<OrderStatus>> TRANSITIONS = new EnumMap<>(Map.of(
            OrderStatus.PENDING, Set.of(OrderStatus.CONFIRMED, OrderStatus.CANCELLED),
            OrderStatus.CONFIRMED, Set.of(OrderStatus.SHIPPING, OrderStatus.CANCELLED),
            OrderStatus.SHIPPING, Set.of(OrderStatus.COMPLETED),
            OrderStatus.COMPLETED, Set.of(),
            OrderStatus.CANCELLED, Set.of()
    ));

    private static final Map<OrderStatus, String> LABELS = Map.of(
            OrderStatus.PENDING, "Chờ xác nhận",
            OrderStatus.CONFIRMED, "Đã xác nhận",
            OrderStatus.SHIPPING, "Đang giao hàng",
            OrderStatus.COMPLETED, "Đã hoàn thành",
            OrderStatus.CANCELLED, "Đã hủy"
    );

    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;
    private final OrderCancellationService orderCancellationService;
    private final AuditLogService auditLogService;

    public AdminOrderServiceImpl(OrderRepository orderRepository,
                                 PaymentRepository paymentRepository,
                                 OrderCancellationService orderCancellationService,
                                 AuditLogService auditLogService) {
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
        this.orderCancellationService = orderCancellationService;
        this.auditLogService = auditLogService;
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderPageResponse list(String status, String keyword, int page, int size) {
        if (page < 0) {
            throw new IllegalArgumentException("Số trang phải từ 0 trở lên");
        }
        if (size < 1 || size > MAX_PAGE_SIZE) {
            throw new IllegalArgumentException("Kích thước trang phải từ 1 đến " + MAX_PAGE_SIZE);
        }
        OrderStatus statusFilter = parseStatus(status, true);
        String pattern = keyword == null || keyword.isBlank() ? null : "%" + keyword.trim().toLowerCase(Locale.ROOT) + "%";

        Page<Order> result = orderRepository.searchForAdmin(statusFilter, pattern,
                PageRequest.of(page, size, Sort.by(Sort.Order.desc("createdAt"), Sort.Order.desc("id"))));

        Map<String, Long> counts = new LinkedHashMap<>();
        counts.put("ALL", 0L);
        for (OrderStatus s : OrderStatus.values()) {
            counts.put(s.name(), 0L);
        }
        long all = 0;
        for (Object[] row : orderRepository.countByStatusForAdmin(pattern)) {
            long n = ((Number) row[1]).longValue();
            counts.put(((OrderStatus) row[0]).name(), n);
            all += n;
        }
        counts.put("ALL", all);

        return new AdminOrderPageResponse(
                result.getContent().stream().map(this::toResponse).toList(),
                result.getNumber(), result.getSize(), result.getTotalElements(), result.getTotalPages(), counts);
    }

    @Override
    @Transactional(readOnly = true)
    public AdminOrderResponse get(Long id) {
        return toResponse(orderRepository.findById(id).orElseThrow(() -> notFound(id)));
    }

    @Override
    @Transactional
    public AdminOrderResponse updateStatus(Long actorUserId, Long id, OrderStatusUpdateRequest request) {
        OrderStatus target = parseStatus(request.status(), false);
        String reason = request.reason() == null || request.reason().isBlank() ? null : request.reason().trim();
        if (reason != null && reason.length() > MAX_REASON_LENGTH) {
            throw new IllegalArgumentException("Lý do tối đa " + MAX_REASON_LENGTH + " ký tự");
        }

        // Khóa dòng đơn trước khi kiểm tra (chặn hai thao tác đồng thời, kể cả khách hủy cùng lúc)
        Order order = orderRepository.findByIdForUpdate(id).orElseThrow(() -> notFound(id));
        OrderStatus from = order.getStatus();
        if (!TRANSITIONS.getOrDefault(from, Set.of()).contains(target)) {
            throw new OrderStatusConflictException("Không thể chuyển đơn " + order.getOrderCode() + " từ \""
                    + LABELS.get(from) + "\" sang \"" + LABELS.get(target) + "\"");
        }
        if (target == OrderStatus.CANCELLED && reason == null) {
            throw new IllegalArgumentException("Vui lòng nhập lý do hủy đơn");
        }

        PaymentStatus paymentBefore = order.getPaymentStatus();
        Order saved;
        if (target == OrderStatus.CANCELLED) {
            saved = orderCancellationService.cancel(order, reason);
        } else {
            if (target == OrderStatus.COMPLETED && order.getPaymentMethod() == PaymentMethod.COD) {
                markCodPaid(order);
            }
            order.setStatus(target);
            saved = orderRepository.save(order);
        }

        Map<String, Object> details = new LinkedHashMap<>();
        details.put("orderCode", saved.getOrderCode());
        details.put("from", from.name());
        details.put("to", target.name());
        details.put("reason", reason);
        details.put("paymentStatusBefore", paymentBefore != null ? paymentBefore.name() : null);
        details.put("paymentStatusAfter", saved.getPaymentStatus() != null ? saved.getPaymentStatus().name() : null);
        auditLogService.record(actorUserId, "ORDER_" + target.name(), "orders", saved.getId(), details);

        return toResponse(saved);
    }

    /** COMPLETED + COD: payment UNPAID → PAID, paidAt; orders.payment_status = PAID (ADR-023 mục 3). */
    private void markCodPaid(Order order) {
        paymentRepository.findByOrderId(order.getId()).ifPresent(payment -> {
            if (payment.getStatus() == PaymentStatus.UNPAID) {
                payment.setStatus(PaymentStatus.PAID);
                payment.setPaidAt(LocalDateTime.now());
                paymentRepository.save(payment);
            }
        });
        order.setPaymentStatus(PaymentStatus.PAID);
    }

    private OrderStatus parseStatus(String status, boolean optional) {
        if (status == null || status.isBlank()) {
            if (optional) {
                return null;
            }
            throw new IllegalArgumentException("Vui lòng chọn trạng thái mới");
        }
        try {
            return OrderStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Trạng thái đơn hàng không hợp lệ: " + status);
        }
    }

    private AdminOrderResponse toResponse(Order order) {
        Payment payment = paymentRepository.findByOrderId(order.getId()).orElse(null);
        return AdminOrderResponse.of(order, payment);
    }

    private static OrderNotFoundException notFound(Long id) {
        return new OrderNotFoundException("Không tìm thấy đơn hàng với ID: " + id);
    }
}
