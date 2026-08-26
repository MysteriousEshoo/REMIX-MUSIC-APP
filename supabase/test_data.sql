-- ==================== TEST DATA ====================
-- Ye SQL run karo agar songs table empty hai

INSERT INTO songs (id, title, artist, genre, duration, cover_image, plays_count, uploaded_by, is_exclusive)
VALUES 
  (gen_random_uuid(), 'Late Night Frequencies Vol. 12', 'DJ Shadow', 'Electronic', 3840, 'https://picsum.photos/seed/mix1/400/400', 245000, 'dj1', true),
  (gen_random_uuid(), 'Purified Radio 189', 'Nora En Pure', 'Deep House', 3600, 'https://picsum.photos/seed/mix2/400/400', 567000, 'dj2', false),
  (gen_random_uuid(), 'Aura Warehouse Set', 'Amelie Lens', 'Techno', 5400, 'https://picsum.photos/seed/mix5/400/400', 678000, 'dj5', true),
  (gen_random_uuid(), 'K-Juice Mixtape #45', 'Peggy Gou', 'House', 2700, 'https://picsum.photos/seed/mix4/400/400', 423000, 'dj4', false),
  (gen_random_uuid(), 'Losing It Remix Collection', 'Fisher', 'Tech House', 3200, 'https://picsum.photos/seed/mix7/400/400', 1200000, 'dj7', false);
