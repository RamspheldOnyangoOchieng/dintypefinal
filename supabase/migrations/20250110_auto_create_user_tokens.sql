-- Function to create initial token balance for new users
CREATE OR REPLACE FUNCTION create_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- Give new users 50 free tokens to start
  INSERT INTO user_tokens (user_id, balance, created_at, updated_at)
  VALUES (NEW.id, 50, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Log the initial token grant
  INSERT INTO token_transactions (user_id, amount, type, description, created_at)
  VALUES (NEW.id, 50, 'bonus', 'Welcome bonus - 50 free tokens', NOW());
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create tokens when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_tokens ON auth.users;
CREATE TRIGGER on_auth_user_created_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_tokens();

COMMENT ON FUNCTION create_user_tokens() IS 'Automatically creates initial token balance (50 tokens) for new users';
