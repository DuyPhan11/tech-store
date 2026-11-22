# Screen Map — Tech Store

> Tài liệu chuẩn ánh xạ tất cả các màn hình, tuyến đường (routes), Use Case nghiệp vụ và liên kết trực tiếp tới frame trên Figma.

## 1. Nguồn chuẩn Figma (Figma Authority)

- **File thiết kế chuẩn:** [eCommerce Template — Tech Store (Community)](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=0-1&p=f&t=u6gcwA1H5qa9cU8x-0)
- **File Key:** `dQPJxUHLSAcVYQoh9wH8Mn`
- **Canvas / Pages trong file:**
  1. `Desktop` (`node-id=0:1`): [Mở Desktop Canvas](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=0-1&p=f&t=u6gcwA1H5qa9cU8x-0) — Toàn bộ 14 màn hình chính và các components nghiệp vụ phiên bản máy tính.
  2. `Tablet` (`node-id=171:0`): Các màn hình phiên bản máy tính bảng.
  3. `Mobile` (`node-id=169:0`): Các màn hình phiên bản điện thoại di động.
  4. `Preview` (`node-id=544:12589`): Ảnh thu nhỏ và tài liệu giới thiệu template.

---

## 2. Bảng ánh xạ Use Case & Tuyến đường (Customer & Public)

Dưới đây là liên kết frame trực tiếp trên Figma cho từng màn hình của phân hệ Khách hàng (Customer & Public):

| Tuyến đường (Route) | Màn hình trên Figma | Use Case | Quyền | Figma Frame URL | API Dependency |
|---|---|---|---|---|---|
| `/` | `Home - 1` (`49:53`, 1920×4684) | UC04 | Public | [Frame Home - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=49-53) | `GET /api/products` |
| `/products` | `Catalog - 1` (`73:291`, 1920×3015) | UC04 | Public | [Frame Catalog - 1 (Grid)](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=73-291) | `GET /api/products` |
| `/products` (List view) | `Catalog  - List view - 1` (`187:124`, 1920×3015) | UC04 | Public | [Frame Catalog - List view](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=187-124) | `GET /api/products` |
| `/products/:slug` (Tổng quan) | `Product - About Product - 1` (`73:4229`, 1920×3486) | UC05 | Public/Customer | [Frame Product - About](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=73-4229) | `GET /api/products/{slug}` |
| `/products/:slug` (Chi tiết) | `Product - Details - 1` (`126:2217`, 1920×3558) | UC05 | Public/Customer | [Frame Product - Details](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=126-2217) | `GET /api/products/{slug}` |
| `/products/:slug` (Thông số) | `Product - Specs - 1` (`126:2561`, 1920×3486) | UC05 | Public/Customer | [Frame Product - Specs](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=126-2561) | `GET /api/products/{slug}` |
| Thẻ sản phẩm | `Product Card - 1` (`121:16844`, 234×319) | UC04/05 | Public | [Symbol Product Card](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=121-16844) | Dữ liệu sản phẩm |
| Thẻ hover | `Hover - 1` (`642:11380`, 234×400) | UC04 | Public | [Symbol Hover - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=642-11380) | Dữ liệu sản phẩm |
| `/login` | `Register - 1` (Khối Registered Customers, `133:3347`) | UC02 | Guest | [Frame Customer Login](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=133-3347) | `POST /api/auth/login` |
| `/register` | `Register - 1` (Khối New Customers, `133:3347`) | UC01 | Guest | [Frame New Customer Register](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=133-3347) | `POST /api/auth/register/request-otp` |
| `/forgot-password` | `Register - 1` (Khối Forgot Your Password?, `133:3573`) | UC03 | Guest | [Node Forgot Password](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=133-3573) | `POST /api/auth/password/request-otp` |
| `/cart` (Giỏ có hàng) | `Shopping Cart - 2` (`133:3612`, 1920×2461) | UC06 | Customer | [Frame Shopping Cart - 2](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=133-3612) | `GET/POST/PATCH/DELETE /api/cart` |
| `/cart` (Giỏ trống) | `Shopping Cart - 1` (`133:4139`, 1920×1841) | UC06 | Customer | [Frame Shopping Cart - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=133-4139) | `GET /api/cart` |
| Drawer / Popup giỏ hàng | `Minicart - 1` (`57:765`, 310×511) | UC06 | Customer | [Symbol Minicart - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=57-765) | `GET /api/cart` |
| Mega-menu Điều hướng | `Hovered Menu - 1` (`65:467` / `59:740`, 1920×380) | UC04 | Public | [Symbol Hovered Menu - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=65-467) | Danh mục & Sản phẩm |
| `/checkout` | `Checkout - 1` (`133:4812`, 1920×2611) | UC07 | Customer | [Frame Checkout - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=133-4812) | `POST /api/checkout` |
| `/profile` & `/orders` | `User Account - 1` (`137:115`, 1920×1788) | UC08/10 | Customer | [Frame User Account - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=137-115) | `GET /api/me`, `GET /api/orders/me` |
| Modal Đánh giá | `Product - Details - 1` (Khối Reviews, `126:2217`) | UC09 | Customer | [Frame Product Reviews](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=126-2217) | `POST /api/reviews` |
| Menu Tài khoản popup | `Account - 1` (`642:11379`, 232×183) | UC02/10 | Customer | [Symbol Account - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=642-11379) | Auth state |
| `/about` | ` About Us - 1` (`126:4439`, 1920×4897) | Chung | Public | [Frame About Us - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=126-4439) | Static |
| `/contact` | `Contact Us - 1` (`133:3117`, 1920×1795) | Chung | Public | [Frame Contact Us - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=133-3117) | Static |
| `/faqs` | `FAQ - 1` (`133:4451`, 1920×3731) | Chung | Public | [Frame FAQ - 1](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=133-4451) | Static |
| Header hoàn chỉnh | `Component 14` (`63:968`, 1920×136) | Toàn site | Mọi vai trò | [Component Header](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=63-968) | Auth & Cart state |
| Footer hoàn chỉnh | `Group 35` (`73:4010`, 1920×520) | Toàn site | Mọi vai trò | [Symbol Footer](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=73-4010) | Static |

