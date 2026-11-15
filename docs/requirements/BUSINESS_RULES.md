# Quy tắc nghiệp vụ — được tổng hợp từ báo cáo và các phần sửa 1–9

> Quy ước triển khai được nhóm dự kiến. Các điểm trái với nội dung GVHD phê duyệt phải được xử lý qua `docs/team/DECISIONS.md`.

## 1. Xác thực và phân quyền
- OTP đăng ký email: 6 số, 5 phút, chờ 60 giây mới gửi lại; xác minh thành công rồi tạo `users`, `ROLE_CUSTOMER`, `carts`; OTP lưu hash, dùng 1 lần.
- Reset password: OTP 6 số, 15 phút, tối đa 5 lần sai; không tiết lộ email tồn tại; hash mật khẩu BCrypt.
- `ROLE_ADMIN` có quyền quản trị của `ROLE_STAFF`; quyền Customer là role riêng. `LOCKED` không sử dụng được API bảo vệ.

## 2. Giỏ hàng, mua ngay và giá
- Một cart/user, một dòng/product. Thêm/sửa giỏ không giữ hay trừ tồn.
- `CART`: checkout chỉ dùng `selectedCartItemIds` thuộc người đăng nhập; xóa những dòng đã đặt sau khi thành công.
- `BUY_NOW`: lấy `productId` và `quantity`, không thay đổi giỏ.
- Giá/tổng tiền từ database tại checkout, không tin số tiền gửi từ frontend.

## 3. Đơn hàng và thanh toán
- Đơn hàng mới `PENDING`; sau đó `CONFIRMED → SHIPPING → COMPLETED`.
- Chỉ `PENDING`/`CONFIRMED` hủy được (`CANCELLED`).
- COD: Payment `UNPAID`, hoàn tất COD mới chuyển `PAID`; hủy COD chưa thu: `CANCELLED`.
- ONLINE_MOCK thành công: `PAID` + tạo đơn; giả lập thất bại: KHÔNG tạo Order/Payment/CouponUsage, không trừ kho, không sửa giỏ.
- Hủy online đã trả: giả lập hoàn tiền rồi `REFUNDED`; trạng thái `orders.payment_status` và `payments.status` khớp.
- Chống tạo đơn trùng khi retry (idempotency design được chốt trước khi code checkout).

## 4. Coupon
- `PERCENTAGE`/`FIXED_AMOUNT`, tối đa một coupon/đơn.
- Preview không tiêu lượt. Khi checkout kiểm tra coupon còn hiệu lực, lượt dùng, đã dùng, min order, trong transaction có khóa.
- `used_count` = số usage `ACTIVE`. Một user tối đa một usage `ACTIVE`/coupon.
- Hủy hợp lệ đổi `ACTIVE → REVERSED`, hoàn used_count đúng một lần. Không xóa lịch sử.

## 5. Tồn kho và chi nhánh
- Một inventory/product/branch; số lượng >=0.
- Trừ kho sau checkout thành công; hủy hợp lệ hoàn kho đúng một lần về chi nhánh gốc.
- `INBOUND`, `OUTBOUND`, `SET` và `TRANSFER` phải lock/transaction nhất quán; chuyển kho không làm đổi tổng tồn.
- `INACTIVE` branch không nhận đơn/chuyển kho; không vô hiệu hóa branch có PENDING/CONFIRMED/SHIPPING.

## 6. Cloudinary
- React chọn file; Spring Boot kiểm tra quyền/định dạng/dung lượng trước khi upload authenticated qua Cloudinary.
- MySQL lưu `secure_url` + `public_id`; không đưa secret lên frontend.
- Nếu DB fail sau upload, dọn dẹp bù trừ. Không xóa ảnh khi snapshot order_items còn tham chiếu.

## 7. Đánh giá
- Customer chỉ tạo review cho product trong order `COMPLETED` của mình; một bộ (user, product, order) chỉ một review cả khi đã ẩn.
- Review `VISIBLE`, `HIDDEN_BY_OWNER`, `HIDDEN_BY_ADMIN`. Điểm trung bình tính từ VISIBLE.
- Admin ẩn vi phạm và ghi audit, không xóa vật lý.

## 8. Tiêu chí kiểm thử bất biến
- Hai khách cùng mua hàng cuối: chỉ số lượng giao dịch thành công phù hợp tồn thực, không tồn âm.
- Gửi hủy đơn hai lần: kho/coupon chỉ được hoàn một lần.
- Guest/Customer không gọi được admin APIs; không sửa được tài nguyên người khác.
