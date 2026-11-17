package com.techstore.user.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public class AddressRequest {

    @NotBlank(message = "Tên người nhận không được để trống")
    private String recipientName;

    @NotBlank(message = "Số điện thoại không được để trống")
    @Pattern(regexp = "^(0|\\+84)[0-9]{9,10}$", message = "Số điện thoại không hợp lệ")
    private String phone;

    @NotBlank(message = "Địa chỉ chi tiết không được để trống")
    private String streetAddress;

    private String ward;

    private String district;

    @NotBlank(message = "Tỉnh / Thành phố không được để trống")
    private String city;

    @JsonProperty("isDefault")
    private Boolean isDefault;

    public AddressRequest() {
    }

    public AddressRequest(String recipientName, String phone, String streetAddress, String ward, String district, String city, Boolean isDefault) {
        this.recipientName = recipientName;
        this.phone = phone;
        this.streetAddress = streetAddress;
        this.ward = ward;
        this.district = district;
        this.city = city;
        this.isDefault = isDefault;
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

    @JsonProperty("isDefault")
    public Boolean getIsDefault() {
        return isDefault;
    }

    @JsonProperty("isDefault")
    public void setIsDefault(Boolean isDefault) {
        this.isDefault = isDefault;
    }

    public Boolean isDefault() {
        return isDefault;
    }

    public void setDefault(Boolean aDefault) {
        this.isDefault = aDefault;
    }
}
