# Quyền review / merge — nhóm 2 người

## Vai trò
- **Owner/Tech Lead (bạn):** tạo/chốt Issue, review PR của thành viên, chạy lại các kiểm tra quan trọng, là người duy nhất thực hiện nút **Merge** theo quy ước nhóm.
- **Developer (bạn cùng nhóm):** phát triển trên branch riêng, tự test, push, mở PR, sửa theo review. Có thể review độc lập PR do owner tạo nhưng không tự merge.

## Quy trình 1 Issue → 1 PR
1. Owner giao scope + acceptance criteria + link UC và diagram cụ thể.
2. Developer cập nhật `main`, tạo `feat/UCxx-short-name`, nhờ Codex đọc AGENTS và diagram tương ứng.
3. Developer tự kiểm tra test/UI, commit thật, push branch, mở PR.
4. Owner xem `Files changed`, chạy test, đối chiếu diagram, API và Figma, yêu cầu sửa nếu cần.
5. Owner bấm **Squash and merge** khi đủ điều kiện, xóa branch đã merge; cả hai kéo `main` mới.

## Owner tự làm PR
- Owner vẫn tạo branch và PR như các thành viên khác.
- **Không thể tự approve PR của chính mình** để thỏa quy tắc required approvals; nếu bật required approval, yêu cầu teammate approve rồi owner merge.
- Nếu repo chưa hỗ trợ branch protection, đây là **quy ước làm việc**, không phải cưỡng chế kỹ thuật. Không tuyên bố GitHub đã hạn chế quyền merge nếu chưa cấu hình thành công.

## Điều kiện chấp nhận
- Không thay đổi nghiệp vụ/API/schema ngoài phạm vi mà chưa được duyệt.
- Đọc đủ Sequence theo UC, kiểm tra ERD/Class nếu thay data, Figma nếu thay UI.
- Chạy/test và ghi kết quả thật, không ghi pass nếu chưa chạy.
- Không commit secret hoặc `.env`; review kỹ migration.
- Có screenshot/video (nếu sửa UI) và cập nhật docs/diagrams nếu luồng thực tế đổi.
