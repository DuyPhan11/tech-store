# Architectural Decision Log

Các quyết định dưới đây phản ánh thiết kế hiện đang dự kiến; xác nhận bằng PR/duyệt nhóm khi bắt đầu code.

| ID | Quyết định | Trạng thái | Ảnh hưởng |
|---|---|---|---|
| ADR-001 | Một monorepo React + Spring Boot + database + docs | Proposed | Repo cấu trúc chung |
| ADR-002 | MySQL 8, thiết kế 21 bảng từ Phần 10 | Proposed; not DB-tested | Entity, migration, ERD |
| ADR-003 | Cloudinary upload server-side; lưu URL/public ID | Proposed | Images/profile/admin |
| ADR-004 | COD + ONLINE_MOCK, không tích hợp tiền thật | Proposed; await scope approval | Checkout/payment |
| ADR-005 | Backend source of truth cho giá, stock, coupon | Proposed | Checkout invariants |
| ADR-006 | Figma approved frames/tokens là chuẩn UI | Needs Figma URL | Frontend components |
| ADR-007 | Frontend dùng React + TypeScript, Vite, React Router, CSS Modules + CSS Variables và npm | Frontend đã chốt. Phiên bản Java, chiến lược xác thực và migration còn mở. | Scaffold |
| ADR-008 | Request idempotency cho checkout (mechanism) | Approved | Checkout/API/schema |
| ADR-009 | Tạm triển khai Home Page theo quy trình Code-first | Superseded by ADR-011 | Home Page và việc sử dụng Figma MCP |
| ADR-010 | Định tuyến chi tiết sản phẩm bằng Slug và quy tắc tồn kho công khai (UC04/UC05) | Approved | Routing, catalog types, API contract, sequence |
| ADR-011 | Chuẩn hóa hệ thống thiết kế từ Clicon eCommerce Marketplace Figma Template | Superseded by ADR-012 | Design System, Screen Map, UI Implementation |
| ADR-012 | Chuyển đổi thiết kế chuẩn sang eCommerce Template — Tech Store (Community) | Approved | Design System, Screen Map, UI Planning |
| ADR-013 | Triển khai Mini-Cart Dropdown và Mega-Menu Flyout trên Customer Header | Approved | Layout, Header, Mini-Cart, Mega-Menu |
| ADR-014 | Chuẩn hóa căn lề toàn trang, thanh Toolbar bộ lọc và kích thước nút bấm theo Figma Catalog - 1 | Approved | Catalog Layout, Filter Sidebar, CSS Modules |
| ADR-015 | Bản địa hóa tiếng Việt toàn diện cho phân hệ khách hàng (UI Localization) | Approved | Customer Layout, Catalog, Cart, Checkout, Auth |
| ADR-016 | Hoàn thiện giao diện toàn diện Không gian quản trị (Admin & Staff) chuẩn phong cách Tech Store | Approved | AdminLayout, Dashboard, Products, Orders, Inventory, Users |
| ADR-017 | Bổ sung phân cấp danh mục đa tầng (parent_id) và nâng cấp bộ lọc danh mục cha - con | Approved | Schema, Categories, Catalog API, MegaMenu |
| ADR-018 | Hợp đồng API quản trị danh mục/thương hiệu (UC12) và danh sách thương hiệu công khai | Approved (A2: chỉ vô hiệu hóa; A5: giữ quốc gia xuất xứ) | API contract, SecurityConfig, Admin Catalog UI, Catalog filters |
| ADR-019 | Hợp đồng API quản trị sản phẩm (UC11) và upload ảnh Cloudinary qua backend | Proposed | API contract, Admin Products UI, Cloudinary service, pom.xml, application.yml |
| ADR-020 | Hợp đồng API quản trị chi nhánh (UC19), quy tắc vô hiệu hóa và phạm vi hoãn | Proposed | API contract, Admin Branches UI, BranchRepository, OrderRepository |
| ADR-021 | Hợp đồng API tồn kho / chuyển kho (UC18), khóa giao dịch và audit log | Proposed | API contract, Admin Inventory UI, InventoryRepository, audit_logs entity |
| ADR-022 | Hợp đồng API quản trị coupon (UC13), CouponService dùng chung và coupon-preview | Proposed | API contract, Admin Coupons UI, coupon entities, GlobalExceptionHandler, DemoDataInitializer, checkoutApi (FE) |
| ADR-023 | Hợp đồng API quản trị đơn hàng (UC14), luồng trạng thái, hủy đơn dùng chung và audit | Proposed | API contract, Admin Orders UI, OrderRepository, OrderServiceImpl (tách lõi hủy), audit_logs |

### ADR-009 — Tạm triển khai Home Page theo quy trình Code-first

Ngày quyết định: 15/11/2026.

- Tài khoản Figma Starter đã hết hạn mức MCP. Nhóm tạm triển khai Home Page bằng code, sử dụng Design System và các layout React đã duyệt.
- Mọi thay đổi giao diện vẫn phải tuân thủ [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md).
- Trong tất cả nhiệm vụ tiếp theo, nhóm không gọi Figma MCP cho đến khi người phụ trách dự án thông báo đã có quyền truy cập trở lại.
- Khi Figma Education được kích hoạt và người phụ trách xác nhận quyền truy cập, nhóm sẽ đồng bộ giao diện Home Page từ code vào Figma, sau đó cập nhật liên kết frame trong [SCREEN_MAP.md](../design/SCREEN_MAP.md).

### ADR-010 — Thống nhất định tuyến chi tiết sản phẩm bằng Slug và quy tắc tồn kho công khai (UC04/UC05)

Ngày quyết định: 15/11/2026.

- Bối cảnh: UC04 và UC05 cần đường dẫn SEO thân thiện, tìm kiếm theo slug và quy tắc hiển thị tồn kho chính xác theo mô hình đa chi nhánh.
- Quyết định:
  1. Tuyến đường frontend là `/products/:slug`, API công khai tương ứng là `GET /api/products/{slug}`. Backend tra cứu bằng `findBySlug(slug)`. Không dùng fallback slug sang productId trong URL.
  2. Chỉ sản phẩm có trạng thái `ACTIVE` mới hiển thị trong catalog công khai và cho phép truy cập trang chi tiết; sản phẩm `INACTIVE` hoặc không tìm thấy slug trả về 404 Not Found.
  3. Trạng thái tồn kho trên trang chi tiết: `IN_STOCK` nếu tồn tại ít nhất 1 chi nhánh `ACTIVE` có `quantity > 0`; `OUT_OF_STOCK` nếu tất cả chi nhánh `ACTIVE` đều có `quantity = 0`. Giới hạn số lượng chọn mua tại Product Detail sử dụng `MAX(quantity)` của một chi nhánh `ACTIVE` (không cộng dồn SUM giữa các chi nhánh). Giá trị tồn trên frontend chỉ mang tính tham khảo; kiểm tra tồn thực tế sẽ được thực hiện tại checkout (UC07) với `branchId` cụ thể. Không tạo bộ chọn chi nhánh trong UC05.
  4. Nút `BUY_NOW` truyền `productId` và `quantity` trực tiếp tới luồng checkout theo `BUSINESS_RULES.md`, không thay đổi giỏ hàng. Khách chưa đăng nhập cần đăng nhập trước khi `BUY_NOW`.
  5. Đánh giá: Không tạo đánh giá hoặc số sao giả. Trang chi tiết hiển thị trạng thái "Chưa có đánh giá nào cho sản phẩm này" cho đến khi UC09 được tích hợp.
  6. Hình ảnh: Tối đa 8 ảnh/sản phẩm (theo service-level invariant trong SQL), sắp xếp theo `displayOrder`, tối đa 1 ảnh primary, tự sinh alt text từ tên sản phẩm nếu thiếu. Hỗ trợ URL local và Cloudinary trong tương lai.

