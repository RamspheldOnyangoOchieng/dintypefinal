-- Migration: 20251114000001_chat_cleanup_job.sql
-- Description: Implement chat history cleanup for free users (24h retention)
-- and respect "Frozen" status for recently expired premium users (60 days).

-- 1. Create the cleanup function
CREATE OR REPLACE FUNCTION public.cleanup_free_user_chats()
RETURNS void AS $$
BEGIN
    -- Delete messages older than 24 hours for users who:
    -- 1. Are NOT currently premium
    -- 2. DO NOT have a premium profile that was active within the last 60 days (Frozen History rule)
    
    DELETE FROM public.messages
    WHERE created_at < NOW() - INTERVAL '1 day'
      AND user_id NOT IN (
        -- Exclude users with active or recently expired (within 60 days) premium profiles
        SELECT user_id 
        FROM public.premium_profiles 
        WHERE expires_at > NOW() - INTERVAL '60 days'
      );
      
    -- Also clean up message_usage_tracking older than 30 days to avoid bloat
    DELETE FROM public.message_usage_tracking
    WHERE date < CURRENT_DATE - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Schedule the cron job if pg_cron is available
-- NOTE: In some Supabase environments, pg_cron might need to be enabled in settings first.
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
        -- Schedule to run daily at 00:00
        PERFORM cron.schedule(
            'cleanup-free-chats',
            '0 0 * * *',
            'SELECT public.cleanup_free_user_chats();'
        );
    END IF;
END $$;
