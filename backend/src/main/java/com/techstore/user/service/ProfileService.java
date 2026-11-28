package com.techstore.user.service;

import com.techstore.user.dto.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

public interface ProfileService {

    UserProfileResponse getProfile(Long userId);

    UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request);

    UserProfileResponse uploadAvatar(Long userId, MultipartFile file);

    void changePassword(Long userId, ChangePasswordRequest request);

    List<AddressResponse> getAddresses(Long userId);

    AddressResponse addAddress(Long userId, AddressRequest request);

    AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request);

    void deleteAddress(Long userId, Long addressId);

    AddressResponse setDefaultAddress(Long userId, Long addressId);
}
