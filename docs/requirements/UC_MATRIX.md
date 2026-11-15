# Ma trận 20 use case — căn cứ từ báo cáo tuần 7

| UC | Chức năng | Phân hệ | Quyền chính |
|---|---|---|---|
| UC01 | Đăng ký tài khoản bằng OTP email | auth | Guest |
| UC02 | Đăng nhập | auth | Guest |
| UC03 | Khôi phục mật khẩu bằng OTP | auth | Guest |
| UC04 | Tìm kiếm và lọc sản phẩm | catalog | Public |
| UC05 | Xem chi tiết sản phẩm / Mua ngay | catalog | Public / Customer |
| UC06 | Quản lý giỏ hàng | cart | Customer |
| UC07 | Đặt hàng và thanh toán | checkout | Customer |
| UC08 | Xem lịch sử và hủy đơn hàng | orders | Customer (own orders) |
| UC09 | Đánh giá sản phẩm | reviews | Customer (own completed order) |
| UC10 | Quản lý thông tin cá nhân | profile | Customer |
| UC11 | Quản lý sản phẩm | admin/products | Staff, Admin |
| UC12 | Quản lý danh mục và thương hiệu | admin/catalog | Admin |
| UC13 | Quản lý khuyến mãi | admin/coupons | Staff, Admin |
| UC14 | Quản lý đơn hàng | admin/orders | Staff, Admin |
| UC15 | Quản lý người dùng và vai trò | admin/users | Admin |
| UC16 | Quản lý nhân viên | admin/staff | Admin |
| UC17 | Xem thống kê doanh thu | admin/dashboard | Staff, Admin |
| UC18 | Quản lý tồn kho/chuyển kho | admin/inventory | Staff, Admin |
| UC19 | Quản lý chi nhánh | admin/branches | Admin |
| UC20 | Kiểm duyệt đánh giá | admin/reviews | Admin |

### UC04 — tiêu chí đã duyệt cho bản frontend dùng dữ liệu mẫu

- Trang công khai `/products` tìm theo tên sản phẩm, bỏ khoảng trắng đầu/cuối, không phân biệt hoa thường và dấu tiếng Việt.
- Kết hợp một danh mục, một thương hiệu và khoảng giá VND. Hai đầu mút đều được tính, mỗi đầu có thể bỏ trống. Giá từ lớn hơn giá đến thì báo lỗi trên form.
- Thứ tự mặc định theo dữ liệu mẫu. Khi sắp xếp giá tăng hoặc giảm, các sản phẩm cùng giá giữ thứ tự ban đầu.
- Lọc và sắp xếp trước khi phân trang, 8 sản phẩm mỗi trang trên cả desktop và mobile. Thay đổi truy vấn đưa kết quả về trang đầu.

**Ownership:** Theo từng Issue/PR, không cố định một người quản lý toàn bộ backend hay frontend. `docs/team/TASK_BOARD.md` là bảng phân công thao tác hằng ngày.
