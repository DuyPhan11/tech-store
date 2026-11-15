# Screen Map — dự kiến; điền Figma frame URL khi duyệt

| Route / màn hình | UC | Role | Frame URL | API dependency |
|---|---|---|---|---|
| `/` — Trang chủ | UC04 | Public | TBD | products/list |
| `/products` — Tìm kiếm/lọc | UC04 | Public | TBD | GET /products |
| `/products/:slug` — Chi tiết / Mua ngay | UC05 | Public + Customer | TBD | GET /products/:slug |
| `/register` — Đăng ký OTP | UC01 | Guest | TBD | auth/register/* |
| `/login` — Đăng nhập | UC02 | Guest | TBD | auth/login |
| `/forgot-password` — OTP reset | UC03 | Guest | TBD | auth/password/* |
| `/cart` — Giỏ hàng | UC06 | Customer | TBD | cart |
| `/checkout` — Đặt hàng | UC07 | Customer | TBD | checkout |
| `/orders` — Đơn hàng tôi | UC08 | Customer | TBD | orders/me |
| `/profile` — Hồ sơ/địa chỉ | UC10 | Customer | TBD | me/addresses |
| `/admin` — Dashboard | UC17 | Staff/Admin | TBD | stats |
| `/admin/products` — Sản phẩm | UC11 | Staff/Admin | TBD | admin/products |
| `/admin/catalog` — Danh mục/hãng | UC12 | Admin | TBD | admin/categories/brands |
| `/admin/coupons` — Khuyến mãi | UC13 | Staff/Admin | TBD | admin/coupons |
| `/admin/orders` — Đơn hàng | UC14 | Staff/Admin | TBD | admin/orders |
| `/admin/users` — Người dùng | UC15 | Admin | TBD | admin/users |
| `/admin/staff` — Nhân viên | UC16 | Admin | TBD | admin/staff |
| `/admin/inventory` — Kho hàng | UC18 | Staff/Admin | TBD | admin/inventories |
| `/admin/branches` — Chi nhánh | UC19 | Admin | TBD | admin/branches |
| `/admin/reviews` — Kiểm duyệt | UC20 | Admin | TBD | admin/reviews |

UC09 review form thường nằm trên `/products/:slug`; có thể là modal; quyết định cuối cùng theo Figma. Địa chỉ REST chỉ là proposal trong `API_CONTRACT.md`. Router URL cũng đề xuất, không được coi là đã có.
