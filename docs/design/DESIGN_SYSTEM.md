# Design System — Tech Store

> Tài liệu quy chuẩn hệ thống thiết kế (Design Tokens, Typography, Bảng màu và Thư viện Component) trích xuất trực tiếp từ file Figma chuẩn của dự án: **eCommerce Template — Tech Store (Community)**.

## 1. Nguồn chuẩn Figma (Figma Authority)

- **File thiết kế chuẩn:** [eCommerce Template — Tech Store (Community)](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=0-1&p=f&t=u6gcwA1H5qa9cU8x-0)
- **File Key:** `dQPJxUHLSAcVYQoh9wH8Mn`
- **Cấu trúc Canvas / Pages trong file:**
  1. `Desktop` (`node-id=0:1`): [Mở Desktop Canvas](https://www.figma.com/design/dQPJxUHLSAcVYQoh9wH8Mn/eCommerce-Template---Tech-Store--Community-?node-id=0-1&p=f&t=u6gcwA1H5qa9cU8x-0) — Toàn bộ 14 màn hình nghiệp vụ chính và các components phiên bản Desktop (1920px).
  2. `Tablet` (`node-id=171:0`): Các màn hình phiên bản máy tính bảng.
  3. `Mobile` (`node-id=169:0`): Các màn hình phiên bản di động.
  4. `Preview` (`node-id=544:12589`): Bản xem trước và thumbnail dự án.

---

## 2. Bảng màu chuẩn (Color System & Tokens)

Hệ thống màu sắc phản ánh phong cách công nghệ máy tính, gaming hiện đại với tông xanh Cobalt đặc trưng:

### 2.1 Màu chủ đạo & Điểm nhấn (Primary & Brand Accent)
| Token Variable | Mã màu HEX | Vai trò / Ứng dụng |
|---|---|---|
| `Primary/500` | `#0156FF` | Màu thương hiệu công nghệ chính (Tech Blue), nút bấm chính, viền nút "Our Deals", badge giỏ hàng |
| `Primary/600` | `#0048D9` | Trạng thái Hover của nút chính |
| `Primary/50` | `#F5F7FF` | Nền nhạt cho các khối thẻ form (Login, Newsletter, Highlight Card) |
| `Primary/100` | `#D6E2FF` | Đường viền nhạt màu xanh |

### 2.2 Màu trung tính & Nền (Neutrals & Grayscale)
| Token Variable | Mã màu HEX | Vai trò / Ứng dụng |
|---|---|---|
| `Neutral/Black` | `#020202` / `#000000` | Màu nền Top Bar (`#020202`), nền Footer (`#020203`), màu tiêu đề chính (`#000000`) |
| `Neutral/White` | `#FFFFFF` | Nền thẻ sản phẩm, nền thanh menu chính, chữ trắng trên nút màu |
| `Neutral/Gray-50` | `#F5F7FF` | Nền các panel chức năng, khối thông tin tài khoản |
| `Neutral/Gray-100` | `#CACDD8` | Đường viền thẻ sản phẩm (Card Border), đường kẻ phân cách chính (Dividers) |
| `Neutral/Gray-300` | `#A2A6B0` | Màu chữ phụ, placeholder ô nhập liệu, nhãn ngày giờ Top Bar |
| `Neutral/Gray-500` | `#666666` | Giá niêm yết cũ (gạch ngang), đoạn văn bản chú thích thứ cấp |
| `Neutral/Gray-700` | `#272560` / `#1E1E1E` | Màu chữ tiêu đề phụ, nhãn bộ lọc |

### 2.3 Màu trạng thái & Phản hồi (Feedback & Status)
| Token Variable | Mã màu HEX | Vai trò / Ứng dụng |
|---|---|---|
| `Success/500` | `#78A962` | Còn hàng (`IN_STOCK`), đặt hàng thành công, badge số sao đánh giá |
| `Success/50` | `#EDF6E8` | Nền nhạt thông báo thành công |
| `Warning/500` | `#E9A426` | Đơn hàng chờ xử lý (`PENDING`), số sao đánh giá vàng |
| `Warning/50` | `#FEF8E7` | Nền badge cảnh báo |
| `Danger/500` | `#C94D3F` | Hết hàng (`OUT_OF_STOCK`), lỗi form, hủy đơn (`CANCELLED`) |
| `Danger/50` | `#FDF0EE` | Nền badge lỗi / thông báo đỏ |

---

## 3. Hệ thống Typography (Poppins Typescale)

Phông chữ tiêu chuẩn của toàn bộ hệ thống là **Poppins** (Google Fonts), tối ưu cho phong cách công nghệ sắc nét:

### 3.1 Tiêu đề lớn & Hiển thị (Display & Headings)
| Tên Style | Size / Line Height (px) | Weight | Ứng dụng |
|---|---|---|---|
| `Display/01` | 38 / 50 | Medium (500) | Tiêu đề lớn Newsletter Footer |
| `Heading/01` | 32 / 40 | SemiBold (600) | Tiêu đề trang chính (Customer Login, My Orders, Catalog) |
| `Heading/02` | 24 / 32 | SemiBold (600) | Tiêu đề nhóm sản phẩm trang chủ ("New Products") |
| `Heading/03` | 18 / 26 | SemiBold (600) | Tiêu đề khối con ("Registered Customers", "New Customers") |
| `Heading/04` | 14 / 20 | SemiBold (600) | Tên menu điều hướng ("Laptops", "Desktop PCs", "Our Deals") |

### 3.2 Văn bản nội dung (Body Text)
| Tên Style | Size / Line Height (px) | Weight | Ứng dụng |
|---|---|---|---|
| `Body/Large` | 16 / 24 | Regular (400) / Light (300) | Mô tả đầu trang, lời dẫn |
| `Body/Default` | 14 / 22 | Regular (400) | Nội dung đoạn văn tiêu chuẩn, giá tiền |
| `Body/Product` | 13 / 18 | Regular (400) | Tên sản phẩm trên thẻ (tối đa 2 dòng), thông số kỹ thuật |
| `Body/Small` | 12 / 16 | Regular (400) / SemiBold (600) | Top Bar text, breadcrumbs, link footer, số lượng đánh giá ("Reviews (4)") |
| `Body/Tiny` | 10 / 12 | Bold (700) | Badge số lượng giỏ hàng trên icon |

---

## 4. Spacing, Radius & Elevation

### 4.1 Bo góc đặc trưng (Border Radius)
- `radius-pill`: `50px` (`rounded-[50px]`) — **Nét nhận diện thương hiệu đặc trưng** của template: Nút "Our Deals", nút "Sign In", nút "Subscribe", nút "Add to Cart", bộ chọn chip.
- `radius-sm`: `4px` — Ô nhập liệu (Input), hộp chọn (Select), thông báo (Alert).
- `radius-card`: `0px` – `4px` — Thẻ sản phẩm, khối container mang tính sắc sảo (sharp modern).

### 4.2 Đường viền & Đổ bóng (Border & Shadow)
- **Border chuẩn:** `1px solid #CACDD8` — Dùng cho tất cả thẻ sản phẩm, phân vùng sidebar và đường kẻ chia khối.
- **Elevation / Hover Shadow:** `0px 5px 15px rgba(0, 0, 0, 0.08)` — Hiệu ứng đổ bóng nổi khi hover thẻ sản phẩm `Hover - 1` (`642:11380`).

---

## 5. Thư viện Component chính (Component Architecture)

Các component chính trên canvas `Desktop` (`0:1`) bao gồm:

1. **Header (`Component 14` — `63:968`):**
   - Top Bar nền đen `#020202`: Giờ mở cửa, địa chỉ showroom, hotline `(00) 1234 5678` và icon mạng xã hội.
   - Middle Nav nền trắng `#FFFFFF`: Logo khối lập phương xanh, danh mục sản phẩm ("Laptops", "Desktop PCs", "PC Parts"...), nút tròn xanh "Our Deals" (`rounded-[50px]`), icon tìm kiếm, giỏ hàng với badge tròn `#0156FF` và avatar người dùng.
2. **Mini-Cart Dropdown Flyout (`Minicart - 1` — `57:765`):**
   - Kích hoạt khi rê chuột vào icon giỏ hàng ở header, neo trực tiếp với mũi tên caret hướng lên icon.
   - Chiều rộng `320px`, viền `#CACDD8`, đổ bóng sâu `0 10px 30px rgba(0,0,0,0.14)`.
   - Tiêu đề "My Cart", số lượng sản phẩm ("2 item in cart"), nút viền "View or Edit Your Cart", danh sách sản phẩm rút gọn với ảnh thumbnail, số lượng, nút xóa `⊗` và sửa `✎`, tổng phụ "Subtotal: $499.00", nút "Go to Checkout" (pill xanh `#0156FF`) và "Check out with PayPal" (pill vàng `#FFB800`).
3. **Mega-Menu Dropdown Flyout (`Hovered Menu - 1` — `65:467` / `59:740`):**
   - Kích hoạt khi rê chuột vào danh mục "Laptops" (nút danh mục chuyển thành pill xanh `#0156FF` chữ trắng).
   - Bung mở toàn chiều rộng trực tiếp dưới thanh header với 3 phân vùng:
     - Cột trái: Danh mục con (Everyday Use Notebooks, MSI Workstation Series, MSI Prestige Series, Gaming Notebooks...).
     - Lưới trung tâm: 4 thẻ sản phẩm nổi bật kèm ảnh laptop/PC, trạng thái "● in stock", đánh giá 5 sao, tên sản phẩm và giá bán.
     - Dải chân đáy: Thanh logo 7 đối tác công nghệ hàng đầu (ROCCAT, msi, RAZER, thermaltake, ADATA, hp HEWLETT PACKARD, GIGABYTE).
4. **Product Card (`Product Card - 1` — `121:16844`):**
   - Chiều rộng `234px`, viền `#CACDD8`, ảnh sản phẩm trung tâm `150×150px`.
   - Cụm đánh giá sao vàng + chữ "Reviews (X)", tên sản phẩm `13px` font Poppins, giá niêm yết gạch ngang `#666666` và giá bán đậm `18px`.
5. **Product Card Hover (`Hover - 1` — `642:11380`):**
   - Chiều rộng `234px`, hiệu ứng nổi khối hover popout (`box-shadow`, `translateY(-2px)`), hiển thị 2 nút tròn Wishlist `♡` và So sánh góc trên phải, cùng nút viên thuốc `[ 🛒 Add To Cart ]` ở đáy.
6. **Auth Form Card (`Register - 1` — `133:3347`):**
   - Bố cục 2 cột: "Registered Customers" (Form đăng nhập với nút "Sign In" màu xanh pill) và "New Customers" (Khối đăng ký thành viên).
   - Ô nhập bo góc `4px`, viền `#CACDD8`, nhãn trên rõ ràng.
7. **Footer (`Group 35` — `73:4010`):**
   - Nền tối `#020203`, thanh đăng ký Newsletter với ô nhập email và nút "Subscribe" xanh pill `50px`.
   - Các cột liên kết: Information, PC Parts, Laptops, Address; dòng bản quyền Copyright ở chân trang.

---

## 6. Quy tắc thực thi (Implementation Invariants)

1. **Đồng bộ Token:** Toàn bộ CSS sử dụng các biến CSS `--ts-*` tương ứng đã định nghĩa theo bảng mã màu Poppins / Tech Blue `#0156FF`.
2. **Nút bấm phong cách Pill:** Các nút bấm hành động chính (Primary Call-to-Action) áp dụng bo góc viên thuốc `50px` theo đúng nhận diện của template.
3. **Bảo toàn chức năng & API:** Việc thay đổi giao diện theo template mới phải đảm bảo 100% các chức năng nghiệp vụ, route guards, API contract và các bài test đã xây dựng.
