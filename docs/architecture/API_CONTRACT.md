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
| Catalog | GET | `/api/brands` | Public |
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
| Admin products (UC11) | GET/POST | `/api/admin/products` | Staff/Admin |
| Admin products (UC11) | GET/PUT | `/api/admin/products/{id}` | Staff/Admin |
| Admin products (UC11) | PATCH | `/api/admin/products/{id}/status` | Staff/Admin |
| Admin categories (UC12) | GET/POST | `/api/admin/categories` | Admin |
| Admin categories (UC12) | PUT | `/api/admin/categories/{id}` | Admin |
| Admin categories (UC12) | PATCH | `/api/admin/categories/{id}/status` | Admin |
| Admin brands (UC12) | GET/POST | `/api/admin/brands` | Admin |
| Admin brands (UC12) | PUT | `/api/admin/brands/{id}` | Admin |
| Admin brands (UC12) | PATCH | `/api/admin/brands/{id}/status` | Admin |
| Admin coupons (UC13) | GET/POST | `/api/admin/coupons` | Staff/Admin |
| Admin coupons (UC13) | GET/PUT | `/api/admin/coupons/{id}` | Staff/Admin |
| Admin coupons (UC13) | PATCH | `/api/admin/coupons/{id}/status` | Staff/Admin |
| Admin orders (UC14) | GET | `/api/admin/orders` | Staff/Admin |
| Admin orders (UC14) | GET | `/api/admin/orders/{id}` | Staff/Admin |
| Admin orders (UC14) | PATCH | `/api/admin/orders/{id}/status` | Staff/Admin |
| Admin inventory (UC18) | GET | `/api/admin/inventories` | Staff/Admin |
| Admin inventory (UC18) | GET | `/api/admin/inventories/branches` | Staff/Admin |
| Admin inventory (UC18) | POST | `/api/admin/inventories/adjust` | Staff/Admin |
| Admin inventory (UC18) | POST | `/api/admin/inventories/transfer` | Staff/Admin |
| Admin branches (UC19) | GET/POST | `/api/admin/branches` | Admin |
| Admin branches (UC19) | PUT | `/api/admin/branches/{id}` | Admin |
| Admin branches (UC19) | PATCH | `/api/admin/branches/{id}/status` | Admin |

## Auth DTO tham chiếu (UC01 - Đã triển khai)

- **Endpoint yêu cầu OTP:** `POST /api/auth/register/request-otp` (Quyền: `Public`)
  - **Request Body:**
    ```json
    {
      "email": "customer@example.com"
    }
    ```
  - **Logic & Quy tắc:**
    - Kiểm tra email hợp lệ và chưa tồn tại trong bảng `users` (`409 Conflict` nếu đã tồn tại).
    - Giới hạn tần suất: Cooldown 60 giây giữa các lần yêu cầu OTP trên cùng email (`429 Too Many Requests` nếu yêu cầu quá sớm).
    - Tạo mã OTP ngẫu nhiên 6 chữ số, mã hóa băm bằng BCrypt và lưu vào bảng `email_verifications`.
    - Thời hạn hiệu lực: 5 phút (300 giây).
  - **Response Body (200 OK):**
    ```json
    {
      "message": "Mã xác thực OTP đã được gửi đến email (hiệu lực 5 phút)",
      "email": "customer@example.com",
      "expiresInSeconds": 300,
      "resendCooldownSeconds": 60
    }
    ```

- **Endpoint xác thực OTP và tạo tài khoản:** `POST /api/auth/register/verify-otp` (và alias `POST /api/auth/register`) (Quyền: `Public`)
  - **Request Body:**
    ```json
    {
      "email": "customer@example.com",
      "otp": "123456",
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567",
      "password": "Password@123"
    }
    ```
  - **Logic & Quy tắc:**
    - Kiểm tra email hoặc số điện thoại chưa tồn tại trong bảng `users` (`409 Conflict` nếu trùng).
    - Tra cứu bản ghi OTP mới nhất chưa sử dụng (`is_used = false`) cho email.
    - Kiểm tra thời hạn hiệu lực: nếu quá 5 phút (`expires_at < now`) trả về `400 Bad Request` ("Mã OTP đã hết hạn").
    - Đối chiếu mã OTP với hash BCrypt: nếu không khớp trả về `400 Bad Request` ("Mã OTP không chính xác"), tăng `failed_attempts`.
    - Khi hợp lệ: đánh dấu `is_used = true`.
    - Tạo bản ghi `User` (mật khẩu mã hóa BCrypt), gán vai trò `ROLE_CUSTOMER`, tạo giỏ hàng trống `Cart` (1 cart/user).
    - Tạo JWT `accessToken` và trả về thông tin đăng nhập (`201 Created`).
  - **Response Body (201 Created):**
    ```json
    {
      "accessToken": "eyJhbGciOi...",
      "tokenType": "Bearer",
      "expiresIn": 86400,
      "user": {
        "id": 1,
        "email": "customer@example.com",
        "phone": "0901234567",
        "fullName": "Nguyễn Văn A",
        "status": "ACTIVE",
        "roles": ["ROLE_CUSTOMER"]
      }
    }
    ```

