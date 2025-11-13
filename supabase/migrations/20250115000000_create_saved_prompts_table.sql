-- Create saved_prompts table if it doesn't exist
CREATE TABLE IF NOT EXISTS saved_prompts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  prompt TEXT NOT NULL,
  character_id UUID REFERENCES characters(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_favorite BOOLEAN DEFAULT FALSE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS saved_prompts_user_id_idx ON saved_prompts(user_id);
CREATE INDEX IF NOT EXISTS saved_prompts_character_id_idx ON saved_prompts(character_id);

-- Enable Row Level Security
ALTER TABLE saved_prompts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own saved prompts" ON saved_prompts FOR SELECT USING (auth.uid()::text = user_id);
CREATE POLICY "Users can insert their own saved prompts" ON saved_prompts FOR INSERT WITH CHECK (auth.uid()::text = user_id);
CREATE POLICY "Users can update their own saved prompts" ON saved_prompts FOR UPDATE USING (auth.uid()::text = user_id);
CREATE POLICY "Users can delete their own saved prompts" ON saved_prompts FOR DELETE USING (auth.uid()::text = user_id);
