# Prompt mẫu cho Codex — copy rồi điền một Issue

```
Bạn đang phát triển tech-store theo AGENTS.md.
NHIỆM VỤ: [Issue # / UC / mục tiêu].
Người làm: [A/B]. Nhánh hiện hành: [tên branch].

Nguồn cần đọc theo nhiệm vụ:
- docs/requirements/BUSINESS_RULES.md (mục liên quan)
- docs/requirements/UC_MATRIX.md (UC liên quan)
- docs/architecture/API_CONTRACT.md (API của UC)
- docs/design/SCREEN_MAP.md + DESIGN_SYSTEM.md + Figma frame được duyệt (nếu là UI)
- docs/architecture/DATABASE.md + schema/migration (nếu đụng DB)

Phạm vi được phép sửa: [đường dẫn + file].
Ngoài phạm vi: [đường dẫn/phần không được động vào].
Acceptance criteria:
1. [...]
2. [...]
3. [...]

Trước khi viết code: đọc phần có liên quan, nêu kế hoạch ngắn, rủi ro và các hợp đồng chưa rõ.
Nếu cần đổi business rule, schema, enum, API hoặc Figma token: DỪNG và đề xuất Issue/ADR thay vì tự đổi.
Sau khi viết: chạy test/build liên quan, báo lệnh đã chạy, kết quả thực, các file sửa và bước bàn giao.
KHÔNG tự commit/push/PR/deploy. Tôi sẽ kiểm tra rồi yêu cầu riêng.
```

## Prompt thiết kế Figma trước khi code

```
Đọc AGENTS.md, DESIGN_SYSTEM.md, SCREEN_MAP.md và UC tương ứng.
Qua Figma MCP, tạo [frame screen name] trong file Figma dự án, dùng shared components/variables/Auto Layout.
Thiết kế desktop và mobile, có loading/empty/error states. Không thay đổi các frame đã duyệt.
Chỉ làm thiết kế, chưa code và chưa tự tạo endpoint/backend.
Tổng kết frame URL và component mới để hai người duyệt.
```

## Prompt implement React từ Figma

```
Đọc đúng frame Figma [URL], design tokens và API contract đã phê duyệt.
Implement duy nhất màn [name]/UC[xx] trong frontend/src/features/[feature].
Không sáng tạo layout/hex mới; reuse components/ui.
Kèm screenshots so sánh với Figma và test phù hợp. Không sửa backend khi chưa có Issue.
```
