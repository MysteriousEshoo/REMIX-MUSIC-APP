-- ==================== FIX: user_likes foreign key constraint ====================
-- Problem: user_likes.user_id profiles table ko reference kar raha hai
-- Fix: Drop old constraint, auth.users ko reference karo

-- Step 1: Purana foreign key constraint drop karo
ALTER TABLE user_likes DROP CONSTRAINT IF EXISTS user_likes_user_id_fkey;

-- Step 2: Naya foreign key auth.users pe lagao
ALTER TABLE user_likes ADD CONSTRAINT user_likes_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Step 3: Verify — ye query chalao aur dekho ki constraint sahi hai
SELECT 
  tc.constraint_name, 
  tc.table_name, 
  kcu.column_name, 
  ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_name = 'user_likes_user_id_fkey';

-- DONE! Ab like/unlike kaam karega ✅
