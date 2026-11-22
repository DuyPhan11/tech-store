package com.techstore.product.controller;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.common.audit.AuditLog;
import com.techstore.common.audit.AuditLogRepository;
import com.techstore.product.entity.ActiveStatus;
import com.techstore.product.entity.Branch;
import com.techstore.product.entity.Inventory;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.BranchRepository;
import com.techstore.product.repository.BrandRepository;
import com.techstore.product.repository.CategoryRepository;
import com.techstore.product.repository.InventoryRepository;
import com.techstore.product.repository.ProductRepository;
import com.techstore.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * UC18 — Tồn kho / chuyển kho (ADR-021). Mỗi test chạy trong transaction và rollback.
 * Test đồng thời nằm ở {@code InventoryConcurrencyTest} (cần commit thật).
 */
@SpringBootTest
@AutoConfigureMockMvc
@Transactional
public class AdminInventoryControllerTest {

    @Autowired private MockMvc mockMvc;
    @Autowired private ObjectMapper objectMapper;
    @Autowired private ProductRepository productRepository;
    @Autowired private CategoryRepository categoryRepository;
    @Autowired private BrandRepository brandRepository;
    @Autowired private BranchRepository branchRepository;
    @Autowired private InventoryRepository inventoryRepository;
    @Autowired private AuditLogRepository auditLogRepository;
    @Autowired private UserRepository userRepository;

    private String adminToken;
    private String staffToken;
    private String customerToken;
    private Long staffId;

    private Product product;
    private Branch branchA;
    private Branch branchB;
    private Branch branchOff;

    @BeforeEach
    void setUp() throws Exception {
        adminToken = login("admin@techstore.vn", "Admin@123");
        staffToken = login("staff@techstore.vn", "Staff@123");
        customerToken = login("customer@techstore.vn", "Customer@123");
        staffId = userRepository.findByEmail("staff@techstore.vn").orElseThrow().getId();

        String suffix = UUID.randomUUID().toString().substring(0, 8);
        product = productRepository.save(new Product(
                categoryRepository.findBySlug("laptop").orElseThrow(),
                brandRepository.findBySlug("nova").orElseThrow(),
                "Kho Test " + suffix, "kho-test-" + suffix, "KHO-" + suffix.toUpperCase(),
                new BigDecimal("1000000"), new BigDecimal("800000"), null, null, ActiveStatus.ACTIVE));
        branchA = branchRepository.save(new Branch("Kho A " + suffix, null, "1 A, TP.HCM", ActiveStatus.ACTIVE));
        branchB = branchRepository.save(new Branch("Kho B " + suffix, null, "2 B, Hà Nội", ActiveStatus.ACTIVE));
        branchOff = branchRepository.save(new Branch("Kho Off " + suffix, null, "3 C, Đà Nẵng", ActiveStatus.INACTIVE));
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

    private ResultActions adjust(String token, Long productId, Long branchId, String type, Integer quantity) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("productId", productId);
        body.put("branchId", branchId);
        body.put("type", type);
        body.put("quantity", quantity);
        body.put("reason", "Kiểm thử " + type);
        return mockMvc.perform(post("/api/admin/inventories/adjust")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private ResultActions transfer(String token, Long fromId, Long toId, Integer quantity) throws Exception {
        Map<String, Object> body = new HashMap<>();
        body.put("productId", product.getId());
        body.put("fromBranchId", fromId);
        body.put("toBranchId", toId);
        body.put("quantity", quantity);
        body.put("reason", "Cân đối tồn");
        return mockMvc.perform(post("/api/admin/inventories/transfer")
                .header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(body)));
    }

    private void stock(Branch branch, int quantity) {
        inventoryRepository.saveAndFlush(new Inventory(product, branch, quantity, 5));
    }

    private int quantityAt(Branch branch) {
        return inventoryRepository.findByProductIdAndBranchId(product.getId(), branch.getId())
                .map(Inventory::getQuantity).orElse(-1);
    }

    private long auditCount() {
        return auditLogRepository.countByEntityName("inventories");
    }

    private AuditLog lastAudit() {
        List<AuditLog> logs = auditLogRepository.findByEntityNameOrderByIdAsc("inventories");
        return logs.get(logs.size() - 1);
    }

    // ===================== List =====================

    @Test
    @DisplayName("List: lọc theo chi nhánh và từ khóa tên/SKU; Staff xem được danh sách chi nhánh (kể cả INACTIVE)")
    void listWithFilters() throws Exception {
        stock(branchA, 7);
        stock(branchB, 2);

        mockMvc.perform(get("/api/admin/inventories").param("q", product.getSku().toLowerCase())
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].sku").value(product.getSku()))
                .andExpect(jsonPath("$[0].branchStatus").value("ACTIVE"))
                .andExpect(jsonPath("$[0].minStockAlert").value(5));

        mockMvc.perform(get("/api/admin/inventories")
                        .param("branchId", String.valueOf(branchB.getId()))
                        .param("q", product.getName())
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].branchId").value(branchB.getId()))
                .andExpect(jsonPath("$[0].quantity").value(2));

        mockMvc.perform(get("/api/admin/inventories/branches").header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[*].name", hasItem(branchOff.getName())))
                .andExpect(jsonPath("$[*].status", hasItem("INACTIVE")));
    }

    // ===================== Adjust =====================

    @Test
    @DisplayName("INBOUND tự tạo dòng tồn cho sản phẩm chưa có tồn; ghi đúng 1 audit với user/action/details")
    void inboundCreatesRowAndWritesAudit() throws Exception {
        assertEquals(-1, quantityAt(branchA));
        long before = auditCount();

        adjust(staffToken, product.getId(), branchA.getId(), "INBOUND", 12)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(12))
                .andExpect(jsonPath("$.branchName").value(branchA.getName()));

        assertEquals(12, quantityAt(branchA));
        assertEquals(before + 1, auditCount());
        AuditLog audit = lastAudit();
        assertEquals(staffId, audit.getUserId());
        assertEquals("INVENTORY_INBOUND", audit.getAction());
        JsonNode details = objectMapper.readTree(audit.getDetails());
        assertEquals(product.getId(), details.get("productId").asLong());
        assertEquals(0, details.get("before").asInt());
        assertEquals(12, details.get("after").asInt());
        assertEquals("Kiểm thử INBOUND", details.get("reason").asText());
    }

    @Test
    @DisplayName("OUTBOUND thành công; vượt tồn → 409, tồn giữ nguyên, không ghi audit")
    void outboundNeverGoesNegative() throws Exception {
        stock(branchA, 5);
        adjust(staffToken, product.getId(), branchA.getId(), "OUTBOUND", 3)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(2));

        long before = auditCount();
        adjust(staffToken, product.getId(), branchA.getId(), "OUTBOUND", 3)
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.message", containsString("chỉ còn 2")));
        assertEquals(2, quantityAt(branchA));
        assertEquals(before, auditCount());
    }

