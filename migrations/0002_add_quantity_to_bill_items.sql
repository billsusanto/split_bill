-- Add quantity column to bill_items table
ALTER TABLE bill_items ADD COLUMN IF NOT EXISTS quantity INTEGER NOT NULL DEFAULT 1; 