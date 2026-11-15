# Phạm vi dự án — đề xuất từ báo cáo, chờ hai thành viên/GVHD duyệt

## Sản phẩm
Website kinh doanh thiết bị công nghệ: React + TypeScript, Spring Boot, MySQL 8, Cloudinary.

## Trong phạm vi đã thiết kế
- Guest: xem/tìm/lọc sản phẩm, chi tiết, đăng ký OTP, đăng nhập, quên mật khẩu OTP.
- Customer: hồ sơ/địa chỉ, giỏ hàng, BUY_NOW, đặt hàng COD/ONLINE_MOCK, lịch sử, hủy đơn, đánh giá đã mua.
- Staff: quản lý sản phẩm/ảnh, mã giảm giá, đơn hàng, tồn kho/chuyển kho, thống kê.
- Admin: Staff capabilities + danh mục/thương hiệu, chi nhánh, tài khoản/nhân viên/vai trò, kiểm duyệt review.

## Ngoài phạm vi đề xuất (chưa được GVHD duyệt)
- Tích hợp thanh toán tiền thật/ngân hàng, ví điện tử, trả góp.
- App mobile độc lập, chat realtime, chuyên mục blog.
- So sánh cấu hình nâng cao, tra cứu bảo hành IMEI/Serial.

## Quy tắc quản lý phạm vi
20 Use Cases trong `UC_MATRIX.md` là danh mục yêu cầu đã đặc tả; việc chia Must-have/Should-have **chưa được xác nhận chính thức**. Không âm thầm bỏ UC khỏi code hay hồ sơ đánh giá. Nếu đổi scope: ghi Decision và được hai người/GVHD chấp thuận theo quy định môn.
