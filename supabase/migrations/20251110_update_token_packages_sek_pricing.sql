-- Update token packages with Swedish Krona (SEK) pricing
-- Date: 2025-11-10
-- Description: Update token package prices from USD/EUR to Swedish Krona

-- Update existing token packages with SEK pricing
UPDATE token_packages
SET 
    price = CASE 
        WHEN tokens = 200 THEN 99  -- 200 tokens (40 images) — 99 kr
        WHEN tokens = 550 THEN 249 -- 550 tokens (110 images) — 249 kr
        WHEN tokens = 1550 THEN 499 -- 1,550 tokens (310 images) — 499 kr
        WHEN tokens = 5800 THEN 1499 -- 5,800 tokens (1,160 images) — 1,499 kr
        ELSE price -- Keep existing price for any other packages
    END,
    updated_at = NOW()
WHERE tokens IN (200, 550, 1550, 5800);

-- Add currency field if it doesn't exist (for future use)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'token_packages' 
        AND column_name = 'currency'
    ) THEN
        ALTER TABLE token_packages ADD COLUMN currency VARCHAR(3) DEFAULT 'SEK';
    END IF;
END $$;

-- Update currency for all packages to SEK
UPDATE token_packages SET currency = 'SEK' WHERE currency IS NULL OR currency != 'SEK';

-- Add display_price field for formatted price display
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'token_packages' 
        AND column_name = 'display_price'
    ) THEN
        ALTER TABLE token_packages ADD COLUMN display_price VARCHAR(50);
    END IF;
END $$;

-- Update display prices with proper formatting
UPDATE token_packages
SET display_price = CASE 
    WHEN tokens = 200 THEN '99 kr'
    WHEN tokens = 550 THEN '249 kr'
    WHEN tokens = 1550 THEN '499 kr'
    WHEN tokens = 5800 THEN '1,499 kr'
    ELSE price::TEXT || ' kr'
END
WHERE tokens IN (200, 550, 1550, 5800);

-- Verify the update
SELECT 
    id,
    name,
    tokens,
    equivalent_images,
    price,
    currency,
    display_price,
    is_active
FROM token_packages
ORDER BY display_order;
