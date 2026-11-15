# Kế hoạch code theo lát cắt chức năng (vertical slices)

> Đây là thứ tự **đề xuất**, không phải deadline hay phần công việc được phân công chính thức.

## Cổng chung trước khi bắt đầu
- [ ] Hai tài khoản GitHub, 1 repo, quy tắc PR đã thống nhất.
- [ ] Xác nhận ngôn ngữ Java version, React/TypeScript, quản lý dependency và local dev.
- [ ] Chốt scope và rules; thử chạy schema trên MySQL mới, kiểm tra FK/unique.
- [ ] Chốt Figma: frame/components/token cho shell, đăng nhập, catalog, customer/admin layout.
- [ ] Bản API contract mẫu đầu tiên được hai người review.

## Phases đề xuất

| Giai đoạn | Người A (owner PR) | Người B (owner PR) | Điều kiện tích hợp |
|---|---|---|---|
| 0. Bootstrap | Frontend scaffolding, Figma tokens và routing | Backend scaffolding, MySQL schema, security skeleton | Main build được, scripts/docs rõ |
| 1. Nền tảng | UC01–03 xác thực/OTP end-to-end | UC04–05 danh sách và chi tiết sản phẩm end-to-end | Có auth API và catalog API chạy |
| 2. Quản trị cốt lõi | UC11–12 sản phẩm, danh mục, Cloudinary | UC18–19 chi nhánh, tồn kho | Inventory và product data đã thống nhất |
| 3. Chuẩn bị mua hàng | UC06 giỏ hàng | UC13 coupon và coupon preview | Cart/discount contract được review |
| 4. Đặt hàng | UC07 checkout COD, ONLINE_MOCK | UC14 giao diện/quản lý trạng thái đơn (cần đồng bộ order service) | Chốt trạng thái, schema, API trước khi chạy song song |
| 5. Sau mua | UC09 review | UC08 lịch sử và hủy đơn (cần test coupon/stock) | Hủy/hoàn kho/hoàn coupon được integration test |
| 6. Hoàn thiện | UC10 hồ sơ + avatar và UC17 dashboard | UC15–16 người dùng/nhân viên và UC20 kiểm duyệt | Kiểm tra RBAC toàn bộ |
| 7. QA | Test luồng Customer, UI/UX, tài liệu | Test Admin, security, CI/CD, deploy | Cả hai cùng review, demo E2E |

**Luân phiên vai trò:** B có thể nhận frontend ở phase kế tiếp, A nhận backend; với một module đã có owner PR, người khác không sửa cùng file khi chưa thống nhất. Hai người nên luân phiên cả **reviewer** và **implementer**, tính công bằng bằng khối lượng và minh chứng thực tế, không chỉ số commit.

## Định nghĩa xong cho một feature
- [ ] Đúng business rules và phạm vi Issue.
- [ ] API contract/DB migration/Design System được cập nhật khi cần.
- [ ] Chạy được local, có unit/integration tests phù hợp.
- [ ] UI bám frame Figma duyệt, có loading, empty, error, success, responsive cơ bản.
- [ ] Không hardcode API URLs/secrets; phân quyền cả frontend lẫn backend.
- [ ] Reviewer khác người viết PR đã kiểm tra.
- [ ] PR ghi rõ minh chứng và thử lại sau merge.