    @Test
    @DisplayName("OUTBOUND khi chưa có dòng tồn → 409, không tạo dòng")
    void outboundWithoutRowIsConflict() throws Exception {
        adjust(staffToken, product.getId(), branchA.getId(), "OUTBOUND", 1).andExpect(status().isConflict());
        assertEquals(-1, quantityAt(branchA));
    }

    @Test
    @DisplayName("SET đặt đúng số lượng (cho phép 0); SET âm → 400")
    void setQuantity() throws Exception {
        stock(branchA, 9);
        adjust(adminToken, product.getId(), branchA.getId(), "SET", 0)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(0));
        assertEquals("INVENTORY_SET", lastAudit().getAction());

        adjust(adminToken, product.getId(), branchB.getId(), "SET", 4)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.quantity").value(4));

        adjust(adminToken, product.getId(), branchA.getId(), "SET", -1)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.quantity").exists());
    }

    @Test
    @DisplayName("Validate: quantity 0 cho INBOUND/OUTBOUND, type lạ, thiếu field → 400, không ghi audit")
    void invalidAdjustReturns400() throws Exception {
        stock(branchA, 5);
        long before = auditCount();
        adjust(staffToken, product.getId(), branchA.getId(), "INBOUND", 0).andExpect(status().isBadRequest());
        adjust(staffToken, product.getId(), branchA.getId(), "OUTBOUND", 0).andExpect(status().isBadRequest());
        adjust(staffToken, product.getId(), branchA.getId(), "REMOVE", 1)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.type").exists());
        adjust(staffToken, null, null, "INBOUND", null)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.productId").exists())
                .andExpect(jsonPath("$.errors.branchId").exists())
                .andExpect(jsonPath("$.errors.quantity").exists());
        assertEquals(5, quantityAt(branchA));
        assertEquals(before, auditCount());
    }

    @Test
    @DisplayName("Chi nhánh INACTIVE → 400 cho adjust; sản phẩm/chi nhánh không tồn tại → 404")
    void inactiveBranchAndNotFound() throws Exception {
        adjust(staffToken, product.getId(), branchOff.getId(), "INBOUND", 3)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("tạm dừng hoạt động")));
        assertEquals(-1, quantityAt(branchOff));

        adjust(staffToken, 999999L, branchA.getId(), "INBOUND", 3).andExpect(status().isNotFound());
        adjust(staffToken, product.getId(), 999999L, "INBOUND", 3).andExpect(status().isNotFound());
    }

    // ===================== Transfer =====================

    @Test
    @DisplayName("TRANSFER giữ nguyên tổng tồn, tự tạo dòng đích, ghi 1 audit INVENTORY_TRANSFER")
    void transferKeepsTotal() throws Exception {
        stock(branchA, 10);
        long before = auditCount();

        transfer(staffToken, branchA.getId(), branchB.getId(), 4)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from.quantity").value(6))
                .andExpect(jsonPath("$.to.quantity").value(4))
                .andExpect(jsonPath("$.to.branchId").value(branchB.getId()));
        assertEquals(10, quantityAt(branchA) + quantityAt(branchB));

        // Chuyển ngược chiều (thứ tự khóa vẫn theo branchId tăng dần)
        transfer(staffToken, branchB.getId(), branchA.getId(), 1)
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.from.quantity").value(3))
                .andExpect(jsonPath("$.to.quantity").value(7));
        assertEquals(10, quantityAt(branchA) + quantityAt(branchB));

        assertEquals(before + 2, auditCount());
        AuditLog audit = lastAudit();
        assertEquals("INVENTORY_TRANSFER", audit.getAction());
        JsonNode details = objectMapper.readTree(audit.getDetails());
        assertEquals(branchB.getId(), details.get("fromBranchId").asLong());
        assertEquals(4, details.get("fromBefore").asInt());
        assertEquals(3, details.get("fromAfter").asInt());
        assertEquals(6, details.get("toBefore").asInt());
        assertEquals(7, details.get("toAfter").asInt());
    }

    @Test
    @DisplayName("TRANSFER: nguồn = đích → 400; nguồn thiếu/không có dòng → 409; quantity 0 → 400; không ghi audit")
    void transferErrors() throws Exception {
        stock(branchA, 2);
        long before = auditCount();
        transfer(staffToken, branchA.getId(), branchA.getId(), 1)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.message", containsString("phải khác nhau")));
        transfer(staffToken, branchA.getId(), branchB.getId(), 3).andExpect(status().isConflict());
        transfer(staffToken, branchB.getId(), branchA.getId(), 1).andExpect(status().isConflict());
        transfer(staffToken, branchA.getId(), branchB.getId(), 0)
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.errors.quantity").exists());

        assertEquals(2, quantityAt(branchA));
        assertEquals(-1, quantityAt(branchB));
        assertEquals(before, auditCount());
    }

    @Test
    @DisplayName("TRANSFER với chi nhánh INACTIVE ở nguồn hoặc đích → 400, tồn không đổi")
    void transferInactiveBranch() throws Exception {
        stock(branchA, 5);
        transfer(staffToken, branchA.getId(), branchOff.getId(), 1).andExpect(status().isBadRequest());
        transfer(staffToken, branchOff.getId(), branchA.getId(), 1).andExpect(status().isBadRequest());
        assertEquals(5, quantityAt(branchA));
        assertEquals(-1, quantityAt(branchOff));
    }

    // ===================== RBAC =====================

    @Test
    @DisplayName("RBAC: không token 401, Customer 403; Staff và Admin được phép")
    void rbac() throws Exception {
        mockMvc.perform(get("/api/admin/inventories")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/admin/inventories").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        mockMvc.perform(get("/api/admin/inventories/branches").header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isForbidden());
        adjust(customerToken, product.getId(), branchA.getId(), "INBOUND", 1).andExpect(status().isForbidden());
        transfer(customerToken, branchA.getId(), branchB.getId(), 1).andExpect(status().isForbidden());
        assertEquals(-1, quantityAt(branchA));

        mockMvc.perform(get("/api/admin/inventories").header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isOk());
        mockMvc.perform(get("/api/admin/inventories").header("Authorization", "Bearer " + adminToken))
                .andExpect(status().isOk());
        adjust(adminToken, product.getId(), branchA.getId(), "INBOUND", 1).andExpect(status().isOk());
    }
}
