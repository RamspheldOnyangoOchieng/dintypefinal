-- Update plan features and restrictions to match the exact requirements from the spreadsheet

-- Clear existing data
TRUNCATE TABLE plan_features CASCADE;
TRUNCATE TABLE plan_restrictions CASCADE;

-- Insert updated plan features with exact values from spreadsheet
INSERT INTO plan_features (feature_key, feature_name, description, category, free_value, premium_value, is_active, display_order) VALUES

-- Core Features
('text_messages', 'Text Messages', 'Daily message limit with AI companions', 'core', 
 '{"value": "10 messages/day", "limit": 10, "reset": "daily"}', 
 '{"value": "Unlimited", "limit": null}', 
 true, 1),

('ai_girlfriends', 'AI Girlfriends', 'Number of active and archived AI companions', 'content',
 '{"active": 1, "archived": 2, "display": "1 active, up to 2 archived"}',
 '{"active": 3, "archived": 50, "display": "3 active, up to 50 archived"}',
 true, 2),

('ai_girlfriend_creation', 'AI Girlfriend Creation', 'Customization options for creating AI companions', 'customization',
 '{"type": "basic", "bio_limit": 200, "avatar_limit": 1, "display": "Basic only: Name + 1 avatar URL + 200-char bio"}',
 '{"type": "unlimited", "bio_limit": null, "avatar_limit": null, "features": ["unlimited_bio", "multiple_avatars", "custom_prompts", "sliders", "fetishes", "memory", "voice"], "display": "Unlimited bio, multiple avatars, custom prompt templates, sliders, fetishes, memory, voice options"}',
 true, 3),

('image_generation', 'Image Generation', 'Generate images during conversations', 'content',
 '{"limit": 2, "period": "week", "watermark": true, "nsfw": "blurred", "display": "2 images per week, watermarked, NSFW blurred"}',
 '{"tokens": 100, "period": "month", "watermark": false, "nsfw": "allowed", "display": "100 tokens/month included (~20 images). Premium images = no watermark, NSFW allowed (not blurred)"}',
 true, 4),

('queue_priority', 'Queue Priority', 'Response speed priority in message queue', 'core',
 '{"priority": "lower", "display": "Slower (Lower Priority)"}',
 '{"priority": "high", "display": "High priority (fast responses)"}',
 true, 5),

('tokens', 'Tokens', 'Monthly token allocation for advanced features', 'content',
 '{"available": false, "display": "Not available"}',
 '{"amount": 100, "period": "month", "auto_credit": true, "display": "100/month auto-credit"}',
 true, 6),

('response_speed', 'Response Speed', 'AI response generation speed', 'core',
 '{"speed": "standard", "display": "Standard (slower)"}',
 '{"speed": "priority", "display": "Priority (faster)"}',
 true, 7),

('chat_history', 'Chat History', 'Chat history retention period', 'core',
 '{"days": 1, "display": "1 day"}',
 '{"days": null, "display": "Unlimited with subscribed"}',
 true, 8),

('support', 'Support', 'Customer support access level', 'support',
 '{"type": "email", "display": "Email support only"}',
 '{"type": "priority", "display": "Priority support"}',
 true, 9),

('early_access', 'Early Feature Access', 'Access to beta features', 'support',
 '{"enabled": false, "display": "No"}',
 '{"enabled": true, "display": "Yes"}',
 true, 10),

('customization', 'Customization', 'Advanced customization capabilities', 'customization',
 '{"level": "limited", "display": "Limited. Only name & avatar visible. No advanced sliders"}',
 '{"level": "full", "display": "Full customization options. Advanced sliders, fetishes, memory tweaks etc."}',
 true, 11);

-- Insert plan restrictions with exact values
INSERT INTO plan_restrictions (plan_type, restriction_key, restriction_value, description) VALUES

