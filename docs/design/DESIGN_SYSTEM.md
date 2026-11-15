# Design System — Tech Store

## Figma nguồn chuẩn

File Figma Free dùng ba page. Các frame Customer và Admin cùng nằm trên page thứ ba.

- [Tech Store — UI Design System](https://www.figma.com/design/EQRJPe0GhmkAlbB6pRhgkN/Tech-Store---UI-Design-System)
- [00 - Foundations](https://www.figma.com/design/EQRJPe0GhmkAlbB6pRhgkN/Tech-Store---UI-Design-System?node-id=0-1) · [Bảng mẫu token và style](https://www.figma.com/design/EQRJPe0GhmkAlbB6pRhgkN/Tech-Store---UI-Design-System?node-id=5-2)
- [01 - Components](https://www.figma.com/design/EQRJPe0GhmkAlbB6pRhgkN/Tech-Store---UI-Design-System?node-id=8-2) · [Bảng biến thể dùng chung](https://www.figma.com/design/EQRJPe0GhmkAlbB6pRhgkN/Tech-Store---UI-Design-System?node-id=10-141)
- [02 - Screens](https://www.figma.com/design/EQRJPe0GhmkAlbB6pRhgkN/Tech-Store---UI-Design-System?node-id=15-2) chứa layout Customer và [section 03 - Admin](https://www.figma.com/design/EQRJPe0GhmkAlbB6pRhgkN/Tech-Store---UI-Design-System?node-id=16-31). Link từng frame có trong [Screen Map](SCREEN_MAP.md).
- Mỗi màn hình có Desktop và Mobile frame chính; dùng Auto Layout/component variants.

## Variables — Tech Store · Foundations (Light)

| Variable | Giá trị |
|---|---|
| `color/primary` | `#244BC4` |
| `color/primary-hover` | `#193AA1` |
| `color/background` | `#F4F6FA` |
| `color/surface` | `#FFFFFF` |
| `color/text` | `#16243A` |
| `color/muted` | `#516077` |
| `color/border` | `#CDD5E1` |
| `color/border-control` | `#77859A` |
| `color/success` | `#14704C` |
| `color/warning` | `#865000` |
| `color/danger` | `#B22E42` |
| `color/focus` | `#244BC4` |
| `color/on-primary` | `#FFFFFF` |
| `color/disabled-surface` | `#E4E9F0` |
| `color/disabled-text` | `#516077` |

Các kích thước sau tính bằng px. Với `space/*` và `radius/*`, hậu tố của variable là giá trị số.

| Nhóm | Giá trị |
|---|---|
| `space/*` | 0, 4, 8, 12, 16, 24, 32, 48, 64 |
| `radius/*` | 0, 4, 8, 12, 16 |
| `breakpoint/*` (chiều rộng tối thiểu) | mobile 0, tablet 768, desktop 1200 |
| `icon/*` | small 16, default 20, large 24, stroke 2, target 44 |
| `focus/*` | width 2, offset 2 |

## Typography và shadow

| Text style | Font | Cỡ / chiều cao dòng (px) | Weight |
|---|---|---|---|
| `Heading/H1` | Inter | 40 / 48 | Bold (700) |
| `Heading/H2` | Inter | 28 / 36 | Semi Bold (600) |
| `Heading/H3` | Inter | 20 / 28 | Semi Bold (600) |
| `Body/Default` | Inter | 16 / 24 | Regular (400) |
| `Body/Small` | Inter | 14 / 20 | Regular (400) |
| `Label/Default` | Inter | 14 / 20 | Semi Bold (600) |
| `Caption/Default` | Inter | 12 / 16 | Regular (400) |

`Shadow/Raised` là drop shadow với offset (0, 4 px), blur 12 px, spread 0 và màu RGB (8%, 14%, 23%) ở opacity 12%.

## Quy tắc trong Foundations

| Viewport | Lưới | Lề ngang |
|---|---|---|
| Mobile · 0–767 px | 4 cột | 16 px |
| Tablet · 768–1199 px | 8 cột | 24 px |
| Desktop · từ 1200 px | 12 cột | 32 px |

- Icon dùng độc lập có tên truy cập và vùng bấm tối thiểu 44 × 44 px.
- Trạng thái lỗi và thành công có thông báo bằng chữ đi cùng màu.
- Focus bàn phím dùng viền 2 px cách phần tử 2 px. Control disabled bỏ hover và chặn kích hoạt.
- Menu nổi và popover dùng `Shadow/Raised`. Bề mặt thông thường dùng đường viền.

## Quy tắc frontend
- Không viết style/hex/color trực tiếp trong màn hình nghiệp vụ nếu token đã có.
- Button/Input/Card/Modal dùng shared components `frontend/src/components/ui`.
- Hành vi phải có loading/empty/error/success, disabled và validation nhất quán.
- Các list có pagination/filter, form có error message, trang admin có shell dùng chung.
- UI code dựa trên **frame đã approved**, không tự redesign khi làm logic.
- Nếu cần đổi component chung: thay Figma component/token, docs, shared code trong PR riêng và xem ảnh hưởng màn hình khác.

## Quy trình Figma → Code
1. Xác định một user flow/screen trong SCREEN_MAP.
2. Codex dùng Figma MCP tạo/edit frame; người làm thiết kế review và ghi link.
3. Hai người duyệt frame + component. Chỉ sau đó Codex implement React.
4. So sánh preview trên browser với frame; lấy screenshot ở PR để reviewer kiểm.
5. Không đồng thời chỉnh thiết kế Figma và CSS chính trên hai nhánh mà không có owner.
