package com.techstore.user.controller;

import com.techstore.common.security.UserPrincipal;
import com.techstore.user.dto.*;
import com.techstore.user.entity.User;
import com.techstore.user.repository.UserRepository;
import com.techstore.user.service.ProfileService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/me")
@PreAuthorize("hasRole('CUSTOMER')")
public class ProfileController {

    private final ProfileService profileService;
    private final UserRepository userRepository;

    public ProfileController(ProfileService profileService, UserRepository userRepository) {
        this.profileService = profileService;
        this.userRepository = userRepository;
    }

    private Long resolveUserId(Authentication authentication) {
        if (authentication == null) {
            throw new AccessDeniedException("Yêu cầu xác thực tài khoản");
        }
        Object principal = authentication.getPrincipal();
        if (principal instanceof UserPrincipal userPrincipal) {
            return userPrincipal.getId();
        }
        String identifier = authentication.getName();
        return userRepository.findByEmailOrPhone(identifier)
                .map(User::getId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy thông tin tài khoản"));
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        UserProfileResponse response = profileService.getProfile(userId);
        return ResponseEntity.ok(response);
    }

    @PatchMapping
    public ResponseEntity<UserProfileResponse> updateProfile(Authentication authentication,
                                                             @Valid @RequestBody UpdateProfileRequest request) {
        Long userId = resolveUserId(authentication);
        UserProfileResponse response = profileService.updateProfile(userId, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<UserProfileResponse> updateProfilePut(Authentication authentication,
                                                                @Valid @RequestBody UpdateProfileRequest request) {
        return updateProfile(authentication, request);
    }

    @PostMapping(value = "/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<UserProfileResponse> uploadAvatar(Authentication authentication,
                                                            @RequestParam("file") MultipartFile file) {
        Long userId = resolveUserId(authentication);
        UserProfileResponse response = profileService.uploadAvatar(userId, file);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(Authentication authentication,
                                                              @Valid @RequestBody ChangePasswordRequest request) {
        Long userId = resolveUserId(authentication);
        profileService.changePassword(userId, request);
        return ResponseEntity.ok(Map.of("message", "Đổi mật khẩu thành công"));
    }

    @GetMapping("/addresses")
    public ResponseEntity<List<AddressResponse>> getAddresses(Authentication authentication) {
        Long userId = resolveUserId(authentication);
        List<AddressResponse> response = profileService.getAddresses(userId);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/addresses")
    public ResponseEntity<AddressResponse> addAddress(Authentication authentication,
                                                      @Valid @RequestBody AddressRequest request) {
        Long userId = resolveUserId(authentication);
        AddressResponse response = profileService.addAddress(userId, request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/addresses/{id}")
    public ResponseEntity<AddressResponse> updateAddress(Authentication authentication,
                                                         @PathVariable Long id,
                                                         @Valid @RequestBody AddressRequest request) {
        Long userId = resolveUserId(authentication);
        AddressResponse response = profileService.updateAddress(userId, id, request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/addresses/{id}")
    public ResponseEntity<AddressResponse> updateAddressPatch(Authentication authentication,
                                                              @PathVariable Long id,
                                                              @Valid @RequestBody AddressRequest request) {
        return updateAddress(authentication, id, request);
    }

    @DeleteMapping("/addresses/{id}")
    public ResponseEntity<Void> deleteAddress(Authentication authentication,
                                              @PathVariable Long id) {
        Long userId = resolveUserId(authentication);
        profileService.deleteAddress(userId, id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/addresses/{id}/default")
    public ResponseEntity<AddressResponse> setDefaultAddress(Authentication authentication,
                                                             @PathVariable Long id) {
        Long userId = resolveUserId(authentication);
        AddressResponse response = profileService.setDefaultAddress(userId, id);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/addresses/{id}/default")
    public ResponseEntity<AddressResponse> setDefaultAddressPost(Authentication authentication,
                                                                 @PathVariable Long id) {
        return setDefaultAddress(authentication, id);
    }
}
