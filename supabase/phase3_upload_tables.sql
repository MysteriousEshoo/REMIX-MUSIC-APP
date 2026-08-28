-- ==================== PHASE 3: UPLOAD FEATURE ====================
-- Audio upload ke liye songs table mein naye columns add karo

ALTER TABLE songs ADD COLUMN IF NOT EXISTS audio_url TEXT;
ALTER TABLE songs ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS cover_image TEXT DEFAULT '';
ALTER TABLE songs ADD COLUMN IF NOT EXISTS duration INTEGER DEFAULT 0;

-- Ensure RLS policies allow creators to insert their own songs
DROP POLICY IF EXISTS "Creators can insert own songs" ON songs;
CREATE POLICY "Creators can insert own songs" ON songs
  FOR INSERT WITH CHECK (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Creators can update own songs" ON songs;
CREATE POLICY "Creators can update own songs" ON songs
  FOR UPDATE USING (auth.uid() = uploaded_by);

DROP POLICY IF EXISTS "Creators can delete own songs" ON songs;
CREATE POLICY "Creators can delete own songs" ON songs
  FOR DELETE USING (auth.uid() = uploaded_by);

-- Everyone can read songs (public content)
DROP POLICY IF EXISTS "Anyone can read songs" ON songs;
CREATE POLICY "Anyone can read songs" ON songs
  FOR SELECT USING (true);

-- Storage bucket policies
-- Run this in Supabase Dashboard > Storage > Create Bucket:
-- Bucket name: remix-uploads
-- Public: true (ya false depending on auth needs)

-- If bucket doesn't exist, create it via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'remix-uploads',
  'remix-uploads',
  true,
  524288000,  -- 500MB limit
  ARRAY['audio/mpeg', 'audio/wav', 'audio/flac', 'audio/aac', 'audio/mp4', 'audio/x-m4a', 'image/jpeg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies
DROP POLICY IF EXISTS "Authenticated users can upload" ON storage.objects;
CREATE POLICY "Authenticated users can upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'remix-uploads'
    AND auth.role() = 'authenticated'
  );

DROP POLICY IF EXISTS "Anyone can view uploads" ON storage.objects;
CREATE POLICY "Anyone can view uploads" ON storage.objects
  FOR SELECT USING (bucket_id = 'remix-uploads');

DROP POLICY IF EXISTS "Users can delete own uploads" ON storage.objects;
CREATE POLICY "Users can delete own uploads" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'remix-uploads'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
