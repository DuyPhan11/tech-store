package com.techstore.checkout.service;

import com.techstore.cart.entity.Cart;
import com.techstore.cart.entity.CartItem;
import com.techstore.cart.repository.CartItemRepository;
import com.techstore.cart.repository.CartRepository;
import com.techstore.checkout.dto.CheckoutRequest;
import com.techstore.checkout.dto.CheckoutResponse;
import com.techstore.checkout.dto.OrderItemResponse;
import com.techstore.common.exception.AccountLockedException;
import com.techstore.common.exception.CartItemNotFoundException;
import com.techstore.common.exception.InsufficientStockException;
import com.techstore.common.exception.InvalidCouponException;
import com.techstore.common.exception.MockPaymentFailedException;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponUsage;
import com.techstore.coupon.entity.CouponUsageStatus;
import com.techstore.coupon.repository.CouponRepository;
import com.techstore.coupon.repository.CouponUsageRepository;
import com.techstore.coupon.service.CouponService;
import com.techstore.common.exception.ProductNotFoundException;
import com.techstore.order.entity.*;
import com.techstore.order.repository.OrderItemRepository;
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
import com.techstore.product.entity.*;
import com.techstore.product.repository.BranchRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductImageRepository;
import com.techstore.product.repository.ProductRepository;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Service
public class CheckoutServiceImpl implements CheckoutService {

    private static final Logger log = LoggerFactory.getLogger(CheckoutServiceImpl.class);

    private final UserRepository userRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;
    private final CartRepository cartRepository;
    private final CartItemRepository cartItemRepository;
    private final OrderRepository orderRepository;
    private final OrderItemRepository orderItemRepository;
    private final PaymentRepository paymentRepository;
    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CouponService couponService;

    // Idempotency cache to prevent duplicate order placement on retry
    private final Map<String, CheckoutResponse> idempotencyCache = new ConcurrentHashMap<>();

    public CheckoutServiceImpl(UserRepository userRepository,
                               BranchRepository branchRepository,
                               ProductRepository productRepository,
                               ProductImageRepository productImageRepository,
                               InventoryRepository inventoryRepository,
                               CartRepository cartRepository,
                               CartItemRepository cartItemRepository,
                               OrderRepository orderRepository,
                               OrderItemRepository orderItemRepository,
                               PaymentRepository paymentRepository,
                               CouponRepository couponRepository,
                               CouponUsageRepository couponUsageRepository,
                               CouponService couponService) {
        this.userRepository = userRepository;
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.inventoryRepository = inventoryRepository;
        this.cartRepository = cartRepository;
        this.cartItemRepository = cartItemRepository;
        this.orderRepository = orderRepository;
        this.orderItemRepository = orderItemRepository;
        this.paymentRepository = paymentRepository;
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.couponService = couponService;
    }

    @Override
    @Transactional(rollbackFor = Exception.class)
    public CheckoutResponse checkout(Long userId, CheckoutRequest request) {
        // 1. Kiểm tra Idempotency Key (chống retry trùng đơn hàng)
        String idempotencyKey = request.getIdempotencyKey();
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            String cacheKey = userId + ":" + idempotencyKey.trim();
            CheckoutResponse cached = idempotencyCache.get(cacheKey);
            if (cached != null) {
                log.info("Idempotent checkout hit: user={}, key={}, returning orderCode={}", userId, idempotencyKey, cached.getOrderCode());
                return cached;
            }
        }

        // 2. Xác thực người dùng và trạng thái tài khoản
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        if (user.getStatus() == UserStatus.LOCKED) {
            throw new AccountLockedException("Tài khoản của bạn đã bị khóa. Vui lòng liên hệ bộ phận hỗ trợ.");
        }

        // 3. Phương thức thanh toán (UC07: hỗ trợ COD và ONLINE_MOCK)
        PaymentMethod paymentMethod = parsePaymentMethod(request.getPaymentMethod());

        // 4. Kiểm tra Chi nhánh (phải tồn tại và ACTIVE)
        if (request.getBranchId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn chi nhánh xử lý đơn hàng");
        }
        Branch branch = branchRepository.findById(request.getBranchId())
                .orElseThrow(() -> new IllegalArgumentException("Chi nhánh không tồn tại"));

        if (branch.getStatus() != ActiveStatus.ACTIVE) {
            throw new IllegalArgumentException("Chi nhánh '" + branch.getName() + "' hiện đang tạm ngưng hoạt động");
        }

