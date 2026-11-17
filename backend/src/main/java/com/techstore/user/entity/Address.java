package com.techstore.user.entity;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "addresses", indexes = {
    @Index(name = "idx_addresses_user_id", columnList = "user_id")
})
public class Address {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "recipient_name", nullable = false, length = 100)
    private String recipientName;

    @Column(nullable = false, length = 20)
    private String phone;

    @Column(name = "street_address", nullable = false, length = 255)
    private String streetAddress;

    @Column(length = 100)
    private String ward;

    @Column(length = 100)
    private String district;

    @Column(nullable = false, length = 100)
    private String city;

    @Column(name = "is_default", nullable = false)
    private boolean isDefault = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Address() {
    }

    public Address(User user, String recipientName, String phone, String streetAddress,
                   String ward, String district, String city, boolean isDefault) {
        this.user = user;
        this.recipientName = recipientName;
        this.phone = phone;
        this.streetAddress = streetAddress;
        this.ward = ward;
        this.district = district;
        this.city = city;
        this.isDefault = isDefault;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        if (updatedAt == null) {
            updatedAt = now;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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

    public boolean isDefault() {
        return isDefault;
    }

    public boolean getIsDefault() {
        return isDefault;
    }

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
