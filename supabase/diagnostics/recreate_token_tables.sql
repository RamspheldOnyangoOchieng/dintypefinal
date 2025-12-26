-- Create token_costs table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS token_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feature_key TEXT NOT NULL UNIQUE,
    feature_name_sv TEXT NOT NULL,
    cost_tokens INTEGER NOT NULL,
    description_sv TEXT,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create token_packages table (if it doesn't exist)
CREATE TABLE IF NOT EXISTS token_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    tokens INTEGER NOT NULL,
    price INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ensure columns exist in token_packages (Fixing the error: column "description" does not exist)
ALTER TABLE token_packages ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE token_packages ADD COLUMN IF NOT EXISTS active BOOLEAN DEFAULT true;

-- Enable RLS
ALTER TABLE token_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE token_costs ENABLE ROW LEVEL SECURITY;

-- Policies for token_packages
DROP POLICY IF EXISTS "Public read access" ON token_packages;
CREATE POLICY "Public read access" ON token_packages
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access" ON token_packages;
CREATE POLICY "Admin full access" ON token_packages
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
      )
    );

-- Policies for token_costs
DROP POLICY IF EXISTS "Public read access" ON token_costs;
CREATE POLICY "Public read access" ON token_costs
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Admin full access" ON token_costs;
CREATE POLICY "Admin full access" ON token_costs
    FOR ALL
    TO authenticated
    USING (
      EXISTS (
        SELECT 1 FROM admin_users WHERE user_id = auth.uid()
      )
    );

-- Grant permissions
GRANT SELECT ON token_packages TO anon, authenticated;
GRANT SELECT ON token_costs TO anon, authenticated;
GRANT ALL ON token_packages TO authenticated;
GRANT ALL ON token_costs TO authenticated;

-- Insert default token_costs
INSERT INTO token_costs (feature_key, feature_name_sv, cost_tokens, description_sv)
VALUES 
    ('image_generation_1', 'Bildgenerering (1 bild)', 5, 'Kostnad för att generera en bild'),
    ('image_generation_4', 'Bildgenerering (4 bilder)', 20, 'Kostnad för att generera fyra bilder samtidigt'),
    ('video_generation', 'Videogenerering', 50, 'Kostnad för att generera en video'),
    ('chat_message', 'Chattmeddelande', 1, 'Kostnad per meddelande (om ej Premium)')
ON CONFLICT (feature_key) DO NOTHING;

-- Insert default token_packages
-- Since name is not unique constraint by default, we use WHERE NOT EXISTS to avoid duplicates
INSERT INTO token_packages (name, tokens, price, description, active)
SELECT 'Small Package', 100, 49, '100 tokens för mindre projekt', true
WHERE NOT EXISTS (SELECT 1 FROM token_packages WHERE name = 'Small Package');

INSERT INTO token_packages (name, tokens, price, description, active)
SELECT 'Medium Package', 500, 199, '500 tokens - Mest populär', true
WHERE NOT EXISTS (SELECT 1 FROM token_packages WHERE name = 'Medium Package');

INSERT INTO token_packages (name, tokens, price, description, active)
SELECT 'Large Package', 1200, 399, '1200 tokens för storanvändare', true
WHERE NOT EXISTS (SELECT 1 FROM token_packages WHERE name = 'Large Package');
