# Design System — cần phê duyệt trên Figma trước khi triển khai UI

> **Không có palette/font/icon cuối cùng trong tài liệu gốc.** Không tự chế màu thương hiệu rồi coi là yêu cầu. Link Figma và các token phải chốt trước khi code.

## Figma nguồn chuẩn
- Figma project/file URL: `TBD`
- Page `00 - Foundations`: color/typography/spacing/border/shadow/breakpoints.
- Page `01 - Components`: button, input, select, table, modal, toast, badge, pagination, product-card, order-status, loading/empty/error.
- Page `02 - Customer`: header/footer/home/catalog/product/cart/checkout/orders/profile.
- Page `03 - Admin`: admin shell/dashboard/products/orders/coupons/inventory/branches/users/reviews.
- Mỗi màn hình có Desktop và Mobile frame chính; dùng Auto Layout/component variants.

## Token cần khóa sau khi duyệt

| Token | Giá trị | Ghi chú |
|---|---|---|
| primary, primary-hover | `TBD từ Figma` | Không hardcode từng màn |
| bg, surface, text, muted, border | `TBD từ Figma` | Hỗ trợ trạng thái |
| success, warning, danger | `TBD từ Figma` | Có semantic mapping |
| font-family / sizes / weights | `TBD từ Figma` | Dùng chung |
| spacing scale | `TBD từ Figma` | 4/8/12/16... chỉ là gợi ý |
| radius / shadow / breakpoints | `TBD từ Figma` | Component tokens |

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
