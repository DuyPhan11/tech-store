package com.techstore.order;

import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderItem;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.Payment;
import com.techstore.order.entity.PaymentMethod;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Branch;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.BranchRepository;
import com.techstore.product.repository.BrandRepository;
import com.techstore.product.repository.CategoryRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductRepository;
import com.techstore.user.entity.User;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Dữ liệu test UC14: sản phẩm + chi nhánh + tồn kho riêng và đơn có 1 dòng hàng + payment.
 * Tồn kho được tạo ở mức "sau khi đã trừ" để kiểm hoàn kho chính xác.
 */
@Component
public class OrderTestFixtures {

    public record Scenario(Product product, Branch branch) {
    }

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final BranchRepository branchRepository;
    private final InventoryRepository inventoryRepository;
    private final OrderRepository orderRepository;
    private final PaymentRepository paymentRepository;

    public OrderTestFixtures(ProductRepository productRepository, CategoryRepository categoryRepository,
                             BrandRepository brandRepository, BranchRepository branchRepository,
                             InventoryRepository inventoryRepository, OrderRepository orderRepository,
                             PaymentRepository paymentRepository) {
        this.productRepository = productRepository;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.branchRepository = branchRepository;
        this.inventoryRepository = inventoryRepository;
        this.orderRepository = orderRepository;
        this.paymentRepository = paymentRepository;
    }

    /** Sản phẩm 1.000.000đ và chi nhánh mới, tồn {@code stock}. */
    public Scenario scenario(int stock) {
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        Product product = productRepository.save(new Product(
                categoryRepository.findBySlug("laptop").orElseThrow(),
                brandRepository.findBySlug("nova").orElseThrow(),
                "Đơn Test " + suffix, "don-test-" + suffix, "ORD-" + suffix.toUpperCase(),
                new BigDecimal("1000000"), new BigDecimal("800000"), null, null, ActiveStatus.ACTIVE));
        Branch branch = branchRepository.save(new Branch("CN Đơn " + suffix, null, "1 Test, TP.HCM", ActiveStatus.ACTIVE));
        inventoryRepository.saveAndFlush(new Inventory(product, branch, stock, 5));
        return new Scenario(product, branch);
    }

    public Order order(Scenario sc, User user, OrderStatus status, PaymentMethod method, PaymentStatus paymentStatus,
                       int qty, String recipientName, String recipientPhone) {
        Order order = new Order();
        order.setOrderCode("ADM-" + UUID.randomUUID().toString().substring(0, 10).toUpperCase());
        order.setUser(user);
        order.setBranch(sc.branch());
        order.setRecipientName(recipientName);
        order.setRecipientPhone(recipientPhone);
        order.setShippingAddress("12 Test, Quận 1, TP.HCM");
        BigDecimal total = sc.product().getPrice().multiply(BigDecimal.valueOf(qty));
        order.setTotalItemsAmount(total);
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setFinalAmount(total);
        order.setStatus(status);
        order.setPaymentMethod(method);
        order.setPaymentStatus(paymentStatus);
        order.getItems().add(new OrderItem(order, sc.product(), sc.product().getName(), sc.product().getSku(),
                null, sc.product().getPrice(), qty, total));
        Order saved = orderRepository.saveAndFlush(order);
        paymentRepository.saveAndFlush(new Payment(saved, method,
                method.name() + "-" + saved.getOrderCode(), total, paymentStatus));
        return saved;
    }

    public Order order(Scenario sc, User user, OrderStatus status, PaymentMethod method, int qty) {
        PaymentStatus ps = method == PaymentMethod.ONLINE_MOCK ? PaymentStatus.PAID : PaymentStatus.UNPAID;
        return order(sc, user, status, method, ps, qty, "Người nhận Test", "0911222333");
    }

    public int stock(Scenario sc) {
        return inventoryRepository.findByProductIdAndBranchId(sc.product().getId(), sc.branch().getId())
                .orElseThrow().getQuantity();
    }
}
