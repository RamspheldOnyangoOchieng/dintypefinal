-- Comprehensive Token Packages Seed Migration
-- Created: 2025-12-27
-- Purpose: Seed the token_packages table with the exact data from the official pricing spreadsheet.

-- 1. Ensure the schema is correct
CREATE TABLE IF NOT EXISTS public.token_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    price DECIMAL(10, 2) NOT NULL, -- Credit cost
    price_display TEXT, -- Monetary display text (EUR/SEK)
    description TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure price_display exists if the table was previously created without it
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'token_packages' AND column_name = 'price_display') THEN
        ALTER TABLE token_packages ADD COLUMN price_display TEXT;
    END IF;
END $$;

-- 2. Clear existing packages to ensure a clean seed as requested
TRUNCATE TABLE public.token_packages;

-- 3. Insert the official packages from the pricing spreadsheet
INSERT INTO public.token_packages (name, tokens, price, price_display, description, active)
VALUES 
    ('100 tokens', 100, 0, 'INGÅR', 'Ingår varje månad för Premium-medlemmar', true),
    ('200 tokens', 200, 99.00, '9,99 € / 99 kr', '200 tokens för användning i alla funktioner', true),
    ('550 tokens', 550, 249.00, '€24.99 / 249 kr', 'Mellanpaket för mer generationer', true),
    ('1,550 tokens', 1550, 499.00, '€49.99 / 499 kr', 'Bra värde för flitiga användare', true),
    ('5,800 tokens', 5800, 1499.00, '€149.99 / 1,499 kr', 'Maximalt värde paket (Super Value)', true);

-- 4. Verify RLS (Row Level Security)
ALTER TABLE public.token_packages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active packages" ON public.token_packages;
CREATE POLICY "Public can view active packages" ON public.token_packages
    FOR SELECT USING (active = true);

DROP POLICY IF EXISTS "Admins can manage all packages" ON public.token_packages;
CREATE POLICY "Admins can manage all packages" ON public.token_packages
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_users WHERE user_id = auth.uid()
        )
    );
