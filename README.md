# Tech Store — Bộ khung làm việc hai thành viên với Codex + Figma

> **STARTER DOCUMENTATION — KHÔNG PHẢI SOURCE CODE ĐÃ CHẠY.**
> Phạm vi suy ra từ báo cáo tuần 7 và các điều chỉnh Phần 1–10 đã thảo luận; các đề xuất chưa được GVHD chốt phải được hai thành viên duyệt trước khi code.

## Bản nâng cấp v2 — tài liệu diagram dành cho Codex

- [Mục lục sơ đồ và mapping 20 UC](docs/diagrams/DIAGRAM_INDEX.md).
- 21 Sequence Diagram, bao gồm 18 bản đã sửa và 3 bản gốc giữ nguyên.
- 3 Use Case Diagram được sinh từ UC_MATRIX.md.
- Class Diagram đen trắng `.drawio`, `.svg` và bản trích `.puml`/Markdown.
- ERD dạng PlantUML của 21 bảng và 24 FK, trích xuất từ SQL đề xuất; **không thay cho reverse-engineer MySQL thật**.
- Kiểm tra cấu trúc nguồn bằng `python scripts/validate_diagrams.py`.

**Quan trọng:** Sơ đồ là trợ giúp đọc hiểu, không tự động là nguồn chuẩn mới. Nếu khác `BUSINESS_RULES.md`, SQL, API contract hay Figma đã duyệt thì mở Issue, không để Codex tự suy luận.

## Bắt đầu từ đây

## Chạy dự án trên máy local

**Yêu cầu:** JDK 17, Node.js + npm, MySQL 8 (đang chạy). Không cần cài Maven: `backend/mvnw.cmd` tự tải Maven 3.9.16 ở lần chạy đầu.

**Lần đầu sau khi clone:**
1. Chép `.env.example` thành `.env.local` ở thư mục gốc, điền `DB_USERNAME`, `DB_PASSWORD` của MySQL máy mình. Không commit file này.
2. Cài thư viện frontend: `npm --prefix frontend ci`

**Chạy:** bấm đúp `start_all.bat` (hoặc `Start-Process .\start_all.bat` từ PowerShell).
- Backend: http://localhost:8080 — tự tạo database `tech_store` nếu chưa có.
- Frontend: http://localhost:5173

**Chạy riêng backend:** `cd backend` → `.\mvnw.cmd spring-boot:run` (cần đặt biến môi trường `DB_USERNAME`, `DB_PASSWORD` trước, vì Spring Boot không tự đọc `.env.local`).

**Test backend:** `cd backend` → `.\mvnw.cmd test` (dùng H2 in-memory, không cần MySQL).

1. Đặt toàn bộ nội dung thư mục này ở **root** một Git repository mới (hoặc chép chọn lọc vào repo đã tồn tại; không ghi đè file quan trọng).
2. Cả hai đọc `AGENTS.md`, `docs/requirements/PROJECT_SCOPE.md`, `docs/team/GIT_WORKFLOW.md`.
3. Kiểm tra `database/schema/01_schema_21_tables_mysql8.sql` trên database THỬ NGHIỆM; không dùng trực tiếp để migrate DB có dữ liệu.
4. Tạo GitHub repo, mời hai tài khoản riêng, bật PR review 1 người trên `main` (nếu gói/quyền repo hỗ trợ), thống nhất Figma team file và tạo 1 page Design System.
5. Chốt `docs/design/DESIGN_SYSTEM.md` và `SCREEN_MAP.md` từ Figma trước khi code giao diện chính thức.
6. Tạo scaffold `frontend/` React + TypeScript, `backend/` Spring Boot + Java theo `docs/architecture/ARCHITECTURE.md` trong hai PR độc lập.
7. Code theo Issue có định nghĩa xong (DoD) và 1 Pull Request/nhóm thay đổi; người kia review.
8. Ghi thực tế dùng Codex/Figma vào `docs/team/AI_USAGE_LOG.md` nếu nhà trường yêu cầu.

## Nguồn thông tin

- `docs/requirements/BUSINESS_RULES.md`: nghiệp vụ chốt từ các phần sửa 1–9.
- `database/schema/01_schema_21_tables_mysql8.sql`: thiết kế SQL **đề xuất** (21 bảng); chưa chạy MySQL.
- `docs/architecture/API_CONTRACT.md`: các endpoint **DRAFT**, phải rà lại khi code.
- `docs/design/DESIGN_SYSTEM.md`: token/component chuẩn (giá trị phải chốt từ Figma).
- `docs/team/DECISIONS.md`: các quyết định gây ảnh hưởng liên module.
- Báo cáo gốc: tài liệu học thuật và đối chiếu; chưa đồng nhất 100% với thiết kế chốt.

**Bất đồng giữa tài liệu?** Không tự chọn một phương án. Dừng PR liên quan, tạo Issue quyết định, cập nhật nguồn chuẩn rồi mới tiếp tục.

## Chú ý bảo mật

Không push `.env`, `CLOUDINARY_API_SECRET`, JWT secret, khóa mail SMTP, thông tin database thật. Lúc mở public repo để nộp phải quét lại secret, cả trong lịch sử commit nếu có.
