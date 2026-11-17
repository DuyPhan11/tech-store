package com.techstore.cart.dto;

import java.util.ArrayList;
import java.util.List;

public class CartResponse {

    private Long id;
    private List<CartItemResponse> items = new ArrayList<>();
    private Integer totalItems;
    private Integer totalUniqueItems;
    private Long totalPriceVnd;

    public CartResponse() {
    }

    public CartResponse(Long id, List<CartItemResponse> items, Integer totalItems,
                        Integer totalUniqueItems, Long totalPriceVnd) {
        this.id = id;
        this.items = items != null ? items : new ArrayList<>();
        this.totalItems = totalItems != null ? totalItems : 0;
        this.totalUniqueItems = totalUniqueItems != null ? totalUniqueItems : 0;
        this.totalPriceVnd = totalPriceVnd != null ? totalPriceVnd : 0L;
    }

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public List<CartItemResponse> getItems() {
        return items;
    }

    public void setItems(List<CartItemResponse> items) {
        this.items = items;
    }

    public Integer getTotalItems() {
        return totalItems;
    }

    public void setTotalItems(Integer totalItems) {
        this.totalItems = totalItems;
    }

    public Integer getTotalUniqueItems() {
        return totalUniqueItems;
    }

    public void setTotalUniqueItems(Integer totalUniqueItems) {
        this.totalUniqueItems = totalUniqueItems;
    }

    public Long getTotalPriceVnd() {
        return totalPriceVnd;
    }

    public void setTotalPriceVnd(Long totalPriceVnd) {
        this.totalPriceVnd = totalPriceVnd;
    }
}
