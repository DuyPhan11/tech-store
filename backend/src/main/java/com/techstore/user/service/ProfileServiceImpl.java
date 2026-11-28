package com.techstore.user.service;

import com.techstore.common.exception.AddressNotFoundException;
import com.techstore.common.exception.DuplicateResourceException;
import com.techstore.common.storage.ImageStorageService;
import com.techstore.common.storage.StoredImage;
import com.techstore.user.dto.*;
import com.techstore.user.entity.Address;
import com.techstore.user.entity.User;
import com.techstore.user.repository.AddressRepository;
import com.techstore.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class ProfileServiceImpl implements ProfileService {

    private static final Logger log = LoggerFactory.getLogger(ProfileServiceImpl.class);
    private static final long MAX_AVATAR_BYTES = 5L * 1024 * 1024;
    private static final Set<String> ALLOWED_IMAGE_TYPES = Set.of("image/jpeg", "image/jpg", "image/png", "image/webp");

    private final UserRepository userRepository;
    private final AddressRepository addressRepository;
    private final PasswordEncoder passwordEncoder;
    private final ImageStorageService imageStorageService;

    public ProfileServiceImpl(UserRepository userRepository,
                              AddressRepository addressRepository,
                              PasswordEncoder passwordEncoder,
                              ImageStorageService imageStorageService) {
        this.userRepository = userRepository;
        this.addressRepository = addressRepository;
        this.passwordEncoder = passwordEncoder;
        this.imageStorageService = imageStorageService;
    }

    private User getUserOrThrow(Long userId) {
        return userRepository.findById(userId)
                .orElseThrow(() -> new AccessDeniedException("Không tìm thấy thông tin tài khoản"));
    }

    @Override
    @Transactional(readOnly = true)
    public UserProfileResponse getProfile(Long userId) {
        User user = getUserOrThrow(userId);
        AddressResponse defaultAddress = addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(AddressResponse::fromEntity)
                .orElse(null);
        return UserProfileResponse.fromEntity(user, defaultAddress);
    }

    @Override
    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest request) {
        User user = getUserOrThrow(userId);

        String newPhone = request.getPhone().trim();
        if (!newPhone.equals(user.getPhone())) {
            Optional<User> phoneHolder = userRepository.findByPhone(newPhone);
            if (phoneHolder.isPresent() && !phoneHolder.get().getId().equals(userId)) {
                throw new DuplicateResourceException("Số điện thoại này đã được sử dụng bởi tài khoản khác");
            }
            user.setPhone(newPhone);
        }

        user.setFullName(request.getFullName().trim());
        if (request.getAvatarUrl() != null) {
            user.setAvatarUrl(request.getAvatarUrl().trim());
        }

        User savedUser = userRepository.save(user);
        log.info("Cập nhật thông tin hồ sơ thành công: userId={}, fullName={}", userId, savedUser.getFullName());

        AddressResponse defaultAddress = addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(AddressResponse::fromEntity)
                .orElse(null);
        return UserProfileResponse.fromEntity(savedUser, defaultAddress);
    }

    @Override
    @Transactional
    public UserProfileResponse uploadAvatar(Long userId, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Vui lòng chọn tệp ảnh đại diện");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new IllegalArgumentException("Kích thước ảnh đại diện tối đa 5MB");
        }
        String contentType = file.getContentType() != null
                ? file.getContentType().trim().toLowerCase(Locale.ROOT)
                : "";
        if (!ALLOWED_IMAGE_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("Chỉ chấp nhận ảnh định dạng JPG, PNG hoặc WEBP");
        }

        User user = getUserOrThrow(userId);
        StoredImage stored = imageStorageService.upload(file);
        user.setAvatarUrl(stored.secureUrl());
        User savedUser = userRepository.save(user);
        log.info("Cập nhật ảnh đại diện Cloudinary thành công: userId={}, publicId={}", userId, stored.publicId());

        AddressResponse defaultAddress = addressRepository.findByUserIdAndIsDefaultTrue(userId)
                .map(AddressResponse::fromEntity)
                .orElse(null);
        return UserProfileResponse.fromEntity(savedUser, defaultAddress);
    }

    @Override
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        User user = getUserOrThrow(userId);

        if (!passwordEncoder.matches(request.getOldPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác");
        }

        user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
        log.info("Đổi mật khẩu thành công: userId={}", userId);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AddressResponse> getAddresses(Long userId) {
        getUserOrThrow(userId);
        return addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId).stream()
                .map(AddressResponse::fromEntity)
                .collect(Collectors.toList());
    }

    @Override
    @Transactional
    public AddressResponse addAddress(Long userId, AddressRequest request) {
        User user = getUserOrThrow(userId);

        long count = addressRepository.countByUserId(userId);
        boolean shouldBeDefault = Boolean.TRUE.equals(request.getIsDefault()) || count == 0;

        if (shouldBeDefault && count > 0) {
            List<Address> existingAddresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            for (Address addr : existingAddresses) {
                if (addr.isDefault()) {
                    addr.setDefault(false);
                    addressRepository.save(addr);
                }
            }
        }

        Address address = new Address(
                user,
                request.getRecipientName().trim(),
                request.getPhone().trim(),
                request.getStreetAddress().trim(),
                request.getWard() != null ? request.getWard().trim() : null,
                request.getDistrict() != null ? request.getDistrict().trim() : null,
                request.getCity().trim(),
                shouldBeDefault
        );

        Address saved = addressRepository.save(address);
        log.info("Thêm địa chỉ mới thành công: addressId={}, userId={}, isDefault={}", saved.getId(), userId, saved.isDefault());
        return AddressResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public AddressResponse updateAddress(Long userId, Long addressId, AddressRequest request) {
        getUserOrThrow(userId);

        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AddressNotFoundException("Địa chỉ không tồn tại hoặc không thuộc quyền sở hữu của bạn"));

        address.setRecipientName(request.getRecipientName().trim());
        address.setPhone(request.getPhone().trim());
        address.setStreetAddress(request.getStreetAddress().trim());
        address.setWard(request.getWard() != null ? request.getWard().trim() : null);
        address.setDistrict(request.getDistrict() != null ? request.getDistrict().trim() : null);
        address.setCity(request.getCity().trim());

        if (Boolean.TRUE.equals(request.getIsDefault()) && !address.isDefault()) {
            List<Address> existing = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            for (Address addr : existing) {
                if (addr.isDefault()) {
                    addr.setDefault(false);
                    addressRepository.save(addr);
                }
            }
            address.setDefault(true);
        }

        Address saved = addressRepository.save(address);
        log.info("Cập nhật địa chỉ thành công: addressId={}, userId={}", addressId, userId);
        return AddressResponse.fromEntity(saved);
    }

    @Override
    @Transactional
    public void deleteAddress(Long userId, Long addressId) {
        getUserOrThrow(userId);

        Address address = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AddressNotFoundException("Địa chỉ không tồn tại hoặc không thuộc quyền sở hữu của bạn"));

        boolean wasDefault = address.isDefault();
        addressRepository.delete(address);
        log.info("Xóa địa chỉ thành công: addressId={}, userId={}", addressId, userId);

        if (wasDefault) {
            List<Address> remaining = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
            if (!remaining.isEmpty()) {
                Address newDefault = remaining.get(0);
                newDefault.setDefault(true);
                addressRepository.save(newDefault);
                log.info("Tự động chỉ định địa chỉ mặc định mới: addressId={}, userId={}", newDefault.getId(), userId);
            }
        }
    }

    @Override
    @Transactional
    public AddressResponse setDefaultAddress(Long userId, Long addressId) {
        getUserOrThrow(userId);

        Address targetAddress = addressRepository.findByIdAndUserId(addressId, userId)
                .orElseThrow(() -> new AddressNotFoundException("Địa chỉ không tồn tại hoặc không thuộc quyền sở hữu của bạn"));

        List<Address> allAddresses = addressRepository.findByUserIdOrderByIsDefaultDescCreatedAtDesc(userId);
        for (Address addr : allAddresses) {
            boolean isTarget = addr.getId().equals(addressId);
            if (addr.isDefault() != isTarget) {
                addr.setDefault(isTarget);
                addressRepository.save(addr);
            }
        }

        log.info("Thiết lập địa chỉ mặc định thành công: addressId={}, userId={}", addressId, userId);
        return AddressResponse.fromEntity(targetAddress);
    }
}
