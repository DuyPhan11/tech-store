# Kiến trúc và ranh giới module

## Stack đã dự kiến
- Frontend dùng React + TypeScript, Vite, React Router, CSS Modules + CSS Variables và npm (ADR-007).
- Backend: Spring Boot REST + Spring Security + Validation + JPA/Hibernate (đề xuất, cần chốt trước triển khai).
- Database: MySQL 8/InnoDB; migrations có phiên bản (Flyway được đề xuất, không bắt buộc).
- Assets: Cloudinary upload từ backend.
- Mail: SMTP/provider theo cấu hình; OTP và secret ở backend.

## Thư mục nguồn khi scaffold

```
frontend/src/
  app/              # Router/providers
  components/ui/    # Reusable primitives, match Figma
  components/layout/# Header/sidebar/page shell
  features/
    auth/ catalog/ cart/ checkout/ orders/ profile/ reviews/
    admin/products/ admin/catalog/ admin/coupons/ admin/orders/
    admin/users/ admin/staff/ admin/inventory/ admin/branches/
    admin/dashboard/ admin/reviews/
  lib/api/          # One HTTP client, shared errors/auth
  styles/           # Tokens from Figma

backend/src/main/java/<base-package>/
  common/           # errors/security/config/util
  auth/ catalog/ cart/ checkout/ orders/ profile/ reviews/
  products/ categories/ brands/ coupons/ inventory/ branches/
  admin/ statistics/
  # per feature: controller, service, repository, dto, entity as appropriate
```

**Mỗi feature sở hữu UI/API domain logic của mình.** Shared component/DTO/auth config thay đổi qua PR riêng nếu ảnh hưởng nhiều feature.

## Quy tắc tích hợp
- REST controllers không truy cập repository trực tiếp cho logic phức tạp; service xử lý transaction.
- DTO thay vì expose JPA Entity trực tiếp; đầu vào validate bằng Jakarta Validation.
- Các enum/status/API fields phải nhất quán với `BUSINESS_RULES.md` và SQL schema.
- Mọi DB migration mới là file bất biến đã merge; không sửa lịch sử migration có dữ liệu.
- Centralized error response và authentication header convention.
- Chia commit theo thay đổi thật, không dùng fake evidence.
