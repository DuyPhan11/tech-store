-- Migration: Add parent_id to categories for hierarchical category tree (ADR-017)
-- Database: MySQL 8

ALTER TABLE categories
  ADD COLUMN parent_id BIGINT NULL AFTER id,
  ADD KEY idx_categories_parent_id (parent_id),
  ADD CONSTRAINT fk_categories_parent FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE SET NULL;
