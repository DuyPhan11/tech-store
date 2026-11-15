# ERD — bản sơ đồ tham khảo từ SQL hiện có

**Nguồn duy nhất:** `database/schema/01_schema_21_tables_mysql8.sql` của Starter v1.

- Sinh được **21 bảng** và **24 khai báo khóa ngoại**.
- `ERD_ALL_21_TABLES.puml` thể hiện toàn bộ bảng và FK, có thể rất rộng khi render.
- Các sơ đồ `ERD_*.puml` còn lại chia thành nhóm để Codex đọc nhanh; nhóm có thể lặp lại bảng dùng chung.
- **Không phải ERD reverse-engineer từ MySQL thực tế.** Đây là schema **đề xuất**, chưa chạy hay xác minh trực tiếp trên MySQL Server.
- **SQL/migrations mới là nguồn chuẩn** cho tên bảng, cột, kiểu dữ liệu, khóa và ràng buộc; ERD chỉ là bản nhìn tổng quan.

Khi database đã được tạo thật, sử dụng MySQL Workbench → Database → Reverse Engineer, xuất ERD được duyệt và cập nhật tài liệu/changelog; không coi `.puml` này là một migration.

## Ngoại lệ quan trọng

- Một số quan hệ như `coupon_usages` (lượt ACTIVE), stock locking, xử lý OTP và authorization **không thể hiện trọn vẹn bằng FK**; đọc `docs/requirements/BUSINESS_RULES.md`.
- `email_verifications` không có FK đến `users`: OTP đăng ký được tạo **trước** khi có tài khoản.
- Class Diagram có 19 lớp nhưng SQL có 21 bảng vì `user_roles`, `audit_logs` là bảng vật lý ngoài nhóm lớp nghiệp vụ tổng quan.