-- Free Plan Restrictions
('free', 'daily_message_limit', '10', 'Reset daily at 00:00 server time. Hard block after limit. → "Daily message limit reached. Upgrade to continue."'),
('free', 'active_girlfriends_limit', '1', 'Only 1 active girlfriend allowed. If user creates another, show error "Free plan allows 1 active girlfriend. Upgrade to create more." Inactive storage at 2 limit DB bloat.'),
('free', 'girlfriend_creation_basic', 'true', 'Basic only: Name + 1 avatar URL + 200-char bio'),
('free', 'girlfriend_creation_advanced', 'false', 'Prompt templates, sliders, fetishes, memory disabled. UI: Show locked → "Upgrade to unlock"'),
('free', 'image_generation_weekly', '2', 'Reset Sunday 00:00 server time. Hard block after limit'),
('free', 'image_watermark', 'true', 'Watermark on all generated images'),
('free', 'nsfw_blurred', 'true', 'NSFW content is blurred'),
('free', 'chat_history_days', '1', 'Chat history retained for 1 day only. Make sure it''s global reset (otherwise tracking gets messy). 24 hours retention then auto-delete older chats (cron job + inactive storage at 2 limit DB bloat)'),
('free', 'queue_priority', 'low', 'Lower priority in message queue'),
('free', 'tokens_available', 'false', 'Tokens not available for free users'),
('free', 'response_speed', 'standard', 'Standard response speed'),
('free', 'support_type', 'email', 'Email support only'),
('free', 'early_access', 'false', 'No early access to features'),
('free', 'beta_features', 'false', 'Beta features flag disabled'),
('free', 'customization_advanced', 'false', 'Advanced sliders, fetishes, memory etc.'),

-- Premium Plan Features
('premium', 'daily_message_limit', 'null', 'No daily/monthly cap'),
('premium', 'active_girlfriends_limit', '3', 'Up to 3 active companions simultaneously. If user tries to add a 4th, prompt "You''ve reached your active limit (3). Deactivate or upgrade to add more." Inactive storage at 2 limit DB bloat (cannot chat with reactivated)'),
('premium', 'inactive_girlfriends_limit', '50', 'Up to 50 inactive girlfriends stored. Cap Premium archives at girlfriends to 50'),
('premium', 'girlfriend_creation_unlimited', 'true', 'Unlimited bio, multiple avatars, custom prompt templates, sliders, fetishes, memory, voice options.'),
('premium', 'monthly_tokens', '100', '100 tokens/month included (~20 images)'),
('premium', 'tokens_purchasable', 'true', 'Extra tokens purchasable anytime. Unlimited while wallet visible anytime'),
('premium', 'image_watermark', 'false', 'No watermark on generated images'),
('premium', 'nsfw_allowed', 'true', 'NSFW content allowed and not blurred'),
('premium', 'chat_history_unlimited', 'true', 'Unlimited chat history. Frozen if cancelled, restored if reactivated (within 60 days of expiration)'),
('premium', 'queue_priority', 'high', 'High priority (fast responses). Assign requests to the priority queue (slower model response). Older chats are deleted nightly. 24 hours retention'),
('premium', 'response_speed', 'priority', 'Priority/faster response speed'),
('premium', 'support_type', 'priority', 'Priority support'),
('premium', 'early_access', 'true', 'Flag enabled → early betas, new features etc.'),
('premium', 'customization_full', 'true', 'Advanced sliders, fetishes, memory tweaks etc.');

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_plan_features_active_order ON plan_features(is_active, display_order);
CREATE INDEX IF NOT EXISTS idx_plan_restrictions_plan_key ON plan_restrictions(plan_type, restriction_key);

-- Add comments to tables
COMMENT ON TABLE plan_features IS 'Stores feature definitions for Free and Premium plans with display values';
COMMENT ON TABLE plan_restrictions IS 'Stores technical restrictions and limits for each plan type with implementation notes';
COMMENT ON COLUMN plan_features.free_value IS 'JSON object containing free plan feature configuration and display text';
COMMENT ON COLUMN plan_features.premium_value IS 'JSON object containing premium plan feature configuration and display text';
COMMENT ON COLUMN plan_restrictions.restriction_value IS 'Restriction value - can be number, boolean, string, or null for unlimited';