        // 5. Thu thập danh sách sản phẩm và số lượng cần đặt (từ CART hoặc BUY_NOW)
        List<ItemToOrder> itemsToOrder = new ArrayList<>();
        List<CartItem> cartItemsToRemove = new ArrayList<>();

        String source = request.getSource();
        if ("CART".equalsIgnoreCase(source)) {
            List<Long> selectedIds = request.getSelectedCartItemIds();
            if (selectedIds == null || selectedIds.isEmpty()) {
                throw new IllegalArgumentException("Vui lòng chọn ít nhất một sản phẩm từ giỏ hàng để đặt hàng");
            }

            Cart cart = cartRepository.findByUserId(userId)
                    .orElseThrow(() -> new IllegalArgumentException("Giỏ hàng của bạn đang trống"));

            List<CartItem> allCartItems = cartItemRepository.findByCartIdOrderByIdAsc(cart.getId());
            Set<Long> selectedSet = new HashSet<>(selectedIds);

            for (CartItem ci : allCartItems) {
                if (selectedSet.contains(ci.getId())) {
                    Product product = ci.getProduct();
                    if (product == null || product.getStatus() != ActiveStatus.ACTIVE) {
                        throw new IllegalArgumentException("Sản phẩm trong giỏ hàng không tồn tại hoặc đã ngừng kinh doanh");
                    }
                    itemsToOrder.add(new ItemToOrder(product, ci.getQuantity()));
                    cartItemsToRemove.add(ci);
                    selectedSet.remove(ci.getId());
                }
            }

            // Nếu còn ID nào trong selectedIds không thuộc cart của user này
            if (!selectedSet.isEmpty()) {
                throw new CartItemNotFoundException("Một số mục giỏ hàng không tồn tại hoặc không thuộc quyền sở hữu của bạn");
            }

        } else if ("BUY_NOW".equalsIgnoreCase(source)) {
            Long productId = request.getProductId();
            Integer quantity = request.getQuantity();

            if (productId == null) {
                throw new IllegalArgumentException("Sản phẩm mua ngay không hợp lệ (thiếu productId)");
            }
            if (quantity == null || quantity < 1) {
                throw new IllegalArgumentException("Số lượng mua phải lớn hơn hoặc bằng 1");
            }

            Product product = productRepository.findById(productId)
                    .orElseThrow(() -> new ProductNotFoundException("Sản phẩm không tồn tại hoặc đã ngừng kinh doanh"));

            if (product.getStatus() != ActiveStatus.ACTIVE) {
                throw new IllegalArgumentException("Sản phẩm '" + product.getName() + "' hiện đã ngừng kinh doanh");
            }

            itemsToOrder.add(new ItemToOrder(product, quantity));
        } else {
            throw new IllegalArgumentException("Nguồn đặt hàng không hợp lệ (chỉ chấp nhận 'CART' hoặc 'BUY_NOW')");
        }

        if (itemsToOrder.isEmpty()) {
            throw new IllegalArgumentException("Không có sản phẩm nào được chọn để đặt hàng");
        }

        // 6. Sắp xếp các sản phẩm theo ID để tránh Deadlock khi khóa dòng tồn kho đồng thời
        itemsToOrder.sort(Comparator.comparing(item -> item.product.getId()));

        // 7. Khóa và kiểm tra trừ tồn kho nguyên tử (Atomic Inventory with Pessimistic Lock)
        for (ItemToOrder item : itemsToOrder) {
            Product prod = item.product;
            int reqQty = item.quantity;

            Inventory inv = inventoryRepository.findByProductIdAndBranchIdForUpdate(prod.getId(), branch.getId())
                    .orElse(null);

            int currentStock = inv != null ? inv.getQuantity() : 0;
            if (inv == null || currentStock < reqQty) {
                throw new InsufficientStockException(
                        "Sản phẩm '" + prod.getName() + "' tại chi nhánh '" + branch.getName() +
                                "' không đủ số lượng tồn kho (còn " + currentStock + ", yêu cầu " + reqQty + ")"
                );
            }

            // Trừ tồn kho nguyên tử
            inv.setQuantity(currentStock - reqQty);
            inventoryRepository.save(inv);
        }

