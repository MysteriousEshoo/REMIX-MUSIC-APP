-- =====================================================
-- COINS SYSTEM SETUP
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to add
-- coins system to your app.
-- =====================================================

-- ==================== COINS TABLE ====================
-- Stores user coin balance

CREATE TABLE IF NOT EXISTS coins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE UNIQUE,
  balance INTEGER DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER DEFAULT 0,
  total_spent INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coins ENABLE ROW LEVEL SECURITY;

-- Users can read their own coin balance
CREATE POLICY "Users can view own coins" ON coins
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert/update coins
CREATE POLICY "System can manage coins" ON coins
  FOR ALL USING (true);

-- ==================== COIN TRANSACTIONS TABLE ====================
-- Tracks all coin transactions (earn/spend)

CREATE TABLE IF NOT EXISTS coin_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'tip_received', 'tip_sent')),
  amount INTEGER NOT NULL CHECK (amount > 0),
  description TEXT NOT NULL,
  reference_id UUID, -- song_id for play, user_id for tip
  reference_type TEXT, -- 'song', 'tip', 'purchase'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE coin_transactions ENABLE ROW LEVEL SECURITY;

-- Users can view their own transactions
CREATE POLICY "Users can view own transactions" ON coin_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- System can insert transactions
CREATE POLICY "System can insert transactions" ON coin_transactions
  FOR INSERT WITH CHECK (true);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_coin_transactions_user_id ON coin_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_created_at ON coin_transactions(created_at DESC);

-- ==================== EARN COINS FUNCTION ====================
-- Call this when user plays a song (1 coin per play)

CREATE OR REPLACE FUNCTION earn_coins_for_play(
  p_user_id UUID,
  p_song_id UUID
)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
  v_already_earned BOOLEAN;
BEGIN
  -- Check if user already earned coins for this song today
  SELECT EXISTS (
    SELECT 1 FROM coin_transactions
    WHERE user_id = p_user_id
      AND reference_id = p_song_id
      AND type = 'earn'
      AND reference_type = 'play'
      AND created_at > NOW() - INTERVAL '24 hours'
  ) INTO v_already_earned;

  -- Don't earn coins for same song within 24 hours
  IF v_already_earned THEN
    SELECT balance INTO v_balance FROM coins WHERE user_id = p_user_id;
    RETURN COALESCE(v_balance, 0);
  END IF;

  -- Insert or update coins balance
  INSERT INTO coins (user_id, balance, total_earned)
  VALUES (p_user_id, 1, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = coins.balance + 1,
    total_earned = coins.total_earned + 1,
    updated_at = NOW();

  -- Record transaction
  INSERT INTO coin_transactions (user_id, type, amount, description, reference_id, reference_type)
  VALUES (p_user_id, 'earn', 1, 'Played a song', p_song_id, 'play');

  -- Get new balance
  SELECT balance INTO v_balance FROM coins WHERE user_id = p_user_id;
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== SEND TIP FUNCTION ====================
-- Call this when user tips a DJ

CREATE OR REPLACE FUNCTION send_tip(
  p_sender_id UUID,
  p_receiver_id UUID,
  p_amount INTEGER
)
RETURNS JSONB AS $$
DECLARE
  v_sender_balance INTEGER;
  v_result JSONB;
BEGIN
  -- Validate amount
  IF p_amount <= 0 THEN
    RETURN jsonb_build_object('success', false, 'error', 'Invalid amount');
  END IF;

  -- Check sender has enough coins
  SELECT balance INTO v_sender_balance FROM coins WHERE user_id = p_sender_id;
  
  IF COALESCE(v_sender_balance, 0) < p_amount THEN
    RETURN jsonb_build_object('success', false, 'error', 'Insufficient coins');
  END IF;

  -- Can't tip yourself
  IF p_sender_id = p_receiver_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'Cannot tip yourself');
  END IF;

  -- Deduct from sender
  UPDATE coins SET
    balance = balance - p_amount,
    total_spent = total_spent + p_amount,
    updated_at = NOW()
  WHERE user_id = p_sender_id;

  -- Add to receiver
  INSERT INTO coins (user_id, balance, total_earned)
  VALUES (p_receiver_id, p_amount, p_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = coins.balance + p_amount,
    total_earned = coins.total_earned + p_amount,
    updated_at = NOW();

  -- Record sender transaction
  INSERT INTO coin_transactions (user_id, type, amount, description, reference_id, reference_type)
  VALUES (p_sender_id, 'tip_sent', p_amount, 'Tipped a DJ', p_receiver_id, 'tip');

  -- Record receiver transaction
  INSERT INTO coin_transactions (user_id, type, amount, description, reference_id, reference_type)
  VALUES (p_receiver_id, 'tip_received', p_amount, 'Received a tip', p_sender_id, 'tip');

  -- Return new balances
  SELECT jsonb_build_object(
    'success', true,
    'sender_balance', (SELECT balance FROM coins WHERE user_id = p_sender_id),
    'receiver_balance', (SELECT balance FROM coins WHERE user_id = p_receiver_id)
  ) INTO v_result;

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== GET USER BALANCE FUNCTION ====================

CREATE OR REPLACE FUNCTION get_user_coin_balance(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_balance INTEGER;
BEGIN
  SELECT balance INTO v_balance FROM coins WHERE user_id = p_user_id;
  RETURN COALESCE(v_balance, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== GET USER TRANSACTIONS FUNCTION ====================

CREATE OR REPLACE FUNCTION get_user_transactions(
  p_user_id UUID,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  type TEXT,
  amount INTEGER,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ct.id,
    ct.type,
    ct.amount,
    ct.description,
    ct.created_at
  FROM coin_transactions ct
  WHERE ct.user_id = p_user_id
  ORDER BY ct.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_coins_user_id ON coins(user_id);
CREATE INDEX IF NOT EXISTS idx_coin_transactions_reference ON coin_transactions(reference_id, reference_type);

-- ==================== GRANT PERMISSIONS ====================

GRANT EXECUTE ON FUNCTION earn_coins_for_play(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION send_tip(UUID, UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_coin_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_transactions(UUID, INTEGER) TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- After running this SQL:
-- 1. coins table stores user balances
-- 2. coin_transactions tracks all earn/spend
-- 3. earn_coins_for_play() — 1 coin per song (24h cooldown)
-- 4. send_tip() — Transfer coins to DJ
-- 5. get_user_coin_balance() — Get current balance
-- 6. get_user_transactions() — Get transaction history
-- =====================================================
