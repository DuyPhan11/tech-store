package com.techstore.checkout;

import com.techstore.checkout.dto.CheckoutRequest;
import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.RoleRepository;
import com.techstore.user.repository.UserRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.ThreadLocalRandom;

/** Dữ liệu test ADR-024: khách hàng mới và CheckoutRequest dựng sẵn. */
@Component
public class CheckoutCouponSupport {

    public static final String PASSWORD = "Customer@123";

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    public CheckoutCouponSupport(UserRepository userRepository, RoleRepository roleRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    /** Khách hàng ROLE_CUSTOMER mới (email/SĐT ngẫu nhiên) để mỗi test độc lập về usage coupon. */
    public User newCustomer() {
        Role role = roleRepository.findByName("ROLE_CUSTOMER").orElseThrow();
        String suffix = UUID.randomUUID().toString().substring(0, 8);
        User u = new User();
        u.setEmail("cp-" + suffix + "@techstore.vn");
        u.setPhone("09" + String.format("%08d", ThreadLocalRandom.current().nextInt(100_000_000)));
        u.setFullName("Khách Coupon " + suffix);
        u.setPassword(passwordEncoder.encode(PASSWORD));
        u.setStatus(UserStatus.ACTIVE);
        u.setRoles(Set.of(role));
        return userRepository.save(u);
    }

    public static CheckoutRequest buyNow(Long productId, int qty, Long branchId, String couponCode) {
        CheckoutRequest r = base(branchId, couponCode);
        r.setSource("BUY_NOW");
        r.setProductId(productId);
        r.setQuantity(qty);
        return r;
    }

    public static CheckoutRequest cart(List<Long> itemIds, Long branchId, String couponCode) {
        CheckoutRequest r = base(branchId, couponCode);
        r.setSource("CART");
        r.setSelectedCartItemIds(itemIds);
        return r;
    }

    private static CheckoutRequest base(Long branchId, String couponCode) {
        CheckoutRequest r = new CheckoutRequest();
        r.setBranchId(branchId);
        r.setPaymentMethod("COD");
        r.setCouponCode(couponCode);
        r.setRecipientName("Người nhận Coupon");
        r.setRecipientPhone("0912345678");
        r.setShippingAddress("1 Lê Lợi, Quận 1, TP.HCM");
        return r;
    }
}