- **Endpoint yêu cầu OTP khôi phục mật khẩu:** `POST /api/auth/password/request-otp` (và alias `POST /api/auth/forgot-password`) (Quyền: `Public`)
  - **Request Body:**
    ```json
    {
      "email": "customer@example.com"
    }
    ```
  - **Logic & Quy tắc bảo mật:**
    - Không tiết lộ email có tồn tại hay không: Luôn trả về HTTP `200 OK` kể cả khi email chưa từng được đăng ký.
    - Chống spam abuse: Cooldown 60 giây giữa các lần yêu cầu OTP trên cùng tài khoản (`429 Too Many Requests`).
    - Nếu tài khoản tồn tại: Sinh mã OTP ngẫu nhiên 6 chữ số, băm bằng BCrypt và lưu vào bảng `password_reset_tokens`.
    - Thời hạn hiệu lực: 15 phút (`expires_at = now + 15m`).
    - Gửi email thông báo OTP cho người dùng (qua SMTP hoặc console log).
  - **Response Body (200 OK):**
    ```json
    {
      "message": "Nếu email của bạn tồn tại trong hệ thống, mã xác thực OTP đã được gửi đến hộp thư (hiệu lực 15 phút).",
      "resendCooldownSeconds": 60
    }
    ```

- **Endpoint xác thực OTP và đổi mật khẩu mới:** `POST /api/auth/password/reset` (và alias `POST /api/auth/reset-password`) (Quyền: `Public`)
  - **Request Body:**
    ```json
    {
      "email": "customer@example.com",
      "otp": "123456",
      "newPassword": "NewPassword@123"
    }
    ```
  - **Logic & Quy tắc kiểm tra (Anti-abuse):**
    - Kiểm tra định dạng email, mã OTP 6 số, mật khẩu mới tối thiểu 6 ký tự (`400 Bad Request`).
    - Tra cứu bản ghi `password_reset_tokens` mới nhất chưa sử dụng (`is_used = false`) của user.
    - Kiểm tra lạm dụng (Abuse protection): Nếu số lần nhập sai `failed_attempts >= 5`, lập tức từ chối và vô hiệu hóa mã OTP (`400 Bad Request`).
    - Kiểm tra thời hạn: Nếu quá 15 phút (`expiry_date < now`), trả về `400 Bad Request` ("Mã OTP đã hết hạn").
    - Kiểm tra OTP hash với BCrypt: Nếu sai mã, tăng `failed_attempts` lên 1 và lưu vào DB (`400 Bad Request`).
    - Khi hợp lệ: Đánh dấu `is_used = true`, cập nhật mật khẩu mới mã hóa BCrypt vào bảng `users`.
  - **Response Body (200 OK):**
    ```json
    {
      "message": "Đặt lại mật khẩu thành công! Bạn có thể đăng nhập bằng mật khẩu mới."
    }
    ```

## Catalog DTO tham chiếu (UC04, UC05)

- `GET /api/products?q={text}&category={cat}&brand={brand}&min={min}&max={max}&sort={sort}&page={page}`:
  - Chỉ trả về sản phẩm `status = 'ACTIVE'`.
  - Phân trang `pageSize = 8`.
  - Phản hồi: `{ "products": CatalogProduct[], "total": number, "page": number }`.
- `GET /api/products/{slug}`:
  - Tra cứu bằng `slug`. Chỉ trả về khi `status = 'ACTIVE'`.
  - Trả về 404 Not Found nếu slug không tồn tại hoặc sản phẩm `INACTIVE`.
  - Phản hồi: `{ id, slug, sku, name, categoryId, brandId, priceVnd, image, images, specification, specifications, description, stock, inStock }`.

## Admin Catalog DTO (UC12 - Đã triển khai, ADR-018)

- Quyền: chỉ `ROLE_ADMIN` (`ROLE_STAFF`/`ROLE_CUSTOMER` → `403`, không token → `401`). **Không có `DELETE`** (→ `405`); vô hiệu hóa bằng trạng thái.
- Slug: bắt buộc, ≤100 ký tự, regex `^[a-z0-9]+(-[a-z0-9]+)*$`, duy nhất trong bảng (trùng → `409`). Lỗi validate → `400` với `errors.{field}`. Id không tồn tại → `404`.
- `GET /api/admin/categories` → mọi danh mục kể cả `INACTIVE`, sắp theo `id`:
  ```json
  [{ "id": 2, "name": "Laptop chơi game (Gaming)", "slug": "laptop-gaming", "description": "...", "imageUrl": null,
     "parentId": 1, "parentName": "Laptop", "status": "ACTIVE", "productCount": 1,
     "createdAt": "2026-11-19T10:00:00", "updatedAt": "2026-11-19T10:00:00" }]
  ```