        // 8. Tính tiền từ giá server (KHÔNG tin client)
        BigDecimal totalItemsAmount = BigDecimal.ZERO;
        List<OrderItemData> orderItemDataList = new ArrayList<>();

        for (ItemToOrder item : itemsToOrder) {
            Product prod = item.product;
            BigDecimal unitPrice = prod.getPrice();
            BigDecimal subtotal = unitPrice.multiply(BigDecimal.valueOf(item.quantity));
            totalItemsAmount = totalItemsAmount.add(subtotal);

            // Tìm ảnh chính của sản phẩm
            List<ProductImage> images = productImageRepository.findByProductIdOrderByDisplayOrderAsc(prod.getId());
            String imageUrl = images.stream()
                    .filter(ProductImage::isPrimary)
                    .findFirst()
                    .map(ProductImage::getImageUrl)
                    .orElse(images.isEmpty() ? null : images.get(0).getImageUrl());

            orderItemDataList.add(new OrderItemData(prod, prod.getName(), prod.getSku(), imageUrl, unitPrice, item.quantity, subtotal));
        }

        // 8b. Coupon (ADR-024): khóa coupon SAU inventory (thứ tự khóa: order → inventory → coupon),
        // kiểm tra như preview (khóa đọc usage) và tính giảm bằng CouponService — không viết lại công thức.
        BigDecimal discountAmount = BigDecimal.ZERO;
        Coupon appliedCoupon = null;
        String couponCode = request.getCouponCode() != null ? request.getCouponCode().trim().toUpperCase(Locale.ROOT) : "";
        if (!couponCode.isEmpty()) {
            final String code = couponCode;
            appliedCoupon = couponRepository.findByCodeForUpdate(code)
                    .orElseThrow(() -> new InvalidCouponException(InvalidCouponException.Reason.NOT_FOUND,
                            "Mã giảm giá " + code + " không tồn tại"));
            couponService.validateForCheckout(appliedCoupon, userId, totalItemsAmount, LocalDateTime.now());
            discountAmount = couponService.calculateDiscount(appliedCoupon, totalItemsAmount);
        }
        BigDecimal finalAmount = totalItemsAmount.subtract(discountAmount);

        // 8c. Giả lập thanh toán ONLINE_MOCK (ADR-025): thực hiện sau khi kiểm tra tồn kho và coupon.
        // Nếu thất bại → ném ngoại lệ để rollback toàn bộ transaction (không tạo đơn/payment/coupon usage, không trừ kho, không xóa giỏ).
        boolean isOnlineMock = paymentMethod == PaymentMethod.ONLINE_MOCK;
        if (isOnlineMock && Boolean.FALSE.equals(request.getMockPaymentSuccess())) {
            throw new MockPaymentFailedException(
                    "Thanh toán trực tuyến (giả lập) thất bại. Đơn hàng chưa được tạo, vui lòng thử lại hoặc chọn phương thức khác."
            );
        }

        LocalDateTime now = LocalDateTime.now();
        PaymentStatus initialPaymentStatus = isOnlineMock ? PaymentStatus.PAID : PaymentStatus.UNPAID;

        // 9. Tạo Order (trạng thái PENDING)
        String orderCode = generateOrderCode();
        Order order = new Order();
        order.setOrderCode(orderCode);
        order.setUser(user);
        order.setBranch(branch);
        order.setRecipientName(request.getRecipientName().trim());
        order.setRecipientPhone(request.getRecipientPhone().trim());
        order.setShippingAddress(request.getShippingAddress().trim());
        order.setTotalItemsAmount(totalItemsAmount);
        order.setDiscountAmount(discountAmount);
        order.setFinalAmount(finalAmount);
        order.setStatus(OrderStatus.PENDING);
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus(initialPaymentStatus);
        order.setNotes(request.getNotes() != null ? request.getNotes().trim() : null);
        if (appliedCoupon != null) {
            order.setCouponId(appliedCoupon.getId());
        }

        Order savedOrder = orderRepository.save(order);

        // 9b. Ghi lượt dùng coupon ACTIVE và tăng used_count đúng 1 (ADR-024), cùng transaction với đơn
        if (appliedCoupon != null) {
            couponUsageRepository.save(new CouponUsage(appliedCoupon.getId(), userId, savedOrder.getId(), CouponUsageStatus.ACTIVE));
            appliedCoupon.setUsedCount(appliedCoupon.getUsedCount() + 1);
            couponRepository.save(appliedCoupon);
        }

