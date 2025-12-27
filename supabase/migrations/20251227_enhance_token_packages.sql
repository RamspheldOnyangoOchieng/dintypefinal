-- Migration to enhance token_packages table
-- Created: 2025-12-27

-- Ensure token_packages table exists (it should, but for robustness)
CREATE TABLE IF NOT EXISTS public.token_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    price_display TEXT, -- e.g. "9,99 € / 99 kr"
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add price_display if it's missing from an existing table
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'token_packages' AND column_name = 'price_display') THEN
        ALTER TABLE token_packages ADD COLUMN price_display TEXT;
    END IF;
END $$;

-- Update existing data with display strings if they are missing
UPDATE token_packages SET price_display = '9,99 € / 99 kr' WHERE tokens = 200 AND price_display IS NULL;
UPDATE token_packages SET price_display = '€24.99 / 249 kr' WHERE tokens = 550 AND price_display IS NULL;
UPDATE token_packages SET price_display = '€49.99 / 499 kr' WHERE tokens = 1550 AND price_display IS NULL;
UPDATE token_packages SET price_display = '€149.99 / 1,499 kr' WHERE tokens = 5800 AND price_display IS NULL;
UPDATE token_packages SET price_display = '0 EUR / 0 kr' WHERE tokens = 100 AND price_display IS NULL;