- `POST /api/admin/categories` (`201`) / `PUT /api/admin/categories/{id}` (`200`):
  ```json
  { "name": "Laptop AI", "slug": "laptop-ai", "description": "Tùy chọn", "parentId": 1 }
  ```
  `parentId` phải tồn tại (→ `400`), không được là chính nó hoặc danh mục con cháu (chống vòng → `400`). `parentId: null` = danh mục gốc.
- `GET /api/admin/brands` → mọi thương hiệu kể cả `INACTIVE`:
  ```json
  [{ "id": 1, "name": "Nova", "slug": "nova", "country": "Việt Nam", "description": "...", "logoUrl": null,
     "status": "ACTIVE", "productCount": 3, "createdAt": "...", "updatedAt": "..." }]
  ```
- `POST /api/admin/brands` (`201`) / `PUT /api/admin/brands/{id}` (`200`):
  ```json
  { "name": "Corsair", "slug": "corsair", "country": "Mỹ", "description": "Tùy chọn" }
  ```
- `PATCH /api/admin/categories/{id}/status`, `PATCH /api/admin/brands/{id}/status`: body `{ "status": "ACTIVE" | "INACTIVE" }` (giá trị khác → `400`); trả về DTO admin tương ứng.
- `productCount`: số sản phẩm mọi trạng thái gắn trực tiếp với danh mục/thương hiệu.
- Ảnh/logo Cloudinary: chưa hỗ trợ trong UC12 (ADR-018 A7); `imageUrl`/`logoUrl` chỉ đọc.

## Admin Products DTO (UC11 - ADR-019, Proposed)

- Quyền: `ROLE_STAFF` (ADMIN kế thừa). `ROLE_CUSTOMER` → `403`, không token → `401`. **Không có `DELETE`** (→ `405`); ẩn sản phẩm bằng trạng thái.
- `GET /api/admin/products` → mọi sản phẩm kể cả `INACTIVE`, sắp `id` giảm dần (frontend lọc ở client). `GET /api/admin/products/{id}` → chi tiết (`404` nếu không tồn tại).
- `AdminProductResponse`:
  ```json
  { "id": 12, "name": "Laptop Nova 14", "slug": "laptop-nova-14", "sku": "NOVA-14",
    "categoryId": 2, "categoryName": "Laptop Gaming", "brandId": 1, "brandName": "Nova",
    "price": 18990000.00, "costPrice": 15000000.00, "description": "...",
    "specifications": [{ "label": "CPU", "value": "Core i7" }],
    "status": "ACTIVE", "totalStock": 14, "primaryImageUrl": "https://res.cloudinary.com/...",
    "images": [{ "id": 31, "url": "https://res.cloudinary.com/...", "primary": true, "displayOrder": 0 }],
    "createdAt": "2026-11-22T10:00:00", "updatedAt": "2026-11-22T10:00:00" }
  ```
  `totalStock` = tổng `quantity` ở chi nhánh `ACTIVE`, chỉ đọc (điều chỉnh kho thuộc UC18).
- `POST /api/admin/products` (`201`) / `PUT /api/admin/products/{id}` (`200`): `multipart/form-data`
  - part `data` (`application/json`):
    ```json
    { "name": "Laptop Nova 14", "slug": "laptop-nova-14", "sku": "NOVA-14", "categoryId": 2, "brandId": 1,
      "price": 18990000, "costPrice": 15000000, "description": "Tùy chọn",
      "specifications": [{ "label": "CPU", "value": "Core i7" }],
      "images": [{ "imageId": 31, "primary": false }, { "fileIndex": 0, "primary": true }] }
    ```
  - part `files`: 0..n ảnh mới, tham chiếu bằng `fileIndex` (vị trí trong `files`).
  - `images` có thứ tự (= `displayOrder`). Mỗi phần tử có đúng một trong `imageId` (ảnh cũ của chính sản phẩm) hoặc `fileIndex`. Ảnh cũ không có trong mảng bị gỡ. Mọi file phải được tham chiếu đúng một lần. Tối đa **8** ảnh; có ảnh thì đúng **1** primary (không chỉ định → ảnh đầu tiên); >1 primary → `400`. Bỏ trống `images` (null) → giữ ảnh cũ theo thứ tự hiện tại và thêm các file mới vào cuối.
  - Validate: `name` ≤200; `slug` ≤255 theo regex slug chung; `sku` ≤50, `^[A-Z0-9]+(-[A-Z0-9]+)*$`; `price`, `costPrice` ≥ 0 (tối đa 13 chữ số nguyên, 2 thập phân). Trùng `slug`/`sku` → `409`. Category/brand không tồn tại hoặc `INACTIVE` (kể cả danh mục cha) khi chọn mới → `400` (giữ nguyên category/brand cũ đã bị vô hiệu hóa vẫn được lưu). File không phải JPEG/PNG/WebP hoặc >5MB → `400`. Cloudinary lỗi hoặc chưa cấu hình → `502`.
  - Sản phẩm mới mặc định `ACTIVE`.
