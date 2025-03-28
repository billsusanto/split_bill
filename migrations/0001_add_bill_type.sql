-- Add billType column with default value 'items'
ALTER TABLE bills ADD COLUMN bill_type VARCHAR(255) NOT NULL DEFAULT 'items'; 