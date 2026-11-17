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

### Contract change protocol
- Nếu cần đổi API: tạo Issue / ADR, cập nhật file này + backend DTO + frontend type + tests **trong cùng PR hoặc hai PR có thứ tự phụ thuộc rõ**.
- Không tự sửa endpoint ở UI để khớp mock data mà không sửa backend.