- `PATCH /api/admin/products/{id}/status`: body `{ "status": "ACTIVE" | "INACTIVE" }`, trả `AdminProductResponse`.
- Cloudinary (BUSINESS_RULES §6): upload từ backend bằng credential trong biến môi trường; MySQL lưu `secure_url` + `public_id`. DB lỗi sau upload → xóa bù ảnh vừa upload. Ảnh bị gỡ chỉ bị xóa trên Cloudinary sau commit và khi không còn `order_items.product_image` tham chiếu.
- Danh sách lựa chọn danh mục/thương hiệu trên form lấy từ `GET /api/categories` và `GET /api/brands` (chỉ `ACTIVE`).

### Ảnh hưởng tới catalog công khai
- `GET /api/brands` (Public): `[{ "id": 1, "name": "Nova", "slug": "nova", "logoUrl": null }]`, chỉ `ACTIVE`, sắp theo tên.
- `GET /api/categories`, `/api/categories/tree`, `/api/categories/{slug}`: chỉ trả danh mục `ACTIVE` **và** mọi danh mục tổ tiên `ACTIVE`.
- `GET /api/products`, `/api/products/{slug}`: ẩn sản phẩm có danh mục, danh mục cha hoặc thương hiệu `INACTIVE`.
- Frontend `/products` lấy bộ lọc từ `GET /api/categories` + `GET /api/brands` (`CatalogOption.id = slug`).

## Admin Inventory DTO (UC18 - ADR-021, Proposed)

- Quyền: `ROLE_STAFF` (ADMIN kế thừa); `ROLE_CUSTOMER` → `403`, không token → `401`.
- `GET /api/admin/inventories?branchId={id}&q={text}` → dòng tồn (mọi trạng thái sản phẩm/chi nhánh), sắp theo tên sản phẩm rồi `branchId`; `q` khớp tên hoặc SKU, không phân biệt hoa thường:
  ```json
  [{ "inventoryId": 3, "productId": 1, "productName": "Laptop Nova 14", "sku": "LAP-NOV-14",
     "branchId": 1, "branchName": "Chi nhánh Quận 1", "branchStatus": "ACTIVE",
     "quantity": 8, "minStockAlert": 5, "updatedAt": "2026-11-22T10:00:00" }]
  ```
- `GET /api/admin/inventories/branches` → `[{ "id": 1, "name": "Chi nhánh Quận 1", "status": "ACTIVE" }]` (mọi trạng thái, chỉ đọc).
- `POST /api/admin/inventories/adjust` (`200`, trả dòng tồn sau khi đổi):
  ```json
  { "productId": 1, "branchId": 1, "type": "INBOUND", "quantity": 10, "reason": "Nhập lô tháng 11" }
  ```
  `type` ∈ `INBOUND | OUTBOUND | SET`. INBOUND/OUTBOUND: `quantity > 0`; SET: `quantity >= 0`. OUTBOUND vượt tồn hoặc chưa có dòng → `409`. INBOUND/SET tự tạo dòng nếu chưa có.
- `POST /api/admin/inventories/transfer` (`200`, trả `{ "from": InventoryItem, "to": InventoryItem }`):
  ```json
  { "productId": 1, "fromBranchId": 1, "toBranchId": 2, "quantity": 3, "reason": "Cân đối tồn" }
  ```
  `quantity > 0`; nguồn = đích → `400`; nguồn thiếu hàng/không có dòng → `409`; đích tự tạo dòng; tổng tồn không đổi.
- Chung: `reason` ≤255; chi nhánh `INACTIVE` (adjust, nguồn hoặc đích) → `400`; sản phẩm/chi nhánh không tồn tại → `404`. Thao tác khóa sản phẩm rồi các dòng tồn (`PESSIMISTIC_WRITE`, TRANSFER theo `branchId` tăng dần). Mỗi thao tác thành công ghi 1 dòng `audit_logs` (`INVENTORY_INBOUND|OUTBOUND|SET|TRANSFER`).
- `minStockAlert` chỉ đọc trong UC18.

## Admin Orders DTO (UC14 - ADR-023, Proposed)

- Quyền: `ROLE_STAFF` (ADMIN kế thừa); `ROLE_CUSTOMER` → `403`, không token → `401`. Staff thấy mọi đơn (chưa lọc theo chi nhánh — FS20).
- `GET /api/admin/orders?status={status}&q={text}&page={0..}&size={1..100}`: sắp `createdAt` giảm dần; `q` khớp một phần (không phân biệt hoa thường) mã đơn, tên hoặc SĐT người nhận; `status` ∈ `PENDING|CONFIRMED|SHIPPING|COMPLETED|CANCELLED` (khác → `400`); mặc định `page=0`, `size=20` (ngoài khoảng → `400`).
  ```json
  { "items": [AdminOrderResponse], "page": 0, "size": 20, "totalElements": 42, "totalPages": 3,
    "counts": { "ALL": 42, "PENDING": 5, "CONFIRMED": 3, "SHIPPING": 4, "COMPLETED": 25, "CANCELLED": 5 } }
  ```
  `counts` tính theo `q`, bỏ qua `status` (cho số trên các tab).
