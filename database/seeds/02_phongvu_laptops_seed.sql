-- =========================================================================
-- Tech Store - Seed Data: 16 Real Laptops Scraped from PhongVu.vn
-- Generated with Rich Descriptions & Valid JSON Specifications
-- =========================================================================

-- 1. Insert Categories (Parent & 4 Children) if not exist
INSERT IGNORE INTO categories (name, slug, description, parent_id, status, created_at, updated_at) VALUES
('Laptop', 'laptop', 'Máy tính xách tay cao cấp', NULL, 'ACTIVE', NOW(), NOW());

INSERT INTO categories (name, slug, description, parent_id, status, created_at, updated_at)
SELECT 'Laptop văn phòng & Học tập', 'laptop-van-phong', 'Laptop văn phòng mỏng nhẹ', c.id, 'ACTIVE', NOW(), NOW()
FROM categories c WHERE c.slug = 'laptop'
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id);

INSERT INTO categories (name, slug, description, parent_id, status, created_at, updated_at)
SELECT 'Laptop chơi game (Gaming)', 'laptop-gaming', 'Laptop gaming cấu hình cao', c.id, 'ACTIVE', NOW(), NOW()
FROM categories c WHERE c.slug = 'laptop'
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id);

INSERT INTO categories (name, slug, description, parent_id, status, created_at, updated_at)
SELECT 'Laptop mỏng nhẹ thời trang', 'laptop-mong-nhe', 'Laptop thời trang mỏng nhẹ', c.id, 'ACTIVE', NOW(), NOW()
FROM categories c WHERE c.slug = 'laptop'
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id);

INSERT INTO categories (name, slug, description, parent_id, status, created_at, updated_at)
SELECT 'Dòng máy trạm MSI Workstation', 'laptop-workstation', 'Máy trạm đồ họa chuyên nghiệp', c.id, 'ACTIVE', NOW(), NOW()
FROM categories c WHERE c.slug = 'laptop'
ON DUPLICATE KEY UPDATE parent_id = VALUES(parent_id);

-- 2. Insert Branches if not exist
INSERT IGNORE INTO branches (name, phone, address, status, created_at, updated_at) VALUES
('Chi nhánh Quận 1', '02811112222', '123 Lê Lợi, Quận 1, TP.HCM', 'ACTIVE', NOW(), NOW()),
('Chi nhánh Quận 7', '02833334444', '456 Nguyễn Thị Thập, Quận 7, TP.HCM', 'ACTIVE', NOW(), NOW());

-- 3. Insert Brands if not exist
INSERT IGNORE INTO brands (name, slug, description, created_at, updated_at) VALUES
('ASUS', 'asus', 'Thương hiệu công nghệ ASUS', NOW(), NOW()),
('Lenovo', 'lenovo', 'Thương hiệu máy tính Lenovo', NOW(), NOW()),
('Acer', 'acer', 'Thương hiệu laptop Acer', NOW(), NOW()),
('HP', 'hp', 'Thương hiệu HP Hewlett Packard', NOW(), NOW()),
('MSI', 'msi', 'Thương hiệu phần cứng và laptop MSI', NOW(), NOW());

