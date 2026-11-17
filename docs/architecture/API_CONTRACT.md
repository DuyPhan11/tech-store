# API Contract — BẢN ĐỀ XUẤT, CHƯA IMPLEMENT

- Base URL **dự kiến** `/api` (nên thống nhất một lần, không mỗi feature dùng một URL).
- HTTP JSON, trừ upload `multipart/form-data`. Token trong `Authorization: Bearer <token>` ở protected endpoints.
- JSON response/error shape cần được chọn và có integration test trước Sprint 1.
- Quy ước lỗi: `401` chưa xác thực, `403` không đủ quyền, `400` invalid, `404` resource không tồn tại/không sở hữu, `409` xung đột nghiệp vụ.

## Endpoint dự kiến (cần PR phê duyệt)

| Feature | Method | Endpoint | Role |
|---|---|---|---|
| Auth | POST | `/api/auth/register/request-otp` | Public |
| Auth | POST | `/api/auth/register/verify-otp` | Public |
| Auth | POST | `/api/auth/login` | Public |
| Auth | POST | `/api/auth/password/request-otp` | Public |
| Auth | POST | `/api/auth/password/reset` | Public |
| Catalog | GET | `/api/products` | Public |
| Catalog | GET | `/api/products/{slug}` | Public |
| Catalog | GET | `/api/categories` | Public |
| Catalog | GET | `/api/categories/tree` | Public |
| Cart | GET | `/api/cart` | Customer |
| Cart | POST | `/api/cart/items` | Customer |
| Cart | PATCH | `/api/cart/items/{itemId}` | Customer |
| Cart | DELETE | `/api/cart/items/{itemId}` | Customer |
| Cart | DELETE | `/api/cart` | Customer |
| Checkout | POST | `/api/checkout/coupon-preview` | Customer |
| Checkout | POST | `/api/checkout` | Customer |
| Orders | GET | `/api/orders/me` | Customer |
| Orders | POST | `/api/orders/{id}/cancel` | Customer (owner) |
| Reviews | POST | `/api/reviews` | Customer |
| Profile | GET/PATCH | `/api/me` | Customer |
| Admin products | POST/PUT | `/api/admin/products` / `/api/admin/products/{id}` | Staff/Admin |
| Admin inventory | POST | `/api/admin/inventories/adjust` | Staff/Admin |
| Admin inventory | POST | `/api/admin/inventories/transfer` | Staff/Admin |
| Admin branches | PATCH | `/api/admin/branches/{id}/status` | Admin |

## Catalog DTO tham chiếu (UC04, UC05)

- `GET /api/products?q={text}&category={cat}&brand={brand}&min={min}&max={max}&sort={sort}&page={page}`:
  - Chỉ trả về sản phẩm `status = 'ACTIVE'`.
  - Phân trang `pageSize = 8`.
  - Phản hồi: `{ "products": CatalogProduct[], "total": number, "page": number }`.
- `GET /api/products/{slug}`:
  - Tra cứu bằng `slug`. Chỉ trả về khi `status = 'ACTIVE'`.
  - Trả về 404 Not Found nếu slug không tồn tại hoặc sản phẩm `INACTIVE`.
  - Phản hồi: `{ id, slug, sku, name, categoryId, brandId, priceVnd, image, images, specification, specifications, description, stock, inStock }`.

## Cart DTO tham chiếu (UC06)

- `GET /api/cart`: Lấy giỏ hàng của user đang đăng nhập (tự động khởi tạo giỏ nếu chưa có).
- `POST /api/cart/items`: Body `{ "productId": number, "quantity": number }`. Thêm sản phẩm vào giỏ; nếu sản phẩm đã có thì cộng dồn số lượng, giữ nguyên 1 dòng/sản phẩm (`uq_cart_items_cart_product`). Không giữ tồn kho.
- `PATCH /api/cart/items/{itemId}`: Body `{ "quantity": number }`. Cập nhật số lượng của dòng sản phẩm (kiểm tra quyền sở hữu).
- `DELETE /api/cart/items/{itemId}`: Xóa một dòng sản phẩm khỏi giỏ (kiểm tra quyền sở hữu).
- `DELETE /api/cart` / `DELETE /api/cart/items`: Xóa toàn bộ sản phẩm trong giỏ hàng.
- Cấu trúc `CartResponse`:
  ```json
  {
    "id": 1,
    "items": [
      {
        "id": 10,
        "productId": 1,
        "productName": "Laptop Nova 14",
        "productSlug": "laptop-nova-14",
        "productSku": "NOVA-14",
        "productImage": "https://...",
        "priceVnd": 18990000,
        "quantity": 2,
        "subtotalVnd": 37980000,
        "inStock": true
      }
    ],
    "totalItems": 2,
    "totalUniqueItems": 1,
    "totalPriceVnd": 37980000
  }
  ```

## Checkout DTO tham chiếu

```json
{
  "source": "CART",
  "selectedCartItemIds": [12, 15],
  "branchId": 1,
  "paymentMethod": "COD",
  "couponCode": null,
  "recipientName": "Demo Customer",
  "recipientPhone": "0900000000",
  "shippingAddress": "Demo address",
  "notes": null
}
```

For `BUY_NOW`: send `source="BUY_NOW"`, `productId`, `quantity` instead of `selectedCartItemIds`. **Không gửi và tin giá từ client.** Idempotency key/response shape cần chốt khi thực hiện checkout.

### Contract change protocol
- Nếu cần đổi API: tạo Issue / ADR, cập nhật file này + backend DTO + frontend type + tests **trong cùng PR hoặc hai PR có thứ tự phụ thuộc rõ**.
- Không tự sửa endpoint ở UI để khớp mock data mà không sửa backend.
