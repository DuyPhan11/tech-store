package com.techstore.product.dto;

import java.util.ArrayList;
import java.util.List;

public class CatalogPageResponse {
    private List<ProductSummaryDto> products = new ArrayList<>();
    private long total;
    private int page;
    private int pageSize = 8;
    private int totalPages;

    public CatalogPageResponse() {
    }

    public CatalogPageResponse(List<ProductSummaryDto> products, long total, int page, int pageSize, int totalPages) {
        this.products = products;
        this.total = total;
        this.page = page;
        this.pageSize = pageSize;
        this.totalPages = totalPages;
    }

    public List<ProductSummaryDto> getProducts() {
        return products;
    }

    public void setProducts(List<ProductSummaryDto> products) {
        this.products = products;
    }

    public long getTotal() {
        return total;
    }

    public void setTotal(long total) {
        this.total = total;
    }

    public int getPage() {
        return page;
    }

    public void setPage(int page) {
        this.page = page;
    }

    public int getPageSize() {
        return pageSize;
    }

    public void setPageSize(int pageSize) {
        this.pageSize = pageSize;
    }

    public int getTotalPages() {
        return totalPages;
    }

    public void setTotalPages(int totalPages) {
        this.totalPages = totalPages;
    }
}
