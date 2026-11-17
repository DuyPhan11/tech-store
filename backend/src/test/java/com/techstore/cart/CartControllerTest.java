package com.techstore.cart;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.cart.dto.AddToCartRequest;
import com.techstore.cart.dto.UpdateCartItemRequest;
import com.techstore.cart.entity.Cart;
import com.techstore.cart.entity.CartItem;
import com.techstore.cart.repository.CartItemRepository;
import com.techstore.cart.repository.CartRepository;
import com.techstore.product.entity.Product;
import com.techstore.product.repository.ProductRepository;
import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.RoleRepository;
import com.techstore.user.repository.UserRepository;
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

import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class CartControllerTest {

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
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    private String customerToken;
    private String customer2Token;
    private String staffToken;
    private Product activeProduct1;
    private Product activeProduct2;
    private User customer1;
    private User customer2;

    @BeforeEach
    void setUp() throws Exception {
        // Lấy token của customer1 và staff
        customerToken = obtainAccessToken("customer@techstore.vn", "Customer@123");
        staffToken = obtainAccessToken("staff@techstore.vn", "Staff@123");

        customer1 = userRepository.findByEmail("customer@techstore.vn").orElseThrow();

        // Tạo customer2 nếu chưa có để test ownership isolation
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

        // Dọn dẹp giỏ hàng trước mỗi test
        cartRepository.findByUserId(customer1.getId()).ifPresent(c -> cartItemRepository.deleteAllByCartId(c.getId()));
        cartRepository.findByUserId(customer2.getId()).ifPresent(c -> cartItemRepository.deleteAllByCartId(c.getId()));

        List<Product> products = productRepository.findAll();
        activeProduct1 = products.get(0);
        activeProduct2 = products.get(1);
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
    @DisplayName("Chưa đăng nhập truy cập /api/cart -> 401 Unauthorized")
    void getCart_Unauthenticated_ShouldReturn401() throws Exception {
        mockMvc.perform(get("/api/cart"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("ROLE_STAFF không có quyền ROLE_CUSTOMER truy cập /api/cart -> 403 Forbidden")
    void getCart_StaffWithoutCustomerRole_ShouldReturn403() throws Exception {
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + staffToken))
                .andExpect(status().isForbidden());
    }

    @Test
    @DisplayName("Khách hàng đăng nhập lấy giỏ hàng ban đầu trống -> 200 OK")
    void getCart_CustomerEmptyCart_ShouldReturn200() throws Exception {
        mockMvc.perform(get("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id", notNullValue()))
                .andExpect(jsonPath("$.items", hasSize(0)))
                .andExpect(jsonPath("$.totalItems", is(0)))
                .andExpect(jsonPath("$.totalUniqueItems", is(0)))
                .andExpect(jsonPath("$.totalPriceVnd", is(0)));
    }

    @Test
    @DisplayName("Thêm sản phẩm hợp lệ vào giỏ hàng -> 200 OK với đúng sản phẩm và số lượng")
    void addToCart_ValidItem_ShouldSucceed() throws Exception {
        AddToCartRequest request = new AddToCartRequest(activeProduct1.getId(), 2);

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(2)))
                .andExpect(jsonPath("$.totalUniqueItems", is(1)))
                .andExpect(jsonPath("$.items[0].productId", is(activeProduct1.getId().intValue())))
                .andExpect(jsonPath("$.items[0].quantity", is(2)))
                .andExpect(jsonPath("$.items[0].productName", is(activeProduct1.getName())))
                .andExpect(jsonPath("$.items[0].priceVnd", is(activeProduct1.getPrice().intValue())))
                .andExpect(jsonPath("$.items[0].subtotalVnd", is(activeProduct1.getPrice().intValue() * 2)));
    }

    @Test
    @DisplayName("Thêm cùng sản phẩm lần 2 -> Cộng dồn số lượng, giữ nguyên 1 dòng sản phẩm (1 line/product)")
    void addToCart_DuplicateProduct_ShouldIncrementQuantity() throws Exception {
        AddToCartRequest request1 = new AddToCartRequest(activeProduct1.getId(), 2);
        AddToCartRequest request2 = new AddToCartRequest(activeProduct1.getId(), 3);

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request1)))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request2)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(5)))
                .andExpect(jsonPath("$.totalUniqueItems", is(1)))
                .andExpect(jsonPath("$.items", hasSize(1)))
                .andExpect(jsonPath("$.items[0].quantity", is(5)))
                .andExpect(jsonPath("$.items[0].subtotalVnd", is(activeProduct1.getPrice().intValue() * 5)));
    }

    @Test
    @DisplayName("Thêm sản phẩm không tồn tại -> 404 Not Found")
    void addToCart_NonExistentProduct_ShouldReturn404() throws Exception {
        AddToCartRequest request = new AddToCartRequest(999999L, 1);

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Thêm sản phẩm với số lượng < 1 -> 400 Bad Request")
    void addToCart_InvalidQuantity_ShouldReturn400() throws Exception {
        AddToCartRequest request = new AddToCartRequest(activeProduct1.getId(), 0);

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Cập nhật số lượng item trong giỏ -> 200 OK với số lượng và thành tiền mới")
    void updateItemQuantity_Valid_ShouldSucceed() throws Exception {
        // Thêm trước 1 item
        AddToCartRequest addReq = new AddToCartRequest(activeProduct1.getId(), 1);
        MvcResult addResult = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn();

        Long itemId = objectMapper.readTree(addResult.getResponse().getContentAsString())
                .get("items").get(0).get("id").asLong();

        UpdateCartItemRequest updateReq = new UpdateCartItemRequest(4);
        mockMvc.perform(patch("/api/cart/items/" + itemId)
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalItems", is(4)))
                .andExpect(jsonPath("$.items[0].quantity", is(4)))
                .andExpect(jsonPath("$.items[0].subtotalVnd", is(activeProduct1.getPrice().intValue() * 4)));
    }

    @Test
    @DisplayName("Xóa một sản phẩm khỏi giỏ -> 200 OK và giỏ cập nhật")
    void removeItem_Valid_ShouldSucceed() throws Exception {
        AddToCartRequest addReq = new AddToCartRequest(activeProduct1.getId(), 2);
        MvcResult addResult = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn();

        Long itemId = objectMapper.readTree(addResult.getResponse().getContentAsString())
                .get("items").get(0).get("id").asLong();

        mockMvc.perform(delete("/api/cart/items/" + itemId)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)))
                .andExpect(jsonPath("$.totalItems", is(0)));
    }

    @Test
    @DisplayName("Xóa toàn bộ giỏ hàng (DELETE /api/cart) -> Giỏ trống")
    void clearCart_ShouldRemoveAllItems() throws Exception {
        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(activeProduct1.getId(), 1))))
                .andExpect(status().isOk());

        mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(new AddToCartRequest(activeProduct2.getId(), 2))))
                .andExpect(status().isOk());

        mockMvc.perform(delete("/api/cart")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.items", hasSize(0)))
                .andExpect(jsonPath("$.totalItems", is(0)))
                .andExpect(jsonPath("$.totalPriceVnd", is(0)));
    }

    @Test
    @DisplayName("Ownership Isolation: User A không thể sửa hoặc xóa item giỏ hàng của User B -> 404")
    void ownershipIsolation_CannotModifyOrDeleteOtherUsersItem() throws Exception {
        // Customer 1 thêm sản phẩm
        AddToCartRequest addReq = new AddToCartRequest(activeProduct1.getId(), 2);
        MvcResult addResult = mockMvc.perform(post("/api/cart/items")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(addReq)))
                .andExpect(status().isOk())
                .andReturn();

        Long customer1ItemId = objectMapper.readTree(addResult.getResponse().getContentAsString())
                .get("items").get(0).get("id").asLong();

        // Customer 2 cố tình sửa item của Customer 1 -> 404 Not Found
        UpdateCartItemRequest updateReq = new UpdateCartItemRequest(10);
        mockMvc.perform(patch("/api/cart/items/" + customer1ItemId)
                        .header("Authorization", "Bearer " + customer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());

        // Customer 2 cố tình xóa item của Customer 1 -> 404 Not Found
        mockMvc.perform(delete("/api/cart/items/" + customer1ItemId)
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isNotFound());

        // Kiểm tra item của Customer 1 vẫn còn nguyên vẹn trong DB
        CartItem itemInDb = cartItemRepository.findById(customer1ItemId).orElseThrow();
        assertEquals(2, itemInDb.getQuantity());
    }
}
