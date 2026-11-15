-- SCHEMA CHOT SAU PHAN 1-9 - MySQL 8.0.16+ / InnoDB / utf8mb4
-- DUNG DE KHOI TAO DATABASE MOI, KHONG PHAI SCRIPT MIGRATION.
-- KHONG CHAY DE 'NANG CAP' DB DA CO DU LIEU: CREATE TABLE IF NOT EXISTS KHONG SUA COT CU.
-- Nguon: Bao cao Tuan 07 Nhom 06 (20 bang) + nhung quy tac da thong nhat o Phan 1-9.
-- Bien phap chong race va bao mat la trach nhiem cua Service; CHECK/FK khong thay the transaction.

CREATE DATABASE IF NOT EXISTS tech_store CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE tech_store;

-- 01. RBAC
CREATE TABLE IF NOT EXISTS roles (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(30) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_roles_name (name)
) ENGINE=InnoDB;

-- 02. Accounts (Cloudinary avatar)
CREATE TABLE IF NOT EXISTS users (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  password VARCHAR(255) NOT NULL,
  full_name VARCHAR(100) NOT NULL,
  avatar_url VARCHAR(1024) NULL,
  avatar_public_id VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email),
  UNIQUE KEY uq_users_phone (phone),
  CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'LOCKED'))
) ENGINE=InnoDB;

-- 03. User-Role junction. ROLE_ADMIN inherits STAFF capabilities in authorization code;
-- it is not necessary to insert a duplicate ROLE_STAFF assignment for each admin.
CREATE TABLE IF NOT EXISTS user_roles (
  user_id BIGINT NOT NULL,
  role_id BIGINT NOT NULL,
  PRIMARY KEY (user_id, role_id),
  KEY idx_user_roles_role_id (role_id),
  CONSTRAINT fk_user_roles_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_user_roles_role FOREIGN KEY (role_id) REFERENCES roles(id)
) ENGINE=InnoDB;

