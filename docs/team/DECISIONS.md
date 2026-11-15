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
| ADR-007 | Kiểm tra và chốt stack FE build, Java version, auth strategy, migration strategy | Open | Scaffold |
| ADR-008 | Request idempotency cho checkout (mechanism) | Open | Checkout/API/schema |

## Mẫu một quyết định

```
### ADR-009 — [Tên]
- Date:
- Context / vấn đề:
- Options:
- Decision:
- Consequences:
- Who approved / PR URL:
```

Không cập nhật chỉ trong chat cá nhân: quyết định cuối phải xuất hiện ở đây (và docs liên quan) bằng PR.
