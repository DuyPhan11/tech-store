# Kiểm thử tối thiểu theo rủi ro

## Kiểu test
- Frontend: component tests với form/loading/error, route guard, API client mocks (test framework chốt theo scaffold).
- Backend: unit test service (calculations/state transitions); integration test DB bằng MySQL phù hợp nếu có điều kiện.
- E2E: Guest đăng ký/login, Customer đặt COD/ONLINE_MOCK, Admin xử lý đơn, Customer hủy, coupon/tồn kho không sai.

## Các test MUST-have
| Module | Ca kiểm thử |
|---|---|
| Auth | OTP 5/15 min, sai/hết hạn, 1 lần, LOCKED, RBAC |
| Cart | Sản phẩm trùng, update qty, user ownership, BUY_NOW giữ cart |
| Checkout | Giá lấy DB, branch hết hàng, concurrency hàng cuối, ONLINE_MOCK failure không tạo order |
| Coupon | Lượt cuối đồng thời, preview không tiêu usage, hủy đảo 1 lần |
| Orders | Transitions hợp lệ, không hủy SHIPPING, không hoàn kho 2 lần |
| Inventory | INBOUND/OUTBOUND/SET, transfer atomic, nonnegative |
| Cloudinary | Sai file, upload fail, DB fail cleanup, không hard-delete snapshot |
| Reviews | Chỉ completed-order owner, UNIQUE, hide mềm, trung bình chỉ VISIBLE |

## Báo cáo kiểm thử
Mỗi test phải có ID, bước thực hiện, dữ liệu, kết quả mong đợi, kết quả thật, trạng thái, commit/PR. Chỉ báo độ phủ thực đo, không tự đặt tỷ lệ đạt/coverage giả.
