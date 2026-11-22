package com.techstore.coupon.service;

import com.techstore.coupon.dto.CouponRequest;
import com.techstore.coupon.dto.CouponResponse;

import java.util.List;

/** UC13 — Quản trị coupon (Staff/Admin, ADR-022). Không có xóa vật lý. */
public interface CouponAdminService {

    List<CouponResponse> list(String keyword, String status);

    CouponResponse get(Long id);

    CouponResponse create(CouponRequest request);

    CouponResponse update(Long id, CouponRequest request);

    CouponResponse setActive(Long id, boolean active);
}
