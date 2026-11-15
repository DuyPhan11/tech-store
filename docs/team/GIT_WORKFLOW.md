# Quy trình GitHub cho nhóm hai người

## Thiết lập ban đầu
- Hai GitHub accounts riêng; mời collaborator đúng quyền; không dùng chung tài khoản.
- `main` luôn là phiên bản chạy được; không push trực tiếp.
- Nếu GitHub repo hỗ trợ: bật **Require a pull request before merging**, **1 approving review**, và **status checks** sau khi có CI thực sự. Hai người phải có quyền review phù hợp; cài ruleset trước khi làm việc.
- Có thể bật squash merge để mỗi PR thành một commit trên main; commit trong branch vẫn phản ánh tiến trình thật.

## Một feature = một Issue + một PR có phạm vi rõ

```
Issue #12: [UC06] Cart — add/update/remove
Branch: feat/uc06-cart
Commits: feat(cart): add owned cart service
         test(cart): cover duplicate item and quantity checks
         feat(cart): implement screen from Figma
PR: [UC06] Cart management — closes #12
```

## Quy trình hằng ngày (terminal)

```bash
git switch main
git pull --ff-only origin main
git switch -c feat/uc06-cart
# code + test + verify
git status
git add frontend/src/features/cart
# Add các file backend/docs/tests liên quan theo mục đích thực tế
git commit -m "feat(cart): implement add/update/remove items"
git push -u origin feat/uc06-cart
```

Mở PR trên GitHub: `base: main` ← `compare: feat/uc06-cart`. Điền template, giao reviewer cho người còn lại; CI xanh → approve → merge. Sau khi merge:

```bash
git switch main
git pull --ff-only origin main
git branch -d feat/uc06-cart
```

Nếu `main` có cập nhật trong lúc làm:

```bash
git fetch origin
git merge origin/main
# Resolve conflicts, run tests, push lại nhánh của bạn
```

## Commit conventions
- `feat(auth): add email OTP verification`
- `fix(checkout): reject insufficient branch stock`
- `test(coupon): cover concurrent last usage`
- `docs(api): define checkout request schema`
- `refactor(products): extract image service`
- `chore(ci): run frontend and backend checks`

**Không chia commit giả hoặc dùng tài khoản người kia để tạo lịch sử công việc.** Số commit không chứng minh công sức; Issue/PR/review/test có ý nghĩa hơn. Nếu cùng làm thật một commit có thể dùng `Co-authored-by` theo quy định GitHub.

## Hợp đồng review
Reviewer phải xem: (a) đúng Issue/UC, (b) API/schema/status không lệch, (c) giao diện bám Figma, (d) tests chạy thật, (e) security/secret, (f) cập nhật docs. Không tự approve PR của mình.

## Tránh xung đột
- Không cùng sửa `application.yml`, `SecurityConfig`, `App.tsx`, `tokens.css`, schema V1, shared UI cùng lúc nếu chưa chỉ định owner.
- Với thay đổi giao nhau: PR **contract-first** rồi mới code. Bắt đầu branch mới từ main sau khi contract PR merge.
- Nếu ai nghỉ, để lại `HANDOFF.md` hoặc cập nhật Issue. Người kế tiếp lấy main mới, không làm trên nhánh chưa rõ trạng thái.


## Quy tắc nhóm: owner review và merge cuối cùng
Đọc `docs/team/REVIEW_POLICY.md`. Mỗi người vẫn có commit/PR trên branch của mình; người giữ repo là người duy nhất bấm Merge theo quy ước. Nếu bật required approval, PR do owner tạo cần teammate approve độc lập trước khi owner merge.