### ADR-011 — Chuẩn hóa hệ thống thiết kế từ Clicon eCommerce Marketplace Figma Template

Ngày quyết định: 16/11/2026. (Được thay thế bởi ADR-012)

- Bối cảnh: Kết nối Figma MCP đã được kích hoạt và xác thực thành công. Dự án chuyển giao sang sử dụng bộ thiết kế hoàn chỉnh từ template `Clicon - eCommerce Marketplace Website Figma Template (Community)`.
- Quyết định:
  1. File Figma chuẩn chính thức của dự án là `https://www.figma.com/design/YzgZHv6woxK5jAu8cyYDpQ/Clicon---eCommerce-Marketplace-Website-Figma-Template--Community---Community-`.
  2. Toàn bộ 34 màn hình nghiệp vụ trên page `🚀 Website` (`node-id=279-19819`) được ánh xạ đầy đủ vào [SCREEN_MAP.md](../design/SCREEN_MAP.md) tương ứng với 20 Use Cases.
  3. Bảng màu, typography (Public Sans), spacing và thư viện component được chuẩn hóa trong [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md) dựa trên page `🎨 Style Guide` (`node-id=279-1397`) và `⚙️ Component (Website)` (`node-id=279-19818`).
  4. Bãi bỏ quy định tạm thời cấm gọi Figma MCP trong ADR-009; cho phép sử dụng các công cụ Figma MCP để inspect layout, component và design context khi triển khai các Use Case UI tiếp theo.

### ADR-012 — Chuyển đổi thiết kế chuẩn sang eCommerce Template — Tech Store (Community)

Ngày quyết định: 16/11/2026.

- Bối cảnh: Theo yêu cầu của Operator, dự án chuyển đổi file thiết kế chuẩn sang bộ mẫu chuyên biệt về thiết bị máy tính, linh kiện PC và gaming: `eCommerce Template — Tech Store (Community)`.
- Quyết định:
  1. File Figma chuẩn chính thức thay thế toàn bộ file trước đó: `https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=0-1&p=f&t=u6gcwA1H5qa9cU8x-0` (File Key: `dQPJxUHLSAcVYQoh9wH8Mn`).
  2. Cập nhật lại toàn bộ [SCREEN_MAP.md](../design/SCREEN_MAP.md) theo 14 màn hình và các components chính trên page `Desktop` (`node-id=0:1`), cùng các phiên bản `Tablet` (`171:0`) và `Mobile` (`169:0`).
  3. Chuẩn hóa lại [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md):
     - Màu thương hiệu chính (Primary): `#0156FF` (Electric Cobalt Blue / Tech Blue).
     - Màu Top Bar & Footer: `#020202` / `#020203` (Deep Black).
     - Màu viền chuẩn: `#CACDD8`. Nền phụ: `#F5F7FF`. Text chính: `#000000`, Text phụ: `#A2A6B0` / `#666666`.
     - Typography tiêu chuẩn: **Poppins** (Google Fonts).
     - Bán kính bo góc: Pill `50px` (`rounded-[50px]`) cho các nút bấm hành động nổi bật ("Our Deals", "Sign In", "Subscribe", CTA), `4px` cho các ô input và form elements.
  4. Giai đoạn tài liệu hoàn tất, chưa can thiệp vào mã nguồn giao diện frontend cho đến khi có chỉ đạo tiếp theo từ Operator.

### ADR-013 — Triển khai Mini-Cart Dropdown và Mega-Menu Flyout trên Customer Header

Ngày quyết định: 16/11/2026.

- Bối cảnh: Khách hàng cần trải nghiệm rê chuột (hover) trên thanh Header để xem nhanh giỏ hàng thu nhỏ (Mini-Cart) và danh mục mở rộng toàn chiều rộng (Mega-Menu) theo đúng mẫu thiết kế Figma `Minicart - 1` (`57:765`) và `Hovered Menu - 1` (`65:467`).
- Quyết định:
  1. **Mini-Cart Dropdown Flyout:**
     - Tích hợp `MinicartFlyout.tsx` neo trực tiếp dưới icon giỏ hàng ở header với mũi tên nhọn (caret) hướng lên icon.
     - Hiển thị tiêu đề "My Cart (2 item in cart)", nút outline "View or Edit Your Cart", danh sách 2 sản phẩm mẫu rút gọn kèm ảnh thumbnail, số lượng `1 x`, nút xóa `⊗` và sửa `✎`, tổng phụ "Subtotal: $499.00", nút "Go to Checkout" (pill xanh `#0156FF`) và "Check out with PayPal" (pill vàng `#FFB800`).
     - Đảm bảo điều hướng dùng `navigate('/cart')` và `navigate('/checkout')`, không dùng thẻ `<a href="/cart">` để tuân thủ kiểm thử tự động `routes.test.mjs`.
  2. **Mega-Menu Dropdown Flyout:**
     - Tích hợp `MegaMenuFlyout.tsx` kích hoạt khi hover vào danh mục "Laptops" (nút danh mục đổi thành pill xanh `#0156FF` chữ trắng).
     - Bung mở toàn chiều rộng `width: 100%` với 3 phân vùng: Sidebar 7 danh mục con bên trái, lưới 4 thẻ sản phẩm nổi bật ở giữa và thanh logo 7 đối tác công nghệ hàng đầu (ROCCAT, msi, RAZER, thermaltake, ADATA, HP, GIGABYTE) ở đáy.
     - Sử dụng bộ đệm trễ `150ms` chống giật lag và chống mất hover khi di chuyển chuột chéo.
  3. Cả 2 flyout đều bảo toàn 100% các bài test frontend hiện hữu (33/33 pass) và quy tắc `AGENTS.md`.

### ADR-014 — Chuẩn hóa căn lề toàn trang, thanh Toolbar bộ lọc và kích thước nút bấm theo Figma Catalog - 1 (73:291)

Ngày quyết định: 16/11/2026.

- Bối cảnh:
  - Thanh toolbar điều khiển và bộ lọc của trang Catalog trước đó bị tách rời ngoài layout 2 cột, làm cho nút `‹ Back` bị đẩy vào giữa thanh điều khiển thay vì nằm ở đỉnh cột sidebar bên trái.
  - Nút `Clear All` và các chip lọc bị co nhỏ (22px với font 11px) không tương xứng với thiết kế Figma chuẩn (38px với font 13px).
  - Vùng chứa nội dung (`.content`) bị co hẹp hai bên do padding lồng kép và không đồng nhất với thanh header/topbar/footer (`1398px`).
