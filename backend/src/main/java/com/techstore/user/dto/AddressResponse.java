package com.techstore.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.techstore.user.entity.Address;

import java.time.LocalDateTime;

public class AddressResponse {

    private Long id;
    private Long userId;
    private String recipientName;
    private String phone;
    private String streetAddress;
    private String ward;
    private String district;
    private String city;
    private String fullAddress;

    @JsonProperty("isDefault")
    private boolean isDefault;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;

    public AddressResponse() {
    }

    public static AddressResponse fromEntity(Address address) {
        AddressResponse res = new AddressResponse();
        res.setId(address.getId());
        res.setUserId(address.getUser().getId());
        res.setRecipientName(address.getRecipientName());
        res.setPhone(address.getPhone());
        res.setStreetAddress(address.getStreetAddress());
        res.setWard(address.getWard());
        res.setDistrict(address.getDistrict());
        res.setCity(address.getCity());
        res.setDefault(address.isDefault());
        res.setCreatedAt(address.getCreatedAt());
        res.setUpdatedAt(address.getUpdatedAt());

        // Build full address string
        StringBuilder sb = new StringBuilder();
        sb.append(address.getStreetAddress());
        if (address.getWard() != null && !address.getWard().isBlank()) {
            sb.append(", ").append(address.getWard());
        }
        if (address.getDistrict() != null && !address.getDistrict().isBlank()) {
            sb.append(", ").append(address.getDistrict());
        }
        if (address.getCity() != null && !address.getCity().isBlank()) {
            sb.append(", ").append(address.getCity());
        }
        res.setFullAddress(sb.toString());

        return res;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public String getRecipientName() {
        return recipientName;
    }

    public void setRecipientName(String recipientName) {
        this.recipientName = recipientName;
    }

    public String getPhone() {
        return phone;
    }

    public void setPhone(String phone) {
        this.phone = phone;
    }

    public String getStreetAddress() {
        return streetAddress;
    }

    public void setStreetAddress(String streetAddress) {
        this.streetAddress = streetAddress;
    }

    public String getWard() {
        return ward;
    }

    public void setWard(String ward) {
        this.ward = ward;
    }

    public String getDistrict() {
        return district;
    }

    public void setDistrict(String district) {
        this.district = district;
    }

    public String getCity() {
        return city;
    }

    public void setCity(String city) {
        this.city = city;
    }

    public String getFullAddress() {
        return fullAddress;
    }

    public void setFullAddress(String fullAddress) {
        this.fullAddress = fullAddress;
    }

    @JsonProperty("isDefault")
    public boolean isDefault() {
        return isDefault;
    }

    public boolean getIsDefault() {
        return isDefault;
    }

    @JsonProperty("isDefault")
    public void setDefault(boolean aDefault) {
        isDefault = aDefault;
    }

    public void setIsDefault(boolean aDefault) {
        isDefault = aDefault;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
}
