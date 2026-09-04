-- =====================================================
-- PLAYLISTS SYSTEM SETUP
-- =====================================================
-- Run this SQL in your Supabase SQL Editor to add
-- full playlist CRUD support to your app.
-- =====================================================

-- ==================== PLAYLISTS TABLE ====================

CREATE TABLE IF NOT EXISTS playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  cover_image TEXT,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

-- Users can view their own playlists
CREATE POLICY "Users can view own playlists" ON playlists
  FOR SELECT USING (auth.uid() = user_id);

-- Users can view public playlists
CREATE POLICY "Users can view public playlists" ON playlists
  FOR SELECT USING (is_public = true);

-- Users can create playlists
CREATE POLICY "Users can create playlists" ON playlists
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own playlists
CREATE POLICY "Users can update own playlists" ON playlists
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can delete their own playlists
CREATE POLICY "Users can delete own playlists" ON playlists
  FOR DELETE USING (auth.uid() = user_id);

-- ==================== PLAYLIST_SONGS TABLE ====================

CREATE TABLE IF NOT EXISTS playlist_songs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID REFERENCES playlists(id) ON DELETE CASCADE,
  song_id UUID REFERENCES songs(id) ON DELETE CASCADE,
  position INTEGER DEFAULT 0,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(playlist_id, song_id)
);

-- Enable RLS
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

-- Users can view songs in their own playlists
CREATE POLICY "Users can view own playlist songs" ON playlist_songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
        AND playlists.user_id = auth.uid()
    )
  );

-- Users can view songs in public playlists
CREATE POLICY "Users can view public playlist songs" ON playlist_songs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
        AND playlists.is_public = true
    )
  );

-- Users can add songs to their own playlists
CREATE POLICY "Users can add songs to own playlists" ON playlist_songs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
        AND playlists.user_id = auth.uid()
    )
  );

-- Users can remove songs from their own playlists
CREATE POLICY "Users can remove songs from own playlists" ON playlist_songs
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
        AND playlists.user_id = auth.uid()
    )
  );

-- Users can update song positions in their own playlists
CREATE POLICY "Users can update own playlist songs" ON playlist_songs
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM playlists
      WHERE playlists.id = playlist_songs.playlist_id
        AND playlists.user_id = auth.uid()
    )
  );

-- ==================== INDEXES ====================

CREATE INDEX IF NOT EXISTS idx_playlists_user_id ON playlists(user_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist_id ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_song_id ON playlist_songs(song_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_position ON playlist_songs(playlist_id, position);

-- ==================== HELPER FUNCTIONS ====================

-- Get playlist with song count
CREATE OR REPLACE FUNCTION get_playlist_with_count(p_playlist_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_playlist JSONB;
  v_song_count INTEGER;
BEGIN
  -- Get playlist info
  SELECT to_jsonb(p.*) INTO v_playlist
  FROM playlists p
  WHERE p.id = p_playlist_id;

  -- Get song count
  SELECT COUNT(*) INTO v_song_count
  FROM playlist_songs ps
  WHERE ps.playlist_id = p_playlist_id;

  -- Add song count to playlist
  v_playlist := v_playlist || jsonb_build_object('song_count', v_song_count);

  RETURN v_playlist;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add song to playlist (with duplicate check)
CREATE OR REPLACE FUNCTION add_song_to_playlist(
  p_playlist_id UUID,
  p_song_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
  v_max_position INTEGER;
  v_exists BOOLEAN;
BEGIN
  -- Check if song already exists in playlist
  SELECT EXISTS (
    SELECT 1 FROM playlist_songs
    WHERE playlist_id = p_playlist_id AND song_id = p_song_id
  ) INTO v_exists;

  IF v_exists THEN
    RETURN false;
  END IF;

  -- Get max position
  SELECT COALESCE(MAX(position), -1) + 1 INTO v_max_position
  FROM playlist_songs
  WHERE playlist_id = p_playlist_id;

  -- Insert song
  INSERT INTO playlist_songs (playlist_id, song_id, position)
  VALUES (p_playlist_id, p_song_id, v_max_position);

  -- Update playlist timestamp
  UPDATE playlists SET updated_at = NOW() WHERE id = p_playlist_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Remove song from playlist
CREATE OR REPLACE FUNCTION remove_song_from_playlist(
  p_playlist_id UUID,
  p_song_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  DELETE FROM playlist_songs
  WHERE playlist_id = p_playlist_id AND song_id = p_song_id;

  -- Update playlist timestamp
  UPDATE playlists SET updated_at = NOW() WHERE id = p_playlist_id;

  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Reorder songs in playlist
CREATE OR REPLACE FUNCTION reorder_playlist_songs(
  p_playlist_id UUID,
  p_from_position INTEGER,
  p_to_position INTEGER
)
RETURNS void AS $$
BEGIN
  IF p_from_position < p_to_position THEN
    -- Moving down: shift songs up
    UPDATE playlist_songs
    SET position = position - 1
    WHERE playlist_id = p_playlist_id
      AND position > p_from_position
      AND position <= p_to_position;
  ELSIF p_from_position > p_to_position THEN
    -- Moving up: shift songs down
    UPDATE playlist_songs
    SET position = position + 1
    WHERE playlist_id = p_playlist_id
      AND position >= p_to_position
      AND position < p_from_position;
  END IF;

  -- Set new position for the moved song
  UPDATE playlist_songs
  SET position = p_to_position
  WHERE playlist_id = p_playlist_id
    AND position = p_from_position;

  -- Update playlist timestamp
  UPDATE playlists SET updated_at = NOW() WHERE id = p_playlist_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Get user's playlists with song counts
CREATE OR REPLACE FUNCTION get_user_playlists(p_user_id UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  cover_image TEXT,
  is_public BOOLEAN,
  song_count BIGINT,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id,
    p.name,
    p.description,
    p.cover_image,
    p.is_public,
    COUNT(ps.id) as song_count,
    p.created_at,
    p.updated_at
  FROM playlists p
  LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id
  WHERE p.user_id = p_user_id
  GROUP BY p.id
  ORDER BY p.updated_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================== GRANT PERMISSIONS ====================

GRANT EXECUTE ON FUNCTION get_playlist_with_count(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_song_to_playlist(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_song_from_playlist(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION reorder_playlist_songs(UUID, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_playlists(UUID) TO authenticated;

-- =====================================================
-- SETUP COMPLETE!
-- =====================================================
-- After running this SQL:
-- 1. playlists table stores user playlists
-- 2. playlist_songs junction table with positions
-- 3. RLS policies for CRUD operations
-- 4. Helper functions for add/remove/reorder
-- 5. get_user_playlists() returns playlists with song counts
-- =====================================================
