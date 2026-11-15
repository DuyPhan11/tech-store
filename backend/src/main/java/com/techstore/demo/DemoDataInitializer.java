package com.techstore.demo;

import com.techstore.user.entity.Role;
import com.techstore.user.entity.User;
import com.techstore.user.entity.UserStatus;
import com.techstore.user.repository.RoleRepository;
import com.techstore.user.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.Set;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    @Value("${app.demo.enabled:true}")
    private boolean demoEnabled;

    @Value("${app.demo.admin-password:Admin@123}")
    private String adminPassword;

    @Value("${app.demo.staff-password:Staff@123}")
    private String staffPassword;

    @Value("${app.demo.customer-password:Customer@123}")
    private String customerPassword;

    public DemoDataInitializer(UserRepository userRepository,
                               RoleRepository roleRepository,
                               PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!demoEnabled) {
            return;
        }

        log.info("Khởi tạo vai trò và tài khoản demo an toàn...");

        // 1. Tạo 3 vai trò chuẩn: ROLE_CUSTOMER, ROLE_STAFF, ROLE_ADMIN
        Role roleCustomer = getOrCreateRole("ROLE_CUSTOMER");
        Role roleStaff = getOrCreateRole("ROLE_STAFF");
        Role roleAdmin = getOrCreateRole("ROLE_ADMIN");

        // 2. Tạo tài khoản Demo Admin (ROLE_ADMIN)
        if (!userRepository.existsByEmail("admin@techstore.vn")) {
            User admin = new User();
            admin.setEmail("admin@techstore.vn");
            admin.setPhone("0901234567");
            admin.setFullName("Administrator");
            admin.setPassword(passwordEncoder.encode(adminPassword));
            admin.setStatus(UserStatus.ACTIVE);
            admin.setRoles(Set.of(roleAdmin));
            userRepository.save(admin);
            log.info("Tạo thành công tài khoản demo ADMIN: admin@techstore.vn / 0901234567");
        }

        // 3. Tạo tài khoản Demo Staff (ROLE_STAFF)
        if (!userRepository.existsByEmail("staff@techstore.vn")) {
            User staff = new User();
            staff.setEmail("staff@techstore.vn");
            staff.setPhone("0902345678");
            staff.setFullName("Nhân viên Cửa hàng");
            staff.setPassword(passwordEncoder.encode(staffPassword));
            staff.setStatus(UserStatus.ACTIVE);
            staff.setRoles(Set.of(roleStaff));
            userRepository.save(staff);
            log.info("Tạo thành công tài khoản demo STAFF: staff@techstore.vn / 0902345678");
        }

        // 4. Tạo tài khoản Demo Customer (ROLE_CUSTOMER)
        if (!userRepository.existsByEmail("customer@techstore.vn")) {
            User customer = new User();
            customer.setEmail("customer@techstore.vn");
            customer.setPhone("0903456789");
            customer.setFullName("Khách hàng Thử nghiệm");
            customer.setPassword(passwordEncoder.encode(customerPassword));
            customer.setStatus(UserStatus.ACTIVE);
            customer.setRoles(Set.of(roleCustomer));
            userRepository.save(customer);
            log.info("Tạo thành công tài khoản demo CUSTOMER: customer@techstore.vn / 0903456789");
        }

        // 5. Tạo tài khoản Demo Locked (status = LOCKED để kiểm thử 403 Forbidden)
        if (!userRepository.existsByEmail("locked@techstore.vn")) {
            User locked = new User();
            locked.setEmail("locked@techstore.vn");
            locked.setPhone("0909999999");
            locked.setFullName("Tài khoản Bị khóa");
            locked.setPassword(passwordEncoder.encode(customerPassword));
            locked.setStatus(UserStatus.LOCKED);
            locked.setRoles(Set.of(roleCustomer));
            userRepository.save(locked);
            log.info("Tạo thành công tài khoản demo LOCKED: locked@techstore.vn / 0909999999");
        }
    }

    private Role getOrCreateRole(String name) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(new Role(name)));
    }
}
