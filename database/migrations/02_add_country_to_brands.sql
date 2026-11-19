-- Migration: Add country (quốc gia xuất xứ) to brands for Admin Catalog (UC12, ADR-018 A5)
-- Database: MySQL 8
-- Không thay đổi/xóa dữ liệu hiện có; cột cho phép NULL.

ALTER TABLE brands
  ADD COLUMN country VARCHAR(100) NULL AFTER slug;
