package com.techstore.checkout;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.cart.dto.AddToCartRequest;
import com.techstore.cart.dto.CartResponse;
import com.techstore.cart.entity.Cart;
import com.techstore.cart.entity.CartItem;
import com.techstore.cart.repository.CartItemRepository;
import com.techstore.cart.repository.CartRepository;
import com.techstore.checkout.dto.CheckoutRequest;
import com.techstore.checkout.dto.CheckoutResponse;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.entity.Payment;
import com.techstore.order.entity.PaymentStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.order.repository.PaymentRepository;
import com.techstore.product.entity.ActiveStatus;
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
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import java.math.BigDecimal;
import java.util.List;
import java.util.Set;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
@DirtiesContext(classMode = DirtiesContext.ClassMode.AFTER_CLASS)
public class CheckoutControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private ProductRepository productRepository;

    @Autowired
    private BranchRepository branchRepository;

    @Autowired
    private InventoryRepository inventoryRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private PaymentRepository paymentRepository;

    private String customerToken;
    private String customer2Token;
    private String staffToken;

    private User customer1;
    private User customer2;
    private Product product1;
    private Product product2;
    private Branch branchActive;
    private Branch branchInactive;
    private int p1InitialStock;
    private int p2InitialStock;

    @BeforeEach
    void setUp() throws Exception {
        customerToken = obtainAccessToken("customer@techstore.vn", "Customer@123");
        staffToken = obtainAccessToken("staff@techstore.vn", "Staff@123");

        customer1 = userRepository.findByEmail("customer@techstore.vn").orElseThrow();

        if (!userRepository.existsByEmail("customer2@techstore.vn")) {
            Role roleCustomer = roleRepository.findByName("ROLE_CUSTOMER").orElseThrow();
            User c2 = new User();
            c2.setEmail("customer2@techstore.vn");
            c2.setPhone("0908888888");
            c2.setFullName("Customer Two");
            c2.setPassword(passwordEncoder.encode("Customer@123"));
            c2.setStatus(UserStatus.ACTIVE);
            c2.setRoles(Set.of(roleCustomer));
            customer2 = userRepository.save(c2);
        } else {
            customer2 = userRepository.findByEmail("customer2@techstore.vn").orElseThrow();
        }
        customer2Token = obtainAccessToken("customer2@techstore.vn", "Customer@123");

        // Dọn dẹp giỏ hàng
        cartRepository.findByUserId(customer1.getId()).ifPresent(c -> cartItemRepository.deleteAllByCartId(c.getId()));
        cartRepository.findByUserId(customer2.getId()).ifPresent(c -> cartItemRepository.deleteAllByCartId(c.getId()));

        List<Product> products = productRepository.findAll();
        product1 = products.get(0);
        product2 = products.get(1);

        branchActive = branchRepository.findAll().stream()
                .filter(b -> b.getStatus() == ActiveStatus.ACTIVE)
                .findFirst().orElseThrow();

        branchInactive = branchRepository.findAll().stream()
                .filter(b -> b.getStatus() == ActiveStatus.INACTIVE)
                .findFirst().orElseGet(() -> {
                    Branch b = new Branch("Kho bảo trì thử nghiệm", "02899990000", "Địa chỉ bảo trì", ActiveStatus.INACTIVE);
                    return branchRepository.save(b);
                });

        // Đảm bảo tồn kho cho product1 và product2 tại branchActive đủ lớn để test
        p1InitialStock = inventoryRepository.findByProductIdAndBranchId(product1.getId(), branchActive.getId()).map(Inventory::getQuantity).orElse(0);
        p2InitialStock = inventoryRepository.findByProductIdAndBranchId(product2.getId(), branchActive.getId()).map(Inventory::getQuantity).orElse(0);
        setStock(product1, branchActive, 50);
        setStock(product2, branchActive, 50);
    }

    @AfterEach
    void tearDown() {
        setStock(product1, branchActive, p1InitialStock);
        setStock(product2, branchActive, p2InitialStock);
    }

    private void setStock(Product product, Branch branch, int quantity) {
        Inventory inv = inventoryRepository.findByProductIdAndBranchId(product.getId(), branch.getId())
                .orElseGet(() -> new Inventory(product, branch, quantity, 5));
        inv.setQuantity(quantity);
        inventoryRepository.save(inv);
    }

    private String obtainAccessToken(String identifier, String password) throws Exception {
        LoginRequest request = new LoginRequest(identifier, password);
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andReturn();

        LoginResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class);
        return response.getAccessToken();
    }

    @Test
    @DisplayName("Chưa đăng nhập gọi /api/checkout -> 401 Unauthorized")
    void checkout_Unauthenticated_ShouldReturn401() throws Exception {
        CheckoutRequest request = new CheckoutRequest();
        request.setSource("BUY_NOW");
        request.setProductId(product1.getId());
        request.setQuantity(1);
        request.setBranchId(branchActive.getId());
        request.setRecipientName("Nguyễn Văn A");
        request.setRecipientPhone("0901234567");
        request.setShippingAddress("123 Lê Lợi, Q1, TP.HCM");

        mockMvc.perform(post("/api/checkout")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("ROLE_STAFF không có ROLE_CUSTOMER gọi /api/checkout -> 403 Forbidden")
    void checkout_StaffWithoutCustomerRole_ShouldReturn403() throws Exception {
        CheckoutRequest request = new CheckoutRequest();
        request.setSource("BUY_NOW");
        request.setProductId(product1.getId());
        request.setQuantity(1);
        request.setBranchId(branchActive.getId());
        request.setRecipientName("Nhân viên Demo");
        request.setRecipientPhone("0901234567");
        request.setShippingAddress("123 Lê Lợi, Q1, TP.HCM");

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Đặt hàng COD từ CART thành công: tạo Order PENDING, Payment UNPAID, trừ kho nguyên tử, xóa mục giỏ hàng đã chọn")
    void checkout_COD_CART_Success_ShouldCreateOrderAndDeductStockAndClearSelectedCartItems() throws Exception {
        // 1. Thêm product1 (qty=2) vào giỏ hàng
        AddToCartRequest addReq = new AddToCartRequest(product1.getId(), 2);
        MvcResult cartResult = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn();

        CartResponse cartResponse = objectMapper.readValue(cartResult.getResponse().getContentAsString(), CartResponse.class);
        Long cartItemId = cartResponse.getItems().get(0).getId();

        // 2. Lấy tồn kho trước khi đặt
        Inventory beforeInv = inventoryRepository.findByProductIdAndBranchId(product1.getId(), branchActive.getId()).orElseThrow();
        int initialStock = beforeInv.getQuantity();

        // 3. Thực hiện checkout
        CheckoutRequest checkoutReq = new CheckoutRequest();
        checkoutReq.setSource("CART");
        checkoutReq.setSelectedCartItemIds(List.of(cartItemId));
        checkoutReq.setBranchId(branchActive.getId());
        checkoutReq.setPaymentMethod("COD");
        checkoutReq.setRecipientName("Nguyễn Văn A");
        checkoutReq.setRecipientPhone("0901234567");
        checkoutReq.setShippingAddress("123 Lê Lợi, Q1, TP.HCM");
        checkoutReq.setNotes("Giao giờ hành chính");

        MvcResult result = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.orderCode", notNullValue()))
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.paymentMethod", is("COD")))
                .andExpect(jsonPath("$.paymentStatus", is("UNPAID")))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productId", is(product1.getId().intValue())))
                .andExpect(jsonPath("$.items[0].quantity", is(2)))
                .andReturn();

        CheckoutResponse response = objectMapper.readValue(result.getResponse().getContentAsString(), CheckoutResponse.class);

        // 4. Kiểm tra tồn kho bị trừ đúng 2
        Inventory afterInv = inventoryRepository.findByProductIdAndBranchId(product1.getId(), branchActive.getId()).orElseThrow();
        assertEquals(initialStock - 2, afterInv.getQuantity());

        // 5. Kiểm tra mục giỏ hàng đã được dọn dẹp
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)));

        // 6. Kiểm tra Order và Payment trong DB
        Order dbOrder = orderRepository.findById(response.getOrderId()).orElseThrow();
        assertEquals(OrderStatus.PENDING, dbOrder.getStatus());
        assertEquals("COD", dbOrder.getPaymentMethod().name());

        Payment dbPayment = paymentRepository.findByOrderId(dbOrder.getId()).orElseThrow();
        assertEquals(PaymentStatus.UNPAID, dbPayment.getStatus());
        assertEquals(dbOrder.getFinalAmount().compareTo(dbPayment.getAmount()), 0);
    }

    @Test
    @DisplayName("Đặt hàng COD từ BUY_NOW thành công: tạo Order PENDING, Payment UNPAID, trừ kho, GIỮ NGUYÊN giỏ hàng")
    void checkout_COD_BUY_NOW_Success_ShouldCreateOrderAndKeepCartIntact() throws Exception {
        // 1. Thêm product2 vào giỏ hàng của user
        AddToCartRequest addReq = new AddToCartRequest(product2.getId(), 3);
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk());

        // 2. Lấy tồn kho product1 trước checkout
        Inventory beforeInv = inventoryRepository.findByProductIdAndBranchId(product1.getId(), branchActive.getId()).orElseThrow();
        int initialStock = beforeInv.getQuantity();

        // 3. Thực hiện BUY_NOW product1 (qty=1)
        CheckoutRequest checkoutReq = new CheckoutRequest();
        checkoutReq.setSource("BUY_NOW");
        checkoutReq.setProductId(product1.getId());
        checkoutReq.setQuantity(1);
        checkoutReq.setBranchId(branchActive.getId());
        checkoutReq.setPaymentMethod("COD");
        checkoutReq.setRecipientName("Trần Thị B");
        checkoutReq.setRecipientPhone("0912345678");
        checkoutReq.setShippingAddress("456 Nguyễn Thị Thập, Q7, TP.HCM");

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.status", is("PENDING")))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productId", is(product1.getId().intValue())));

        // 4. Tồn kho product1 bị trừ 1
        Inventory afterInv = inventoryRepository.findByProductIdAndBranchId(product1.getId(), branchActive.getId()).orElseThrow();
        assertEquals(initialStock - 1, afterInv.getQuantity());

        // 5. Giỏ hàng của user VẪN CÒN NGUYÊN product2 (qty=3)
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].productId", is(product2.getId().intValue())))
                .andExpect(jsonPath("$.items[0].quantity", is(3)));
    }

    @Test
    @DisplayName("Đặt hàng với chi nhánh INACTIVE -> 400 Bad Request, không tạo đơn")
    void checkout_InactiveBranch_ShouldReturn400() throws Exception {
        CheckoutRequest checkoutReq = new CheckoutRequest();
        checkoutReq.setSource("BUY_NOW");
        checkoutReq.setProductId(product1.getId());
        checkoutReq.setQuantity(1);
        checkoutReq.setBranchId(branchInactive.getId());
        checkoutReq.setPaymentMethod("COD");
        checkoutReq.setRecipientName("Lê Văn C");
        checkoutReq.setRecipientPhone("0900000000");
        checkoutReq.setShippingAddress("789 Kha Vạn Cân, TP.Thủ Đức");

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("tạm ngưng hoạt động")));
    }

    @Test
    @DisplayName("Đặt hàng vượt quá số lượng tồn kho của chi nhánh -> 409 Conflict, không tạo đơn, không trừ tồn")
    void checkout_InsufficientStock_ShouldReturn409() throws Exception {
        // Đặt số lượng tồn của product1 tại branchActive = 2
        setStock(product1, branchActive, 2);

        // Đặt mua với quantity = 5
        CheckoutRequest checkoutReq = new CheckoutRequest();
        checkoutReq.setSource("BUY_NOW");
        checkoutReq.setProductId(product1.getId());
        checkoutReq.setQuantity(5);
        checkoutReq.setBranchId(branchActive.getId());
        checkoutReq.setPaymentMethod("COD");
        checkoutReq.setRecipientName("Hoàng D");
        checkoutReq.setRecipientPhone("0901111222");
        checkoutReq.setShippingAddress("123 Lê Lợi");

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("không đủ số lượng tồn kho")));

        // Kiểm tra tồn kho vẫn giữ nguyên = 2
        Inventory inv = inventoryRepository.findByProductIdAndBranchId(product1.getId(), branchActive.getId()).orElseThrow();
        assertEquals(2, inv.getQuantity());
    }

    @Test
    @DisplayName("Customer 1 checkout với cartItemId thuộc Customer 2 -> 404 Not Found, ngăn chặn can thiệp trái phép")
    void checkout_OtherUserCartItem_ShouldReturn404() throws Exception {
        // Customer 2 thêm product1 vào giỏ
        AddToCartRequest addReq = new AddToCartRequest(product1.getId(), 1);
        MvcResult c2Result = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn();

        CartResponse c2Cart = objectMapper.readValue(c2Result.getResponse().getContentAsString(), CartResponse.class);
        Long c2ItemId = c2Cart.getItems().get(0).getId();

        // Customer 1 cố tình checkout với c2ItemId
        CheckoutRequest checkoutReq = new CheckoutRequest();
        checkoutReq.setSource("CART");
        checkoutReq.setSelectedCartItemIds(List.of(c2ItemId));
        checkoutReq.setBranchId(branchActive.getId());
        checkoutReq.setPaymentMethod("COD");
        checkoutReq.setRecipientName("Customer One");
        checkoutReq.setRecipientPhone("0901234567");
        checkoutReq.setShippingAddress("123 Demo");

        mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.message", containsString("không thuộc quyền sở hữu của bạn")));
    }

    @Test
    @DisplayName("Chống retry trùng (Idempotency Key): gọi 2 lần cùng key chỉ tạo 1 đơn hàng và trừ kho đúng 1 lần")
    void checkout_IdempotencyKey_ShouldReturnCachedOrderWithoutDoubleDeduction() throws Exception {
        setStock(product1, branchActive, 20);
        String uniqueIdempotencyKey = "IDEMP-" + UUID.randomUUID();

        CheckoutRequest checkoutReq = new CheckoutRequest();
        checkoutReq.setSource("BUY_NOW");
        checkoutReq.setProductId(product1.getId());
        checkoutReq.setQuantity(2);
        checkoutReq.setBranchId(branchActive.getId());
        checkoutReq.setPaymentMethod("COD");
        checkoutReq.setRecipientName("Trùng Lặp");
        checkoutReq.setRecipientPhone("0909999888");
        checkoutReq.setShippingAddress("123 Lê Lợi");
        checkoutReq.setIdempotencyKey(uniqueIdempotencyKey);

        // Lần gọi 1
        MvcResult firstResult = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andReturn();

        CheckoutResponse firstResponse = objectMapper.readValue(firstResult.getResponse().getContentAsString(), CheckoutResponse.class);

        // Tồn kho sau lần 1: 20 - 2 = 18
        Inventory invAfter1 = inventoryRepository.findByProductIdAndBranchId(product1.getId(), branchActive.getId()).orElseThrow();
        assertEquals(18, invAfter1.getQuantity());

        // Lần gọi 2 (retry network với cùng idempotencyKey)
        MvcResult secondResult = mockMvc.perform(post("/api/checkout")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(checkoutReq)))
                .andExpect(status().isCreated())
                .andReturn();

        CheckoutResponse secondResponse = objectMapper.readValue(secondResult.getResponse().getContentAsString(), CheckoutResponse.class);

        // Kết quả phải trả về cùng 1 mã đơn hàng
        assertEquals(firstResponse.getOrderCode(), secondResponse.getOrderCode());

        // Tồn kho sau lần 2 VẪN LÀ 18 (KHÔNG bị trừ thêm 2 thành 16!)
        Inventory invAfter2 = inventoryRepository.findByProductIdAndBranchId(product1.getId(), branchActive.getId()).orElseThrow();
        assertEquals(18, invAfter2.getQuantity());
    }
}