- `AdminOrderResponse` = toàn bộ trường của `OrderResponse` (UC08: `id, orderCode, status, statusLabel, paymentMethod, paymentStatus, paymentStatusLabel, recipientName, recipientPhone, shippingAddress, branchId, branchName, totalItemsAmount, discountAmount, finalAmount, notes, cancelReason, cancelledAt, canCancel, itemSummary, items, createdAt, updatedAt`) cộng:
  ```json
  { "customer": { "id": 3, "fullName": "Khách hàng Thử nghiệm", "email": "customer@techstore.vn", "phone": "0903456789" },
    "payment": { "method": "COD", "status": "UNPAID", "transactionCode": "COD-ORD-...", "amount": 18990000.00,
                 "paidAt": null, "refundedAt": null } }
  ```
  `payment` có thể `null` nếu đơn thiếu dòng `payments`. Response `/api/orders/me` không đổi.
- `GET /api/admin/orders/{id}` → `AdminOrderResponse`; không tồn tại → `404`.
- `PATCH /api/admin/orders/{id}/status` body `{ "status": "CONFIRMED", "reason": null }` → `AdminOrderResponse`.
  - Hợp lệ: `PENDING→CONFIRMED`, `CONFIRMED→SHIPPING`, `SHIPPING→COMPLETED`, `PENDING|CONFIRMED→CANCELLED`. Khác (nhảy cóc, lùi, giữ nguyên, về `PENDING`, hủy đơn đã giao/hủy) → `409`.
  - `CANCELLED`: `reason` bắt buộc (không rỗng), ≤ 500 ký tự (→ `400`); hoàn kho đúng 1 lần về chi nhánh gốc; COD → payment `CANCELLED`; ONLINE_MOCK → `REFUNDED` + `refundedAt`; dùng chung lõi với `POST /api/orders/{id}/cancel`; đơn có coupon → usage `ACTIVE → REVERSED`, `used_count − 1` đúng 1 lần (ADR-024).
  - `COMPLETED` + COD: payment `UNPAID → PAID`, `paidAt`, `orders.payment_status = PAID`.
  - Khóa dòng đơn (`PESSIMISTIC_WRITE`) trước khi kiểm tra. Thành công ghi 1 dòng `audit_logs` (`ORDER_CONFIRMED|ORDER_SHIPPING|ORDER_COMPLETED|ORDER_CANCELLED`, `entity_name = orders`, details: `orderCode, from, to, reason, paymentStatusBefore, paymentStatusAfter`).

## Admin Coupon DTO (UC13 - ADR-022, Proposed)

- Quyền: `ROLE_STAFF` (ADMIN kế thừa); `ROLE_CUSTOMER` → `403`, không token → `401`. **Không có `DELETE`** (→ `405`); vô hiệu hóa bằng `PATCH .../status`.
- `CouponResponse`:
  ```json
  { "id": 1, "code": "TECHSTORE10", "discountType": "PERCENTAGE", "discountValue": 10.00,
    "minOrderAmount": 0.00, "maxDiscountAmount": 2000000.00, "usageLimit": 100, "usedCount": 0,
    "startDate": "2026-01-01T00:00:00", "endDate": "2027-12-31T23:59:59", "active": true,
    "displayStatus": "ACTIVE", "createdAt": "2026-11-22T10:00:00", "updatedAt": "2026-11-22T10:00:00" }
  ```
  `displayStatus` tính ở server, ưu tiên `DISABLED` (`active = false`) > `EXPIRED` (now > `endDate`) > `EXHAUSTED` (`usedCount ≥ usageLimit`) > `SCHEDULED` (now < `startDate`) > `ACTIVE`.
- `GET /api/admin/coupons?q={text}&status={displayStatus}` → mọi coupon, sắp `id` giảm dần; `q` khớp một phần mã (không phân biệt hoa thường); `status` ∈ 5 giá trị trên (khác → `400`). `GET /api/admin/coupons/{id}` → `404` nếu không tồn tại.
- `POST /api/admin/coupons` (`201`, mặc định `active = true`) / `PUT /api/admin/coupons/{id}` (`200`):
  ```json
  { "code": "giam500k", "discountType": "FIXED_AMOUNT", "discountValue": 500000, "minOrderAmount": 10000000,
    "maxDiscountAmount": null, "usageLimit": 50, "startDate": "2026-11-22T00:00", "endDate": "2026-12-31T23:59" }
  ```
  - `code` trim + UPPERCASE, `^[A-Z0-9_-]{3,50}$`; trùng mã → `409`.
  - `discountType` ∈ `PERCENTAGE | FIXED_AMOUNT`; PERCENTAGE `0 < value ≤ 100`; FIXED_AMOUNT `value > 0`. `maxDiscountAmount` null hoặc `> 0`, chỉ dùng với PERCENTAGE (FIXED_AMOUNT → lưu `null`). `minOrderAmount ≥ 0` (bỏ trống = 0). `usageLimit ≥ 1`. `endDate > startDate`. Tiền tối đa 13 chữ số nguyên, 2 thập phân. Lỗi → `400` với `errors.{field}`; ngày/enum sai định dạng → `400`.
  - Sửa: `usageLimit < usedCount` → `409`. Coupon đã có usage (bất kỳ trạng thái, hoặc `usedCount > 0`): đổi `code`/`discountType`/`discountValue` → `409`; vẫn được đổi hạn, `usageLimit`, `minOrderAmount`, `maxDiscountAmount`.
