# Database — hợp đồng dữ liệu

**Schema đề xuất ban đầu**: `database/schema/01_schema_21_tables_mysql8.sql` (21 tables, MySQL 8). Chưa chạy thực tế và KHÔNG phải migration.

## Cách xử lý
1. Hai người review trước khi chạy SQL và tự tạo DB mới local.
2. Dùng migrations phiên bản (gợi ý `backend/src/main/resources/db/migration/V1__init.sql`), quyết định cách import SQL hiện tại và đóng băng V1.
3. Mỗi lần thay schema: tạo migration mới + cập nhật `docs/architecture/API_CONTRACT.md` nếu DTO thay đổi; chạy integration tests.
4. Không sửa tên cột tùy ý để vừa ý agent. Không đổi enum mà chưa cập nhật cả 3 nơi: docs, DB, client.
5. Cập nhật ERD bằng MySQL Workbench Reverse Engineer sau khi migrations chạy trên DB thử nghiệm.
6. Không commit `database` dump chứa dữ liệu thật; dữ liệu demo phải giả lập.

## Những unique quan trọng
- `categories (parent_id)`: Tự tham chiếu khóa ngoại `parent_id REFERENCES categories(id)` hỗ trợ phân cấp danh mục đa tầng (Cha - Con, ví dụ: Laptop -> Laptop Gaming, Laptop Văn phòng).
- `inventories (product_id, branch_id)`; không unique đơn lẻ từng FK.
- `cart_items (cart_id, product_id)`; không unique đơn lẻ từng FK.
- `coupon_usages (order_id)`; `(coupon_id, user_id, status)` index hỗ trợ kiểm tra usage ACTIVE với transaction.
- `reviews (user_id, product_id, order_id)`; ẩn review vẫn chiếm bản ghi.

**Migration phải được reviewer đọc kỹ** khi có DROP, TRUNCATE, làm thay đổi dữ liệu hoặc FK.

## Migrations đã áp dụng sau schema gốc
| File | Nội dung | Quyết định |
|---|---|---|
| `database/migrations/01_add_parent_id_to_categories.sql` | `categories.parent_id` tự tham chiếu | ADR-017 |
| `database/migrations/02_add_country_to_brands.sql` | `brands.country VARCHAR(100) NULL` — quốc gia xuất xứ thương hiệu (Admin Catalog UC12) | ADR-018 (A5) |

## Entity bổ sung không đổi schema
- `audit_logs` → entity `com.techstore.common.audit.AuditLog` + `AuditLogService` (UC18, ADR-021). Map đúng các cột hiện có; `user_id` lưu id người thực hiện (không có FK trong schema).
- `coupons` → entity `com.techstore.coupon.entity.Coupon`; `coupon_usages` → `CouponUsage` (UC13, ADR-022). Map đúng cột hiện có; FS15 chỉ đọc `coupon_usages`. `used_count` vẫn là số usage `ACTIVE`, do FS16 duy trì khi checkout/hủy.
