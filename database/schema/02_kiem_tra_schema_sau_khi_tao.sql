-- Chay SAU KHI da khoi tao database va (tuy chon) co du lieu mau.
-- MySQL Workbench: mo script va execute tung query hoac toan bo.
USE tech_store;

-- 1) Ky vong: 21 bang (bao gom email_verifications)
SELECT COUNT(*) AS total_tables
FROM information_schema.tables
WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';

-- 2) Danh sach cac bang va so cot
SELECT TABLE_NAME, COUNT(*) AS column_count
FROM information_schema.columns
WHERE table_schema = DATABASE()
GROUP BY TABLE_NAME ORDER BY TABLE_NAME;

-- 3) Cac FK de Workbench Reverse Engineer ve moi quan he
SELECT TABLE_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
FROM information_schema.KEY_COLUMN_USAGE
WHERE TABLE_SCHEMA = DATABASE() AND REFERENCED_TABLE_NAME IS NOT NULL
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- 4) Kiem tra cac ràng buoc UNIQUE/PK. Chu y UNIQUE 1 cot vs UNIQUE cap.
SELECT TABLE_NAME, INDEX_NAME, NON_UNIQUE,
       GROUP_CONCAT(COLUMN_NAME ORDER BY SEQ_IN_INDEX SEPARATOR ', ') AS index_columns
FROM information_schema.statistics
WHERE TABLE_SCHEMA = DATABASE()
GROUP BY TABLE_NAME, INDEX_NAME, NON_UNIQUE
ORDER BY TABLE_NAME, INDEX_NAME;

-- 5) Kiem tra cac rang buoc CHECK
SELECT tc.TABLE_NAME, tc.CONSTRAINT_NAME, cc.CHECK_CLAUSE
FROM information_schema.TABLE_CONSTRAINTS AS tc
JOIN information_schema.CHECK_CONSTRAINTS AS cc
  ON cc.CONSTRAINT_SCHEMA = tc.CONSTRAINT_SCHEMA AND cc.CONSTRAINT_NAME = tc.CONSTRAINT_NAME
WHERE tc.CONSTRAINT_SCHEMA = DATABASE() AND tc.CONSTRAINT_TYPE = 'CHECK'
ORDER BY tc.TABLE_NAME, tc.CONSTRAINT_NAME;

-- 6) Bảng duoc su dung de xem lai Cloudinary/OTP/status
SELECT TABLE_NAME, COLUMN_NAME, COLUMN_TYPE, IS_NULLABLE, COLUMN_DEFAULT
FROM information_schema.COLUMNS
WHERE TABLE_SCHEMA = DATABASE()
  AND TABLE_NAME IN ('users','email_verifications','password_reset_tokens',
                     'product_images','orders','payments','coupon_usages','reviews')
ORDER BY TABLE_NAME, ORDINAL_POSITION;

-- DUOI DAY LA KIEM TRA DU LIEU: khi chua co du lieu thi khong tra hang nao.

-- 7) Mot tai khoan chi co toi da 1 dia chi mac dinh
SELECT user_id, COUNT(*) AS default_count
FROM addresses WHERE is_default = TRUE
GROUP BY user_id HAVING COUNT(*) > 1;

-- 8) Neu san pham co hinh thi phai co dung 1 hinh primary, khong qua 8 hinh
SELECT product_id, COUNT(*) AS image_count, SUM(is_primary = TRUE) AS primary_count
FROM product_images GROUP BY product_id
HAVING COUNT(*) > 8 OR SUM(is_primary = TRUE) <> 1;

-- 9) So luot ACTIVE phai bang coupons.used_count
SELECT c.id, c.code, c.used_count,
       (SELECT COUNT(*) FROM coupon_usages cu
        WHERE cu.coupon_id = c.id AND cu.status='ACTIVE') AS actual_active_count
FROM coupons c
WHERE c.used_count <> (SELECT COUNT(*) FROM coupon_usages cu
                       WHERE cu.coupon_id = c.id AND cu.status='ACTIVE');

-- 10) Moi (coupon,user) khong duoc co >1 luot ACTIVE
SELECT coupon_id, user_id, COUNT(*) AS active_count
FROM coupon_usages WHERE status='ACTIVE'
GROUP BY coupon_id, user_id HAVING COUNT(*) > 1;

-- 11) Moi order can mot record payment; order/payment trang thai phai khop
SELECT o.id, o.order_code, o.payment_status, p.status AS payment_row_status
FROM orders o LEFT JOIN payments p ON p.order_id = o.id
WHERE p.id IS NULL OR o.payment_status <> p.status;

-- 12) Order coupon_id phai khop voi coupon_usages, neu ap coupon
SELECT o.id, o.order_code, o.coupon_id,
       cu.coupon_id AS usage_coupon_id
FROM orders o LEFT JOIN coupon_usages cu ON cu.order_id=o.id
WHERE (o.coupon_id IS NULL AND cu.id IS NOT NULL)
   OR (o.coupon_id IS NOT NULL AND (cu.id IS NULL OR cu.coupon_id<>o.coupon_id));

-- 13) Huy don phai co timestamp
SELECT id, order_code FROM orders
WHERE status='CANCELLED' AND cancelled_at IS NULL;

-- 14) Review phai thuoc don COMPLETED cua dung nguoi va san pham trong don
SELECT r.id AS review_id, r.user_id, r.product_id, r.order_id
FROM reviews r
LEFT JOIN orders o ON o.id=r.order_id
WHERE o.id IS NULL OR o.user_id<>r.user_id OR o.status<>'COMPLETED'
   OR NOT EXISTS (SELECT 1 FROM order_items oi
                  WHERE oi.order_id=r.order_id AND oi.product_id=r.product_id);
