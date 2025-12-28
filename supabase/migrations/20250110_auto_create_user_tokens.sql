-- Function to create initial token balance for new users
CREATE OR REPLACE FUNCTION create_user_tokens()
RETURNS TRIGGER AS $$
BEGIN
  -- New users start with 0 tokens
  INSERT INTO user_tokens (user_id, balance, created_at, updated_at)
  VALUES (NEW.id, 0, NOW(), NOW())
  ON CONFLICT (user_id) DO NOTHING;
  
  -- Welcome bonus log removed as per user request
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically create tokens when user signs up
DROP TRIGGER IF EXISTS on_auth_user_created_tokens ON auth.users;
CREATE TRIGGER on_auth_user_created_tokens
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_tokens();

COMMENT ON FUNCTION create_user_tokens() IS 'Automatically creates initial token balance (0 tokens) for new users';