- `PATCH /api/admin/coupons/{id}/status`: body `{ "active": true | false }` (thiếu → `400`), trả `CouponResponse`. Sửa và đổi trạng thái khóa dòng coupon (`PESSIMISTIC_WRITE`).

## Coupon preview DTO (UC07/UC13 - ADR-022, Proposed)

- `POST /api/checkout/coupon-preview` (Quyền: `ROLE_CUSTOMER`; Staff/Admin không có `ROLE_CUSTOMER` → `403`; tài khoản `LOCKED` → `403`).
  ```json
  { "couponCode": "TECHSTORE10", "source": "CART", "selectedCartItemIds": [12, 15] }
  { "couponCode": "GIAM500K", "source": "BUY_NOW", "productId": 1, "quantity": 1 }
  ```
- Response `200`: `{ "couponCode": "TECHSTORE10", "subtotal": 18990000.00, "discountAmount": 1899000.00, "finalAmount": 17091000.00 }`.
- Subtotal tính ở server theo giá hiện tại; cart item không thuộc user → `404`; sản phẩm `INACTIVE` / dữ liệu thiếu → `400`. Không kiểm tra tồn kho.
- Tính giảm: PERCENTAGE = `floor(subtotal × value / 100)` giới hạn bởi `maxDiscountAmount`; FIXED_AMOUNT = `value`; luôn `≤ subtotal`; làm tròn xuống đồng.
- Mã không hợp lệ → `400`, `message` tiếng Việt và `errors.reason` ∈ `NOT_FOUND | DISABLED | NOT_STARTED | EXPIRED | EXHAUSTED | MIN_ORDER_NOT_MET | ALREADY_USED` (user đã có usage `ACTIVE`).
- Preview **không khóa, không tạo `coupon_usages`, không tăng `used_count`**. Áp coupon khi `POST /api/checkout` là FS16.

## Admin Branches DTO (UC19 - ADR-020, Proposed)

- Quyền: chỉ `ROLE_ADMIN` (`ROLE_STAFF`/`ROLE_CUSTOMER` → `403`, không token → `401`). **Không có `DELETE`** (→ `405`): `orders`, `inventories` tham chiếu chi nhánh.
- `GET /api/admin/branches` → mọi chi nhánh kể cả `INACTIVE`, sắp theo `id`:
  ```json
  [{ "id": 1, "name": "Chi nhánh Quận 1", "phone": "02811112222", "address": "123 Lê Lợi, Quận 1, TP.HCM",
     "status": "ACTIVE", "createdAt": "2026-11-22T10:00:00", "updatedAt": "2026-11-22T10:00:00" }]
  ```
- `POST /api/admin/branches` (`201`, mặc định `ACTIVE`) / `PUT /api/admin/branches/{id}` (`200`, `404` nếu không tồn tại):
  ```json
  { "name": "Chi nhánh Thủ Đức", "phone": "028 3333 4444", "address": "12 Võ Văn Ngân, Thủ Đức, TP.HCM" }
  ```
  `name` bắt buộc ≤150; `address` bắt buộc ≤255; `phone` tùy chọn ≤20, `^[0-9+() .-]{8,20}$` (rỗng → `null`). Lỗi → `400` với `errors.{field}`.
- `PATCH /api/admin/branches/{id}/status`: body `{ "status": "ACTIVE" | "INACTIVE" }` (giá trị khác → `400`). Chuyển `INACTIVE` khi còn đơn `PENDING`/`CONFIRMED`/`SHIPPING` → `409` ("Chi nhánh còn N đơn hàng chưa hoàn tất"); chỉ còn đơn `COMPLETED`/`CANCELLED` → `200`. Thao tác khóa chi nhánh (`PESSIMISTIC_WRITE`).
- Chi nhánh `INACTIVE` không nhận checkout mới (`POST /api/checkout` → `400`, đã có từ UC07) và không được tính vào tồn kho công khai.
- "Tỉnh / Thành phố" trên UI được tách từ `address` ở frontend; không có field API riêng.

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

## Checkout DTO tham chiếu (UC07 - Đã triển khai)

- **Endpoint:** `POST /api/checkout` (Quyền: `ROLE_CUSTOMER`)
- **Headers:** `Authorization: Bearer <token>`, tùy chọn `Idempotency-Key: <unique-key>`
- **Request Body:**
  ```json
  {
    "source": "CART",
    "selectedCartItemIds": [12, 15],
    "branchId": 1,
    "paymentMethod": "COD",
    "couponCode": null,
    "recipientName": "Khách hàng Thử nghiệm",
    "recipientPhone": "0901234567",
    "shippingAddress": "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
    "notes": "Giao giờ hành chính",
    "idempotencyKey": "idemp-20261117-uuid"
  }
  ```
  *Lưu ý:* Với `source = "BUY_NOW"`: gửi `productId` và `quantity` thay vì `selectedCartItemIds`. **Giá tiền và tổng tiền được tính toán 100% tại backend.**