-- 04. Customer addresses. At most one default address per user is enforced in Service
-- with concurrency control on the owning user, not by this table's indexes.
CREATE TABLE IF NOT EXISTS addresses (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  phone VARCHAR(20) NOT NULL,
  street_address VARCHAR(255) NOT NULL,
  ward VARCHAR(100) NULL,
  district VARCHAR(100) NULL,
  city VARCHAR(100) NOT NULL,
  is_default BOOLEAN NOT NULL DEFAULT FALSE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_addresses_user_id (user_id),
  CONSTRAINT fk_addresses_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 05. Password reset OTP (6 digits / 15 min / max 5 failed checks; service rules)
CREATE TABLE IF NOT EXISTS password_reset_tokens (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expiry_date DATETIME NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  failed_attempts INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_password_reset_user_created (user_id, created_at),
  CONSTRAINT fk_password_reset_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT ck_password_reset_attempts CHECK (failed_attempts >= 0)
) ENGINE=InnoDB;

-- 06. NEW TABLE: Email OTP at registration, before users record exists.
-- OTP 6 digits, expires in 5 minutes; resend after 60 seconds; service rules.
CREATE TABLE IF NOT EXISTS email_verifications (
  id BIGINT NOT NULL AUTO_INCREMENT,
  email VARCHAR(100) NOT NULL,
  otp_hash VARCHAR(255) NOT NULL,
  expiry_date DATETIME NOT NULL,
  is_used BOOLEAN NOT NULL DEFAULT FALSE,
  failed_attempts INT NOT NULL DEFAULT 0,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_email_verifications_email_created (email, created_at),
  CONSTRAINT ck_email_verifications_attempts CHECK (failed_attempts >= 0)
) ENGINE=InnoDB;

-- 07. Categories with Cloudinary image
CREATE TABLE IF NOT EXISTS categories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  description TEXT NULL,
  image_url VARCHAR(1024) NULL,
  image_public_id VARCHAR(255) NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categories_slug (slug),
  CONSTRAINT ck_categories_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

-- 08. Brands with Cloudinary logo
CREATE TABLE IF NOT EXISTS brands (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) NOT NULL,
  logo_url VARCHAR(1024) NULL,
  logo_public_id VARCHAR(255) NULL,
  description TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_brands_slug (slug),
  CONSTRAINT ck_brands_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

-- 09. Branches
CREATE TABLE IF NOT EXISTS branches (
  id BIGINT NOT NULL AUTO_INCREMENT,
  name VARCHAR(150) NOT NULL,
  phone VARCHAR(20) NULL,
  address VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT ck_branches_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

-- 10. Products: managed by Staff/Admin
CREATE TABLE IF NOT EXISTS products (
  id BIGINT NOT NULL AUTO_INCREMENT,
  category_id BIGINT NOT NULL,
  brand_id BIGINT NOT NULL,
  name VARCHAR(200) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  sku VARCHAR(50) NOT NULL,
  price DECIMAL(15,2) NOT NULL,
  cost_price DECIMAL(15,2) NOT NULL,
  description LONGTEXT NULL,
  specifications TEXT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_products_slug (slug),
  UNIQUE KEY uq_products_sku (sku),
  KEY idx_products_category_id (category_id),
  KEY idx_products_brand_id (brand_id),
  KEY idx_products_name (name),
  CONSTRAINT fk_products_category FOREIGN KEY (category_id) REFERENCES categories(id),
  CONSTRAINT fk_products_brand FOREIGN KEY (brand_id) REFERENCES brands(id),
  CONSTRAINT ck_products_price CHECK (price >= 0 AND cost_price >= 0),
  CONSTRAINT ck_products_status CHECK (status IN ('ACTIVE','INACTIVE'))
) ENGINE=InnoDB;

-- 11. Cloudinary image references. Exactly one primary image IF any exist:
-- service-level invariant, not enforced by these keys.
CREATE TABLE IF NOT EXISTS product_images (
  id BIGINT NOT NULL AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  image_url VARCHAR(1024) NOT NULL,
  cloudinary_public_id VARCHAR(255) NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT FALSE,
  display_order INT NOT NULL DEFAULT 0,
  PRIMARY KEY (id),
  UNIQUE KEY uq_product_images_public_id (cloudinary_public_id),
  KEY idx_product_images_product_id (product_id),
  CONSTRAINT fk_product_images_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT ck_product_images_order CHECK (display_order >= 0)
) ENGINE=InnoDB;

-- 12. One inventory row per product-branch pair (NO individual unique on each FK)
CREATE TABLE IF NOT EXISTS inventories (
  id BIGINT NOT NULL AUTO_INCREMENT,
  product_id BIGINT NOT NULL,
  branch_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 0,
  min_stock_alert INT NOT NULL DEFAULT 5,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_inventories_product_branch (product_id, branch_id),
  KEY idx_inventories_branch_id (branch_id),
  CONSTRAINT fk_inventories_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_inventories_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT ck_inventories_nonnegative CHECK (quantity >= 0 AND min_stock_alert >= 0)
) ENGINE=InnoDB;

-- 13. One cart per user
CREATE TABLE IF NOT EXISTS carts (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_carts_user_id (user_id),
  CONSTRAINT fk_carts_user FOREIGN KEY (user_id) REFERENCES users(id)
) ENGINE=InnoDB;

-- 14. One product line per cart; adding to cart NEVER reserves inventory
CREATE TABLE IF NOT EXISTS cart_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  cart_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  quantity INT NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_cart_items_cart_product (cart_id, product_id),
  KEY idx_cart_items_product_id (product_id),
  CONSTRAINT fk_cart_items_cart FOREIGN KEY (cart_id) REFERENCES carts(id),
  CONSTRAINT fk_cart_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT ck_cart_items_quantity CHECK (quantity >= 1)
) ENGINE=InnoDB;

-- 15. Coupons. used_count = number of ACTIVE coupon_usages, maintained in Service.
CREATE TABLE IF NOT EXISTS coupons (
  id BIGINT NOT NULL AUTO_INCREMENT,
  code VARCHAR(50) NOT NULL,
  discount_type VARCHAR(20) NOT NULL,
  discount_value DECIMAL(15,2) NOT NULL,
  min_order_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  max_discount_amount DECIMAL(15,2) NULL,
  usage_limit INT NOT NULL DEFAULT 100,
  used_count INT NOT NULL DEFAULT 0,
  start_date DATETIME NOT NULL,
  end_date DATETIME NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_coupons_code (code),
  CONSTRAINT ck_coupons_type CHECK (discount_type IN ('PERCENTAGE','FIXED_AMOUNT')),
  CONSTRAINT ck_coupons_discount CHECK (discount_value > 0 AND
       (discount_type <> 'PERCENTAGE' OR discount_value <= 100)),
  CONSTRAINT ck_coupons_values CHECK (min_order_amount >= 0 AND
       (max_discount_amount IS NULL OR max_discount_amount > 0)),
  CONSTRAINT ck_coupons_limit CHECK (usage_limit >= 1 AND used_count >= 0 AND used_count <= usage_limit),
  CONSTRAINT ck_coupons_dates CHECK (end_date > start_date)
) ENGINE=InnoDB;

-- 16. Orders, status transitions controlled by Service.
CREATE TABLE IF NOT EXISTS orders (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_code VARCHAR(50) NOT NULL,
  user_id BIGINT NOT NULL,
  branch_id BIGINT NOT NULL,
  recipient_name VARCHAR(100) NOT NULL,
  recipient_phone VARCHAR(20) NOT NULL,
  shipping_address VARCHAR(255) NOT NULL,
  total_items_amount DECIMAL(15,2) NOT NULL,
  discount_amount DECIMAL(15,2) NOT NULL DEFAULT 0.00,
  final_amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'PENDING',
  payment_method VARCHAR(20) NOT NULL,
  payment_status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  coupon_id BIGINT NULL,
  notes TEXT NULL,
  cancel_reason TEXT NULL,
  cancelled_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_orders_order_code (order_code),
  KEY idx_orders_user_id (user_id),
  KEY idx_orders_branch_id (branch_id),
  KEY idx_orders_coupon_id (coupon_id),
  KEY idx_orders_status (status),
  CONSTRAINT fk_orders_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_orders_branch FOREIGN KEY (branch_id) REFERENCES branches(id),
  CONSTRAINT fk_orders_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  CONSTRAINT ck_orders_status CHECK (status IN ('PENDING','CONFIRMED','SHIPPING','COMPLETED','CANCELLED')),
  CONSTRAINT ck_orders_method CHECK (payment_method IN ('COD','ONLINE_MOCK')),
  CONSTRAINT ck_orders_payment_status CHECK (payment_status IN ('UNPAID','PAID','CANCELLED','FAILED','REFUNDED')),
  CONSTRAINT ck_orders_money CHECK (total_items_amount >= 0 AND discount_amount >= 0
       AND discount_amount <= total_items_amount AND final_amount = total_items_amount - discount_amount)
) ENGINE=InnoDB;

-- 17. Snapshot of product details at successful checkout (Cloudinary URL kept as snapshot)
CREATE TABLE IF NOT EXISTS order_items (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  product_name VARCHAR(200) NOT NULL,
  product_sku VARCHAR(50) NOT NULL,
  product_image VARCHAR(1024) NULL,
  unit_price DECIMAL(15,2) NOT NULL,
  quantity INT NOT NULL,
  subtotal_amount DECIMAL(15,2) NOT NULL,
  PRIMARY KEY (id),
  KEY idx_order_items_order_id (order_id),
  KEY idx_order_items_product_id (product_id),
  CONSTRAINT fk_order_items_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT fk_order_items_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT ck_order_items_values CHECK (quantity >= 1 AND unit_price >= 0
       AND subtotal_amount = unit_price * quantity)
) ENGINE=InnoDB;

-- 18. Exactly one payment record per order. COD can become CANCELLED before collection.
CREATE TABLE IF NOT EXISTS payments (
  id BIGINT NOT NULL AUTO_INCREMENT,
  order_id BIGINT NOT NULL,
  payment_method VARCHAR(20) NOT NULL,
  transaction_code VARCHAR(100) NULL,
  amount DECIMAL(15,2) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'UNPAID',
  paid_at DATETIME NULL,
  refunded_at DATETIME NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_payments_order_id (order_id),
  UNIQUE KEY uq_payments_transaction_code (transaction_code),
  CONSTRAINT fk_payments_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT ck_payments_method CHECK (payment_method IN ('COD','ONLINE_MOCK')),
  CONSTRAINT ck_payments_status CHECK (status IN ('UNPAID','PAID','CANCELLED','FAILED','REFUNDED')),
  CONSTRAINT ck_payments_amount CHECK (amount >= 0)
) ENGINE=InnoDB;

-- 19. Coupon history: 1 coupon per order; REVERSED row retained for audit and later reuse.
-- UNIQUE(coupon_id, user_id) is intentionally NOT used; it would prevent reuse after reversal.
CREATE TABLE IF NOT EXISTS coupon_usages (
  id BIGINT NOT NULL AUTO_INCREMENT,
  coupon_id BIGINT NOT NULL,
  user_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  used_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  reversed_at DATETIME NULL,
  PRIMARY KEY (id),
  UNIQUE KEY uq_coupon_usages_order_id (order_id),
  KEY idx_coupon_usages_coupon_user_status (coupon_id, user_id, status),
  KEY idx_coupon_usages_user_id (user_id),
  CONSTRAINT fk_coupon_usages_coupon FOREIGN KEY (coupon_id) REFERENCES coupons(id),
  CONSTRAINT fk_coupon_usages_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_coupon_usages_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT ck_coupon_usage_status CHECK (status IN ('ACTIVE','REVERSED'))
) ENGINE=InnoDB;

-- 20. Soft moderation. One row for (user, product, completed order), even if hidden.
CREATE TABLE IF NOT EXISTS reviews (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NOT NULL,
  product_id BIGINT NOT NULL,
  order_id BIGINT NOT NULL,
  rating INT NOT NULL,
  comment TEXT NOT NULL,
  status VARCHAR(30) NOT NULL DEFAULT 'VISIBLE',
  hidden_at DATETIME NULL,
  hidden_reason VARCHAR(255) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_reviews_user_product_order (user_id, product_id, order_id),
  KEY idx_reviews_product_status (product_id, status),
  KEY idx_reviews_order_id (order_id),
  CONSTRAINT fk_reviews_user FOREIGN KEY (user_id) REFERENCES users(id),
  CONSTRAINT fk_reviews_product FOREIGN KEY (product_id) REFERENCES products(id),
  CONSTRAINT fk_reviews_order FOREIGN KEY (order_id) REFERENCES orders(id),
  CONSTRAINT ck_reviews_rating CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT ck_reviews_status CHECK (status IN ('VISIBLE','HIDDEN_BY_OWNER','HIDDEN_BY_ADMIN'))
) ENGINE=InnoDB;

-- 21. Application audit log. user_id is intentionally nullable without FK,
-- matching original design for cases where actor is unknown.
CREATE TABLE IF NOT EXISTS audit_logs (
  id BIGINT NOT NULL AUTO_INCREMENT,
  user_id BIGINT NULL,
  action VARCHAR(100) NOT NULL,
  entity_name VARCHAR(50) NOT NULL,
  entity_id BIGINT NULL,
  details TEXT NULL,
  ip_address VARCHAR(50) NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_audit_logs_user_id (user_id),
  KEY idx_audit_logs_action (action),
  KEY idx_audit_logs_entity (entity_name, entity_id)
) ENGINE=InnoDB;

-- Seed roles. Customer signup creates ROLE_CUSTOMER and one empty Cart in service.
INSERT INTO roles (name) VALUES
 ('ROLE_CUSTOMER'), ('ROLE_STAFF'), ('ROLE_ADMIN')
ON DUPLICATE KEY UPDATE name = VALUES(name);

-- IMPORTANT SERVICE-LEVEL INVARIANTS NOT ENFORCED BY THIS DDL:
-- 1) Verify OTP / rate limits, do NOT expose OTP hashes.
-- 2) ADMIN inherits STAFF management permissions; CUSTOMER role is separate.
-- 3) Limit each product to 8 Cloudinary images; exactly one primary if any.
-- 4) Maintain <=1 default address per user under suitable locking.
-- 5) Check selected cart items belong to user; BUY_NOW leaves cart unchanged.
-- 6) Checkout validates active product, branch and locked inventory; decrement once.
-- 7) ONLINE_MOCK failure creates neither Order nor Payment nor CouponUsage.
-- 8) For CouponUsages, lock coupon and check no prior ACTIVE usage, increment
--    used_count atomically. On cancellation reverse once and decrement once.
-- 9) Order/payment transitions; orders.payment_status mirrors payments.status.
-- 10) Only COMPLETED order owner can review matching product, once per order.
-- 11) Prevent INACTIVE branches with unfinished orders by locking consistently.
-- 12) Never hard-delete a Cloudinary asset still used by order_items snapshot.
