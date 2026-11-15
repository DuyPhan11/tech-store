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

### ADR-009 — Tạm triển khai Home Page theo quy trình Code-first

Ngày quyết định: 15/11/2026.

- Tài khoản Figma Starter đã hết hạn mức MCP. Nhóm tạm triển khai Home Page bằng code, sử dụng Design System và các layout React đã duyệt.
- Mọi thay đổi giao diện vẫn phải tuân thủ [DESIGN_SYSTEM.md](../design/DESIGN_SYSTEM.md).
- Trong tất cả nhiệm vụ tiếp theo, nhóm không gọi Figma MCP cho đến khi người phụ trách dự án thông báo đã có quyền truy cập trở lại.
- Khi Figma Education được kích hoạt và người phụ trách xác nhận quyền truy cập, nhóm sẽ đồng bộ giao diện Home Page từ code vào Figma, sau đó cập nhật liên kết frame trong [SCREEN_MAP.md](../design/SCREEN_MAP.md).

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
