# Diagrams cho người và Codex — Tech Store

Các diagram này giúp xem **luồng nghiệp vụ và quan hệ dữ liệu**, không thay cho văn bản nghiệp vụ và SQL.

| Loại | Đường dẫn | Nguồn | Dùng khi |
|---|---|---|---|
| Use Case | `use-case/*.puml` | Sinh mới từ `UC_MATRIX.md` (đề xuất) | Xác định actor, UC và phạm vi |
| Sequence | `sequence/*.puml` | 18 đã chỉnh, 3 giữ nguyên (Phần 1–9) | Code một UC, đặc biệt luồng OTP/checkout/kho |
| Class | `class/*.drawio`, `.puml`, `.md` | Class Diagram trắng đen đã tạo | Xem quan hệ các lớp nghiệp vụ |
| ERD | `erd/*.puml` | Sinh từ SQL 21 bảng trong Starter v1 | Xem bảng và FK; phải đối chiếu SQL |

Đọc trước: [`DIAGRAM_INDEX.md`](DIAGRAM_INDEX.md). Một Use Case có thể dùng nhiều sequence; một sequence có thể mô tả hai UC.

## Mức độ tin cậy

- **Nguồn chuẩn nghiệp vụ:** `docs/requirements/BUSINESS_RULES.md`, UC đã được nhóm/GVHD chốt.
- **Nguồn chuẩn CSDL:** SQL/migrations mới nhất (khi đã chạy và được duyệt); `.puml` ERD chỉ để nhìn.
- **Nguồn chuẩn tích hợp API:** `docs/architecture/API_CONTRACT.md` sau khi được duyệt (hiện là DRAFT).
- **Nguồn chuẩn giao diện:** Figma frame và `docs/design/DESIGN_SYSTEM.md` sau khi chốt.
- **Sơ đồ có thể đã rút gọn:** Nếu khác với nguồn chuẩn hoặc thực tế code, mở Issue/Decision, không tự đoán.

## Sửa sơ đồ

1. Sửa `.puml` trực tiếp bằng VS Code; có thể dùng PlantUML extension để render SVG.
2. Sửa Class `.drawio` tại https://app.diagrams.net/; cập nhật lại bản trích text/PlantUML nếu chỉnh thuộc tính/quan hệ.
3. Khi đổi SQL/migrations, **sinh lại ERD** và kiểm tra mọi FK.
4. Đính kèm link file thay đổi vào PR, ghi rõ UC nào bị ảnh hưởng.
