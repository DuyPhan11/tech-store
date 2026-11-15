# Sequence Diagram — 20 Use Cases, 21 tệp PlantUML

> **Nguồn:** 18 tệp cập nhật trong `sequence-diagrams-ngan-gon.zip` + 3 tệp giữ nguyên từ `admin-simple.zip`. Nội dung PlantUML được giữ nguyên; tên file trong Starter v2 đặt lại theo mã UC để agent không nhầm số thứ tự hình vẽ với mã Use Case.

- `UC04` và `UC05` được biểu diễn chung trong một hình tìm kiếm/xem chi tiết.
- `UC07` gồm ba hình riêng: kiểm tra coupon, COD, ONLINE_MOCK.
- Một vài tên tệp nguồn khác mã UC; xem bảng dưới, không suy đoán mã từ số cũ.
- Đây là các luồng **rút gọn để báo cáo**, không phải đặc tả kỹ thuật đầy đủ. Những bước lock/transaction/rollback phải đọc ở `BUSINESS_RULES.md` và schema/Service.

| Mã UC | File trong Starter | Nguồn |
|---|---|---|
| UC01 | `UC01-register.puml` | `customer-simple/01-register.puml` ("updated") |
| UC02 | `UC02-login.puml` | `customer-simple/02-login.puml` ("updated") |
| UC03 | `UC03-reset-password.puml` | `customer-simple/03-password-reset.puml` ("updated") |
| UC04, UC05 | `UC04-UC05-browse-product-details.puml` | `customer-simple/04-browse-products.puml` ("original") |
| UC06 | `UC06-manage-cart.puml` | `customer-simple/05-manage-cart.puml` ("updated") |
| UC07 | `UC07-coupon-preview.puml` | `customer-simple/06-validate-coupon.puml` ("updated") |
| UC07 | `UC07-checkout-cod.puml` | `customer-simple/07-checkout-cod.puml` ("updated") |
| UC07 | `UC07-checkout-online-mock.puml` | `customer-simple/08-checkout-online-mock.puml` ("updated") |
| UC08 | `UC08-order-history-cancel.puml` | `customer-simple/09-order-history-cancel.puml` ("updated") |
| UC09 | `UC09-product-reviews.puml` | `customer-simple/10-product-reviews.puml` ("updated") |
| UC10 | `UC10-profile-addresses.puml` | `customer-simple/11-profile-addresses.puml` ("updated") |
| UC11 | `UC11-admin-products.puml` | `admin-simple/11-admin-products.puml` ("updated") |
| UC12 | `UC12-admin-categories-brands.puml` | `admin-simple/12-admin-categories-brands.puml` ("updated") |
| UC13 | `UC13-admin-coupons.puml` | `admin-simple/13-admin-coupons.puml` ("updated") |
| UC14 | `UC14-admin-orders.puml` | `admin-simple/14-admin-orders.puml` ("updated") |
| UC15 | `UC15-admin-users.puml` | `admin-simple/15-admin-users.puml` ("updated") |
| UC16 | `UC16-admin-staff.puml` | `admin-simple/16-admin-staff.puml` ("original") |
| UC17 | `UC17-admin-dashboard.puml` | `admin-simple/19-admin-dashboard.puml` ("original") |
| UC18 | `UC18-admin-inventory.puml` | `admin-simple/18-admin-inventory.puml` ("updated") |
| UC19 | `UC19-admin-branches.puml` | `admin-simple/17-admin-branches.puml` ("updated") |
| UC20 | `UC20-admin-review-moderation.puml` | `admin-simple/20-admin-review-moderation.puml` ("updated") |