- **Response Body (201 Created):**
  ```json
  {
    "orderId": 101,
    "orderCode": "ORD-20261117-XXXXXX",
    "status": "PENDING",
    "paymentMethod": "COD",
    "paymentStatus": "UNPAID",
    "recipientName": "Khách hàng Thử nghiệm",
    "recipientPhone": "0901234567",
    "shippingAddress": "123 Lê Lợi, Phường Bến Nghé, Quận 1, TP.HCM",
    "totalItemsAmount": 18990000.00,
    "discountAmount": 0.00,
    "finalAmount": 18990000.00,
    "items": [
      {
        "productId": 1,
        "productName": "Laptop Nova 14",
        "productSku": "LAP-NOV-14",
        "productImage": "https://...",
        "unitPrice": 18990000.00,
        "quantity": 1,
        "subtotalAmount": 18990000.00
      }
    ]
  }
  ```
- **Coupon (ADR-024, Proposed):** `couponCode` trim + UPPERCASE; `null`/rỗng = không dùng mã (hành vi cũ). Có mã: tính subtotal ở server → khóa/trừ tồn kho → khóa coupon (`PESSIMISTIC_WRITE`) → kiểm tra như `coupon-preview` (chưa tới hạn, hết hạn, tắt, hết lượt, dưới đơn tối thiểu, user đã có usage `ACTIVE`) → `discountAmount` theo cùng công thức preview, `finalAmount = totalItemsAmount − discountAmount`, `payments.amount = finalAmount`, `orders.coupon_id`; tạo `coupon_usages` (`ACTIVE`) và `used_count + 1`. Mã không hợp lệ → `400` với `errors.reason` (`NOT_FOUND | DISABLED | NOT_STARTED | EXPIRED | EXHAUSTED | MIN_ORDER_NOT_MET | ALREADY_USED`), rollback toàn bộ: không tạo đơn, không trừ kho, không xóa giỏ.
- **Xử lý lỗi:**
  - `401 Unauthorized`: Chưa đăng nhập tài khoản.
  - `403 Forbidden`: Tài khoản bị khóa (`LOCKED`) hoặc không có quyền `ROLE_CUSTOMER`.
  - `400 Bad Request`: Chi nhánh không tồn tại / tạm ngưng (`INACTIVE`), dữ liệu form thiếu hoặc không hợp lệ.
  - `404 Not Found`: Mục giỏ hàng không tồn tại hoặc không thuộc sở hữu của người dùng; sản phẩm không tìm thấy.
  - `409 Conflict`: Tồn kho chi nhánh không đủ số lượng yêu cầu.
  - **Idempotency:** Gửi retry với cùng `idempotencyKey` trả về cùng kết quả đơn hàng đã tạo, không trừ kho lần 2.

### Profile & Address DTO (UC10 - Đã triển khai)

- **GET `/api/me` (Quyền: `ROLE_CUSTOMER`)**
  - Trả về thông tin cá nhân của người dùng hiện tại kèm theo thông tin địa chỉ giao hàng mặc định (`defaultAddress`).
  - Response (200 OK):
    ```json
    {
      "id": 1,
      "email": "customer@techstore.vn",
      "fullName": "Nguyễn Văn A",
      "phone": "0901234567",
      "avatarUrl": null,
      "roles": ["ROLE_CUSTOMER"],
      "status": "ACTIVE",
      "defaultAddress": {
        "id": 1,
        "recipientName": "Nguyễn Văn A",
        "phone": "0901234567",
        "streetAddress": "123 Lê Lợi",
        "ward": "Bến Nghé",
        "district": "Quận 1",
        "city": "TP. Hồ Chí Minh",
        "fullAddress": "123 Lê Lợi, Bến Nghé, Quận 1, TP. Hồ Chí Minh",
        "isDefault": true,
        "createdAt": "2026-11-17T12:00:00",
        "updatedAt": "2026-11-17T12:00:00"
      },
      "createdAt": "2026-11-17T10:00:00"
    }
    ```

- **PATCH `/api/me` (Quyền: `ROLE_CUSTOMER`)**
  - Cập nhật họ tên, số điện thoại hoặc avatar. Email là định danh bất biến không thể cập nhật.
  - Request:
    ```json
    {
      "fullName": "Nguyễn Văn B",
      "phone": "0912345678"
    }
    ```
  - Lỗi: `409 Conflict` nếu số điện thoại đã được đăng ký bởi tài khoản khác.

- **POST `/api/me/change-password` (Quyền: `ROLE_CUSTOMER`)**
  - Đổi mật khẩu tài khoản. Mật khẩu cũ được kiểm tra qua BCrypt; mật khẩu mới tối thiểu 6 ký tự.
  - Request:
    ```json
    {
      "oldPassword": "OldPassword@123",
      "newPassword": "NewPassword@123",
      "confirmPassword": "NewPassword@123"
    }
    ```
  - Lỗi: `400 Bad Request` nếu mật khẩu cũ không đúng hoặc mật khẩu mới không hợp lệ.

