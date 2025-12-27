-- Function for admins to add tokens to anyone (including themselves)
CREATE OR REPLACE FUNCTION admin_add_tokens(
    p_user_id UUID,
    p_amount INTEGER,
    p_description TEXT DEFAULT 'Admin adjustment'
) RETURNS BOOLEAN AS $$
BEGIN
    -- Check if target user has a record in user_tokens
    INSERT INTO user_tokens (user_id, balance, updated_at)
    VALUES (p_user_id, p_amount, NOW())
    ON CONFLICT (user_id) 
    DO UPDATE SET 
        balance = user_tokens.balance + p_amount,
        updated_at = NOW();

    -- Record token transaction
    INSERT INTO token_transactions (user_id, amount, type, description)
    VALUES (p_user_id, p_amount, 'bonus', p_description);

    RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
