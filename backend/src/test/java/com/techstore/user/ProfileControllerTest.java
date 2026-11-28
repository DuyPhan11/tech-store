package com.techstore.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.techstore.auth.dto.LoginRequest;
import com.techstore.auth.dto.LoginResponse;
import com.techstore.common.storage.ImageStorageService;
import com.techstore.common.storage.StoredImage;
import com.techstore.user.dto.AddressRequest;
import com.techstore.user.dto.ChangePasswordRequest;
import com.techstore.user.dto.UpdateProfileRequest;
import com.techstore.user.entity.Address;
import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.AddressRepository;
import com.techstore.user.repository.RoleRepository;
import com.techstore.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.test.web.servlet.MvcResult;

import java.util.List;
import java.util.Set;

import static org.hamcrest.Matchers.*;
import static org.junit.jupiter.api.Assertions.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
public class ProfileControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private RoleRepository roleRepository;

    @Autowired
    private AddressRepository addressRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @MockBean
    private ImageStorageService imageStorageService;

    private String customerToken;
    private String customer2Token;
    private String staffToken;
    private User customer1;
    private User customer2;

    @BeforeEach
    void setUp() throws Exception {
        // Lấy token của customer1 và staff
        customerToken = obtainAccessToken("customer@techstore.vn", "Customer@123");
        staffToken = obtainAccessToken("staff@techstore.vn", "Staff@123");

        customer1 = userRepository.findByEmail("customer@techstore.vn").orElseThrow();

        // Tạo customer2 nếu chưa có
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

        // Dọn dẹp địa chỉ trước mỗi test
        addressRepository.deleteAll(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(customer1.getId()));
        addressRepository.deleteAll(addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(customer2.getId()));
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
    @DisplayName("GET /api/me: Trả về thông tin cá nhân của khách hàng đã đăng nhập")
    void testGetProfileSuccess() throws Exception {
        mockMvc.perform(get("/api/me")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email", is("customer@techstore.vn")))
                .andExpect(jsonPath("$.roles", hasItem("ROLE_CUSTOMER")));
    }

    @Test
    @DisplayName("GET /api/me: 401 Unauthorized nếu không gửi token")
    void testGetProfileUnauthorized() throws Exception {
        mockMvc.perform(get("/api/me"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    @DisplayName("PATCH /api/me: Cập nhật họ tên thành công")
    void testUpdateProfileSuccess() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Nguyễn Văn Khách Hàng");
        request.setPhone("0912345678");

        mockMvc.perform(patch("/api/me")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName", is("Nguyễn Văn Khách Hàng")))
                .andExpect(jsonPath("$.phone", is("0912345678")));
    }

    @Test
    @DisplayName("PATCH /api/me: Trả về 409 Conflict nếu số điện thoại bị trùng với user khác")
    void testUpdateProfileDuplicatePhone() throws Exception {
        UpdateProfileRequest request = new UpdateProfileRequest();
        request.setFullName("Tên Mới");
        request.setPhone("0908888888"); // Phone của customer2

        mockMvc.perform(patch("/api/me")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict());
    }

    @Test
    @DisplayName("POST /api/me/change-password: Đổi mật khẩu thành công và xác minh mật khẩu mới")
    void testChangePasswordSuccess() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("Customer@123");
        request.setNewPassword("Customer@999");
        request.setConfirmPassword("Customer@999");

        mockMvc.perform(post("/api/me/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());

        // Đổi lại về ban đầu để không ảnh hưởng test khác
        request.setOldPassword("Customer@999");
        request.setNewPassword("Customer@123");
        request.setConfirmPassword("Customer@123");
        String newToken = obtainAccessToken("customer@techstore.vn", "Customer@999");
        mockMvc.perform(post("/api/me/change-password")
                        .header("Authorization", "Bearer " + newToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk());
    }

    @Test
    @DisplayName("POST /api/me/change-password: Báo lỗi 400 khi sai mật khẩu cũ")
    void testChangePasswordWrongOldPassword() throws Exception {
        ChangePasswordRequest request = new ChangePasswordRequest();
        request.setOldPassword("SaiMatKhau123");
        request.setNewPassword("Customer@999");
        request.setConfirmPassword("Customer@999");

        mockMvc.perform(post("/api/me/change-password")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Địa chỉ: Thêm địa chỉ đầu tiên tự động thành mặc định, thêm địa chỉ thứ hai")
    void testAddressCreationAndDefaultToggle() throws Exception {
        // Thêm địa chỉ 1 (không set isDefault hoặc set false) -> phải tự động thành true vì là địa chỉ đầu tiên
        AddressRequest req1 = new AddressRequest();
        req1.setRecipientName("Nguyễn Văn A");
        req1.setPhone("0912345678");
        req1.setStreetAddress("123 Lê Lợi");
        req1.setWard("Bến Nghé");
        req1.setDistrict("Quận 1");
        req1.setCity("TP. Hồ Chí Minh");
        req1.setIsDefault(false);

        MvcResult res1 = mockMvc.perform(post("/api/me/addresses")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req1)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isDefault", is(true)))
                .andExpect(jsonPath("$.recipientName", is("Nguyễn Văn A")))
                .andReturn();

        // Thêm địa chỉ 2 với isDefault = true -> địa chỉ 2 thành mặc định, địa chỉ 1 mất mặc định
        AddressRequest req2 = new AddressRequest();
        req2.setRecipientName("Nguyễn Văn B");
        req2.setPhone("0987654321");
        req2.setStreetAddress("456 Hai Bà Trưng");
        req2.setWard("Đa Kao");
        req2.setDistrict("Quận 1");
        req2.setCity("TP. Hồ Chí Minh");
        req2.setIsDefault(true);

        mockMvc.perform(post("/api/me/addresses")
                        .header("Authorization", "Bearer " + customerToken)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(req2)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.isDefault", is(true)))
                .andExpect(jsonPath("$.recipientName", is("Nguyễn Văn B")));

        // Lấy danh sách địa chỉ -> req2 phải đứng đầu vì isDefault = true
        mockMvc.perform(get("/api/me/addresses")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(2)))
                .andExpect(jsonPath("$[0].recipientName", is("Nguyễn Văn B")))
                .andExpect(jsonPath("$[0].isDefault", is(true)))
                .andExpect(jsonPath("$[1].recipientName", is("Nguyễn Văn A")))
                .andExpect(jsonPath("$[1].isDefault", is(false)));
    }

    @Test
    @DisplayName("Địa chỉ: Không cho phép sửa/xóa địa chỉ của người khác (Strict Ownership Isolation -> 404)")
    void testAddressOwnershipIsolation() throws Exception {
        // Customer 1 tạo 1 địa chỉ
        Address addr1 = new Address();
        addr1.setUser(customer1);
        addr1.setRecipientName("Khách 1");
        addr1.setPhone("0912345678");
        addr1.setStreetAddress("123 Phố 1");
        addr1.setWard("Phường 1");
        addr1.setDistrict("Quận 1");
        addr1.setCity("TP. Hồ Chí Minh");
        addr1.setIsDefault(true);
        addr1 = addressRepository.save(addr1);

        // Customer 2 cố gắng sửa địa chỉ của Customer 1 -> 404 Not Found
        AddressRequest updateReq = new AddressRequest();
        updateReq.setRecipientName("Hacker");
        updateReq.setPhone("0999999999");
        updateReq.setStreetAddress("456 Phố Lạ");
        updateReq.setWard("Phường 2");
        updateReq.setDistrict("Quận 2");
        updateReq.setCity("TP. Hồ Chí Minh");

        mockMvc.perform(put("/api/me/addresses/" + addr1.getId())
                        .header("Authorization", "Bearer " + customer2Token)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(updateReq)))
                .andExpect(status().isNotFound());

        // Customer 2 cố gắng xóa địa chỉ của Customer 1 -> 404 Not Found
        mockMvc.perform(delete("/api/me/addresses/" + addr1.getId())
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isNotFound());

        // Customer 2 cố đặt làm mặc định -> 404 Not Found
        mockMvc.perform(patch("/api/me/addresses/" + addr1.getId() + "/default")
                        .header("Authorization", "Bearer " + customer2Token))
                .andExpect(status().isNotFound());
    }

    @Test
    @DisplayName("Địa chỉ: Xóa địa chỉ mặc định khi còn địa chỉ khác thì tự động gán địa chỉ còn lại làm mặc định")
    void testDeleteDefaultAddressReassignsDefault() throws Exception {
        // Tạo 2 địa chỉ cho customer1
        Address addr1 = new Address();
        addr1.setUser(customer1);
        addr1.setRecipientName("Khách A");
        addr1.setPhone("0912345678");
        addr1.setStreetAddress("123 Phố 1");
        addr1.setWard("Phường 1");
        addr1.setDistrict("Quận 1");
        addr1.setCity("TP. Hồ Chí Minh");
        addr1.setIsDefault(true);
        addr1 = addressRepository.save(addr1);

        Address addr2 = new Address();
        addr2.setUser(customer1);
        addr2.setRecipientName("Khách B");
        addr2.setPhone("0987654321");
        addr2.setStreetAddress("456 Phố 2");
        addr2.setWard("Phường 2");
        addr2.setDistrict("Quận 2");
        addr2.setCity("TP. Hồ Chí Minh");
        addr2.setIsDefault(false);
        addr2 = addressRepository.save(addr2);

        // Xóa addr1 (đang là mặc định)
        mockMvc.perform(delete("/api/me/addresses/" + addr1.getId())
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isNoContent());

        // Kiểm tra danh sách: chỉ còn 1 địa chỉ và đã tự động thành mặc định
        mockMvc.perform(get("/api/me/addresses")
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$", hasSize(1)))
                .andExpect(jsonPath("$[0].id", is(addr2.getId().intValue())))
                .andExpect(jsonPath("$[0].isDefault", is(true)));
    }

    @Test
    @DisplayName("Avatar: Upload ảnh đại diện hợp lệ lên Cloudinary và lưu avatarUrl")
    void testUploadAvatarSuccess() throws Exception {
        when(imageStorageService.upload(any()))
                .thenReturn(new StoredImage("https://res.cloudinary.com/demo/image/upload/v1/avatar.png", "tech-store/avatars/u1"));

        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                new byte[]{1, 2, 3, 4}
        );

        mockMvc.perform(multipart("/api/me/avatar")
                        .file(file)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.avatarUrl", is("https://res.cloudinary.com/demo/image/upload/v1/avatar.png")));
    }

    @Test
    @DisplayName("Avatar: Từ chối file không phải ảnh (400 Bad Request)")
    void testUploadAvatarInvalidMimeType() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "notes.txt",
                "text/plain",
                "not-an-image".getBytes()
        );

        mockMvc.perform(multipart("/api/me/avatar")
                        .file(file)
                        .header("Authorization", "Bearer " + customerToken))
                .andExpect(status().isBadRequest());
    }

    @Test
    @DisplayName("Avatar: Chưa đăng nhập không thể upload ảnh đại diện")
    void testUploadAvatarUnauthenticated() throws Exception {
        MockMultipartFile file = new MockMultipartFile(
                "file",
                "avatar.png",
                "image/png",
                new byte[]{1, 2, 3, 4}
        );

        mockMvc.perform(multipart("/api/me/avatar").file(file))
                .andExpect(status().isUnauthorized());
    }
}