---

## 3. Bảng ánh xạ Phân hệ Quản trị (Admin & Staff: UC11 – UC20)

Layout Admin kế thừa toàn bộ hệ thống Component (Bảng dữ liệu, Breadcrumb, Sidebar navigation, Badges, Form Inputs, Nút bấm Pill) từ phong cách công nghệ `Tech Store Community`:

| Tuyến đường (Route) | Chức năng nghiệp vụ | UC | Quyền hạn | Cấu trúc UI tham chiếu từ Figma | API Dependency |
|---|---|---|---|---|---|
| `/admin` | Thống kê Dashboard & Doanh thu | UC17 | Staff, Admin | Card số liệu viền `#CACDD8` + Bảng đơn hàng gần đây | `GET /api/admin/dashboard/stats` |
| `/admin/products` | Quản lý sản phẩm | UC11 | Staff, Admin | Bảng sản phẩm, lọc danh mục/trạng thái, modal thêm/sửa kèm ảnh (ADR-019) | `GET/POST /api/admin/products`, `GET/PUT /api/admin/products/{id}`, `PATCH /api/admin/products/{id}/status` |
| `/admin/catalog` | Quản lý danh mục & thương hiệu | UC12 | Admin | Bảng phân cấp danh mục + thương hiệu (`73:3935`) | `GET/POST/PUT /api/admin/categories`, `PATCH .../{id}/status`; tương tự `/api/admin/brands` (ADR-018, không DELETE) |
| `/admin/coupons` | Quản lý mã khuyến mãi | UC13 | Staff, Admin | Bảng mã giảm giá, lọc mã/trạng thái (5 trạng thái), modal tạo/sửa, bật/tắt (ADR-022) | `GET/POST /api/admin/coupons`, `GET/PUT /api/admin/coupons/{id}`, `PATCH /api/admin/coupons/{id}/status` |
| `/admin/orders` | Quản lý và xử lý đơn hàng | UC14 | Staff, Admin | Bảng đơn hàng từ `User Account - 1` (`137:115`), tab trạng thái có số đếm, tìm kiếm, phân trang, modal chi tiết, modal lý do hủy (ADR-023) | `GET /api/admin/orders`, `GET /api/admin/orders/{id}`, `PATCH /api/admin/orders/{id}/status` |
| `/admin/users` | Quản lý người dùng & khóa tài khoản | UC15 | Admin | Bảng khách hàng, nút Lock/Unlock, modal thông tin | `GET/PATCH /api/admin/users` |
| `/admin/staff` | Quản lý nhân viên & phân quyền | UC16 | Admin | Bảng nhân viên (ROLE_STAFF), thêm nhân viên mới | `CRUD /api/admin/staff` |
| `/admin/inventory` | Quản lý tồn kho & chuyển kho | UC18 | Staff, Admin | Bảng tồn theo chi nhánh, nút nhanh −1/+5/+20, modal điều chỉnh & chuyển kho (ADR-021) | `GET /api/admin/inventories`, `GET /api/admin/inventories/branches`, `POST /api/admin/inventories/adjust`, `POST /api/admin/inventories/transfer` |
| `/admin/branches` | Quản lý chi nhánh | UC19 | Admin | Bảng chi nhánh, modal thêm/sửa, cập nhật trạng thái ACTIVE/INACTIVE (ADR-020) | `GET/POST /api/admin/branches`, `PUT /api/admin/branches/{id}`, `PATCH /api/admin/branches/{id}/status` |
| `/admin/reviews` | Kiểm duyệt đánh giá khách hàng | UC20 | Admin | Bảng đánh giá, xem nội dung, ẩn vi phạm (HIDDEN_BY_ADMIN) | `PATCH /api/admin/reviews/{id}` |

---

## 4. Quy tắc kích thước & bố cục (Layout Metrics)

1. **Desktop Container:**
   - Chiều rộng khung canvas chuẩn: `1920px`.
   - Vùng nội dung trung tâm (Max Content Width): `1398px` căn giữa (`margin: 0 auto`, lề hai bên `261px`).
   - Lưới cột chuẩn (Grid): Lưới 4-5 cột sản phẩm (`width: 234px`), khoảng cách cột `16px` – `24px`.
2. **Breakpoints Responsive:**
   - Mobile: tham chiếu canvas `Mobile` (`node-id=169:0`), chiều rộng dưới `768px`.
   - Tablet: tham chiếu canvas `Tablet` (`node-id=171:0`), chiều rộng từ `768px` đến `1199px`.
   - Desktop: tham chiếu canvas `Desktop` (`node-id=0:1`), chiều rộng từ `1200px` trở lên.
3. **Nút bấm đặc trưng (Pill Buttons):**
   - Nút hành động chính (Our Deals, Sign In, Subscribe, Add to Cart) có bo góc viên thuốc tròn `50px` (`rounded-[50px]`).
   - Ô nhập form (Inputs, Select) có bo góc nhẹ `4px` và viền sắc nét `#CACDD8`.