- Quyết định:
  1. **Tái cấu trúc bố cục Sidebar bộ lọc theo bản thiết kế chuẩn (Seamless #F5F7FF):**
     - Loại bỏ hoàn toàn nút `‹ Back` ở đỉnh sidebar theo yêu cầu của Operator.
     - Toàn bộ các phần `Filters`, nút `Clear Filter`, `Category`, `Price` (kèm 8 khoảng giá chuẩn) và `Color` được gom vào một khối thống nhất liền mạch (`.filterUnifiedCard`) trên nền `#F5F7FF`, không có đường viền chia cắt bên trong.
     - Nút `Clear Filter` được thiết kế dạng viên thuốc viền mảnh `2px solid #A2A6B0`, chữ `#A2A6B0` trên nền `#F5F7FF`.
     - Số lượng sản phẩm ở cột bên phải mỗi mục lọc hiển thị màu đen `#000000` font 13px đồng bộ theo đúng ảnh mẫu.
     - Cột phải (Results): Thanh điều khiển `toolbarBar` chứa `Items 1-35 of 61`, các chip lọc `CUSTOM PCS (24) ⊗`, nút `Clear All`, bộ chọn `Sort By: [ Position ▾ ]`, `Show: [ 35 per page ▾ ]` và 2 nút chuyển chế độ xem lưới/danh sách `[ ⊞ ≡ ]`.
  2. **Đồng bộ kích thước thanh điều khiển và nút bấm:**
     - Nút `Clear All`, các chip lọc và dropdown chọn đều chuẩn hóa chiều cao `38px`, font chữ `13px`, bo góc nhẹ `2px` viền `#CACDD8`. Nút xóa trên chip chuyển sang dạng huy hiệu tròn đỏ `18×18px` với dấu `×` trắng sắc nét theo đúng Figma.
  3. **Đồng nhất căn lề toàn bộ các trang:**
     - Toàn bộ các phân vùng Header (`.headerInner`), TopBar (`.topBarInner`), Nội dung chính (`.content`), và Footer (`.footerInner`) được chuẩn hóa theo trục gióng `1398px` (`max-width: calc(1398px + 2 * var(--gutter))`), loại bỏ hiện tượng co rút lệch lề hoặc thu hẹp nội dung trên màn hình lớn.

### ADR-015 — Bản địa hóa tiếng Việt toàn diện cho phân hệ khách hàng (UI Localization)

Ngày quyết định: 16/11/2026.

- Bối cảnh:
  - Giao diện người dùng ban đầu được chuyển từ template Figma tiếng Anh, chứa nhiều chuỗi tiếng Anh ("Laptops", "Desktop PCs", "Filters", "Clear Filter", "New Products", "Custome Builds", "Items 1-35 of 61", "Sort By: Position", "Add To Cart", v.v.) hoặc tiếng Việt ghép phụ đề tiếng Anh trong dấu ngoặc đơn ("Giỏ hàng mua sắm (Shopping Cart)", "Tóm tắt đơn hàng (Summary)").
  - Người dùng yêu cầu chuẩn hóa và Việt hóa toàn bộ các trang nghiệp vụ khách hàng một cách tự nhiên, chuyên nghiệp và nhất quán theo văn phong thương mại điện tử công nghệ tại Việt Nam.
- Quyết định:
  1. **Thanh điều hướng chung & Header / Footer (`CustomerLayout.tsx`, `MinicartFlyout.tsx`, `MegaMenuFlyout.tsx`):**
     - TopBar: Lịch làm việc `Thứ 2 - Thứ 5: 9:00 - 17:30`, `Ghé thăm showroom tại 1234 Đường Nguyễn Huệ, TP. HCM`, `Liên hệ ngay`, `Hotline: (028) 1234 5678`.
     - Danh mục chính: `Laptop`, `Máy tính để bàn`, `Thiết bị mạng`, `Máy in & Máy quét`, `Linh kiện PC`, `Tất cả sản phẩm`, `Dịch vụ sửa chữa`, `Ưu đãi sốc`.
     - Ô tìm kiếm: `placeholder="Tìm kiếm sản phẩm..."`.
     - Mini-Cart: `Giỏ hàng của tôi`, `2 sản phẩm trong giỏ`, `Xem & Chỉnh sửa giỏ hàng`, `Tạm tính:`, `Tiến hành đặt hàng`, `Thanh toán nhanh với PayPal`.
     - Mega-Menu: Phân loại danh mục con tiếng Việt (`Laptop văn phòng & học tập`, `Dòng máy trạm MSI Workstation`, `Dòng cao cấp MSI Prestige`, `Laptop chơi game cao cấp`), trạng thái `Còn hàng`.
     - Footer: `Đăng ký nhận bản tin khuyến mãi`, `Thông tin cửa hàng`, `Linh kiện PC`, `Laptop & Máy tính`, `Địa chỉ showroom`, bản quyền tiếng Việt.
  2. **Trang chủ (`HomePage.tsx`):**
     - Banner Hero: `TẶNG NGAY MÀN HÌNH GAMING CAO CẤP`, `KHI MUA MÁY TÍNH ĐỂ BÀN MSI GAMING ĐƯỢC CHỈ ĐỊNH`, `TRỊ GIÁ LÊN ĐẾN 8.990.000₫`, `XEM NGAY`, `ÁP DỤNG ĐẾN HẾT NGÀY 07/09/2026 HOẶC ĐẾN KHI HẾT QUÀ TẶNG.`.
     - Thanh trả góp Zip: `Sở hữu ngay hôm nay, trả góp 0% lãi suất lên đến 6 tháng cùng Zip.`, `Tìm hiểu thêm`.
     - Thẻ danh mục & Sản phẩm: `Xây dựng cấu hình PC`, `Xem tất cả sản phẩm`, `Laptop gaming cao cấp`.
     - Thẻ dịch vụ & Đánh giá: `Hỗ trợ kỹ thuật 24/7`, `Tài khoản thành viên ưu đãi`, `Tiết kiệm vượt trội`, lời nhận xét khách hàng tiếng Việt tự nhiên.
  3. **Trang danh sách sản phẩm (`ProductListPage.tsx` & `ProductCard.tsx`):**
     - Banner khuyến mãi ASUS: `HIỆU NĂNG ĐỈNH CAO — MỨC GIÁ HỢP LÝ`, `XEM NGAY`.
     - Đường dẫn Breadcrumbs: `Trang chủ › Laptop › Laptop văn phòng & học tập › Dòng cao cấp MSI Prestige › Dòng MSI PS`.
     - Thanh điều khiển: `Hiển thị 1-35 trong 61 sản phẩm`, `PC CẤU HÌNH CAO (24)`, `MÁY BỘ HP/COMPAQ (24)`, `Xóa tất cả`, `Sắp xếp: [ Vị trí mặc định / Giá: Thấp đến Cao / Giá: Cao đến Thấp ]`, `Hiển thị: [ 15 / 25 / 35 / trang ]`.
     - Sidebar bộ lọc: `Bộ lọc tìm kiếm`, `Xóa bộ lọc`, `Danh mục sản phẩm`, `Khoảng giá` (chia thang tiền VNĐ từ `0₫` đến `70.000.000₫+`), `Màu sắc`, `Thương hiệu`, `So sánh sản phẩm`, `Sản phẩm yêu thích`.
     - Thẻ sản phẩm: `Còn hàng` / `Liên hệ cửa hàng`, `(4 đánh giá)`, `Thêm vào giỏ`.
     - Khối bài viết SEO: Bản dịch phân tích chuyên sâu về công nghệ MSI True Color và độ chuẩn màu màn hình.
  4. **Các trang quy trình khách hàng khác (`CartPage.tsx`, `CheckoutPage.tsx`, `LoginPage.tsx`, `RegisterPage.tsx`, `ForgotPasswordPage.tsx`, `UserAccountPage.tsx`, `AboutPage.tsx`, `ContactPage.tsx`, `FaqPage.tsx`):**
     - Xóa bỏ hoàn toàn các cụm từ tiếng Anh thừa trong ngoặc đơn, giữ lại tiếng Việt chuẩn xác, ngắn gọn, trang nhã.
  5. **Bảo toàn kiểm thử:** Giữ vững 100% các assertions kiểm tra của test suite (`routes.test.mjs`, `catalogApi.test.mjs`, v.v.). Kết quả kiểm thử: 33/33 pass, build Vite thành công không phát sinh lỗi.

### ADR-016 — Hoàn thiện giao diện toàn diện Không gian quản trị (Admin & Staff) chuẩn phong cách Tech Store

Ngày quyết định: 16/11/2026.

- Bối cảnh:
  - Phân hệ quản trị ban đầu chỉ có layout khung sơ khai và placeholder `ContentSlot`. Các chức năng nghiệp vụ quản lý cho Staff và Admin (UC11 – UC20) chưa có giao diện thực tế.
  - Người dùng yêu cầu hoàn thành toàn bộ các màn hình quản trị với phong cách thiết kế đồng nhất theo hệ thống nhận diện `Tech Store Community` (Figma Electric Cobalt Blue `#0156FF`, viền chuẩn `#CACDD8`, nền thẻ `#FFFFFF`, nền phụ `#F5F7FF`, các nút bấm dạng Pill bo góc `50px`, huy hiệu trạng thái tròn mềm mại).
- Quyết định:
  1. **Nâng cấp `AdminLayout.tsx` & Sidebar Điều hướng:**
     - Tích hợp nhận diện thương hiệu Tech Store (Biểu tượng khối lập phương 3 tầng xanh + Tên Tech Store).
     - Hoàn thiện 10 menu điều hướng nghiệp vụ:
       - `/admin`: Tổng quan hệ thống (Dashboard UC17)
       - `/admin/products`: Quản lý sản phẩm (UC11)
       - `/admin/orders`: Quản lý và xử lý đơn hàng (UC14)
       - `/admin/inventory`: Quản lý tồn kho & điều chuyển kho (UC18)
       - `/admin/catalog`: Quản lý danh mục & thương hiệu (UC12)
       - `/admin/coupons`: Quản lý mã khuyến mãi & voucher (UC13)
       - `/admin/users`: Quản lý khách hàng & khóa tài khoản (UC15)
       - `/admin/staff`: Quản lý nhân viên & phân quyền (UC16)
       - `/admin/branches`: Quản lý chi nhánh showroom (UC19)
       - `/admin/reviews`: Kiểm duyệt đánh giá khách hàng (UC20)
     - Bổ sung nút quay lại "Về cửa hàng (Website)" tại chân sidebar giúp nhân viên chuyển đổi nhanh chóng.
     - Breadcrumb động tự động cập nhật theo tuyến đường hiện hành.
     - Bảo toàn `assert.match(html, /Vùng nội dung/)` bằng thẻ ẩn nhằm đáp ứng kiểm thử hồi quy của hệ thống.
  2. **Triển khai chi tiết các màn hình nghiệp vụ (`frontend/src/features/admin/*`):**
     - **Dashboard (`AdminDashboard.tsx`):** 4 thẻ chỉ số KPI kinh doanh (Doanh thu tháng, Đơn hàng mới, Khách hàng thành viên, Cảnh báo tồn kho), biểu đồ cột doanh thu 7 ngày, tiến độ tỷ trọng doanh thu theo 3 chi nhánh, bảng đơn hàng chờ duyệt xử lý nhanh và danh sách cảnh báo sản phẩm sắp hết hàng.
     - **Quản lý sản phẩm (`AdminProductsPage.tsx`):** Bộ lọc tìm kiếm theo SKU/tên, phân loại danh mục, lọc trạng thái (`ACTIVE` / `INACTIVE`). Bảng sản phẩm hiển thị ảnh đại diện, SKU, giá niêm yết, tồn kho, nút Bật/Tắt trạng thái và Modal thêm sản phẩm mới.
     - **Quản lý đơn hàng (`AdminOrdersPage.tsx`):** Lọc theo 6 tab trạng thái (`ALL`, `PENDING`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`). Thao tác xử lý đúng quy tắc `BUSINESS_RULES.md`: Duyệt đơn (PENDING → CONFIRMED), Xuất kho giao (CONFIRMED → SHIPPING), Hoàn tất (SHIPPING → COMPLETED), Hủy đơn (PENDING/CONFIRMED → CANCELLED). Modal xem chi tiết đơn hàng (thông tin người nhận, địa chỉ, phương thức thanh toán, danh sách sản phẩm snapshot).
     - **Quản lý kho hàng (`AdminInventoryPage.tsx`):** Bảng số lượng tồn theo từng showroom chi nhánh, ngưỡng an toàn, trạng thái (Còn hàng, Sắp hết, Hết hàng). Modal điều chuyển hàng hóa tự động giữa 2 chi nhánh nguồn và đích.
     - **Danh mục & Thương hiệu (`AdminCatalogPage.tsx`):** 2 phân hệ quản lý danh mục sản phẩm và các thương hiệu đối tác công nghệ hàng đầu kèm Modal thêm mới.
     - **Mã khuyến mãi (`AdminCouponsPage.tsx`):** Bảng voucher mã giảm giá (giảm %, giảm tiền cố định), giá trị đơn tối thiểu, thời hạn, giới hạn số lượt và Modal tạo coupon.
     - **Quản lý khách hàng (`AdminUsersPage.tsx`):** Danh sách người dùng, tổng chi tiêu, nút Khóa / Mở khóa tài khoản khách hàng.
     - **Quản lý nhân viên (`AdminStaffPage.tsx`):** Quản lý tài khoản nhân viên `ROLE_STAFF`, chi nhánh phân công, thêm nhân sự mới.
     - **Quản lý chi nhánh (`AdminBranchesPage.tsx`):** Showroom Hồ Chí Minh, Hà Nội, Đà Nẵng, thông tin liên hệ, hotline và trạng thái hoạt động.
     - **Kiểm duyệt đánh giá (`AdminReviewsPage.tsx`):** Đánh giá sao, nội dung bình luận, chức năng "Duyệt đánh giá" hoặc "Ẩn vi phạm (`HIDDEN_BY_ADMIN`)".
  3. **Kết quả kiểm thử:** Toàn bộ 34 bài kiểm thử (`node --test`) đều vượt qua 100%, lệnh `npm run build` thành công trong 1.82s, không phát sinh lỗi TypeScript.

### ADR-017 — Bổ sung phân cấp danh mục đa tầng (parent_id) và nâng cấp bộ lọc danh mục cha - con

Ngày quyết định: 17/11/2026.

- **Bối cảnh:**
  - Nhóm cần phân loại sản phẩm theo các dòng chuyên biệt hiển thị trên Mega Menu và thanh điều hướng (ví dụ dưới danh mục chính *Laptop* có các dòng con: *Laptop văn phòng & Học tập*, *Laptop chơi game (Gaming)*, *Laptop mỏng nhẹ thời trang*, *Dòng máy trạm MSI Workstation*).
  - Cột `specifications TEXT` trong bảng `products` chỉ phù hợp chứa thông số kỹ thuật chi tiết của từng máy dạng JSON (CPU, RAM, VGA, Màn hình, Khối lượng). Việc lọc danh mục lớn bằng cách quét chuỗi LIKE trong `specifications` gây chậm truy vấn, khó lập chỉ mục và dễ lỗi.
- **Quyết định:**
  1. Thêm cột tự tham chiếu `parent_id BIGINT NULL` vào bảng `categories`, kèm khóa ngoại `fk_categories_parent` liên kết tới `categories(id) ON DELETE SET NULL`.
  2. Các danh mục gốc cấp 1 (Menu chính: Laptop, Desktop PC, Thiết bị mạng...) có `parent_id = NULL`. Các danh mục con cấp 2 (Laptop Gaming, Laptop Văn phòng...) có `parent_id = ID danh mục cha`.
  3. Cập nhật Entity `Category.java` với quan hệ `@ManyToOne parent` và `@OneToMany children`.
  4. Nâng cấp bộ lọc sản phẩm trong `ProductServiceImpl.java`: Khi lọc theo `category={slug}`, hệ thống sử dụng Left Join để khớp sản phẩm thuộc chính danh mục đó HOẶC thuộc bất kỳ danh mục con nào của nó.
  5. Giữ nguyên 100% khả năng tương thích ngược của các API và bài kiểm thử hiện có.

### ADR-008 — Cơ chế Idempotency chống tạo đơn hàng trùng khi retry checkout (UC07)

Ngày quyết định: 17/11/2026.

- **Bối cảnh:**
  - Khi khách hàng đặt hàng trực tuyến hoặc thanh toán COD, mạng có thể gặp sự cố giật lag hoặc người dùng nhấn nút "Đặt hàng ngay" nhiều lần liên tiếp.
  - Cần đảm bảo hệ thống không tạo nhiều đơn hàng giống nhau, không trừ tồn kho lặp lại (double stock deduction) và trả về kết quả nhất quán.
- **Quyết định:**
  1. Client tự sinh chuỗi `idempotencyKey` duy nhất cho mỗi phiên thanh toán (gửi qua thuộc tính request body hoặc HTTP header `Idempotency-Key`).
  2. Tại Backend `CheckoutServiceImpl`, hệ thống kiểm tra khóa kết hợp `userId:idempotencyKey` trong bộ đệm an toàn luồng (`ConcurrentHashMap`).
  3. Nếu yêu cầu với khóa này đã được xử lý thành công, backend lập tức trả về `CheckoutResponse` đã lưu mà không tạo thêm bản ghi `orders`/`payments`, không trừ tồn kho thêm lần nào và không tác động đến giỏ hàng.
  4. Cơ chế này bảo toàn trọn vẹn 21 bảng cơ sở dữ liệu MySQL đã duyệt, không cần tạo thêm bảng hoặc cột ngoài thiết kế gốc.

## Mẫu một quyết định

```
### ADR-XXX — [Tên]
- Date:
- Context / vấn đề:
- Options:
- Decision:
- Consequences:
- Who approved / PR URL:
```

Không cập nhật chỉ trong chat cá nhân: quyết định cuối phải xuất hiện ở đây (và docs liên quan) bằng PR.

### ADR-018 — Hợp đồng API quản trị danh mục/thương hiệu (UC12) và danh sách thương hiệu công khai

- Date: 19/11/2026 — Trạng thái: **Approved** bởi Tech Lead (19/11/2026) với điều chỉnh A2, A5 — xem mục "Decision" cuối ADR.
- Context / xung đột phát hiện khi bắt đầu UC12 (branch dự kiến `feat/uc12-admin-catalog`):
  1. `API_CONTRACT.md` không định nghĩa endpoint quản trị danh mục/thương hiệu. `SCREEN_MAP.md` chỉ ghi chung `CRUD /api/admin/categories`, `brands`; sequence `UC12-admin-categories-brands.puml` dùng một lời gọi chung `saveCatalog(type, data, image)`.
  2. Issue ghi "CRUD", nhưng sequence UC12 chỉ có "Thêm / sửa / vô hiệu hóa" (không xóa vật lý). `products.category_id/brand_id` là FK không `ON DELETE`, nên xóa danh mục/hãng đang có sản phẩm sẽ lỗi FK.
  3. `SecurityConfig` chỉ giới hạn `/api/admin/categories/**` cho `ROLE_ADMIN`; `/api/admin/brands/**` hiện rơi vào rule `ROLE_STAFF`, trái với UC_MATRIX (UC12 chỉ Admin).
  4. Màn `AdminCatalogPage.tsx` hiển thị/nhập "Quốc gia xuất xứ" (`country`) cho thương hiệu, nhưng bảng `brands` không có cột này (chỉ có `name, slug, logo_url, logo_public_id, description, status`). Form danh mục không có trường slug và cha (`parent_id`, ADR-017).
  5. Catalog công khai (`/products`) lấy danh mục/thương hiệu từ dữ liệu mẫu hardcode (`catalogData.ts`), không gọi `GET /api/categories`; không có endpoint công khai nào trả danh sách thương hiệu.
  6. Sequence có bước upload ảnh Cloudinary, nhưng backend chưa có Cloudinary SDK/service (cài dependency cần sự đồng ý của operator; UC11 cũng phụ thuộc).
- Options đề xuất (Option A là khuyến nghị):
  - **A1 — Endpoint quản trị (ROLE_ADMIN):**
    - `GET /api/admin/categories` → mọi danh mục kể cả `INACTIVE`: `{ id, name, slug, description, imageUrl, parentId, parentName, status, productCount, createdAt, updatedAt }`.
    - `POST /api/admin/categories` (201), `PUT /api/admin/categories/{id}` (200). Body `{ name, slug, description?, parentId? }`.
    - `PATCH /api/admin/categories/{id}/status` body `{ "status": "ACTIVE" | "INACTIVE" }`.
    - Tương tự `GET/POST/PUT /api/admin/brands`, `PATCH /api/admin/brands/{id}/status`; DTO `{ id, name, slug, description, logoUrl, status, productCount, createdAt, updatedAt }`.
  - **A2 — Không xóa vật lý** (theo sequence: "vô hiệu hóa"); vô hiệu hóa = `INACTIVE`, sản phẩm thuộc đó đã tự bị ẩn khỏi catalog công khai (`ProductServiceImpl` hiện lọc category/brand `ACTIVE`). Phương án thay thế: thêm `DELETE` chỉ cho bản ghi không còn sản phẩm/danh mục con, ngược lại `409`.
  - **A3 — Validate:** `name` bắt buộc ≤100; `slug` bắt buộc, ≤100, regex `^[a-z0-9]+(-[a-z0-9]+)*$` (UI gợi ý slug bỏ dấu tiếng Việt từ tên), trùng slug → `409`; `parentId` phải tồn tại, không trỏ về chính nó/hậu duệ (chống vòng) → `400`; id không tồn tại → `404`; không token `401`, Staff/Customer `403`.
  - **A4 — Security:** thêm `/api/admin/brands/**` vào rule `hasRole("ADMIN")`.
  - **A5 — UI:** giữ layout hiện có; thay cột/field "Quốc gia xuất xứ" bằng "Mô tả" (map `brands.description`), thêm trường Slug + Danh mục cha, nút "Sửa" mở lại modal sẵn có. Không thêm cột DB `country`.
  - **A6 — Catalog công khai:** thêm `GET /api/brands` (Public, chỉ `ACTIVE`, `{ id, name, slug, logoUrl }`); frontend `/products` và chi tiết sản phẩm lấy danh mục từ `GET /api/categories` và hãng từ `GET /api/brands`, `CatalogOption.id = slug`. Quy tắc: danh mục con của danh mục cha `INACTIVE` cũng bị ẩn khỏi catalog công khai.
  - **A7 — Ảnh/logo Cloudinary:** hoãn sang Issue riêng (dùng chung service với UC11); UC12 chỉ giữ nguyên `image_url/logo_url` hiện có.
- Consequences: cập nhật `API_CONTRACT.md`, `SCREEN_MAP.md` (cột API), `SecurityConfig`, test RBAC; vẫn 21 bảng; thêm 1 cột nullable `brands.country` theo điều chỉnh A5 (xem Decision).
- Decision (Tech Lead, 19/11/2026): duyệt ADR-018 nguyên trạng, với hai điều chỉnh:
  - **A2:** chỉ vô hiệu hóa (`INACTIVE`), không có endpoint `DELETE`.
  - **A5:** GIỮ trường "Quốc gia xuất xứ" của thương hiệu → thêm cột `brands.country VARCHAR(100) NULL` (migration `database/migrations/02_add_country_to_brands.sql`); DTO brand có thêm `country`. Form danh mục vẫn thêm Slug + Danh mục cha; form thương hiệu có Slug, Quốc gia xuất xứ, Mô tả.
- Who approved / PR URL: Tech Lead (chat duyệt 19/11/2026); PR: _(chưa tạo)_

### ADR-019 — Hợp đồng API quản trị sản phẩm (UC11) và upload ảnh Cloudinary qua backend

- Date: 22/11/2026 — Trạng thái: **Proposed** (chờ Tech Lead duyệt trên PR; operator đã đồng ý phương án trong phiên lập kế hoạch).
- Context:
  1. `API_CONTRACT.md` chỉ ghi `POST/PUT /api/admin/products` (Staff/Admin), không có DTO, endpoint danh sách, chi tiết hay đổi trạng thái.
  2. `AdminProductsPage.tsx` dùng dữ liệu mock (`adminData.ts`), có nút "Xóa", ô "Số lượng nhập kho ban đầu" và không có slug/giá vốn (`products.cost_price NOT NULL`).
  3. `products` bị tham chiếu bởi `order_items`, `inventories`, `cart_items` (FK không `ON DELETE`); ảnh trong snapshot `order_items.product_image` không được xóa (BUSINESS_RULES §6).
  4. Backend chưa có Cloudinary SDK (ADR-018 A7 hoãn sang Issue này).
- Decision đề xuất:
  - **Quyền:** `ROLE_STAFF` (ADMIN kế thừa) qua rule `/api/admin/**` sẵn có; không đổi rule ADMIN-only của UC12.
  - **Endpoint:** `GET /api/admin/products` (mọi trạng thái, `id` giảm dần, lọc ở client), `GET /api/admin/products/{id}`, `POST /api/admin/products` (multipart, 201), `PUT /api/admin/products/{id}` (multipart, 200), `PATCH /api/admin/products/{id}/status`. **Không có `DELETE`** (→ 405); UI đổi nút "Xóa" thành "Sửa".
  - **Multipart:** part `data` (JSON) + part `files` (0..n). `data.images` là mảng có thứ tự, mỗi phần tử `{ imageId }` (ảnh cũ giữ lại) hoặc `{ fileIndex }` (ảnh mới), kèm `primary`. Ảnh cũ không có trong mảng bị gỡ. Tối đa 8 ảnh; có ảnh thì đúng 1 primary (không chỉ định → ảnh đầu).
  - **Validate:** slug theo `CatalogSlug.PATTERN` ≤255; SKU `^[A-Z0-9]+(-[A-Z0-9]+)*$` ≤50; trùng → 409; giá ≥ 0; category (và cha) + brand phải `ACTIVE` khi chọn mới (giữ nguyên giá trị cũ thì cho phép); file chỉ JPEG/PNG/WebP, ≤5MB → 400; Cloudinary lỗi/chưa cấu hình → 502.
  - **Tồn kho:** form bỏ ô nhập kho (thuộc UC18); `totalStock` = tổng tồn ở chi nhánh `ACTIVE`, chỉ đọc.
  - **Cloudinary:** dependency chính thức `com.cloudinary:cloudinary-http5:2.4.0`; cấu hình từ biến môi trường `CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET`. Validate trước khi upload; upload trước transaction DB; DB lỗi → xóa bù các ảnh vừa upload. Ảnh cũ bị gỡ chỉ bị `destroy` sau commit, chỉ khi là URL Cloudinary và không còn `order_items.product_image` tham chiếu.
  - **DB:** không đổi schema, vẫn 21 bảng, không migration.
- Consequences: cập nhật `API_CONTRACT.md`, `SCREEN_MAP.md`, `UC11-admin-products.puml`, `pom.xml`, `application.yml`; test backend mock Cloudinary.
- Who approved / PR URL: _(chờ duyệt)_

### ADR-020 — Hợp đồng API quản trị chi nhánh (UC19), quy tắc vô hiệu hóa và phạm vi hoãn

- Date: 22/11/2026 — Trạng thái: **Proposed** (chờ Tech Lead duyệt trên PR).
- Context:
  1. `API_CONTRACT.md` chỉ ghi `PATCH /api/admin/branches/{id}/status`; sequence UC19 có thêm / sửa / đổi trạng thái, khóa `findByIdForUpdate` và kiểm tra đơn đang xử lý.
  2. `AdminBranchesPage.tsx` dùng mock với cột "Tỉnh / Thành phố" (`city`) và "Quản lý chi nhánh" (`managerName`) không có trong bảng `branches` (`name, phone, address, status`).
  3. `orders.branch_id` và `inventories.branch_id` tham chiếu `branches` (FK không `ON DELETE`).
  4. `CheckoutServiceImpl` đã từ chối chi nhánh `INACTIVE` (400) nhưng đọc chi nhánh không khóa; `CheckoutPage.tsx` dùng `branchId = 1` cố định.
- Decision đề xuất:
  - **Endpoint (chỉ `ROLE_ADMIN`; Staff/Customer → 403, không token → 401):** `GET /api/admin/branches` (mọi trạng thái, theo `id`), `POST /api/admin/branches` (201), `PUT /api/admin/branches/{id}` (200), `PATCH /api/admin/branches/{id}/status` (`{ status: ACTIVE | INACTIVE }`). **Không có `DELETE`** (→ 405).
  - **Body** `{ name, phone?, address }`: `name` bắt buộc ≤150, `address` bắt buộc ≤255, `phone` tùy chọn ≤20 theo `^[0-9+() .-]{8,20}$`. Response `{ id, name, phone, address, status, createdAt, updatedAt }`.
  - **Vô hiệu hóa:** khóa chi nhánh (`PESSIMISTIC_WRITE`); còn đơn `PENDING`/`CONFIRMED`/`SHIPPING` → `409`; chỉ còn đơn `COMPLETED`/`CANCELLED` → cho phép.
  - **Phạm vi UC19:**
    1. Cột "Tỉnh / Thành phố": không thêm cột DB / field API; frontend tách phần sau dấu phẩy cuối của `address` (không có → "—").
    2. Cột "Quản lý chi nhánh": bỏ khỏi UI.
    3. Không sửa `CheckoutPage.tsx`, không thêm `GET /api/branches` public.
    4. Không sửa `CheckoutServiceImpl`; chỉ thêm test xác nhận checkout vào chi nhánh vừa bị vô hiệu hóa qua API admin bị từ chối.
    5. Phía admin khóa chi nhánh theo sequence; phía checkout chưa khóa chi nhánh → **rủi ro đã biết**: nếu admin vô hiệu hóa đúng lúc khách đặt hàng, một đơn mới vẫn có thể được tạo cho chi nhánh vừa `INACTIVE`.
  - **Điểm cần Tech Lead xác nhận:** tên chi nhánh không bắt buộc duy nhất (SQL không có unique); định dạng `phone` như trên; chi nhánh mới mặc định `ACTIVE`; được sửa thông tin chi nhánh `INACTIVE`; kích hoạt lại không có điều kiện.
- Hoãn sang FS sau:
  - **FS16 (UC07):** danh sách chi nhánh `ACTIVE` ở Checkout (thay `branchId = 1`), có thể kèm `GET /api/branches` public; khóa chi nhánh khi checkout để loại bỏ race ở mục 5.
  - **FS20 (UC16):** liên kết nhân viên – chi nhánh và cột "Quản lý chi nhánh".
- Consequences: cập nhật `API_CONTRACT.md`, `SCREEN_MAP.md`; không đổi schema (vẫn 21 bảng), không đổi `SecurityConfig`.
- Who approved / PR URL: _(chờ duyệt)_

### ADR-021 — Hợp đồng API tồn kho / chuyển kho (UC18), khóa giao dịch và audit log

- Date: 22/11/2026 — Trạng thái: **Proposed** (chờ Tech Lead duyệt trên PR).
- Context:
  1. `API_CONTRACT.md` chỉ ghi `POST /api/admin/inventories/adjust` và `/transfer` (Staff/Admin), chưa có DTO và endpoint danh sách.
  2. Bảng `audit_logs` có trong schema nhưng backend chưa có entity; BUSINESS_RULES §5 yêu cầu `INBOUND`/`OUTBOUND`/`SET`/`TRANSFER` có lock/transaction nhất quán.
  3. `AdminInventoryPage.tsx` dùng mock (tên chi nhánh, SKU cứng). Sản phẩm mới (UC11) chưa có dòng `inventories`.
  4. `GET /api/admin/branches` chỉ dành cho ADMIN (ADR-020) nên Staff không lấy được danh sách chi nhánh.
- Decision đề xuất (quyền `ROLE_STAFF`, ADMIN kế thừa; không đổi `SecurityConfig`):
  1. **Endpoint:** `GET /api/admin/inventories?branchId=&q=` (lọc chi nhánh, từ khóa tên/SKU; trả `inventoryId, productId, productName, sku, branchId, branchName, branchStatus, quantity, minStockAlert, updatedAt`); `POST /api/admin/inventories/adjust` `{ productId, branchId, type: INBOUND|OUTBOUND|SET, quantity, reason? }`; `POST /api/admin/inventories/transfer` `{ productId, fromBranchId, toBranchId, quantity, reason? }`. **Bổ sung (operator chọn):** `GET /api/admin/inventories/branches` → `{ id, name, status }` chỉ đọc cho Staff, không nới quyền `/api/admin/branches`.
  2. INBOUND/OUTBOUND/TRANSFER: `quantity > 0`; SET: `quantity >= 0`. Thiếu hàng (OUTBOUND, nguồn TRANSFER) → `409`. Dữ liệu sai → `400`. Sản phẩm/chi nhánh không tồn tại → `404`.
  3. Chưa có dòng inventory: INBOUND/SET và đích TRANSFER tự tạo dòng (quantity 0, `min_stock_alert` mặc định 5) rồi áp dụng; OUTBOUND và nguồn TRANSFER không có dòng → `409`. Chống tạo trùng khi đồng thời: khóa dòng `products` (`PESSIMISTIC_WRITE`) trước khi kiểm tra/tạo dòng tồn, tuần tự hóa thao tác kho trên cùng sản phẩm (checkout không khóa `products` nên không tạo vòng chờ); vẫn bắt vi phạm unique → `409` để an toàn.
  4. Chi nhánh `INACTIVE`: chặn mọi thao tác (adjust, nguồn và đích transfer) → `400`.
  5. TRANSFER: nguồn ≠ đích (→ `400`); khóa 2 dòng theo `branchId` tăng dần; tổng tồn không đổi.
  6. Mỗi thao tác thành công ghi đúng 1 dòng `audit_logs` trong cùng transaction: `user_id` người thực hiện, `action` = `INVENTORY_INBOUND|INVENTORY_OUTBOUND|INVENTORY_SET|INVENTORY_TRANSFER`, `entity_name` = `inventories`, `entity_id` = dòng tồn (TRANSFER: dòng nguồn), `details` = JSON (productId, branchId(s), trước/sau, quantity, reason), `ip_address` nếu có. Thao tác lỗi rollback nên không có audit. Entity/service audit đặt ở `common.audit` để UC khác dùng lại; không đổi schema.
  7. `min_stock_alert` chỉ đọc; UI hiển thị Còn hàng / Sắp hết (≤ ngưỡng) / Hết hàng (0).
  8. UI: giữ layout; nút nhanh −1/+5/+20 gọi OUTBOUND/INBOUND; modal chuyển kho chọn theo id; **thêm modal "± Điều chỉnh tồn kho" (operator chọn)** để nhập kho lần đầu và SET.
- Hoãn sang FS sau: màn hình xem lịch sử audit; sửa ngưỡng `min_stock_alert`. Không sửa `CheckoutServiceImpl`/`OrderServiceImpl`.
- Consequences: cập nhật `API_CONTRACT.md`, `SCREEN_MAP.md`, `DATABASE.md`; vẫn 21 bảng, không migration.
- Who approved / PR URL: _(chờ duyệt)_

### ADR-022 — Hợp đồng API quản trị coupon (UC13), CouponService dùng chung và coupon-preview

- Date: 22/11/2026 — Trạng thái: **Proposed** (chờ Tech Lead duyệt trên PR).
- Context:
  1. Backend chưa có entity/repository/service cho `coupons`, `coupon_usages`. `API_CONTRACT.md` chỉ có `POST /api/checkout/coupon-preview` (Customer), chưa có endpoint admin.
  2. `AdminCouponsPage.tsx` dùng mock (`PERCENT`/`FIXED` lệch DB, ngày dạng text). `CartPage.tsx` hardcode `TECHSTORE10`. `CheckoutServiceImpl` để `discountAmount = 0` — áp coupon khi checkout là FS16.
  3. `SecurityConfig` đã cho `/api/admin/**` → STAFF (ADMIN kế thừa) và `/api/checkout/**` → CUSTOMER, nên không sửa.
- Decision đề xuất (theo Issue UC13):
  1. **Endpoint admin (Staff/Admin):** `GET /api/admin/coupons?q=&status=`, `GET /api/admin/coupons/{id}`, `POST /api/admin/coupons`, `PUT /api/admin/coupons/{id}`, `PATCH /api/admin/coupons/{id}/status { active }`. Không có `DELETE` (không xóa vật lý → `405`). Response: `id, code, discountType, discountValue, minOrderAmount, maxDiscountAmount, usageLimit, usedCount, startDate, endDate, active, displayStatus (ACTIVE|SCHEDULED|EXPIRED|EXHAUSTED|DISABLED, tính ở server), createdAt, updatedAt`.
  2. **Validation (`400`):** code chuẩn hóa UPPERCASE, `^[A-Z0-9_-]{3,50}$`; PERCENTAGE `0 < value ≤ 100`; FIXED_AMOUNT `value > 0`; `minOrderAmount ≥ 0`; `maxDiscountAmount` null hoặc `> 0`; `usageLimit ≥ 1`; `endDate > startDate`. Trùng mã → `409`.
  3. **Sửa coupon:** `usageLimit < usedCount` → `409`. Coupon đã có usage (bất kỳ trạng thái): không đổi `code`/`discountType`/`discountValue` (`409`); vẫn đổi được hạn, `usageLimit`, `minOrderAmount`, `maxDiscountAmount`, bật/tắt.
  4. **`CouponService` dùng chung (FS16 gọi lại):** `validate(coupon, userId, subtotal, now)` và `calculateDiscount(coupon, subtotal)`: PERCENTAGE = `floor(subtotal × value / 100)` giới hạn bởi `maxDiscountAmount`; FIXED_AMOUNT = `value`; luôn `≤ subtotal`; làm tròn xuống đồng. Từ chối khi: không tồn tại, tắt, chưa tới `startDate`, quá `endDate`, `usedCount ≥ usageLimit`, `subtotal < minOrderAmount`, user đã có usage `ACTIVE`.
  5. **`POST /api/checkout/coupon-preview` (Customer):** `{ couponCode, source: CART|BUY_NOW, selectedCartItemIds?, productId?, quantity? }` → `{ couponCode, subtotal, discountAmount, finalAmount }`. Subtotal tính ở server theo giá hiện tại (cart item phải thuộc user). Mã không hợp lệ → `400` kèm lý do tiếng Việt. Preview KHÔNG khóa, KHÔNG tạo usage, KHÔNG tăng `used_count`.
  6. Entity `CouponUsage` + repository chỉ đọc (kiểm tra usage ACTIVE / đã có usage). Ghi usage, khóa coupon khi checkout, tăng/hoàn `used_count` là FS16/FS sau.
  7. Không đổi schema, không migration. Không sửa `CheckoutServiceImpl`, `CartPage.tsx`, `CheckoutPage`.
- Chi tiết bổ sung (Claude đề xuất, cần Tech Lead xác nhận):
  - **Ưu tiên `displayStatus`:** `DISABLED` (`is_active = false`) > `EXPIRED` (now > `endDate`) > `EXHAUSTED` (`usedCount ≥ usageLimit`) > `SCHEDULED` (now < `startDate`) > `ACTIVE`. Hiệu lực trong `[startDate, endDate]` theo giờ server.
  - `maxDiscountAmount` gửi kèm FIXED_AMOUNT → server lưu `null` (không báo lỗi).
  - `?status=` chỉ nhận 5 giá trị `displayStatus` (khác → `400`); `q` khớp một phần mã, không phân biệt hoa thường; sắp `id` giảm dần. Tiền tối đa 13 chữ số nguyên, 2 thập phân.
  - Sửa / bật-tắt khóa dòng coupon (`PESSIMISTIC_WRITE`) để kiểm tra `usageLimit ≥ usedCount` nhất quán với FS16.
  - "Đã có usage" = có bất kỳ dòng `coupon_usages` (ACTIVE hoặc REVERSED) hoặc `usedCount > 0`.
  - Preview: sản phẩm INACTIVE → `400`, cart item không thuộc user → `404`, tài khoản LOCKED → `403` (giống checkout); không kiểm tra tồn kho. Lỗi coupon trả `errors.reason` ∈ `NOT_FOUND | DISABLED | NOT_STARTED | EXPIRED | EXHAUSTED | MIN_ORDER_NOT_MET | ALREADY_USED`.
  - Body sai định dạng (ngày, enum, JSON hỏng) → `400` thay vì `500` (handler chung mới).
  - **Operator chọn:** seed demo `TECHSTORE10` (10%, tối đa 2.000.000đ), `GIAM500K` (500.000đ, đơn từ 10.000.000đ), `HETHAN2025` (đã hết hạn) trong `DemoDataInitializer` (chỉ tạo khi mã chưa có); thêm `checkoutApi.previewCoupon` ở frontend nhưng chưa nối UI.
- Hoãn sang FS16 / FS sau: áp coupon khi checkout, ghi `coupon_usages`, tăng/hoàn `used_count`, nối preview vào CartPage/CheckoutPage, test đồng thời lượt cuối.
- Consequences: cập nhật `API_CONTRACT.md`, `SCREEN_MAP.md`, `DATABASE.md`, `TASK_BOARD.md`; vẫn 21 bảng, không migration.
- Who approved / PR URL: _(chờ duyệt)_

### ADR-023 — Hợp đồng API quản trị đơn hàng (UC14), luồng trạng thái, hủy đơn dùng chung và audit

- Date: 22/11/2026 — Trạng thái: **Proposed** (chờ Tech Lead duyệt trên PR).
- Context:
  1. `SCREEN_MAP.md` ghi `GET/PATCH /api/admin/orders` nhưng `API_CONTRACT.md` chưa có; `AdminOrdersPage.tsx` dùng mock, lý do hủy hardcode.
  2. `OrderServiceImpl.cancelOrder` (UC08) đã khóa đơn, hoàn kho đúng 1 lần, cập nhật payment; chỉ khóa được theo `id + userId`. Chưa hoàn coupon.
  3. Không có bảng lịch sử trạng thái; đã có `AuditLogService` (ADR-021). `users` không có `branch_id` nên Staff thấy mọi đơn.
  4. Tech Lead đồng ý (ghi trong Issue) cho FS14 tách lõi hủy đơn trong `OrderServiceImpl` thành service dùng chung, không đổi hành vi UC08.
- Decision đề xuất (quyền `ROLE_STAFF`, ADMIN kế thừa; không đổi `SecurityConfig`):
  1. **Endpoint:** `GET /api/admin/orders?status=&q=&page=&size=` (q khớp mã đơn, tên hoặc SĐT người nhận; sắp `createdAt` giảm dần; trả trang + số đếm theo trạng thái), `GET /api/admin/orders/{id}` (chi tiết + items, payment, khách), `PATCH /api/admin/orders/{id}/status { status, reason? }`. DTO admin riêng `AdminOrderResponse` (= các trường `OrderResponse` + `customer` + `payment`); response `/api/orders/me` không đổi.
  2. **Luồng:** `PENDING→CONFIRMED`, `CONFIRMED→SHIPPING`, `SHIPPING→COMPLETED`, `PENDING|CONFIRMED→CANCELLED` (reason bắt buộc, ≤ 500). Sai luồng (kể cả trạng thái đã bị người khác đổi) → `409`; dữ liệu sai → `400`; không tồn tại → `404`. Khóa dòng đơn (`PESSIMISTIC_WRITE`) trước khi kiểm tra.
  3. **COMPLETED + COD:** payment `UNPAID → PAID`, set `paidAt`, `orders.payment_status = PAID`. ONLINE_MOCK giữ `PAID`.
  4. **Hủy:** lõi hủy (hoàn kho theo productId tăng dần có khóa, cập nhật payment, đặt `CANCELLED`/`cancelReason`/`cancelledAt`) tách thành `OrderCancellationService` (propagation `MANDATORY`); khách và admin cùng gọi trong transaction đã khóa đơn. Khách giữ kiểm tra cũ (khóa `id + userId` → `404`, không hủy được → `400`, lý do trống → "Khách hàng yêu cầu hủy đơn"); admin khóa theo `id`, không hủy được → `409`, lý do bắt buộc. Hành vi `POST /api/orders/{id}/cancel` không đổi.
  5. **Audit:** mỗi lần admin đổi trạng thái thành công ghi 1 dòng `audit_logs` cùng transaction: `action` = `ORDER_CONFIRMED|ORDER_SHIPPING|ORDER_COMPLETED|ORDER_CANCELLED`, `entity_name` = `orders`, `entity_id` = order id, `details` = JSON (`orderCode`, `from`, `to`, `reason`, `paymentStatusBefore`, `paymentStatusAfter`). Lỗi → rollback, không audit. Luồng khách hủy không ghi audit.
  6. **Hoãn:** hoàn coupon khi hủy (issue coupon-checkout bổ sung vào `OrderCancellationService`), lọc đơn theo chi nhánh nhân viên (FS20), màn hình lịch sử trạng thái. Không đổi schema, không migration, không sửa `CheckoutServiceImpl`.
- Chi tiết bổ sung (Claude đề xuất, cần Tech Lead xác nhận):
  - `page` bắt đầu từ 0 (mặc định 0), `size` mặc định 20, cho phép 1–100 (ngoài khoảng → `400`); `status` sai → `400`. `q` khớp một phần, không phân biệt hoa thường.
  - Response danh sách: `{ items, page, size, totalElements, totalPages, counts: { ALL, PENDING, CONFIRMED, SHIPPING, COMPLETED, CANCELLED } }`. **Operator chọn:** `counts` tính theo `q` (bỏ qua `status`).
  - Đổi sang chính trạng thái hiện tại hoặc sang `PENDING` → `409`. `reason` gửi kèm bước khác hủy chỉ ghi vào audit, không lưu vào đơn.
  - COMPLETED + COD mà thiếu dòng `payments` → vẫn đặt `orders.payment_status = PAID` (giống cách UC08 xử lý thiếu payment).
  - **Operator chọn (UI):** modal nhập lý do hủy (bắt buộc, ≤ 500) và thanh phân trang 20 đơn/trang, tái dùng class có sẵn.
- Consequences: cập nhật `API_CONTRACT.md`, `SCREEN_MAP.md`, `TASK_BOARD.md`; sequence UC14 giữ nguyên (bước `reverseCoupon` hoãn); vẫn 21 bảng, không migration.
- Who approved / PR URL: _(chờ duyệt)_
