-- Create user_credits table
CREATE TABLE IF NOT EXISTS user_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Create credit_transactions table
CREATE TABLE IF NOT EXISTS credit_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount DECIMAL(10, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('subscription_grant', 'token_purchase', 'admin_adjustment', 'refund')),
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_user_credits_user_id ON user_credits(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_transactions_user_id ON credit_transactions(user_id);

-- Enable RLS
ALTER TABLE user_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own credits" ON user_credits;
CREATE POLICY "Users can view their own credits" ON user_credits
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view their own credit transactions" ON credit_transactions;
CREATE POLICY "Users can view their own credit transactions" ON credit_transactions
    FOR SELECT USING (auth.uid() = user_id);

-- Admin policies
DROP POLICY IF EXISTS "Admins can view all credits" ON user_credits;
CREATE POLICY "Admins can view all credits" ON user_credits
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users WHERE user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Admins can view all credit transactions" ON credit_transactions;
CREATE POLICY "Admins can view all credit transactions" ON credit_transactions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_users WHERE user_id = auth.uid()
        )
    );

-- Create function to buy tokens with credits
CREATE OR REPLACE FUNCTION buy_tokens_with_credits(
    p_user_id UUID,
    p_credit_amount DECIMAL(10, 2),
    p_token_amount INTEGER,
    p_description TEXT
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_credits DECIMAL(10, 2);
BEGIN
    -- Check balance
    SELECT balance INTO v_current_credits FROM user_credits WHERE user_id = p_user_id FOR UPDATE;
    
    IF v_current_credits IS NULL OR v_current_credits < p_credit_amount THEN
        RAISE EXCEPTION 'Insufficient credits';
    END IF;

    -- Deduct credits
    UPDATE user_credits 
    SET balance = balance - p_credit_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record credit transaction
    INSERT INTO credit_transactions (user_id, amount, type, description)
    VALUES (p_user_id, -p_credit_amount, 'token_purchase', p_description);

    -- Add tokens (handle both 'balance' and 'token_balance' column names for robustness if needed, but we'll assume 'balance')
    -- First try 'balance'
    INSERT INTO user_tokens (user_id, balance, updated_at)
    VALUES (p_user_id, p_token_amount, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = user_tokens.balance + p_token_amount,
        updated_at = NOW();

    -- Record token transaction
    INSERT INTO token_transactions (user_id, amount, type, description)
    VALUES (p_user_id, p_token_amount, 'purchase', p_description);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
