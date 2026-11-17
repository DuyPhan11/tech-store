package com.techstore.user.dto;

import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

public class UserProfileResponse {

    private Long id;
    private String email;
    private String phone;
    private String fullName;
    private String avatarUrl;
    private String status;
    private List<String> roles;
    private AddressResponse defaultAddress;
    private LocalDateTime createdAt;

    public UserProfileResponse() {
    }

    public static UserProfileResponse fromEntity(User user, AddressResponse defaultAddress) {
        UserProfileResponse res = new UserProfileResponse();
        res.setId(user.getId());
        res.setEmail(user.getEmail());
        res.setPhone(user.getPhone());
        res.setFullName(user.getFullName());
        res.setAvatarUrl(user.getAvatarUrl());
        res.setStatus(user.getStatus().name());
        res.setRoles(user.getRoles().stream().map(Role::getName).collect(Collectors.toList()));
        res.setDefaultAddress(defaultAddress);
        res.setCreatedAt(user.getCreatedAt());
        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getEmail() {
        return email;
    }

    public void setEmail(String email) {
        this.email = email;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getFullName() {
        return fullName;
    }

    public void setFullName(String fullName) {
        this.fullName = fullName;
    }

    public String getAvatarUrl() {
        return avatarUrl;
    }

    public void setAvatarUrl(String avatarUrl) {
        this.avatarUrl = avatarUrl;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }

    public AddressResponse getDefaultAddress() {
        return defaultAddress;
    }

    public void setDefaultAddress(AddressResponse defaultAddress) {
        this.defaultAddress = defaultAddress;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