-- Product 1: Laptop Asus Vivobook Go 14 E1404FA-EB935W (Ryzen 5 40/ 16GB/ 512GB/ Windows 11 Home)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Asus Vivobook Go 14 E1404FA-EB935W (Ryzen 5 40/ 16GB/ 512GB/ Windows 11 Home)', 'laptop-asus-vivobook-go-14-e1404fa-eb935w-ryzen-5-40-16gb-512gb-windows-11-home', '260301642', 20990000, 16792000, 'Laptop Asus Vivobook Go 14 E1404FA mang thiết kế mỏng nhẹ hiện đại, sở hữu màn hình 14 inch Full HD chống lóa cùng vi xử lý AMD Ryzen 5 mạnh mẽ và 16GB RAM đa nhiệm mượt mà. Đây là lựa chọn hoàn hảo cho học sinh, sinh viên và dân văn phòng cần một cỗ máy bền bỉ, thời trang cho nhu cầu học tập và làm việc suốt ngày dài.', '{"summary":"14 inch · R5 40 · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch Full HD (1920 × 1080) IPS 60Hz chống lóa"},{"label":"Bộ vi xử lý","value":"AMD Ryzen 5 40 (6 nhân 12 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR4 3200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe M.2 PCIe"},{"label":"Card đồ họa","value":"AMD Radeon Graphics"},{"label":"Trọng lượng","value":"1.3 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-van-phong' AND b.slug = 'asus'
ON DUPLICATE KEY UPDATE
  description = 'Laptop Asus Vivobook Go 14 E1404FA mang thiết kế mỏng nhẹ hiện đại, sở hữu màn hình 14 inch Full HD chống lóa cùng vi xử lý AMD Ryzen 5 mạnh mẽ và 16GB RAM đa nhiệm mượt mà. Đây là lựa chọn hoàn hảo cho học sinh, sinh viên và dân văn phòng cần một cỗ máy bền bỉ, thời trang cho nhu cầu học tập và làm việc suốt ngày dài.',
  specifications = '{"summary":"14 inch · R5 40 · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch Full HD (1920 × 1080) IPS 60Hz chống lóa"},{"label":"Bộ vi xử lý","value":"AMD Ryzen 5 40 (6 nhân 12 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR4 3200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe M.2 PCIe"},{"label":"Card đồ họa","value":"AMD Radeon Graphics"},{"label":"Trọng lượng","value":"1.3 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}',
  price = 20990000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/qexCUvh-ASrliTTw6635imfDBmjxIDsGC7gVBepCo11oO3JMEk3c7KsRtbr_TfzA5iciTFPwqga-hl3AdYyYE5W9OVUQdVY=w230-rw', 'phongvu/260301642', 1, 1
FROM products p WHERE p.sku = '260301642';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260301642' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260301642' AND b.name = 'Chi nhánh Quận 7';

-- Product 2: Laptop Asus Vivobook Go 15 E1504FA-BQ340W (Ryzen 5 40/ 16GB/ 512GB/ Win 11 Home)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Asus Vivobook Go 15 E1504FA-BQ340W (Ryzen 5 40/ 16GB/ 512GB/ Win 11 Home)', 'laptop-asus-vivobook-go-15-e1504fa-bq340w-ryzen-5-40-16gb-512gb-win-11-home', '260302495', 21590000, 17272000, 'Asus Vivobook Go 15 sở hữu không gian hiển thị rộng rãi 15.6 inch viền mỏng NanoEdge, tích hợp cụm phím số số riêng biệt tiện lợi cho việc nhập liệu kế toán. Pin hỗ trợ sạc nhanh 60% chỉ trong 49 phút kết hợp cấu hình Ryzen 5 đa nhiệm 16GB RAM giúp xử lý trơn tru mọi tác vụ văn phòng và giải trí trực tuyến.', '{"summary":"15.6 inch · R5 40 · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"15.6 inch Full HD (1920 × 1080) IPS 60Hz"},{"label":"Bộ vi xử lý","value":"AMD Ryzen 5 40 (6 nhân 12 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR4 3200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe M.2 PCIe"},{"label":"Card đồ họa","value":"AMD Radeon Graphics"},{"label":"Trọng lượng","value":"1.6 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-van-phong' AND b.slug = 'asus'
ON DUPLICATE KEY UPDATE
  description = 'Asus Vivobook Go 15 sở hữu không gian hiển thị rộng rãi 15.6 inch viền mỏng NanoEdge, tích hợp cụm phím số số riêng biệt tiện lợi cho việc nhập liệu kế toán. Pin hỗ trợ sạc nhanh 60% chỉ trong 49 phút kết hợp cấu hình Ryzen 5 đa nhiệm 16GB RAM giúp xử lý trơn tru mọi tác vụ văn phòng và giải trí trực tuyến.',
  specifications = '{"summary":"15.6 inch · R5 40 · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"15.6 inch Full HD (1920 × 1080) IPS 60Hz"},{"label":"Bộ vi xử lý","value":"AMD Ryzen 5 40 (6 nhân 12 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR4 3200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe M.2 PCIe"},{"label":"Card đồ họa","value":"AMD Radeon Graphics"},{"label":"Trọng lượng","value":"1.6 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}',
  price = 21590000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/_sL3w-ZtnaRAfND1YV_R0r1U072FFAZigghF4ETZGuEeLfOjdK0ryf18KTRF79SP18h0lmQKkTQDI_GMuMbxI48zvw7a1os=w230-rw', 'phongvu/260302495', 1, 1
FROM products p WHERE p.sku = '260302495';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260302495' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260302495' AND b.name = 'Chi nhánh Quận 7';

-- Product 3: Laptop Asus Vivobook 14 X1404MA-EB219W (Core 5 320/ 8GB/ 512GB/ Windows 11 Home)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Asus Vivobook 14 X1404MA-EB219W (Core 5 320/ 8GB/ 512GB/ Windows 11 Home)', 'laptop-asus-vivobook-14-x1404ma-eb219w-core-5-320-8gb-512gb-windows-11-home', '260507148', 20490000, 16392000, 'Asus Vivobook 14 X1404MA nổi bật với tông màu thanh lịch, bản lề mở phẳng 180 độ linh hoạt chia sẻ ý tưởng cùng bàn phím công thái học ErgoSense gõ êm ái. Vi xử lý Intel Core thế hệ mới mang lại trải nghiệm làm việc mượt mà, hạn chế tiếng ồn và tiết kiệm điện năng tối ưu.', '{"summary":"14 inch · Core 5 320 · 8GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch Full HD (1920 × 1080) IPS 60Hz"},{"label":"Bộ vi xử lý","value":"Intel Core 5 320 (8 nhân xung nhịp tối đa 4.5 GHz)"},{"label":"Bộ nhớ RAM","value":"8 GB LPDDR5 4800 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe"},{"label":"Card đồ họa","value":"Intel Graphics"},{"label":"Trọng lượng","value":"1.4 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-van-phong' AND b.slug = 'asus'
ON DUPLICATE KEY UPDATE
  description = 'Asus Vivobook 14 X1404MA nổi bật với tông màu thanh lịch, bản lề mở phẳng 180 độ linh hoạt chia sẻ ý tưởng cùng bàn phím công thái học ErgoSense gõ êm ái. Vi xử lý Intel Core thế hệ mới mang lại trải nghiệm làm việc mượt mà, hạn chế tiếng ồn và tiết kiệm điện năng tối ưu.',
  specifications = '{"summary":"14 inch · Core 5 320 · 8GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch Full HD (1920 × 1080) IPS 60Hz"},{"label":"Bộ vi xử lý","value":"Intel Core 5 320 (8 nhân xung nhịp tối đa 4.5 GHz)"},{"label":"Bộ nhớ RAM","value":"8 GB LPDDR5 4800 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe"},{"label":"Card đồ họa","value":"Intel Graphics"},{"label":"Trọng lượng","value":"1.4 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}',
  price = 20490000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/g9E60KEgoAT_FaVvJoBz1-qmBrNsE845-_ndcjKZdyewpBrCKdbcw--Vz-JQNrHdbTNqBfK2ljBVuVJjLf0_KRAA27n27C3-=w230-rw', 'phongvu/260507148', 1, 1
FROM products p WHERE p.sku = '260507148';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260507148' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260507148' AND b.name = 'Chi nhánh Quận 7';

-- Product 4: Laptop Lenovo IdeaPad Slim 3 14AHP10 83K9004QVN (Ryzen 5 125/ 8GB/ 512GB/ Windows 11)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Lenovo IdeaPad Slim 3 14AHP10 83K9004QVN (Ryzen 5 125/ 8GB/ 512GB/ Windows 11)', 'laptop-lenovo-ideapad-slim-3-14ahp10-83k9004qvn-ryzen-5-125-8gb-512gb-windows-11', '260902421', 19790000, 15832000, 'Lenovo IdeaPad Slim 3 được chế tác mỏng nhẹ chuẩn quân đội MIL-STD-810H bền bỉ trước va đập thường ngày. Màn hình WUXGA sắc nét tỉ lệ 16:10 hiển thị nhiều dòng văn bản hơn, đi kèm vi xử lý Ryzen 5 và chứng nhận bảo vệ mắt TÜV Rheinland giúp làm việc cả ngày dài mà không mỏi mắt.', '{"summary":"14 inch WUXGA · R5 125 · 8GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) IPS 16:10 300 nits"},{"label":"Bộ vi xử lý","value":"AMD Ryzen 5 125"},{"label":"Bộ nhớ RAM","value":"8 GB LPDDR5"},{"label":"Ổ cứng","value":"512 GB SSD NVMe M.2 PCIe"},{"label":"Card đồ họa","value":"AMD Radeon Graphics"},{"label":"Trọng lượng","value":"1.39 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-van-phong' AND b.slug = 'lenovo'
ON DUPLICATE KEY UPDATE
  description = 'Lenovo IdeaPad Slim 3 được chế tác mỏng nhẹ chuẩn quân đội MIL-STD-810H bền bỉ trước va đập thường ngày. Màn hình WUXGA sắc nét tỉ lệ 16:10 hiển thị nhiều dòng văn bản hơn, đi kèm vi xử lý Ryzen 5 và chứng nhận bảo vệ mắt TÜV Rheinland giúp làm việc cả ngày dài mà không mỏi mắt.',
  specifications = '{"summary":"14 inch WUXGA · R5 125 · 8GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) IPS 16:10 300 nits"},{"label":"Bộ vi xử lý","value":"AMD Ryzen 5 125"},{"label":"Bộ nhớ RAM","value":"8 GB LPDDR5"},{"label":"Ổ cứng","value":"512 GB SSD NVMe M.2 PCIe"},{"label":"Card đồ họa","value":"AMD Radeon Graphics"},{"label":"Trọng lượng","value":"1.39 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}',
  price = 19790000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/3eqhAIqi2zIL_xdvpgmq_a63Z3R-Riw1FodSc5aZCSDJyz_a1EXhCLfqSMqMJ0z6-ruTiDJ7AItayq2if9AORiEy-VvZpwOn=w230-rw', 'phongvu/260902421', 1, 1
FROM products p WHERE p.sku = '260902421';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260902421' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260902421' AND b.name = 'Chi nhánh Quận 7';

-- Product 5: Laptop Lenovo LOQ 15IRH11E - 83Y9003VVN (Core 5 205H/ GeForce RTX 3050/ 8GB/ 512GB/ Win 11)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Lenovo LOQ 15IRH11E - 83Y9003VVN (Core 5 205H/ GeForce RTX 3050/ 8GB/ 512GB/ Win 11)', 'laptop-lenovo-loq-15irh11e---83y9003vvn-core-5-205h-geforce-rtx-3050-8gb-512gb-win-11', '261001309', 25990000, 20792000, 'Lenovo LOQ 15 là cỗ máy chiến game đỉnh cao với hệ thống tản nhiệt buồng kín quạt kép cực êm ái. Sức mạnh đến từ CPU Intel Core 5 thế hệ mới kết hợp card đồ họa rời NVIDIA GeForce RTX 3050 và màn hình 165Hz mượt mà mang đến trải nghiệm Esport không độ trễ.', '{"summary":"15.3 inch 165Hz · Core 5 · RTX 3050 · 8GB RAM","items":[{"label":"Kích thước màn hình","value":"15.3 inch WUXGA (1920 × 1200) IPS 165Hz 100% sRGB"},{"label":"Bộ vi xử lý","value":"Intel Core 5 205H (8 nhân 12 luồng, xung nhịp 4.8 GHz)"},{"label":"Bộ nhớ RAM","value":"8 GB DDR5 4800 MHz (nâng cấp tối đa 32GB)"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"NVIDIA GeForce RTX 3050 6GB GDDR6"},{"label":"Trọng lượng","value":"2.1 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home SL"},{"label":"Bảo hành","value":"24 tháng chính hãng Legion Ultimate Support"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-gaming' AND b.slug = 'lenovo'
ON DUPLICATE KEY UPDATE
  description = 'Lenovo LOQ 15 là cỗ máy chiến game đỉnh cao với hệ thống tản nhiệt buồng kín quạt kép cực êm ái. Sức mạnh đến từ CPU Intel Core 5 thế hệ mới kết hợp card đồ họa rời NVIDIA GeForce RTX 3050 và màn hình 165Hz mượt mà mang đến trải nghiệm Esport không độ trễ.',
  specifications = '{"summary":"15.3 inch 165Hz · Core 5 · RTX 3050 · 8GB RAM","items":[{"label":"Kích thước màn hình","value":"15.3 inch WUXGA (1920 × 1200) IPS 165Hz 100% sRGB"},{"label":"Bộ vi xử lý","value":"Intel Core 5 205H (8 nhân 12 luồng, xung nhịp 4.8 GHz)"},{"label":"Bộ nhớ RAM","value":"8 GB DDR5 4800 MHz (nâng cấp tối đa 32GB)"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"NVIDIA GeForce RTX 3050 6GB GDDR6"},{"label":"Trọng lượng","value":"2.1 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home SL"},{"label":"Bảo hành","value":"24 tháng chính hãng Legion Ultimate Support"}]}',
  price = 25990000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/_PM-PnsTUlTl_r4iqpYJvTnADzLN-M5iZ00gSqjqEG1elMFA725DzTl7gFHenFAPmU1qxk2yE5ZQyt-3L1kZ0TpnohR_gPk=w230-rw', 'phongvu/261001309', 1, 1
FROM products p WHERE p.sku = '261001309';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '261001309' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '261001309' AND b.name = 'Chi nhánh Quận 7';

-- Product 6: Laptop Acer Gaming Aspire 7 A715-59G-59RD (Core 5 210H/ GeForce RTX 3050/ 16GB/ 512GB/ Win 11)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Acer Gaming Aspire 7 A715-59G-59RD (Core 5 210H/ GeForce RTX 3050/ 16GB/ 512GB/ Win 11)', 'laptop-acer-gaming-aspire-7-a715-59g-59rd-core-5-210h-geforce-rtx-3050-16gb-512gb-win-11', '260805394', 25990000, 20792000, 'Acer Aspire 7 Gaming là sự kết hợp hoàn hảo giữa diện mạo văn phòng tối giản và cấu hình gaming mạnh mẽ. Sở hữu CPU Core 5, card đồ họa rời RTX 3050 và sẵn 16GB RAM tốc độ cao, chiếc máy sẵn sàng cân mọi tựa game AAA cũng như xử lý render video đồ họa mượt mà.', '{"summary":"15.6 inch 144Hz · Core 5 · RTX 3050 · 16GB RAM","items":[{"label":"Kích thước màn hình","value":"15.6 inch Full HD (1920 × 1080) IPS 144Hz SlimBezel"},{"label":"Bộ vi xử lý","value":"Intel Core 5 210H (8 nhân 12 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR4 3200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"NVIDIA GeForce RTX 3050 6GB GDDR6"},{"label":"Trọng lượng","value":"2.1 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home SL"},{"label":"Bảo hành","value":"12 tháng chính hãng bảo hành VIP 3S1"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-gaming' AND b.slug = 'acer'
ON DUPLICATE KEY UPDATE
  description = 'Acer Aspire 7 Gaming là sự kết hợp hoàn hảo giữa diện mạo văn phòng tối giản và cấu hình gaming mạnh mẽ. Sở hữu CPU Core 5, card đồ họa rời RTX 3050 và sẵn 16GB RAM tốc độ cao, chiếc máy sẵn sàng cân mọi tựa game AAA cũng như xử lý render video đồ họa mượt mà.',
  specifications = '{"summary":"15.6 inch 144Hz · Core 5 · RTX 3050 · 16GB RAM","items":[{"label":"Kích thước màn hình","value":"15.6 inch Full HD (1920 × 1080) IPS 144Hz SlimBezel"},{"label":"Bộ vi xử lý","value":"Intel Core 5 210H (8 nhân 12 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR4 3200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"NVIDIA GeForce RTX 3050 6GB GDDR6"},{"label":"Trọng lượng","value":"2.1 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home SL"},{"label":"Bảo hành","value":"12 tháng chính hãng bảo hành VIP 3S1"}]}',
  price = 25990000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/XocPrkhBjIbz91p7_hrFO_sbjVN9vKv5k5KAms6hRjpWoKgINeayDeI9JAJBzll3RYDC3UesGhcew8Hv8ZESPTksGRRyA9Fk=w230-rw', 'phongvu/260805394', 1, 1
FROM products p WHERE p.sku = '260805394';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260805394' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260805394' AND b.name = 'Chi nhánh Quận 7';

-- Product 7: Laptop Asus TUF Gaming A15 FA506NCG-HN329W (Ryzen 7 8845HS/ GeForce RTX 3050/ 16GB/ 512GB)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Asus TUF Gaming A15 FA506NCG-HN329W (Ryzen 7 8845HS/ GeForce RTX 3050/ 16GB/ 512GB)', 'laptop-asus-tuf-gaming-a15-fa506ncg-hn329w-ryzen-7-8845hs-geforce-rtx-3050-16gb-512gb', '260407198', 27990000, 22392000, 'Chiến binh Asus TUF Gaming A15 đạt chuẩn độ bền quân đội Mỹ MIL-STD-810H, trang bị chip Ryzen 7 8845HS với 8 nhân 16 luồng và card đồ họa RTX 3050. Bàn phím đèn nền RGB, màn hình 144Hz đồng bộ Adaptive-Sync giúp bạn làm chủ mọi đấu trường ảo.', '{"summary":"15.6 inch 144Hz · R7 8845HS · RTX 3050 · 16GB RAM","items":[{"label":"Kích thước màn hình","value":"15.6 inch Full HD (1920 × 1080) IPS 144Hz Adaptive-Sync"},{"label":"Bộ vi xử lý","value":"AMD Ryzen 7 8845HS (8 nhân 16 luồng, xung nhịp 5.1 GHz)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR5 5600 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"NVIDIA GeForce RTX 3050 4GB GDDR6"},{"label":"Trọng lượng","value":"2.3 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-gaming' AND b.slug = 'asus'
ON DUPLICATE KEY UPDATE
  description = 'Chiến binh Asus TUF Gaming A15 đạt chuẩn độ bền quân đội Mỹ MIL-STD-810H, trang bị chip Ryzen 7 8845HS với 8 nhân 16 luồng và card đồ họa RTX 3050. Bàn phím đèn nền RGB, màn hình 144Hz đồng bộ Adaptive-Sync giúp bạn làm chủ mọi đấu trường ảo.',
  specifications = '{"summary":"15.6 inch 144Hz · R7 8845HS · RTX 3050 · 16GB RAM","items":[{"label":"Kích thước màn hình","value":"15.6 inch Full HD (1920 × 1080) IPS 144Hz Adaptive-Sync"},{"label":"Bộ vi xử lý","value":"AMD Ryzen 7 8845HS (8 nhân 16 luồng, xung nhịp 5.1 GHz)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR5 5600 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"NVIDIA GeForce RTX 3050 4GB GDDR6"},{"label":"Trọng lượng","value":"2.3 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}',
  price = 27990000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/JVbjYz4WEYUOgot9lQ2vt9y-BPdlvzaxR5A9MtzEnfddsdjkaYX2q6-rt7Gwuqv3Y6L5awdsDjqQXQ3WiN-IWJWOEaLFwjIDBA=w230-rw', 'phongvu/260407198', 1, 1
FROM products p WHERE p.sku = '260407198';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260407198' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260407198' AND b.name = 'Chi nhánh Quận 7';

-- Product 8: Laptop Acer Nitro ProPanel ANV16-I12-53VH (Core 5 205H/ GeForce RTX 3050/ 16GB/ 512GB/ Win 11)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Acer Nitro ProPanel ANV16-I12-53VH (Core 5 205H/ GeForce RTX 3050/ 16GB/ 512GB/ Win 11)', 'laptop-acer-nitro-propanel-anv16-i12-53vh-core-5-205h-geforce-rtx-3050-16gb-512gb-win-11', '261001943', 28990000, 23192000, 'Acer Nitro ProPanel tái định nghĩa trải nghiệm laptop gaming với màn hình 16 inch tỉ lệ 16:10 tần số quét 165Hz chuẩn màu 100% sRGB. Thiết kế tản nhiệt quạt kép với phần mềm NitroSense độc quyền cho phép kiểm soát nhiệt độ và ép xung tức thì chỉ bằng một nút bấm.', '{"summary":"16 inch 165Hz · Core 5 · RTX 3050 · 16GB RAM","items":[{"label":"Kích thước màn hình","value":"16 inch WUXGA (1920 × 1200) IPS 165Hz 100% sRGB"},{"label":"Bộ vi xử lý","value":"Intel Core 5 205H (8 nhân 12 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR5 5200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"NVIDIA GeForce RTX 3050 6GB GDDR6"},{"label":"Trọng lượng","value":"2.35 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"12 tháng chính hãng bảo hành VIP 3S1"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-gaming' AND b.slug = 'acer'
ON DUPLICATE KEY UPDATE
  description = 'Acer Nitro ProPanel tái định nghĩa trải nghiệm laptop gaming với màn hình 16 inch tỉ lệ 16:10 tần số quét 165Hz chuẩn màu 100% sRGB. Thiết kế tản nhiệt quạt kép với phần mềm NitroSense độc quyền cho phép kiểm soát nhiệt độ và ép xung tức thì chỉ bằng một nút bấm.',
  specifications = '{"summary":"16 inch 165Hz · Core 5 · RTX 3050 · 16GB RAM","items":[{"label":"Kích thước màn hình","value":"16 inch WUXGA (1920 × 1200) IPS 165Hz 100% sRGB"},{"label":"Bộ vi xử lý","value":"Intel Core 5 205H (8 nhân 12 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR5 5200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"NVIDIA GeForce RTX 3050 6GB GDDR6"},{"label":"Trọng lượng","value":"2.35 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"12 tháng chính hãng bảo hành VIP 3S1"}]}',
  price = 28990000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/pzhCCNum6HOe9zEXHJbr3lG5OIS6IDN5YFVi-4FAuFzASxx3Ol_gQg-UVpNYY50GfMx7sUkDwdEi1sHDlGfUFRejNQL4xW0=w230-rw', 'phongvu/261001943', 1, 1
FROM products p WHERE p.sku = '261001943';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '261001943' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '261001943' AND b.name = 'Chi nhánh Quận 7';

-- Product 9: Laptop Asus Vivobook S14 S3407CA-SF913W (Ultra 5-225H/ 16GB/ 512GB/ Win 11 Home)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Asus Vivobook S14 S3407CA-SF913W (Ultra 5-225H/ 16GB/ 512GB/ Win 11 Home)', 'laptop-asus-vivobook-s14-s3407ca-sf913w-ultra-5-225h-16gb-512gb-win-11-home', '260302512', 27490000, 21992000, 'Asus Vivobook S14 là tuyệt tác công nghệ mỏng nhẹ với độ mỏng chỉ 1.39 cm cùng trọng lượng 1.4 kg. Điểm nhấn đột phá là màn hình Lumina OLED rực rỡ chuẩn điện ảnh và bộ xử lý Intel Core Ultra 5 tích hợp NPU AI thông minh tối ưu hóa mọi tác vụ hiện đại.', '{"summary":"14 inch OLED · Ultra 5-225H · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) Lumina OLED 60Hz 100% DCI-P3"},{"label":"Bộ vi xử lý","value":"Intel Core Ultra 5-225H tích hợp Intel AI Boost NPU"},{"label":"Bộ nhớ RAM","value":"16 GB LPDDR5X"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"Intel Arc Graphics"},{"label":"Trọng lượng","value":"1.4 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-mong-nhe' AND b.slug = 'asus'
ON DUPLICATE KEY UPDATE
  description = 'Asus Vivobook S14 là tuyệt tác công nghệ mỏng nhẹ với độ mỏng chỉ 1.39 cm cùng trọng lượng 1.4 kg. Điểm nhấn đột phá là màn hình Lumina OLED rực rỡ chuẩn điện ảnh và bộ xử lý Intel Core Ultra 5 tích hợp NPU AI thông minh tối ưu hóa mọi tác vụ hiện đại.',
  specifications = '{"summary":"14 inch OLED · Ultra 5-225H · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) Lumina OLED 60Hz 100% DCI-P3"},{"label":"Bộ vi xử lý","value":"Intel Core Ultra 5-225H tích hợp Intel AI Boost NPU"},{"label":"Bộ nhớ RAM","value":"16 GB LPDDR5X"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"Intel Arc Graphics"},{"label":"Trọng lượng","value":"1.4 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}',
  price = 27490000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/fh3QAE_n_Y_-PrJNaJbHhURaBpqBQGu_XfE3pzvEtWVgzbnXFPE1aILkHf6Rm0k54YMEYz3zerwv34SkhvlhELSnR1t2w7jZww=w230-rw', 'phongvu/260302512', 1, 1
FROM products p WHERE p.sku = '260302512';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260302512' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260302512' AND b.name = 'Chi nhánh Quận 7';

-- Product 10: Laptop HP ProBook 4 G1i - BQ5C7PT (Ultra 7-255U/ 16GB/ 512GB/ Win 11 Home SL)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop HP ProBook 4 G1i - BQ5C7PT (Ultra 7-255U/ 16GB/ 512GB/ Win 11 Home SL)', 'laptop-hp-probook-4-g1i---bq5c7pt-ultra-7-255u-16gb-512gb-win-11-home-sl', '260303867', 32490000, 25992000, 'HP ProBook 4 G1i là dòng máy tính doanh nhân cao cấp với bộ vỏ nhôm nguyên khối sang trọng, bảo mật vân tay và công nghệ bảo vệ dữ liệu HP Wolf Security hàng đầu. Máy trang bị vi xử lý Intel Core Ultra 7 mạnh mẽ, thời lượng pin cả ngày dài phục vụ công tác liên tục.', '{"summary":"14 inch · Ultra 7-255U · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) IPS chống chói 300 nits"},{"label":"Bộ vi xử lý","value":"Intel Core Ultra 7-255U (12 nhân 14 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR5 5600 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe"},{"label":"Card đồ họa","value":"Intel Graphics"},{"label":"Trọng lượng","value":"1.4 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home SL"},{"label":"Bảo hành","value":"12 tháng chính hãng HP tận nơi"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-mong-nhe' AND b.slug = 'hp'
ON DUPLICATE KEY UPDATE
  description = 'HP ProBook 4 G1i là dòng máy tính doanh nhân cao cấp với bộ vỏ nhôm nguyên khối sang trọng, bảo mật vân tay và công nghệ bảo vệ dữ liệu HP Wolf Security hàng đầu. Máy trang bị vi xử lý Intel Core Ultra 7 mạnh mẽ, thời lượng pin cả ngày dài phục vụ công tác liên tục.',
  specifications = '{"summary":"14 inch · Ultra 7-255U · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) IPS chống chói 300 nits"},{"label":"Bộ vi xử lý","value":"Intel Core Ultra 7-255U (12 nhân 14 luồng)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR5 5600 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe"},{"label":"Card đồ họa","value":"Intel Graphics"},{"label":"Trọng lượng","value":"1.4 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home SL"},{"label":"Bảo hành","value":"12 tháng chính hãng HP tận nơi"}]}',
  price = 32490000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/WjSd894vIGO-EaYozFdQMK3VFU-w7Rw0qfCt0iqxBGeMP54VWD7A5VmtwxQHXF_ZpQMrVmEUghLJDGJJbMv3vBx8Upi1GyU=w230-rw', 'phongvu/260303867', 1, 1
FROM products p WHERE p.sku = '260303867';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260303867' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260303867' AND b.name = 'Chi nhánh Quận 7';

-- Product 11: Laptop Acer Swift Air 14 SFA14-I31-52BV (Core 5 320/ 12GB/ 512GB/ Windows 11 Home)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Acer Swift Air 14 SFA14-I31-52BV (Core 5 320/ 12GB/ 512GB/ Windows 11 Home)', 'laptop-acer-swift-air-14-sfa14-i31-52bv-core-5-320-12gb-512gb-windows-11-home', '260801536', 24990000, 19992000, 'Acer Swift Air 14 định chuẩn lại độ cơ động với trọng lượng siêu nhẹ vỏn vẹn 1.1 kg chế tác từ hợp kim Magie - Nhôm nguyên khối. Màn hình 120Hz mượt mà, RAM 12GB và thiết kế mỏng như một cuốn sổ tay giúp bạn thoải mái mang theo làm việc tại mọi không gian.', '{"summary":"14 inch 120Hz · Core 5 · 12GB · Siêu nhẹ 1.1 kg","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) IPS 120Hz 100% sRGB"},{"label":"Bộ vi xử lý","value":"Intel Core 5 320 (8 nhân)"},{"label":"Bộ nhớ RAM","value":"12 GB LPDDR5"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe"},{"label":"Card đồ họa","value":"Intel Graphics"},{"label":"Trọng lượng","value":"1.1 kg (Siêu nhẹ)"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"12 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-mong-nhe' AND b.slug = 'acer'
ON DUPLICATE KEY UPDATE
  description = 'Acer Swift Air 14 định chuẩn lại độ cơ động với trọng lượng siêu nhẹ vỏn vẹn 1.1 kg chế tác từ hợp kim Magie - Nhôm nguyên khối. Màn hình 120Hz mượt mà, RAM 12GB và thiết kế mỏng như một cuốn sổ tay giúp bạn thoải mái mang theo làm việc tại mọi không gian.',
  specifications = '{"summary":"14 inch 120Hz · Core 5 · 12GB · Siêu nhẹ 1.1 kg","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) IPS 120Hz 100% sRGB"},{"label":"Bộ vi xử lý","value":"Intel Core 5 320 (8 nhân)"},{"label":"Bộ nhớ RAM","value":"12 GB LPDDR5"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe"},{"label":"Card đồ họa","value":"Intel Graphics"},{"label":"Trọng lượng","value":"1.1 kg (Siêu nhẹ)"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"12 tháng chính hãng"}]}',
  price = 24990000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/KghMvRNKo3CqbgEH5A1L0jbbMYNY0ByLZam2ABkHansFvIfu25qla_84sQ3W2VTc1aZxfA37FqIaPQNk0pF-coIsMMJAkj0=w230-rw', 'phongvu/260801536', 1, 1
FROM products p WHERE p.sku = '260801536';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260801536' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260801536' AND b.name = 'Chi nhánh Quận 7';

-- Product 12: Laptop Lenovo ThinkBook 14 G9 IRL - 21UY008TVN (Core i5-13420H/ 16GB/ 512GB/ Win 11)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Lenovo ThinkBook 14 G9 IRL - 21UY008TVN (Core i5-13420H/ 16GB/ 512GB/ Win 11)', 'laptop-lenovo-thinkbook-14-g9-irl---21uy008tvn-core-i5-13420h-16gb-512gb-win-11', '260603062', 26290000, 21032000, 'Lenovo ThinkBook 14 G9 là bạn đồng hành hoàn hảo cho doanh nghiệp trẻ với phong cách 2 tông màu thời thượng. Sở hữu bàn phím ThinkPad trứ danh bấm êm nảy, cảm biến vân tay tích hợp nút nguồn và hiệu năng mạnh mẽ từ CPU Intel Core H-series hiệu năng cao.', '{"summary":"14 inch WUXGA · i5-13420H · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) IPS chống chói 300 nits"},{"label":"Bộ vi xử lý","value":"Intel Core i5-13420H (8 nhân 12 luồng, xung nhịp 4.6 GHz)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR5 5200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"Intel UHD Graphics"},{"label":"Trọng lượng","value":"1.36 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home SL"},{"label":"Bảo hành","value":"24 tháng chính hãng Premier Support"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-mong-nhe' AND b.slug = 'lenovo'
ON DUPLICATE KEY UPDATE
  description = 'Lenovo ThinkBook 14 G9 là bạn đồng hành hoàn hảo cho doanh nghiệp trẻ với phong cách 2 tông màu thời thượng. Sở hữu bàn phím ThinkPad trứ danh bấm êm nảy, cảm biến vân tay tích hợp nút nguồn và hiệu năng mạnh mẽ từ CPU Intel Core H-series hiệu năng cao.',
  specifications = '{"summary":"14 inch WUXGA · i5-13420H · 16GB · 512GB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) IPS chống chói 300 nits"},{"label":"Bộ vi xử lý","value":"Intel Core i5-13420H (8 nhân 12 luồng, xung nhịp 4.6 GHz)"},{"label":"Bộ nhớ RAM","value":"16 GB DDR5 5200 MHz"},{"label":"Ổ cứng","value":"512 GB SSD NVMe PCIe 4.0"},{"label":"Card đồ họa","value":"Intel UHD Graphics"},{"label":"Trọng lượng","value":"1.36 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home SL"},{"label":"Bảo hành","value":"24 tháng chính hãng Premier Support"}]}',
  price = 26290000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/60T5Wb3tR6ddyp_XyZsC2oMMUoDtTjyKdmHUBTksR1CRwdpHGIWvnX0_B-VZ1-blkQ57PYEx_uw6HGRIcfcK2xFk0Rvw0-Dn=w230-rw', 'phongvu/260603062', 1, 1
FROM products p WHERE p.sku = '260603062';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260603062' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260603062' AND b.name = 'Chi nhánh Quận 7';

-- Product 13: Laptop Msi Prestige 14 AI+ D3MG-022VN (Ultra 7-355/ 32GB/ 1TB/ Windows 11 Home)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Msi Prestige 14 AI+ D3MG-022VN (Ultra 7-355/ 32GB/ 1TB/ Windows 11 Home)', 'laptop-msi-prestige-14-ai-d3mg-022vn-ultra-7-355-32gb-1tb-windows-11-home', '260303605', 44490000, 35592000, 'MSI Prestige 14 AI+ là mẫu máy trạm di động siêu mỏng nhẹ dành riêng cho nhà sáng tạo nội dung và kỹ sư đồ họa. Tấm nền OLED siêu sắc nét chuẩn DCI-P3, vi xử lý Intel Core Ultra 7 tích hợp AI và 32GB RAM giúp xử lý dựng phim 4K, đồ họa chuyên nghiệp không chút giật lag.', '{"summary":"14 inch OLED · Ultra 7-355 · 32GB RAM · 1TB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) OLED 100% DCI-P3 DisplayHDR True Black"},{"label":"Bộ vi xử lý","value":"Intel Core Ultra 7-355 (16 nhân 22 luồng, tích hợp NPU AI)"},{"label":"Bộ nhớ RAM","value":"32 GB LPDDR5X 7500 MHz"},{"label":"Ổ cứng","value":"1 TB SSD NVMe PCIe Gen4"},{"label":"Card đồ họa","value":"Intel Arc Graphics"},{"label":"Trọng lượng","value":"1.3 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-workstation' AND b.slug = 'msi'
ON DUPLICATE KEY UPDATE
  description = 'MSI Prestige 14 AI+ là mẫu máy trạm di động siêu mỏng nhẹ dành riêng cho nhà sáng tạo nội dung và kỹ sư đồ họa. Tấm nền OLED siêu sắc nét chuẩn DCI-P3, vi xử lý Intel Core Ultra 7 tích hợp AI và 32GB RAM giúp xử lý dựng phim 4K, đồ họa chuyên nghiệp không chút giật lag.',
  specifications = '{"summary":"14 inch OLED · Ultra 7-355 · 32GB RAM · 1TB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA (1920 × 1200) OLED 100% DCI-P3 DisplayHDR True Black"},{"label":"Bộ vi xử lý","value":"Intel Core Ultra 7-355 (16 nhân 22 luồng, tích hợp NPU AI)"},{"label":"Bộ nhớ RAM","value":"32 GB LPDDR5X 7500 MHz"},{"label":"Ổ cứng","value":"1 TB SSD NVMe PCIe Gen4"},{"label":"Card đồ họa","value":"Intel Arc Graphics"},{"label":"Trọng lượng","value":"1.3 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}',
  price = 44490000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/tJdbWXqIBRbW-KlFl5CYIYYOKYMKfiRqVnHaLgvLICEpiSvrurbOOsRQv6PKwAojYT848Qn2v71z3dKbUPY9p7qO9isGyJQ=w230-rw', 'phongvu/260303605', 1, 1
FROM products p WHERE p.sku = '260303605';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260303605' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260303605' AND b.name = 'Chi nhánh Quận 7';

-- Product 14: Laptop Msi Prestige 14 Flip AI+ Vincent van Gogh Edition (Ultra X9-378H/ 32GB/ 1TB)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Msi Prestige 14 Flip AI+ Vincent van Gogh Edition (Ultra X9-378H/ 32GB/ 1TB)', 'laptop-msi-prestige-14-flip-ai-vincent-van-gogh-edition-ultra-x9-378h-32gb-1tb', '260805116', 58590000, 46872000, 'Phiên bản nghệ thuật giới hạn MSI Prestige 14 Flip AI+ Vincent van Gogh sở hữu bản lề xoay gập 360 độ và bút cảm ứng MSI Pen chuyên nghiệp. Sức mạnh vượt trội từ Intel Core Ultra X9 cùng 32GB RAM giúp hiện thực hóa mọi ý tưởng hội họa số và thiết kế kiến trúc.', '{"summary":"14 inch OLED Xoay gập · Ultra X9 · 32GB · 1TB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA OLED Touch xoay gập 360 độ kèm bút stylus"},{"label":"Bộ vi xử lý","value":"Intel Core Ultra X9-378H (16 nhân)"},{"label":"Bộ nhớ RAM","value":"32 GB LPDDR5X"},{"label":"Ổ cứng","value":"1 TB SSD NVMe PCIe Gen4"},{"label":"Card đồ họa","value":"Intel Graphics"},{"label":"Trọng lượng","value":"1.37 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-workstation' AND b.slug = 'msi'
ON DUPLICATE KEY UPDATE
  description = 'Phiên bản nghệ thuật giới hạn MSI Prestige 14 Flip AI+ Vincent van Gogh sở hữu bản lề xoay gập 360 độ và bút cảm ứng MSI Pen chuyên nghiệp. Sức mạnh vượt trội từ Intel Core Ultra X9 cùng 32GB RAM giúp hiện thực hóa mọi ý tưởng hội họa số và thiết kế kiến trúc.',
  specifications = '{"summary":"14 inch OLED Xoay gập · Ultra X9 · 32GB · 1TB SSD","items":[{"label":"Kích thước màn hình","value":"14 inch WUXGA OLED Touch xoay gập 360 độ kèm bút stylus"},{"label":"Bộ vi xử lý","value":"Intel Core Ultra X9-378H (16 nhân)"},{"label":"Bộ nhớ RAM","value":"32 GB LPDDR5X"},{"label":"Ổ cứng","value":"1 TB SSD NVMe PCIe Gen4"},{"label":"Card đồ họa","value":"Intel Graphics"},{"label":"Trọng lượng","value":"1.37 kg"},{"label":"Hệ điều hành","value":"Windows 11 Home"},{"label":"Bảo hành","value":"24 tháng chính hãng"}]}',
  price = 58590000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/bvm27CeviO9nTuVDmlLiIYdqHZCOQ1dYGmsj_CsLq6M5t2pH1UF_A7wQx-jXwNiSpEYiSNE0ECvrdZLVdQxFzhOmRk2MbF6p=w230-rw', 'phongvu/260805116', 1, 1
FROM products p WHERE p.sku = '260805116';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '260805116' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '260805116' AND b.name = 'Chi nhánh Quận 7';

-- Product 15: Laptop Msi Prestige N16 Flip AI+ C1XMT-017VN (RTX Spark N1X/ 64GB/ 2TB/ Windows 11 Pro)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Msi Prestige N16 Flip AI+ C1XMT-017VN (RTX Spark N1X/ 64GB/ 2TB/ Windows 11 Pro)', 'laptop-msi-prestige-n16-flip-ai-c1xmt-017vn-rtx-spark-n1x-64gb-2tb-windows-11-pro', '261000940', 139990000, 111992000, 'Quái thú máy trạm đồ họa chuyên nghiệp MSI Prestige N16 Flip AI+ trang bị card đồ họa kiến trúc NVIDIA Blackwell RTX và chip chuyên dụng Workstation. Màn hình 16 inch 2.8K OLED 120Hz mang đến không gian làm việc bao la cho các tác vụ mô phỏng 3D, AI training và tính toán kỹ thuật phức tạp.', '{"summary":"16 inch 2.8K OLED · RTX Blackwell · 64GB RAM · 2TB SSD","items":[{"label":"Kích thước màn hình","value":"16 inch 2.8K (2880 × 1800) OLED 120Hz 100% DCI-P3"},{"label":"Bộ vi xử lý","value":"RTX Spark N1X Workstation Processor"},{"label":"Bộ nhớ RAM","value":"64 GB LPDDR5X"},{"label":"Ổ cứng","value":"2 TB SSD NVMe PCIe Gen5 siêu tốc"},{"label":"Card đồ họa","value":"NVIDIA Blackwell RTX Workstation GPU"},{"label":"Trọng lượng","value":"1.9 kg"},{"label":"Hệ điều hành","value":"Windows 11 Pro"},{"label":"Bảo hành","value":"36 tháng bảo hành máy trạm doanh nghiệp"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-workstation' AND b.slug = 'msi'
ON DUPLICATE KEY UPDATE
  description = 'Quái thú máy trạm đồ họa chuyên nghiệp MSI Prestige N16 Flip AI+ trang bị card đồ họa kiến trúc NVIDIA Blackwell RTX và chip chuyên dụng Workstation. Màn hình 16 inch 2.8K OLED 120Hz mang đến không gian làm việc bao la cho các tác vụ mô phỏng 3D, AI training và tính toán kỹ thuật phức tạp.',
  specifications = '{"summary":"16 inch 2.8K OLED · RTX Blackwell · 64GB RAM · 2TB SSD","items":[{"label":"Kích thước màn hình","value":"16 inch 2.8K (2880 × 1800) OLED 120Hz 100% DCI-P3"},{"label":"Bộ vi xử lý","value":"RTX Spark N1X Workstation Processor"},{"label":"Bộ nhớ RAM","value":"64 GB LPDDR5X"},{"label":"Ổ cứng","value":"2 TB SSD NVMe PCIe Gen5 siêu tốc"},{"label":"Card đồ họa","value":"NVIDIA Blackwell RTX Workstation GPU"},{"label":"Trọng lượng","value":"1.9 kg"},{"label":"Hệ điều hành","value":"Windows 11 Pro"},{"label":"Bảo hành","value":"36 tháng bảo hành máy trạm doanh nghiệp"}]}',
  price = 139990000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/p7mwSaoRmOnhVbwoCi3j1pmcFFX-bJQQWimMSsBGkWp7efz9nuSBmCIatUMFgsN8D3NWuhHwNpJacQJvSi9GPOLZWjqco4PRXw=w230-rw', 'phongvu/261000940', 1, 1
FROM products p WHERE p.sku = '261000940';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '261000940' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '261000940' AND b.name = 'Chi nhánh Quận 7';

-- Product 16: Laptop Msi Prestige N16 Flip AI+ C1XMT-016VN (RTX Spark N1X/ 128GB/ 2TB/ Windows 11 Pro)
INSERT INTO products (category_id, brand_id, name, slug, sku, price, cost_price, description, specifications, status, created_at, updated_at)
SELECT c.id, b.id, 'Laptop Msi Prestige N16 Flip AI+ C1XMT-016VN (RTX Spark N1X/ 128GB/ 2TB/ Windows 11 Pro)', 'laptop-msi-prestige-n16-flip-ai-c1xmt-016vn-rtx-spark-n1x-128gb-2tb-windows-11-pro', '261000912', 222990000, 178392000, 'Đỉnh cao máy trạm di động cao cấp nhất thế giới MSI Prestige N16 Flip AI+ C1XMT-016VN sở hữu dung lượng RAM khủng 128GB và màn hình Tandem OLED 16 inch UHD+ siêu nét. Cấu hình vô song đáp ứng trọn vẹn các yêu cầu khắt khe nhất của các studio kỹ xảo Hollywood, viện nghiên cứu AI và kỹ thuật hàng không.', '{"summary":"16 inch UHD+ Tandem OLED · 128GB RAM · 2TB SSD","items":[{"label":"Kích thước màn hình","value":"16 inch UHD+ (3840 × 2400) Tandem OLED 120Hz"},{"label":"Bộ vi xử lý","value":"RTX Spark N1X Workstation Processor"},{"label":"Bộ nhớ RAM","value":"128 GB LPDDR5X"},{"label":"Ổ cứng","value":"2 TB SSD NVMe PCIe Gen5"},{"label":"Card đồ họa","value":"NVIDIA Blackwell RTX Workstation GPU"},{"label":"Trọng lượng","value":"1.9 kg"},{"label":"Hệ điều hành","value":"Windows 11 Pro"},{"label":"Bảo hành","value":"36 tháng bảo hành máy trạm doanh nghiệp"}]}', 'ACTIVE', NOW(), NOW()
FROM categories c, brands b
WHERE c.slug = 'laptop-workstation' AND b.slug = 'msi'
ON DUPLICATE KEY UPDATE
  description = 'Đỉnh cao máy trạm di động cao cấp nhất thế giới MSI Prestige N16 Flip AI+ C1XMT-016VN sở hữu dung lượng RAM khủng 128GB và màn hình Tandem OLED 16 inch UHD+ siêu nét. Cấu hình vô song đáp ứng trọn vẹn các yêu cầu khắt khe nhất của các studio kỹ xảo Hollywood, viện nghiên cứu AI và kỹ thuật hàng không.',
  specifications = '{"summary":"16 inch UHD+ Tandem OLED · 128GB RAM · 2TB SSD","items":[{"label":"Kích thước màn hình","value":"16 inch UHD+ (3840 × 2400) Tandem OLED 120Hz"},{"label":"Bộ vi xử lý","value":"RTX Spark N1X Workstation Processor"},{"label":"Bộ nhớ RAM","value":"128 GB LPDDR5X"},{"label":"Ổ cứng","value":"2 TB SSD NVMe PCIe Gen5"},{"label":"Card đồ họa","value":"NVIDIA Blackwell RTX Workstation GPU"},{"label":"Trọng lượng","value":"1.9 kg"},{"label":"Hệ điều hành","value":"Windows 11 Pro"},{"label":"Bảo hành","value":"36 tháng bảo hành máy trạm doanh nghiệp"}]}',
  price = 222990000;

-- Product Image
INSERT IGNORE INTO product_images (product_id, image_url, cloudinary_public_id, is_primary, display_order)
SELECT p.id, 'https://lh3.googleusercontent.com/TR9IyRX4ggytDPYmjRhsYsODLsWCo8hWpDUA-5mwlxp3NvSLTQmF-LbvgdidKL4xQOnAg-0SvSIw-qQpjWdlzhX9uuDqXWk=w230-rw', 'phongvu/261000912', 1, 1
FROM products p WHERE p.sku = '261000912';

-- Inventories for Branch 1 and Branch 2
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 10, 3, NOW() FROM products p, branches b WHERE p.sku = '261000912' AND b.name = 'Chi nhánh Quận 1';
INSERT IGNORE INTO inventories (product_id, branch_id, quantity, min_stock_alert, updated_at)
SELECT p.id, b.id, 8, 3, NOW() FROM products p, branches b WHERE p.sku = '261000912' AND b.name = 'Chi nhánh Quận 7';

