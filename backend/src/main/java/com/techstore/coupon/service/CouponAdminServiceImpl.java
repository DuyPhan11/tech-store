package com.techstore.coupon.service;

import com.techstore.common.exception.CatalogResourceNotFoundException;
import com.techstore.common.exception.CouponConflictException;
import com.techstore.common.exception.DuplicateResourceException;
import com.techstore.coupon.dto.CouponRequest;
import com.techstore.coupon.dto.CouponResponse;
import com.techstore.coupon.entity.Coupon;
import com.techstore.coupon.entity.CouponDisplayStatus;
import com.techstore.coupon.entity.DiscountType;
import com.techstore.coupon.repository.CouponRepository;
import com.techstore.coupon.repository.CouponUsageRepository;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;
import java.util.regex.Pattern;

/** UC13 — Quản trị coupon (ADR-022). Sửa/bật-tắt khóa dòng coupon để nhất quán với FS16. */
@Service
public class CouponAdminServiceImpl implements CouponAdminService {

    private static final Pattern CODE_PATTERN = Pattern.compile("^[A-Z0-9_-]{3,50}$");
    private static final BigDecimal HUNDRED = BigDecimal.valueOf(100);

    private final CouponRepository couponRepository;
    private final CouponUsageRepository couponUsageRepository;
    private final CouponService couponService;

    public CouponAdminServiceImpl(CouponRepository couponRepository,
                                  CouponUsageRepository couponUsageRepository,
                                  CouponService couponService) {
        this.couponRepository = couponRepository;
        this.couponUsageRepository = couponUsageRepository;
        this.couponService = couponService;
    }

    @Override
    @Transactional(readOnly = true)
    public List<CouponResponse> list(String keyword, String status) {
        CouponDisplayStatus filter = parseStatus(status);
        String q = keyword == null ? "" : keyword.trim().toUpperCase(Locale.ROOT);
        LocalDateTime now = LocalDateTime.now();
        return couponRepository.findAllByOrderByIdDesc().stream()
                .filter(c -> q.isEmpty() || c.getCode().contains(q))
                .map(c -> CouponResponse.of(c, couponService.displayStatus(c, now)))
                .filter(r -> filter == null || r.displayStatus() == filter)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CouponResponse get(Long id) {
        return toResponse(couponRepository.findById(id).orElseThrow(() -> notFound(id)));
    }

    @Override
    @Transactional
    public CouponResponse create(CouponRequest request) {
        String code = normalizeCode(request.code());
        validateRules(request);
        if (couponRepository.existsByCode(code)) {
            throw duplicate(code);
        }
        Coupon coupon = new Coupon();
        coupon.setCode(code);
        coupon.setDiscountType(DiscountType.valueOf(request.discountType()));
        coupon.setDiscountValue(request.discountValue());
        applyEditable(coupon, request);
        coupon.setUsedCount(0);
        coupon.setActive(true);
        return toResponse(saveFlush(coupon, code));
    }

    @Override
    @Transactional
    public CouponResponse update(Long id, CouponRequest request) {
        String code = normalizeCode(request.code());
        validateRules(request);
        Coupon coupon = couponRepository.findByIdForUpdate(id).orElseThrow(() -> notFound(id));
        DiscountType type = DiscountType.valueOf(request.discountType());

        boolean lockedFieldsChanged = !coupon.getCode().equals(code)
                || coupon.getDiscountType() != type
                || coupon.getDiscountValue().compareTo(request.discountValue()) != 0;
        if (lockedFieldsChanged && hasUsage(coupon)) {
            throw new CouponConflictException("Mã " + coupon.getCode()
                    + " đã được sử dụng nên không thể đổi mã, hình thức giảm hoặc giá trị giảm");
        }
        if (request.usageLimit() < coupon.getUsedCount()) {
            throw new CouponConflictException("Giới hạn lượt dùng (" + request.usageLimit()
                    + ") không được nhỏ hơn số lượt đã dùng (" + coupon.getUsedCount() + ")");
        }
        if (!coupon.getCode().equals(code) && couponRepository.existsByCodeAndIdNot(code, id)) {
            throw duplicate(code);
        }

        coupon.setCode(code);
        coupon.setDiscountType(type);
        coupon.setDiscountValue(request.discountValue());
        applyEditable(coupon, request);
        return toResponse(saveFlush(coupon, code));
    }

    @Override
    @Transactional
    public CouponResponse setActive(Long id, boolean active) {
        Coupon coupon = couponRepository.findByIdForUpdate(id).orElseThrow(() -> notFound(id));
        coupon.setActive(active);
        return toResponse(couponRepository.saveAndFlush(coupon));
    }

    // ===================== Helpers =====================

    private void applyEditable(Coupon coupon, CouponRequest request) {
        coupon.setMinOrderAmount(request.minOrderAmount() != null ? request.minOrderAmount() : BigDecimal.ZERO);
        // ADR-022: maxDiscountAmount chỉ có nghĩa với PERCENTAGE; FIXED_AMOUNT lưu null.
        coupon.setMaxDiscountAmount(coupon.getDiscountType() == DiscountType.PERCENTAGE ? request.maxDiscountAmount() : null);
        coupon.setUsageLimit(request.usageLimit());
        coupon.setStartDate(request.startDate());
        coupon.setEndDate(request.endDate());
    }

    /** Ràng buộc chéo trường (ADR-022 mục 2) → 400. */
    private void validateRules(CouponRequest request) {
        if (DiscountType.valueOf(request.discountType()) == DiscountType.PERCENTAGE
                && request.discountValue().compareTo(HUNDRED) > 0) {
            throw new IllegalArgumentException("Giảm theo phần trăm phải lớn hơn 0 và không vượt quá 100%");
        }
        if (!request.endDate().isAfter(request.startDate())) {
            throw new IllegalArgumentException("Ngày kết thúc phải sau ngày bắt đầu");
        }
    }

    private String normalizeCode(String raw) {
        String code = raw == null ? "" : raw.trim().toUpperCase(Locale.ROOT);
        if (!CODE_PATTERN.matcher(code).matches()) {
            throw new IllegalArgumentException("Mã chỉ gồm A-Z, 0-9, dấu _ hoặc -, dài 3–50 ký tự");
        }
        return code;
    }

    private CouponDisplayStatus parseStatus(String status) {
        if (status == null || status.isBlank()) {
            return null;
        }
        try {
            return CouponDisplayStatus.valueOf(status.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException ex) {
            throw new IllegalArgumentException("Trạng thái lọc không hợp lệ (chấp nhận: "
                    + Arrays.toString(CouponDisplayStatus.values()) + ")");
        }
    }

    /** "Đã có usage" = có dòng coupon_usages bất kỳ trạng thái hoặc usedCount &gt; 0 (ADR-022). */
    private boolean hasUsage(Coupon coupon) {
        return coupon.getUsedCount() > 0 || couponUsageRepository.existsByCouponId(coupon.getId());
    }

    private Coupon saveFlush(Coupon coupon, String code) {
        try {
            return couponRepository.saveAndFlush(coupon);
        } catch (DataIntegrityViolationException ex) {
            throw duplicate(code);
        }
    }

    private CouponResponse toResponse(Coupon coupon) {
        return CouponResponse.of(coupon, couponService.displayStatus(coupon, LocalDateTime.now()));
    }

    private static CatalogResourceNotFoundException notFound(Long id) {
        return new CatalogResourceNotFoundException("Không tìm thấy mã giảm giá với ID: " + id);
    }

    private static DuplicateResourceException duplicate(String code) {
        return new DuplicateResourceException("Mã giảm giá " + code + " đã tồn tại");
    }
}