        // 10. Tạo các OrderItem
        List<OrderItemResponse> responseItems = new ArrayList<>();
        for (OrderItemData data : orderItemDataList) {
            OrderItem orderItem = new OrderItem(
                    savedOrder,
                    data.product,
                    data.productName,
                    data.productSku,
                    data.productImage,
                    data.unitPrice,
                    data.quantity,
                    data.subtotalAmount
            );
            orderItemRepository.save(orderItem);

            responseItems.add(new OrderItemResponse(
                    data.product.getId(),
                    data.productName,
                    data.productSku,
                    data.productImage,
                    data.unitPrice,
                    data.quantity,
                    data.subtotalAmount
            ));
        }

        // 11. Tạo Payment (COD → UNPAID; ONLINE_MOCK thành công → PAID + paidAt)
        Payment payment = new Payment();
        payment.setOrder(savedOrder);
        payment.setPaymentMethod(paymentMethod);
        payment.setAmount(finalAmount);
        payment.setStatus(initialPaymentStatus);
        payment.setTransactionCode((isOnlineMock ? "MOCK-" : "COD-") + orderCode);
        if (isOnlineMock) {
            payment.setPaidAt(now);
        }
        paymentRepository.save(payment);

        // 12. Dọn dẹp giỏ hàng nếu nguồn là CART
        if ("CART".equalsIgnoreCase(source) && !cartItemsToRemove.isEmpty()) {
            cartItemRepository.deleteAll(cartItemsToRemove);
        }

        // 13. Xây dựng response
        CheckoutResponse response = new CheckoutResponse(
                savedOrder.getId(),
                savedOrder.getOrderCode(),
                savedOrder.getStatus().name(),
                savedOrder.getPaymentMethod().name(),
                savedOrder.getPaymentStatus().name(),
                savedOrder.getRecipientName(),
                savedOrder.getRecipientPhone(),
                savedOrder.getShippingAddress(),
                savedOrder.getTotalItemsAmount(),
                savedOrder.getDiscountAmount(),
                savedOrder.getFinalAmount(),
                responseItems
        );

        // Lưu Idempotency cache nếu có key
        if (idempotencyKey != null && !idempotencyKey.isBlank()) {
            idempotencyCache.put(userId + ":" + idempotencyKey.trim(), response);
        }

        log.info("Đặt hàng {} thành công: orderId={}, orderCode={}, paymentStatus={}, finalAmount={}, userId={}",
                paymentMethod, savedOrder.getId(), savedOrder.getOrderCode(), savedOrder.getPaymentStatus(), savedOrder.getFinalAmount(), userId);

        return response;
    }

    private PaymentMethod parsePaymentMethod(String methodStr) {
        if (methodStr == null || methodStr.isBlank()) {
            throw new IllegalArgumentException("Phương thức thanh toán không được để trống");
        }
        String normalized = methodStr.trim().toUpperCase(Locale.ROOT);
        if ("COD".equals(normalized)) {
            return PaymentMethod.COD;
        }
        if ("ONLINE_MOCK".equals(normalized)) {
            return PaymentMethod.ONLINE_MOCK;
        }
        throw new IllegalArgumentException("Phương thức thanh toán không hợp lệ (chỉ chấp nhận 'COD' hoặc 'ONLINE_MOCK')");
    }

    private String generateOrderCode() {
        String datePart = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
        String randPart = UUID.randomUUID().toString().replace("-", "").substring(0, 6).toUpperCase();
        return "ORD-" + datePart + "-" + randPart;
    }

    private static class ItemToOrder {
        final Product product;
        final int quantity;

        ItemToOrder(Product product, int quantity) {
            this.product = product;
            this.quantity = quantity;
        }
    }

    private static class OrderItemData {
        final Product product;
        final String productName;
        final String productSku;
        final String productImage;
        final BigDecimal unitPrice;
        final int quantity;
        final BigDecimal subtotalAmount;

        OrderItemData(Product product, String productName, String productSku, String productImage,
                      BigDecimal unitPrice, int quantity, BigDecimal subtotalAmount) {
            this.product = product;
            this.productName = productName;
            this.productSku = productSku;
            this.productImage = productImage;
            this.unitPrice = unitPrice;
            this.quantity = quantity;
            this.subtotalAmount = subtotalAmount;
        }
    }
}
