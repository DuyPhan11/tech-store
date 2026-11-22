package com.techstore.product.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.checkout.dto.CheckoutRequest;
import com.techstore.order.entity.Order;
import com.techstore.order.entity.OrderStatus;
import com.techstore.order.repository.OrderRepository;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Branch;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.BranchRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashMap;
import java.util.Map;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * UC19 — Quản trị chi nhánh (ADR-020).
 * Mỗi test chạy trong transaction và rollback để không ảnh hưởng dữ liệu demo dùng chung.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AdminBranchControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private BranchRepository branchRepository;
    @Autowired private ProductRepository productRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private OrderRepository orderRepository;

    private String adminToken;
    private String staffToken;
    private String customerToken;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = login("admin@techstore.vn", "Admin@123");
        staffToken = login("staff@techstore.vn", "Staff@123");
        customerToken = login("customer@techstore.vn", "Customer@123");
    }

    // ===================== Helpers =====================

    private String login(String identifier, String password) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new LoginRequest(identifier, password))))
                .andExpect(status().isOk())
                .andReturn();
        return objectMapper.readValue(result.getResponse().getContentAsString(), LoginResponse.class).getAccessToken();
    }

    private static Map<String, Object> body(String name, String phone, String address) {
        Map<String, Object> body = new HashMap<>();
        body.put("name", name);
        body.put("phone", phone);
        body.put("address", address);
        return body;
    }

    private ResultActions createBranch(String token, Map<String, Object> body) throws Exception {
        return mockMvc.perform(post("/api/admin/branches")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private ResultActions changeStatus(String token, Long id, String status) throws Exception {
        return mockMvc.perform(patch("/api/admin/branches/{id}/status", id)
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"status\":\"" + status + "\"}"));
    }

    /** Chi nhánh riêng của test, có tồn kho cho một sản phẩm demo ACTIVE để đặt hàng được. */
    private Branch branchWithStock() {
        Branch branch = branchRepository.save(new Branch("Chi nhánh Test UC19", "02899998888", "1 Đường Test, Quận 3, TP.HCM", ActiveStatus.ACTIVE));
        Product product = productRepository.findBySlug("nova-14").orElseThrow();
        inventoryRepository.save(new Inventory(product, branch, 20, 1));
        return branch;
    }

    private ResultActions checkout(Long branchId) throws Exception {
        CheckoutRequest request = new CheckoutRequest();
        request.setSource("BUY_NOW");
        request.setProductId(productRepository.findBySlug("nova-14").orElseThrow().getId());
        request.setQuantity(1);
        request.setBranchId(branchId);
        request.setPaymentMethod("COD");
        request.setRecipientName("Khách hàng Thử nghiệm");
        request.setRecipientPhone("0903456789");
        request.setShippingAddress("123 Lê Lợi, Quận 1, TP.HCM");
        return mockMvc.perform(post("/api/checkout")
                .header("Authorization", "Bearer " + customerToken)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)));
    }

    /** Tạo đơn thật qua checkout rồi đặt trạng thái mong muốn. */
    private Order placeOrder(Long branchId, OrderStatus status) throws Exception {
        MvcResult result = checkout(branchId).andExpect(status().isCreated()).andReturn();
        long orderId = objectMapper.readTree(result.getResponse().getContentAsString()).get("orderId").asLong();
        Order order = orderRepository.findById(orderId).orElseThrow();
        order.setStatus(status);
        return orderRepository.saveAndFlush(order);
    }

    // ===================== CRUD =====================

    @Test
    @DisplayName("Admin xem danh sách gồm cả chi nhánh INACTIVE, sắp theo id")
    void adminListsAllBranches() throws Exception {
        mockMvc.perform(get("/api/admin/branches").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItems("Chi nhánh Quận 1", "Kho bảo trì")))
                .andExpect(jsonPath("$[*].status", hasItem("INACTIVE")))
                .andExpect(jsonPath("$[0].id", lessThan(2)));
    }

    @Test
    @DisplayName("Admin tạo chi nhánh → 201, mặc định ACTIVE, trim dữ liệu, phone rỗng → null")
    void adminCreatesBranch() throws Exception {
        createBranch(adminToken, body("  Chi nhánh Thủ Đức  ", "028 3333 4444", " 12 Võ Văn Ngân, TP. Thủ Đức "))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").isNumber())
                .andExpect(jsonPath("$.name").value("Chi nhánh Thủ Đức"))
                .andExpect(jsonPath("$.address").value("12 Võ Văn Ngân, TP. Thủ Đức"))
                .andExpect(jsonPath("$.phone").value("028 3333 4444"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        createBranch(adminToken, body("Kho phụ", "   ", "5 Đường Số 7, Bình Tân, TP.HCM"))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.phone").doesNotExist());
    }

    @Test
    @DisplayName("Admin sửa chi nhánh → 200; id không tồn tại → 404")
    void adminUpdatesBranch() throws Exception {
        Branch branch = branchWithStock();
        mockMvc.perform(put("/api/admin/branches/{id}", branch.getId())
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body("Chi nhánh Quận 3 (mới)", "(028) 1111-2222", "9 Nam Kỳ Khởi Nghĩa, Quận 3, TP.HCM"))))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Chi nhánh Quận 3 (mới)"))
                .andExpect(jsonPath("$.phone").value("(028) 1111-2222"))
                .andExpect(jsonPath("$.status").value("ACTIVE"));

        mockMvc.perform(put("/api/admin/branches/{id}", 999999)
                        .header("Authorization", "Bearer " + adminToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body("X", null, "Y, Z"))))
                .andExpect(status().isNotFound());
        changeStatus(adminToken, 999999L, "ACTIVE").andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Validate: thiếu tên/địa chỉ, phone sai định dạng, tên quá dài → 400 với errors.{field}")
    void invalidBodyReturns400() throws Exception {
        createBranch(adminToken, body("  ", "abc", ""))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.phone").exists())
                .andExpect(jsonPath("$.errors.address").exists());

        createBranch(adminToken, body("a".repeat(151), "123", "Địa chỉ, TP.HCM"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.name").exists())
                .andExpect(jsonPath("$.errors.phone").exists());
    }

    @Test
    @DisplayName("Trạng thái không hợp lệ → 400")
    void invalidStatusReturns400() throws Exception {
        Branch branch = branchWithStock();
        changeStatus(adminToken, branch.getId(), "CLOSED").andExpect(status().isBadRequest());
        changeStatus(adminToken, branch.getId(), "").andExpect(status().isBadRequest());
    }

    // ===================== Status rules =====================

    @ParameterizedTest(name = "Còn đơn {0} → 409")
    @EnumSource(value = OrderStatus.class, names = {"PENDING", "CONFIRMED", "SHIPPING"})
    @DisplayName("Không vô hiệu hóa chi nhánh còn đơn PENDING / CONFIRMED / SHIPPING → 409, trạng thái giữ ACTIVE")
    void cannotDeactivateWithOpenOrders(OrderStatus openStatus) throws Exception {
        Branch branch = branchWithStock();
        placeOrder(branch.getId(), openStatus);

        changeStatus(adminToken, branch.getId(), "INACTIVE")
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("1 đơn hàng chưa hoàn tất")));
        assertEquals(ActiveStatus.ACTIVE, branchRepository.findById(branch.getId()).orElseThrow().getStatus());
    }

    @Test
    @DisplayName("Chỉ còn đơn COMPLETED / CANCELLED → vô hiệu hóa được; kích hoạt lại → 200")
    void canDeactivateWhenOnlyFinishedOrders() throws Exception {
        Branch branch = branchWithStock();
        placeOrder(branch.getId(), OrderStatus.COMPLETED);
        placeOrder(branch.getId(), OrderStatus.CANCELLED);

        changeStatus(adminToken, branch.getId(), "INACTIVE")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("INACTIVE"));
        // Idempotent
        changeStatus(adminToken, branch.getId(), "INACTIVE").andExpect(status().isOk());
        changeStatus(adminToken, branch.getId(), "ACTIVE")
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    @DisplayName("Đơn đang mở ở chi nhánh KHÁC không chặn việc vô hiệu hóa chi nhánh này")
    void openOrdersOfOtherBranchDoNotBlock() throws Exception {
        Branch busy = branchWithStock();
        placeOrder(busy.getId(), OrderStatus.PENDING);
        Branch idle = branchRepository.save(new Branch("Chi nhánh rảnh", null, "2 Đường Test, Quận 5, TP.HCM", ActiveStatus.ACTIVE));

        changeStatus(adminToken, idle.getId(), "INACTIVE").andExpect(status().isOk());
    }

    @Test
    @DisplayName("Sau khi vô hiệu hóa qua API admin, checkout vào chi nhánh đó bị từ chối (400) và không tạo đơn")
    void checkoutRejectedAfterAdminDeactivates() throws Exception {
        Branch branch = branchWithStock();
        changeStatus(adminToken, branch.getId(), "INACTIVE").andExpect(status().isOk());
        long before = orderRepository.count();

        checkout(branch.getId())
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("tạm ngưng hoạt động")));
        assertEquals(before, orderRepository.count());

        // Mở lại → đặt được
        changeStatus(adminToken, branch.getId(), "ACTIVE").andExpect(status().isOk());
        checkout(branch.getId()).andExpect(status().isCreated());
    }

    // ===================== RBAC =====================

    @Test
    @DisplayName("RBAC: không token 401, Staff/Customer 403 cho mọi thao tác; DELETE → 405")
    void rbac() throws Exception {
        Branch branch = branchWithStock();
        mockMvc.perform(get("/api/admin/branches")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/branches").header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/branches").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        createBranch(staffToken, body("Staff tạo", null, "A, B")).andExpect(status().isForbidden());
        changeStatus(staffToken, branch.getId(), "INACTIVE").andExpect(status().isForbidden());
        changeStatus(customerToken, branch.getId(), "INACTIVE").andExpect(status().isForbidden());
        mockMvc.perform(put("/api/admin/branches/{id}", branch.getId())
                        .header("Authorization", "Bearer " + staffToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(body("X", null, "Y, Z"))))
                .andExpect(status().isForbidden());

        mockMvc.perform(delete("/api/admin/branches/{id}", branch.getId()).header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isMethodNotAllowed());
        assertEquals(ActiveStatus.ACTIVE, branchRepository.findById(branch.getId()).orElseThrow().getStatus());
    }
}
