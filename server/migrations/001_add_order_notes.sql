-- 001_add_order_notes.sql
-- Adds notes and trackingNumber columns to the orders table

ALTER TABLE orders ADD COLUMN IF NOT EXISTS notes TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS "trackingNumber" TEXT;