- **GET `/api/me/addresses` (Quyền: `ROLE_CUSTOMER`)**
  - Danh sách địa chỉ của người dùng đã xác thực, sắp xếp địa chỉ mặc định lên đầu (`isDefault DESC, createdAt DESC`).

- **POST `/api/me/addresses` (Quyền: `ROLE_CUSTOMER`)**
  - Thêm địa chỉ mới. Nếu người dùng chưa có địa chỉ nào, địa chỉ này tự động thành mặc định (`isDefault = true`).
  - Nếu gửi kèm `isDefault = true`, các địa chỉ còn lại của người dùng sẽ tự động hủy cờ mặc định.
  - Request:
    ```json
    {
      "recipientName": "Nguyễn Văn A",
      "phone": "0901234567",
      "streetAddress": "123 Lê Lợi",
      "ward": "Bến Nghé",
      "district": "Quận 1",
      "city": "TP. Hồ Chí Minh",
      "isDefault": true
    }
    ```

- **PUT `/api/me/addresses/{id}` & PATCH `/api/me/addresses/{id}` (Quyền: `ROLE_CUSTOMER`)**
  - Cập nhật thông tin địa chỉ với kiểm tra quyền sở hữu chặt chẽ (`404 Not Found` nếu không thuộc sở hữu của người dùng).

- **DELETE `/api/me/addresses/{id}` (Quyền: `ROLE_CUSTOMER`)**
  - Xóa địa chỉ với kiểm tra quyền sở hữu (`404 Not Found` nếu không thuộc sở hữu).
  - Nếu xóa địa chỉ đang là mặc định và còn các địa chỉ khác, địa chỉ gần nhất còn lại sẽ tự động được gán làm mặc định.

- **PATCH `/api/me/addresses/{id}/default` (Quyền: `ROLE_CUSTOMER`)**
  - Đặt địa chỉ chỉ định làm mặc định và hủy mặc định ở tất cả các địa chỉ khác của người dùng.

### Order DTO (UC08 - Đã triển khai)

- **GET `/api/orders/me` (Quyền: `ROLE_CUSTOMER`)**
  - Lấy danh sách lịch sử đơn hàng của người dùng hiện tại, sắp xếp theo thời gian tạo mới nhất (`createdAt DESC`).
  - Response (200 OK): Mảng các `OrderResponse`.

- **GET `/api/orders/me/{id}` (Quyền: `ROLE_CUSTOMER`)**
  - Xem chi tiết đơn hàng kèm danh sách sản phẩm (`items`), trạng thái đơn và thông tin thanh toán.
  - Phân quyền sở hữu: trả về `404 Not Found` nếu đơn hàng không tồn tại hoặc không thuộc sở hữu của người dùng.

- **POST `/api/orders/{id}/cancel` (Quyền: `ROLE_CUSTOMER`)**
  - Hủy đơn hàng kèm lý do hủy (`cancelReason`).
  - Request Body:
    ```json
    {
      "cancelReason": "Khách hàng đổi ý / không còn nhu cầu"
    }
    ```
  - Nghiệp vụ & Bất biến:
    - Chỉ cho phép hủy khi đơn ở trạng thái `PENDING` hoặc `CONFIRMED` (BR18).
    - Khóa bi quan (`PESSIMISTIC_WRITE`) chống tranh chấp hủy đồng thời (BR48).
    - Hoàn trả số lượng tồn kho nguyên tử đúng 1 lần về chi nhánh gốc (BR32, BR48). Sắp xếp theo `productId` tăng dần khi khóa tồn kho để phòng ngừa deadlock.
    - Đơn có coupon: khóa coupon, usage `ACTIVE → REVERSED` + `reversedAt`, `used_count − 1` (không âm), đúng 1 lần; khách dùng lại được mã sau khi hủy (ADR-024).
    - Cập nhật trạng thái thanh toán (BR19, BR21): đơn COD chuyển sang `CANCELLED`; đơn ONLINE_MOCK chuyển sang `REFUNDED` và cập nhật `refundedAt`.
    - Đơn đã hủy chuyển trạng thái `CANCELLED`, ghi nhận `cancelReason` và `cancelledAt`.
    - Trả về `400 Bad Request` nếu đơn hàng ở trạng thái không thể hủy (`SHIPPING`, `COMPLETED`, hoặc đã `CANCELLED`).
    - Trả về `404 Not Found` nếu đơn hàng không thuộc sở hữu của người dùng (BR49).

### Contract change protocol
- Nếu cần đổi API: tạo Issue / ADR, cập nhật file này + backend DTO + frontend type + tests **trong cùng PR hoặc hai PR có thứ tự phụ thuộc rõ**.
- Không tự sửa endpoint ở UI để khớp mock data mà không sửa backend.
