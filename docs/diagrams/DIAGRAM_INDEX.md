# DIAGRAM_INDEX.md — mục lục cho Codex

> Khi được giao UCxx: mở đúng hàng trong bảng, đọc file `.puml` **dạng text** trước khi sửa code. Không suy đoán UC từ thứ tự số của file cũ.

| UC | Chức năng | Sequence cần đọc |
|---|---|---|
| UC01 | Đăng ký OTP email | [`UC01-register.puml`](sequence/UC01-register.puml) |
| UC02 | Đăng nhập | [`UC02-login.puml`](sequence/UC02-login.puml) |
| UC03 | Khôi phục mật khẩu OTP | [`UC03-reset-password.puml`](sequence/UC03-reset-password.puml) |
| UC04 | Tìm kiếm / lọc sản phẩm | [`UC04-UC05-browse-product-details.puml`](sequence/UC04-UC05-browse-product-details.puml) |
| UC05 | Chi tiết sản phẩm / Mua ngay | [`UC04-UC05-browse-product-details.puml`](sequence/UC04-UC05-browse-product-details.puml) |
| UC06 | Quản lý giỏ hàng | [`UC06-manage-cart.puml`](sequence/UC06-manage-cart.puml) |
| UC07 | Đặt hàng và thanh toán | [`UC07-coupon-preview.puml`](sequence/UC07-coupon-preview.puml), [`UC07-checkout-cod.puml`](sequence/UC07-checkout-cod.puml), [`UC07-checkout-online-mock.puml`](sequence/UC07-checkout-online-mock.puml) |
| UC08 | Lịch sử / Hủy đơn | [`UC08-order-history-cancel.puml`](sequence/UC08-order-history-cancel.puml) |
| UC09 | Đánh giá sản phẩm | [`UC09-product-reviews.puml`](sequence/UC09-product-reviews.puml) |
| UC10 | Hồ sơ và địa chỉ | [`UC10-profile-addresses.puml`](sequence/UC10-profile-addresses.puml) |
| UC11 | Quản lý sản phẩm | [`UC11-admin-products.puml`](sequence/UC11-admin-products.puml) |
| UC12 | Danh mục và thương hiệu | [`UC12-admin-categories-brands.puml`](sequence/UC12-admin-categories-brands.puml) |
| UC13 | Quản lý coupon | [`UC13-admin-coupons.puml`](sequence/UC13-admin-coupons.puml) |
| UC14 | Quản lý đơn hàng | [`UC14-admin-orders.puml`](sequence/UC14-admin-orders.puml) |
| UC15 | Quản lý người dùng | [`UC15-admin-users.puml`](sequence/UC15-admin-users.puml) |
| UC16 | Quản lý nhân viên | [`UC16-admin-staff.puml`](sequence/UC16-admin-staff.puml) |
| UC17 | Thống kê doanh thu | [`UC17-admin-dashboard.puml`](sequence/UC17-admin-dashboard.puml) |
| UC18 | Quản lý tồn kho | [`UC18-admin-inventory.puml`](sequence/UC18-admin-inventory.puml) |
| UC19 | Quản lý chi nhánh | [`UC19-admin-branches.puml`](sequence/UC19-admin-branches.puml) |
| UC20 | Kiểm duyệt đánh giá | [`UC20-admin-review-moderation.puml`](sequence/UC20-admin-review-moderation.puml) |

## Sơ đồ theo mục đích

- **Use Case:** [Tổng thể](use-case/UC_OVERVIEW.puml), [Customer](use-case/UC_CUSTOMER.puml), [Admin](use-case/UC_ADMIN.puml).
- **Class:** [Bản chỉnh sửa trắng đen](class/class-diagram-overview.drawio), [Bản text/Puml trích từ Class](class/class-diagram-readonly-reference.puml), [Chỉ mục lớp](class/CLASS_MODEL_INDEX.md).
- **ERD:** [Toàn bộ 21 bảng](erd/ERD_ALL_21_TABLES.puml), [Các sơ đồ theo nhóm](erd/README.md).
- **Sequence:** [Danh sách nguồn và quy ước](sequence/README.md).

## Khi nguồn thông tin không khớp

1. Đừng tự chọn tên DTO/enum/trạng thái dựa trên một sơ đồ cũ.
2. Báo cáo chính xác file/đoạn xung đột trong mô tả task hoặc PR.
3. Nghiệp vụ: đối chiếu `docs/requirements/BUSINESS_RULES.md` và UC được nhóm duyệt.
4. Database: SQL/migrations; API: tài liệu contract đã duyệt; UI: Figma frame đã duyệt.
5. Khi đã có quyết định, cập nhật tài liệu và diagram trong PR trước khi code phụ thuộc vào nó.
