# Chỉ mục Class Diagram — trích từ bản .drawio đen trắng

> Tài liệu này sinh từ nội dung các shape thực tế của `class-diagram-overview.drawio`. Đây là lớp nghiệp vụ, **không phải danh sách đầy đủ bảng/cột SQL**.

- 19 classes, 9 enums, 23 links trong file .drawio.
- Sửa layout/nhãn ở file `.drawio` trước; bản `.puml` và tệp này là bản đọc nhanh, cần tái đồng bộ nếu .drawio thay đổi.
- Khi có xung đột với cấu trúc DB thực tế, kiểm tra SQL/migrations và tạo Issue; không tự suy diễn.

## Danh sách lớp

### Role
- `- id: Long`
- `- name: RoleName`

### Address
- `- id: Long`
- `- recipientName: String`
- `- phone: String`
- `- streetAddress: String`
- `- city: String`
- `- isDefault: Boolean`
- `+ setDefault(): void`

### PasswordResetToken
- `- id: Long`
- `- userId: Long`
- `- otpHash: String`
- `- expiryDate: LocalDateTime`
- `- isUsed: Boolean`
- `- failedAttempts: Integer`
- `+ isValid(): Boolean`

### EmailVerification
- `- id: Long`
- `- email: String`
- `- otpHash: String`
- `- expiryDate: LocalDateTime`
- `- isUsed: Boolean`
- `+ isValid(): Boolean`

### User
- `- id: Long`
- `- email: String`
- `- phone: String`
- `- password: String`
- `- fullName: String`
- `- status: UserStatus`
- `- avatarUrl: String`
- `- avatarPublicId: String`
- `+ updateProfile(): void`
- `+ changePassword(): void`

### Coupon
- `- id: Long`
- `- code: String`
- `- discountType: DiscountType`
- `- discountValue: BigDecimal`
- `- minOrderAmount: BigDecimal`
- `- usageLimit: Integer`
- `- usedCount: Integer`
- `- isActive: Boolean`
- `+ isValid(): Boolean`
- `+ calculateDiscount(): BigDecimal`

### CouponUsage
- `- id: Long`
- `- couponId: Long`
- `- userId: Long`
- `- orderId: Long`
- `- status: CouponUsageStatus`
- `- usedAt: LocalDateTime`
- `- reversedAt: LocalDateTime`
- `+ reverse(): void`

### Cart
- `- id: Long`
- `- userId: Long`
- `+ addItem(): void`
- `+ updateQuantity(): void`
- `+ removeItem(): void`

### Order
- `- id: Long`
- `- orderCode: String`
- `- userId: Long`
- `- branchId: Long`
- `- status: OrderStatus`
- `- paymentMethod: PaymentMethod`
- `- paymentStatus: PaymentStatus`
- `- finalAmount: BigDecimal`
- `- cancelReason: String`
- `- cancelledAt: LocalDateTime`
- `+ placeOrder(): void`
- `+ cancelOrder(): void`

### CartItem
- `- id: Long`
- `- cartId: Long`
- `- productId: Long`
- `- quantity: Integer`
- `+ getSubtotal(): BigDecimal`

### Review
- `- id: Long`
- `- userId: Long`
- `- productId: Long`
- `- orderId: Long`
- `- rating: Integer`
- `- status: ReviewStatus`
- `- hiddenAt: LocalDateTime`
- `- hiddenReason: String`
- `+ hide(): void`

### OrderItem
- `- id: Long`
- `- productName: String`
- `- productSku: String`
- `- productImage: String`
- `- unitPrice: BigDecimal`
- `- quantity: Integer`
- `+ getSubtotal(): BigDecimal`

### Payment
- `- id: Long`
- `- orderId: Long`
- `- amount: BigDecimal`
- `- status: PaymentStatus`
- `- paymentMethod: PaymentMethod`
- `- refundedAt: LocalDateTime`
- `+ refund(): void`

### Product
- `- id: Long`
- `- name: String`
- `- sku: String`
- `- price: BigDecimal`
- `- costPrice: BigDecimal`
- `- description: String`
- `- specifications: String`
- `- status: ActiveStatus`
- `+ getTotalStock(): int`
- `+ getAverageRating(): double`

### Inventory
- `- id: Long`
- `- productId: Long`
- `- branchId: Long`
- `- quantity: Integer`
- `- minStockAlert: Integer`
- `+ adjustStock(): void`
- `+ isLowStock(): Boolean`

### Branch
- `- id: Long`
- `- name: String`
- `- phone: String`
- `- address: String`
- `- status: ActiveStatus`
- `+ deactivate(): void`

### Category
- `- id: Long`
- `- name: String`
- `- slug: String`
- `- imageUrl: String`
- `- imagePublicId: String`
- `- status: ActiveStatus`
- `+ deactivate(): void`

### Brand
- `- id: Long`
- `- name: String`
- `- slug: String`
- `- logoUrl: String`
- `- logoPublicId: String`
- `- status: ActiveStatus`
- `+ deactivate(): void`

### ProductImage
- `- id: Long`
- `- productId: Long`
- `- imageUrl: String`
- `- cloudinaryPublicId: String`
- `- isPrimary: Boolean`
- `- displayOrder: Integer`
- `+ setPrimary(): void`

## Các enum

- **RoleName**: `ROLE_CUSTOMER`, `ROLE_STAFF`, `ROLE_ADMIN`
- **UserStatus**: `ACTIVE`, `LOCKED`
- **ActiveStatus**: `ACTIVE`, `INACTIVE`
- **OrderStatus**: `PENDING`, `CONFIRMED`, `SHIPPING`, `COMPLETED`, `CANCELLED`
- **PaymentMethod**: `COD`, `ONLINE_MOCK`
- **PaymentStatus**: `UNPAID`, `PAID`, `CANCELLED`, `REFUNDED`, `FAILED`
- **DiscountType**: `PERCENTAGE`, `FIXED_AMOUNT`
- **CouponUsageStatus**: `ACTIVE`, `REVERSED`
- **ReviewStatus**: `VISIBLE`, `HIDDEN_BY_OWNER`, `HIDDEN_BY_ADMIN`

## Liên hệ lớp (không khẳng định hướng/cardinality từ trích xuất này)

- `Role` — `User`
- `Address` — `User`
- `PasswordResetToken` — `User`
- `User` — `Cart`
- `Cart` — `CartItem`
- `CartItem` — `Product`
- `User` — `Review`
- `User` — `Order`
- `User` — `CouponUsage`
- `Coupon` — `Order`
- `Coupon` — `CouponUsage`
- `Order` — `CouponUsage`
- `Order` — `OrderItem`
- `Order` — `Payment`
- `Order` — `Branch`
- `Review` — `Order`
- `Review` — `Product`
- `OrderItem` — `Product`
- `Product` — `Category`
- `Product` — `Brand`
- `Product` — `ProductImage`
- `Product` — `Inventory`
- `Inventory` — `Branch`
