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
| ADR-008 | Request idempotency cho checkout (mechanism) | Open | Checkout/API/schema |
| ADR-009 | Tạm triển khai Home Page theo quy trình Code-first | Đang áp dụng | Home Page và việc sử dụng Figma MCP |
| ADR-010 | Định tuyến chi tiết sản phẩm bằng Slug và quy tắc tồn kho công khai (UC04/UC05) | Approved | Routing, catalog types, API contract, sequence |

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
