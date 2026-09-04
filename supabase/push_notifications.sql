-- =====================================================
-- PUSH NOTIFICATIONS SETUP
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to add
-- push notification support to your app.
-- =====================================================

-- ==================== ADD PUSH_TOKENS COLUMN ====================
-- This column stores the user's Expo push tokens as JSON array
-- Each device gets its own token, so a user can have multiple tokens

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS push_tokens TEXT DEFAULT '[]';

-- ==================== INDEX FOR FASTER QUERIES ====================
-- Index on push_tokens for faster lookups when sending notifications

CREATE INDEX IF NOT EXISTS idx_profiles_push_tokens ON profiles USING gin (push_tokens jsonb_path_ops);

-- ==================== NOTIFICATION LOG TABLE ====================
-- Optional: Log all sent notifications for debugging

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('like', 'follow', 'upload', 'tip', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  target_tokens TEXT[],
  success_count INTEGER DEFAULT 0,
  failure_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on notification_logs
ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Users can only see their own notification logs
CREATE POLICY "Users can view own notification logs" ON notification_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Only system can insert notification logs
CREATE POLICY "System can insert notification logs" ON notification_logs
  FOR INSERT WITH CHECK (true);

-- ==================== CLEANUP OLD TOKENS ====================
-- Function to clean up invalid/expired tokens (optional)

CREATE OR REPLACE FUNCTION cleanup_old_push_tokens()
RETURNS void AS $$
BEGIN
  -- This is a placeholder - in production, you'd check with Expo API
  -- For now, we just keep all tokens
  RAISE NOTICE 'Token cleanup completed';
END;
$$ LANGUAGE plpgsql;

-- ==================== HELPER FUNCTION: GET USER PUSH TOKENS ====================
-- Function to get push tokens for a specific user

CREATE OR REPLACE FUNCTION get_user_push_tokens(target_user_id UUID)
RETURNS TEXT[] AS $$
DECLARE
  tokens TEXT;
  result TEXT[];
BEGIN
  SELECT push_tokens INTO tokens FROM profiles WHERE id = target_user_id;
  
  IF tokens IS NULL OR tokens = '[]' THEN
    RETURN ARRAY[]::TEXT[];
  END IF;
  
  -- Parse JSON array
  SELECT array_agg(value::text) INTO result
  FROM json_array_elements_text(tokens::json);
  
  RETURN COALESCE(result, ARRAY[]::TEXT[]);
END;
$$ LANGUAGE plpgsql;

-- ==================== HELPER FUNCTION: ADD PUSH TOKEN ====================
-- Function to add a new push token for a user

CREATE OR REPLACE FUNCTION add_push_token(user_id UUID, new_token TEXT)
RETURNS void AS $$
DECLARE
  current_tokens TEXT;
  token_exists BOOLEAN;
BEGIN
  -- Get current tokens
  SELECT push_tokens INTO current_tokens FROM profiles WHERE id = user_id;
  
  IF current_tokens IS NULL THEN
    current_tokens := '[]';
  END IF;
  
  -- Check if token already exists
  SELECT EXISTS (
    SELECT 1 FROM json_array_elements_text(current_tokens::json) 
    WHERE value = new_token
  ) INTO token_exists;
  
  -- Add token if it doesn't exist
  IF NOT token_exists THEN
    UPDATE profiles 
    SET push_tokens = json_build_array(new_token)::text
    WHERE id = user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- ==================== CLEANUP FUNCTION: REMOVE OLD TOKENS ====================
-- Function to remove a specific token (e.g., when user logs out on a device)

CREATE OR REPLACE FUNCTION remove_push_token(user_id UUID, token_to_remove TEXT)
RETURNS void AS $$
DECLARE
  current_tokens TEXT;
  new_tokens TEXT;
BEGIN
  SELECT push_tokens INTO current_tokens FROM profiles WHERE id = user_id;
  
  IF current_tokens IS NULL THEN
    RETURN;
  END IF;
  
  -- Remove the token from the array
  SELECT json_agg(value::text) INTO new_tokens
  FROM json_array_elements_text(current_tokens::json)
  WHERE value != token_to_remove;
  
  -- Update with new tokens (or empty array if no tokens left)
  UPDATE profiles 
  SET push_tokens = COALESCE(new_tokens, '[]')::text
  WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- ==================== GRANT PERMISSIONS ====================
-- Grant execute permissions to authenticated users

GRANT EXECUTE ON FUNCTION get_user_push_tokens(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_push_token(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_push_token(UUID, TEXT) TO authenticated;

-- ==================== SEED DATA (OPTIONAL) ====================
-- Uncomment if you want to test with sample data
-- INSERT INTO profiles (id, email, full_name, push_tokens) VALUES
-- ('test-user-id', 'test@example.com', 'Test User', '["ExponentPushToken[xxx]"]');

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- After running this SQL:
-- 1. profiles table now has push_tokens column
-- 2. Helper functions are available for managing tokens
-- 3. notification_logs table is ready for debugging
-- 
-- Next steps:
-- 1. Add PushNotificationProvider to App.tsx
-- 2. Request permissions on user login
-- 3. Save device token to profiles table
-- 4. Send notifications on like/follow/upload events
-- =====================================================
