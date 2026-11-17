package com.techstore.demo;

import com.techstore.product.entity.*;
import com.techstore.product.repository.*;
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

import java.math.BigDecimal;
import java.util.Set;

@Component
public class DemoDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(DemoDataInitializer.class);

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;

    private final CategoryRepository categoryRepository;
    private final BrandRepository brandRepository;
    private final BranchRepository branchRepository;
    private final ProductRepository productRepository;
    private final ProductImageRepository productImageRepository;
    private final InventoryRepository inventoryRepository;

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
                               PasswordEncoder passwordEncoder,
                               CategoryRepository categoryRepository,
                               BrandRepository brandRepository,
                               BranchRepository branchRepository,
                               ProductRepository productRepository,
                               ProductImageRepository productImageRepository,
                               InventoryRepository inventoryRepository) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.categoryRepository = categoryRepository;
        this.brandRepository = brandRepository;
        this.branchRepository = branchRepository;
        this.productRepository = productRepository;
        this.productImageRepository = productImageRepository;
        this.inventoryRepository = inventoryRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        if (!demoEnabled) {
            return;
        }

        log.info("Khởi tạo vai trò và tài khoản demo an toàn...");
        initUsersAndRoles();

        log.info("Khởi tạo danh mục, thương hiệu, chi nhánh và sản phẩm catalog demo...");
        initCatalogData();
    }

    private void initUsersAndRoles() {
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

        // 4. Tạo hoặc khôi phục mật khẩu chuẩn cho Demo Customer (ROLE_CUSTOMER)
        User customer = userRepository.findByEmail("customer@techstore.vn").orElseGet(() -> {
            User c = new User();
            c.setEmail("customer@techstore.vn");
            c.setPhone("0903456789");
            c.setFullName("Khách hàng Thử nghiệm");
            c.setStatus(UserStatus.ACTIVE);
            c.setRoles(Set.of(roleCustomer));
            return c;
        });
        customer.setPassword(passwordEncoder.encode(customerPassword));
        customer.setStatus(UserStatus.ACTIVE);
        userRepository.save(customer);
        log.info("Đã đồng bộ tài khoản demo CUSTOMER: customer@techstore.vn / {}", customerPassword);

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

    private void initCatalogData() {
        // 1. Categories (Hỗ trợ cấu trúc phân cấp Cha - Con theo ADR-017)
        Category catLaptop = getOrCreateCategory("Laptop", "laptop", "Máy tính xách tay cao cấp", null);
        Category catLaptopVanPhong = getOrCreateCategory("Laptop văn phòng & Học tập", "laptop-van-phong", "Laptop văn phòng mỏng nhẹ", catLaptop);
        Category catLaptopGaming = getOrCreateCategory("Laptop chơi game (Gaming)", "laptop-gaming", "Laptop gaming cấu hình cao", catLaptop);
        Category catLaptopMongNhe = getOrCreateCategory("Laptop mỏng nhẹ thời trang", "laptop-mong-nhe", "Laptop thời trang mỏng nhẹ", catLaptop);
        Category catLaptopWorkstation = getOrCreateCategory("Dòng máy trạm MSI Workstation", "laptop-workstation", "Máy trạm đồ họa chuyên nghiệp", catLaptop);

        Category catPhone = getOrCreateCategory("Điện thoại", "dien-thoai", "Điện thoại thông minh", null);
        Category catMonitor = getOrCreateCategory("Màn hình", "man-hinh", "Màn hình sắc nét độ phân giải cao", null);
        Category catAudio = getOrCreateCategory("Âm thanh", "am-thanh", "Thiết bị âm thanh chính hãng", null);
        getOrCreateCategory("Phụ kiện", "phu-kien", "Phụ kiện công nghệ", null);

        // 2. Brands
        Brand brandNova = getOrCreateBrand("Nova", "nova", "Thương hiệu Nova Technology");
        Brand brandOrbit = getOrCreateBrand("Orbit", "orbit", "Thương hiệu Orbit Smart Devices");
        Brand brandVista = getOrCreateBrand("Vista", "vista", "Thương hiệu Vista Displays");
        Brand brandEcho = getOrCreateBrand("Echo", "echo", "Thương hiệu Echo Audio Systems");

        // 3. Branches
        Branch branchQ1 = getOrCreateBranch("Chi nhánh Quận 1", "02811112222", "123 Lê Lợi, Quận 1, TP.HCM", ActiveStatus.ACTIVE);
        Branch branchQ7 = getOrCreateBranch("Chi nhánh Quận 7", "02833334444", "456 Nguyễn Thị Thập, Quận 7, TP.HCM", ActiveStatus.ACTIVE);
        Branch branchMaintenance = getOrCreateBranch("Kho bảo trì", "02855556666", "789 Kha Vạn Cân, TP.Thủ Đức, TP.HCM", ActiveStatus.INACTIVE);

        // 4. Products (8+ active, 1 out of stock, 1 inactive)
        // 4.1 Laptop Nova 14
        createProductWithImagesAndInventory(
                catLaptop, brandNova,
                "Laptop Nova 14", "nova-14", "LAP-NOV-14",
                new BigDecimal("18990000"), new BigDecimal("15000000"),
                "Laptop Nova 14 mang đến hiệu năng ấn tượng trong thiết kế gọn nhẹ. Màn hình sắc nét cùng thời lượng pin bền bỉ hỗ trợ tối đa cho công việc và học tập hằng ngày.",
                """
                {
                  "summary": "14 inch · RAM 16 GB · SSD 512 GB",
                  "items": [
                    {"label": "Kích thước màn hình", "value": "14 inch IPS QHD (2560 × 1600)"},
                    {"label": "Bộ vi xử lý", "value": "8 nhân, xung nhịp tối đa 4.5 GHz"},
                    {"label": "Bộ nhớ RAM", "value": "16 GB LPDDR5 6400 MHz"},
                    {"label": "Ổ cứng", "value": "512 GB SSD NVMe PCIe 4.0"},
                    {"label": "Trọng lượng", "value": "1.38 kg"},
                    {"label": "Bảo hành", "value": "12 tháng chính hãng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80", "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7, branchMaintenance},
                new int[]{5, 8, 20}
        );

        // 4.2 Điện thoại Orbit 6
        createProductWithImagesAndInventory(
                catPhone, brandOrbit,
                "Điện thoại Orbit 6", "orbit-6", "PHO-ORB-06",
                new BigDecimal("8990000"), new BigDecimal("7000000"),
                "Điện thoại Orbit 6 sở hữu màn hình OLED 120Hz mượt mà, cụm camera sắc nét và thời lượng pin cả ngày dài.",
                """
                {
                  "summary": "OLED 6,1 inch · Bộ nhớ 128 GB",
                  "items": [
                    {"label": "Màn hình", "value": "6.1 inch Super AMOLED 120Hz"},
                    {"label": "Bộ nhớ trong", "value": "128 GB"},
                    {"label": "Camera chính", "value": "50 MP + 12 MP góc siêu rộng"},
                    {"label": "Dung lượng pin", "value": "4500 mAh, sạc nhanh 33W"},
                    {"label": "Hệ điều hành", "value": "Android 14"},
                    {"label": "Bảo hành", "value": "12 tháng chính hãng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1511707171634-5f897ff02560?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7},
                new int[]{12, 6}
        );

        // 4.3 Màn hình Vista 27
        createProductWithImagesAndInventory(
                catMonitor, brandVista,
                "Màn hình Vista 27", "vista-27", "MON-VIS-27",
                new BigDecimal("5490000"), new BigDecimal("4000000"),
                "Màn hình Vista 27 với tấm nền IPS 2K mang đến màu sắc trung thực, góc nhìn rộng và tần số quét 100Hz tối ưu cho đồ họa và giải trí.",
                """
                {
                  "summary": "27 inch · QHD 2K · 100 Hz",
                  "items": [
                    {"label": "Kích thước màn hình", "value": "27 inch IPS QHD (2560 × 1440)"},
                    {"label": "Tần số quét", "value": "100 Hz"},
                    {"label": "Thời gian phản hồi", "value": "1 ms"},
                    {"label": "Độ phủ màu", "value": "99% sRGB"},
                    {"label": "Cổng kết nối", "value": "HDMI 2.0, DisplayPort 1.4, USB-C 65W"},
                    {"label": "Bảo hành", "value": "36 tháng chính hãng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7},
                new int[]{7, 3}
        );

        // 4.4 Tai nghe Echo Air
        createProductWithImagesAndInventory(
                catAudio, brandEcho,
                "Tai nghe Echo Air", "echo-air", "AUD-ECH-AIR",
                new BigDecimal("2490000"), new BigDecimal("1800000"),
                "Tai nghe không dây Echo Air với công nghệ chống ồn chủ động ANC tiên tiến, mang lại không gian âm nhạc tĩnh lặng tuyệt đối.",
                """
                {
                  "summary": "Chống ồn chủ động ANC · Pin 32h",
                  "items": [
                    {"label": "Loại tai nghe", "value": "True Wireless In-ear"},
                    {"label": "Chống ồn", "value": "ANC chủ động kết hợp micro kép"},
                    {"label": "Thời lượng pin", "value": "8 giờ tai nghe + 24 giờ hộp sạc"},
                    {"label": "Kết nối", "value": "Bluetooth 5.3, hỗ trợ codec AAC/SBC"},
                    {"label": "Kháng nước", "value": "IPX5"},
                    {"label": "Bảo hành", "value": "12 tháng chính hãng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7},
                new int[]{15, 10}
        );

        // 4.5 Laptop Nova 16 Pro (Thuộc danh mục con catLaptopGaming)
        createProductWithImagesAndInventory(
                catLaptopGaming, brandNova,
                "Laptop Nova 16 Pro", "nova-16", "LAP-NOV-16",
                new BigDecimal("28990000"), new BigDecimal("23000000"),
                "Laptop đồ họa chuyên nghiệp Nova 16 Pro với màn hình 16 inch 3.2K, card đồ họa rời hiệu năng mạnh mẽ cho dựng phim và thiết kế 3D.",
                """
                {
                  "summary": "16 inch · RAM 32 GB · RTX 4060",
                  "items": [
                    {"label": "Màn hình", "value": "16 inch 3.2K 165Hz (3200 × 2000)"},
                    {"label": "Bộ vi xử lý", "value": "14 nhân 20 luồng, xung nhịp 5.0 GHz"},
                    {"label": "Bộ nhớ RAM", "value": "32 GB DDR5 5600 MHz"},
                    {"label": "Ổ cứng", "value": "1 TB SSD NVMe PCIe 4.0"},
                    {"label": "Card đồ họa", "value": "NVIDIA GeForce RTX 4060 8GB"},
                    {"label": "Bảo hành", "value": "24 tháng chính hãng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1541807084-5c52b6b3adef?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7},
                new int[]{4, 2}
        );

        // 4.6 Điện thoại Orbit Mini
        createProductWithImagesAndInventory(
                catPhone, brandOrbit,
                "Điện thoại Orbit Mini", "orbit-mini", "PHO-ORB-MINI",
                new BigDecimal("6490000"), new BigDecimal("5000000"),
                "Thiết kế nhỏ gọn vừa vặn trong lòng bàn tay, Orbit Mini mang đến trải nghiệm linh hoạt mà không đánh đổi về thời lượng pin.",
                """
                {
                  "summary": "5,4 inch · RAM 6 GB · Nhỏ gọn",
                  "items": [
                    {"label": "Màn hình", "value": "5.4 inch OLED FHD+"},
                    {"label": "Bộ nhớ", "value": "6 GB RAM, 128 GB ROM"},
                    {"label": "Pin", "value": "4000 mAh, sạc 25W"},
                    {"label": "Trọng lượng", "value": "145 g"},
                    {"label": "Bảo hành", "value": "12 tháng chính hãng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1580910051074-3eb694886505?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7},
                new int[]{9, 11}
        );

        // 4.7 Màn hình Vista 24
        createProductWithImagesAndInventory(
                catMonitor, brandVista,
                "Màn hình Vista 24", "vista-24", "MON-VIS-24",
                new BigDecimal("3290000"), new BigDecimal("2500000"),
                "Màn hình văn phòng tiêu chuẩn 24 inch FHD, viền siêu mỏng 3 cạnh và công nghệ bảo vệ mắt chống nhấp nháy Flicker-Free.",
                """
                {
                  "summary": "24 inch · Full HD · IPS 75Hz",
                  "items": [
                    {"label": "Kích thước", "value": "23.8 inch IPS FHD (1920 × 1080)"},
                    {"label": "Tần số quét", "value": "75 Hz"},
                    {"label": "Công nghệ", "value": "Low Blue Light, Flicker-Free"},
                    {"label": "Cổng kết nối", "value": "HDMI, VGA"},
                    {"label": "Bảo hành", "value": "24 tháng chính hãng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1585792180666-f7347c490ee2?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7},
                new int[]{8, 5}
        );

        // 4.8 Loa Echo Studio
        createProductWithImagesAndInventory(
                catAudio, brandEcho,
                "Loa Echo Studio", "echo-studio", "AUD-ECH-STU",
                new BigDecimal("4190000"), new BigDecimal("3200000"),
                "Loa để bàn chất âm Hi-Res sắc sảo, dải trầm sâu lắng và hỗ trợ kết nối đa phòng thông minh qua Wi-Fi.",
                """
                {
                  "summary": "Âm thanh Hi-Res · Công suất 60W",
                  "items": [
                    {"label": "Công suất", "value": "60W RMS"},
                    {"label": "Dải tần", "value": "45 Hz - 20 kHz"},
                    {"label": "Kết nối", "value": "Wi-Fi, Bluetooth 5.0, AUX 3.5mm, Optical"},
                    {"label": "Bảo hành", "value": "12 tháng chính hãng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1545454675-3531b543be5d?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7},
                new int[]{6, 4}
        );

        // 4.9 Sản phẩm HẾT HÀNG (để kiểm thử inStock = false, maxBranchQuantity = 0)
        createProductWithImagesAndInventory(
                catLaptop, brandNova,
                "Laptop Nova Lite (Hết hàng)", "nova-out-of-stock", "LAP-NOV-OOS",
                new BigDecimal("12990000"), new BigDecimal("10000000"),
                "Phiên bản giới hạn tạm thời hết hàng tại tất cả chi nhánh đang hoạt động.",
                """
                {
                  "summary": "13.3 inch · RAM 8 GB · Hết hàng",
                  "items": [
                    {"label": "Màn hình", "value": "13.3 inch Full HD"},
                    {"label": "Tình trạng tồn", "value": "Hết hàng"}
                  ]
                }
                """,
                ActiveStatus.ACTIVE,
                new String[]{"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80"},
                new Branch[]{branchQ1, branchQ7},
                new int[]{0, 0}
        );

        // 4.10 Sản phẩm INACTIVE (ngừng kinh doanh - kiểm thử loại trừ khỏi catalog và trả về 404)
        createProductWithImagesAndInventory(
                catLaptop, brandNova,
                "Laptop Nova Cũ (Ngừng kinh doanh)", "nova-archived", "LAP-NOV-ARC",
                new BigDecimal("9990000"), new BigDecimal("8000000"),
                "Sản phẩm đời cũ đã ngừng kinh doanh, không hiển thị trên danh mục công khai.",
                """
                {
                  "summary": "14 inch · Ngừng kinh doanh",
                  "items": [
                    {"label": "Trạng thái", "value": "Ngừng kinh doanh"}
                  ]
                }
                """,
                ActiveStatus.INACTIVE,
                new String[]{"https://images.unsplash.com/photo-1496181133206-80ce9b88a853?w=800&q=80"},
                new Branch[]{branchQ1},
                new int[]{10}
        );
    }

    private Category getOrCreateCategory(String name, String slug, String description, Category parent) {
        return categoryRepository.findBySlug(slug).orElseGet(() -> {
            Category category = new Category(name, slug, description, parent);
            return categoryRepository.save(category);
        });
    }

    private Category getOrCreateCategory(String name, String slug, String description) {
        return getOrCreateCategory(name, slug, description, null);
    }

    private Brand getOrCreateBrand(String name, String slug, String description) {
        return brandRepository.findBySlug(slug).orElseGet(() -> {
            Brand brand = new Brand(name, slug, description);
            return brandRepository.save(brand);
        });
    }

    private Branch getOrCreateBranch(String name, String phone, String address, ActiveStatus status) {
        return branchRepository.findFirstByNameOrderByIdAsc(name).orElseGet(() -> {
            Branch branch = new Branch(name, phone, address, status);
            return branchRepository.save(branch);
        });
    }

    private void createProductWithImagesAndInventory(Category category, Brand brand,
                                                    String name, String slug, String sku,
                                                    BigDecimal price, BigDecimal costPrice,
                                                    String description, String specifications,
                                                    ActiveStatus status,
                                                    String[] imageUrls,
                                                    Branch[] branches, int[] quantities) {
        Product product = productRepository.findBySlug(slug).orElseGet(() -> {
            Product p = new Product(category, brand, name, slug, sku, price, costPrice, description, specifications, status);
            return productRepository.save(p);
        });

        // Seed images if not existing
        for (int i = 0; i < imageUrls.length; i++) {
            String publicId = "products/" + slug + "-" + (i + 1);
            if (!productImageRepository.existsByCloudinaryPublicId(publicId)) {
                ProductImage img = new ProductImage(product, imageUrls[i], publicId, i == 0, i + 1);
                productImageRepository.save(img);
            }
        }

        // Seed inventories if not existing
        for (int i = 0; i < branches.length; i++) {
            Branch b = branches[i];
            int qty = quantities[i];
            if (inventoryRepository.findByProductIdAndBranchId(product.getId(), b.getId()).isEmpty()) {
                Inventory inv = new Inventory(product, b, qty, 5);
                inventoryRepository.save(inv);
            }
        }
    }

    private Role getOrCreateRole(String name) {
        return roleRepository.findByName(name)
                .orElseGet(() -> roleRepository.save(new Role(name)));
    }
}
