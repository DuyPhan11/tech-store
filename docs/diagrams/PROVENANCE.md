# Provenance / nguồn gốc sơ đồ trong Starter v2

| Thành phần | Nguồn thực tế | Thao tác trong v2 |
|---|---|---|
| Starter v1 | `Tech_Store_Codex_Figma_Team_Starter.zip` (30 mục) | Giữ nguyên nội dung cơ sở, cập nhật README/AGENTS/GIT_WORKFLOW |
| Sequence sửa | `sequence-diagrams-ngan-gon.zip` (18 `.puml`) | Giữ byte nội dung, đổi tên theo UC |
| Sequence gốc | `admin-simple.zip` | Bổ sung nguyên bản 04-browse, 16-staff, 19-dashboard |
| Class | `Class_Diagram_Tong_The_Trang_Den.drawio` và SVG preview | Copy nguyên bản, trích lớp/quan hệ thành text và PlantUML tham khảo |
| Use Case | `UC_MATRIX.md` trong starter v1 | **Sinh mới** ba diagram (không phải bản gốc của báo cáo) |
| ERD | `01_schema_21_tables_mysql8.sql` trong starter v1 | **Sinh mới** PlantUML với 21 table/24 FK từ SQL đề xuất |

## Giới hạn
- Chưa mở/render PlantUML bằng renderer chuyên dụng; có kiểm tra cấu trúc và đồng bộ danh sách.
- Chưa chạy SQL hay reverse engineer một MySQL Server.
- Không có quyền xác nhận người hướng dẫn đã duyệt nghiệp vụ, route, API hay Figma.
- Sequence Diagram rút gọn chỉ mô tả luồng tổng quát; không thay thế kiểm tra transaction, authorization và concurrency ở backend.
- Nếu sau này nhóm sửa class `.drawio` hoặc SQL, bản text/PlantUML trích xuất có thể không còn đồng bộ; cập nhật trong cùng PR.
