package com.techstore.order;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.order.dto.CancelOrderRequest;
import com.techstore.order.entity.*;
import com.techstore.order.repository.OrderItemRepository;
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
import com.techstore.product.entity.Branch;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.BranchRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductRepository;
import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.RoleRepository;
import com.techstore.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class OrderControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    private String customerToken;
    private String customer2Token;
    private String staffToken;
    private User customer1;
    private User customer2;
    private Product testProduct;
    private Branch testBranch;

    @BeforeEach
    void setUp() throws Exception {
        customerToken = obtainAccessToken("customer@techstore.vn", "Customer@123");
        staffToken = obtainAccessToken("staff@techstore.vn", "Staff@123");

        customer1 = userRepository.findByEmail("customer@techstore.vn").orElseThrow();

        // Tạo customer2 độc lập để test bảo mật ownership
        customer2 = userRepository.findByEmail("customer2_orders@techstore.vn").orElseGet(() -> {
            Role customerRole = roleRepository.findByName("ROLE_CUSTOMER").orElseThrow();
            User u = new User();
            u.setEmail("customer2_orders@techstore.vn");
            u.setPassword(passwordEncoder.encode("Password@123"));
            u.setFullName("Customer Hai");
            u.setPhone("0987654322");
            u.setStatus(UserStatus.ACTIVE);
            u.setRoles(Set.of(customerRole));
            return userRepository.save(u);
        });
        customer2Token = obtainAccessToken("customer2_orders@techstore.vn", "Password@123");

        testProduct = productRepository.findById(1L).orElseThrow();
        testBranch = branchRepository.findById(1L).orElseThrow();

        // Đảm bảo tồn kho chi nhánh Q1 ban đầu là 5
        Inventory inv = inventoryRepository.findByProductIdAndBranchId(testProduct.getId(), testBranch.getId()).orElse(null);
        if (inv != null) {
            inv.setQuantity(5);
            inventoryRepository.save(inv);
        }
    }

    @AfterEach
    void tearDown() {
        // Đặt lại tồn kho branch 1 về 5 để tránh ảnh hưởng ProductControllerTest
        Inventory inv = inventoryRepository.findByProductIdAndBranchId(1L, 1L).orElse(null);
        if (inv != null) {
            inv.setQuantity(5);
            inventoryRepository.save(inv);
        }
    }

    private String obtainAccessToken(String email, String password) throws Exception {
        LoginRequest req = new LoginRequest(email, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse resp = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        return resp.getAccessToken();
    }

    private Order createTestOrder(User user, OrderStatus status, PaymentMethod method, PaymentStatus paymentStatus, int qty) {
        Order order = new Order();
        order.setOrderCode("TEST-ORD-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase());
        order.setUser(user);
        order.setBranch(testBranch);
        order.setRecipientName(user.getFullName());
        order.setRecipientPhone(user.getPhone() != null ? user.getPhone() : "0901234567");
        order.setShippingAddress("123 Test Street, HCM");
        BigDecimal unitPrice = testProduct.getPrice() != null ? testProduct.getPrice() : BigDecimal.valueOf(18990000);
        order.setTotalItemsAmount(unitPrice.multiply(BigDecimal.valueOf(qty)));
        order.setDiscountAmount(BigDecimal.ZERO);
        order.setFinalAmount(order.getTotalItemsAmount());
        order.setStatus(status);
        order.setPaymentMethod(method);
        order.setPaymentStatus(paymentStatus);

        OrderItem item = new OrderItem(
                order,
                testProduct,
                testProduct.getName(),
                testProduct.getSku(),
                "https://images.unsplash.com/test.jpg",
                unitPrice,
                qty,
                order.getTotalItemsAmount()
        );
        order.getItems().add(item);

        Order saved = orderRepository.save(order);

        Payment payment = new Payment(
                saved,
                method,
                "TRANS-" + UUID.randomUUID().toString().substring(0, 8),
                saved.getFinalAmount(),
                paymentStatus
        );
        paymentRepository.save(payment);

        // Trừ tồn kho tương ứng khi tạo đơn
        Inventory inv = inventoryRepository.findByProductIdAndBranchId(testProduct.getId(), testBranch.getId()).orElse(null);
        if (inv != null) {
            inv.setQuantity(Math.max(0, inv.getQuantity() - qty));
            inventoryRepository.save(inv);
        }

        return saved;
    }

    @Test
    @DisplayName("GET /api/orders/me: Thành công, trả về danh sách đơn hàng của người dùng sắp xếp mới nhất")
    void getMyOrders_Success_ShouldReturnOrdersSorted() throws Exception {
        createTestOrder(customer1, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 1);

        mockMvc.perform(get("/api/orders/me")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", not(empty())))
                .andExpect(jsonPath("$[0].orderCode", notNullValue()))
                .andExpect(jsonPath("$[0].status", notNullValue()))
                .andExpect(jsonPath("$[0].finalAmount", notNullValue()))
                .andExpect(jsonPath("$[0].canCancel", is(true)));
    }

    @Test
    @DisplayName("GET /api/orders/me: Chưa đăng nhập trả về 401")
    void getMyOrders_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/orders/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("GET /api/orders/me/{id}: Thành công, trả về chi tiết đơn hàng kèm danh sách sản phẩm")
    void getMyOrderDetail_Success_ShouldReturnFullDetailWithItems() throws Exception {
        Order order = createTestOrder(customer1, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 2);

        mockMvc.perform(get("/api/orders/me/" + order.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", is(order.getId().intValue())))
                .andExpect(jsonPath("$.orderCode", is(order.getOrderCode())))
                .andExpect(jsonPath("$.recipientName", is(customer1.getFullName())))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productName", is(testProduct.getName())))
                .andExpect(jsonPath("$.items[0].quantity", is(2)))
                .andExpect(jsonPath("$.canCancel", is(true)));
    }

    @Test
    @DisplayName("GET /api/orders/me/{id}: IDOR - Xem đơn của khách hàng khác trả về 404")
    void getMyOrderDetail_NotOwned_ShouldReturn404() throws Exception {
        Order orderOfCustomer1 = createTestOrder(customer1, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 1);

        mockMvc.perform(get("/api/orders/me/" + orderOfCustomer1.getId())
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Đơn hàng không tồn tại")));
    }

    @Test
    @DisplayName("POST /api/orders/{id}/cancel: Hủy đơn COD PENDING thành công, hoàn tồn kho và cập nhật CANCELLED")
    void cancelOrder_PendingCod_Success_ShouldRestoreInventory() throws Exception {
        // Tồn ban đầu 5, tạo đơn qty 2 -> tồn còn 3
        Order order = createTestOrder(customer1, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 2);

        CancelOrderRequest req = new CancelOrderRequest("Đổi ý không muốn mua nữa");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.statusLabel", is("Đã hủy")))
                .andExpect(jsonPath("$.paymentStatus", is("CANCELLED")))
                .andExpect(jsonPath("$.cancelReason", is("Đổi ý không muốn mua nữa")))
                .andExpect(jsonPath("$.cancelledAt", notNullValue()))
                .andExpect(jsonPath("$.canCancel", is(false)));

        // Kiểm tra tồn kho đã được hoàn lại 3 + 2 = 5
        Inventory inv = inventoryRepository.findByProductIdAndBranchId(testProduct.getId(), testBranch.getId()).orElseThrow();
        assertEquals(5, inv.getQuantity());

        // Kiểm tra trong DB
        Order updated = orderRepository.findById(order.getId()).orElseThrow();
        assertEquals(OrderStatus.CANCELLED, updated.getStatus());
        assertEquals(PaymentStatus.CANCELLED, updated.getPaymentStatus());
    }

    @Test
    @DisplayName("POST /api/orders/{id}/cancel: Hủy đơn ONLINE_MOCK CONFIRMED thành công, trạng thái thanh toán REFUNDED")
    void cancelOrder_ConfirmedOnlineMock_Success_ShouldRefundPayment() throws Exception {
        Order order = createTestOrder(customer1, OrderStatus.CONFIRMED, PaymentMethod.ONLINE_MOCK, PaymentStatus.PAID, 1);

        CancelOrderRequest req = new CancelOrderRequest("Muốn thanh toán bằng phương thức khác");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status", is("CANCELLED")))
                .andExpect(jsonPath("$.paymentStatus", is("REFUNDED")))
                .andExpect(jsonPath("$.paymentStatusLabel", is("Đã hoàn tiền")));

        Payment payment = paymentRepository.findByOrderId(order.getId()).orElseThrow();
        assertEquals(PaymentStatus.REFUNDED, payment.getStatus());
        assertNotNull(payment.getRefundedAt());
    }

    @Test
    @DisplayName("POST /api/orders/{id}/cancel: BR18 - Đơn đã SHIPPING không thể hủy, trả về 400")
    void cancelOrder_ShippingOrder_ShouldReturn400() throws Exception {
        Order order = createTestOrder(customer1, OrderStatus.SHIPPING, PaymentMethod.COD, PaymentStatus.UNPAID, 1);

        CancelOrderRequest req = new CancelOrderRequest("Hủy đơn giao");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Chỉ có thể hủy đơn hàng ở trạng thái Chờ xác nhận hoặc Đã xác nhận")));
    }

    @Test
    @DisplayName("POST /api/orders/{id}/cancel: BR48 - Hủy lần 2 bị từ chối 400, không hoàn kho lần 2")
    void cancelOrder_AlreadyCancelled_ShouldReturn400AndNotRestoreInventoryTwice() throws Exception {
        Order order = createTestOrder(customer1, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 2);

        CancelOrderRequest req = new CancelOrderRequest("Lý do hủy hợp lệ");

        // Hủy lần 1: Thành công
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isOk());

        Inventory invAfterFirstCancel = inventoryRepository.findByProductIdAndBranchId(testProduct.getId(), testBranch.getId()).orElseThrow();
        int stockAfterFirstCancel = invAfterFirstCancel.getQuantity();

        // Hủy lần 2: Phải bị 400 Bad Request
        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("Chỉ có thể hủy đơn hàng")));

        // Tồn kho không bị cộng thêm lần nữa
        Inventory invAfterSecondCancel = inventoryRepository.findByProductIdAndBranchId(testProduct.getId(), testBranch.getId()).orElseThrow();
        assertEquals(stockAfterFirstCancel, invAfterSecondCancel.getQuantity());
    }

    @Test
    @DisplayName("POST /api/orders/{id}/cancel: BR49 - Không được hủy đơn hàng của người khác (IDOR)")
    void cancelOrder_NotOwned_ShouldReturn404() throws Exception {
        Order orderOfCustomer1 = createTestOrder(customer1, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 1);

        CancelOrderRequest req = new CancelOrderRequest("Hủy đơn trộm");

        mockMvc.perform(post("/api/orders/" + orderOfCustomer1.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("Đơn hàng không tồn tại")));
    }

    @Test
    @DisplayName("POST /api/orders/{id}/cancel: Thiếu lý do hủy trả về 400 Bad Request")
    void cancelOrder_BlankReason_ShouldReturn400() throws Exception {
        Order order = createTestOrder(customer1, OrderStatus.PENDING, PaymentMethod.COD, PaymentStatus.UNPAID, 1);

        CancelOrderRequest req = new CancelOrderRequest("");

        mockMvc.perform(post("/api/orders/" + order.getId() + "/cancel")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.cancelReason", notNullValue()));
    }
}
