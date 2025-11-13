-- Insert token packages based on spreadsheet pricing
-- Clean existing packages first
TRUNCATE TABLE token_packages CASCADE;

-- Insert token packages with Swedish pricing (1 EUR ≈ 11.5 SEK)
INSERT INTO token_packages (name, tokens, equivalent_images, price, currency, is_active, display_order) VALUES
('200 Tokens Package', 200, 40, 99.00, 'SEK', true, 1),
('550 Tokens Package', 550, 110, 249.00, 'SEK', true, 2),
('1,550 Tokens Package', 1550, 310, 499.00, 'SEK', true, 3),
('5,800 Tokens Package', 5800, 1160, 1499.00, 'SEK', true, 4);

-- Also insert EUR pricing for international users
INSERT INTO token_packages (name, tokens, equivalent_images, price, currency, is_active, display_order) VALUES
('200 Tokens Package (EUR)', 200, 40, 9.99, 'EUR', true, 5),
('550 Tokens Package (EUR)', 550, 110, 24.99, 'EUR', true, 6),
('1,550 Tokens Package (EUR)', 1550, 310, 49.99, 'EUR', true, 7),
('5,800 Tokens Package (EUR)', 5800, 1160, 149.99, 'EUR', true, 8);

-- Update token package metadata for better display
COMMENT ON TABLE token_packages IS 'Token packages for pay-as-you-go purchases. 1 token = ~0.20 images (5 tokens per image)';
COMMENT ON COLUMN token_packages.equivalent_images IS 'Approximate number of images this package can generate (5 tokens per image)';

-- Create view for active token packages
CREATE OR REPLACE VIEW active_token_packages AS
SELECT 
  id,
  name,
  tokens,
  equivalent_images,
  price,
  currency,
  display_order,
  ROUND(price / tokens::numeric, 2) as price_per_token,
  ROUND(price / equivalent_images::numeric, 2) as price_per_image
FROM token_packages
WHERE is_active = true
ORDER BY display_order;

COMMENT ON VIEW active_token_packages IS 'Active token packages with calculated price per token and price per image';
