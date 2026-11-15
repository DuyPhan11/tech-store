package com.techstore.auth.dto;

import java.util.List;

public class UserSummaryDto {

    private Long id;
    private String email;
    private String phone;
    private String fullName;
    private String avatarUrl;
    private List<String> roles;

    public UserSummaryDto() {
    }

    public UserSummaryDto(Long id, String email, String phone, String fullName, String avatarUrl, List<String> roles) {
        this.id = id;
        this.email = email;
        this.phone = phone;
        this.fullName = fullName;
        this.avatarUrl = avatarUrl;
        this.roles = roles;
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

    public List<String> getRoles() {
        return roles;
    }

    public void setRoles(List<String> roles) {
        this.roles = roles;
    }
}
