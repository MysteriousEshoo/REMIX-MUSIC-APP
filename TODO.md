# 🎵 ReMix App — Project TODO

## 📅 Last Updated: August 29, 2026

---

## ✅ COMPLETED WORK

### Phase 0: Project Setup ✅
- [x] Expo + React Native project setup
- [x] Navigation (Tab + Stack) configured
- [x] Theme system (Colors, Typography, Spacing)
- [x] Reusable components (10 components built)
- [x] All screens built (16 screens)

### Phase 1: Backend Integration ✅ (August 22, 2026)
- [x] Supabase SDK installed and configured
- [x] `src/config/supabase.ts` — Client setup
- [x] `src/contexts/AuthContext.tsx` — Auth state management
- [x] `src/utils/authErrors.ts` — Friendly error messages
- [x] Login screen connected to Supabase Auth
- [x] Signup screen connected to Supabase Auth
- [x] Forgot Password connected to Supabase
- [x] ProfileScreen — fetches user data from DB
- [x] SearchScreen — searches in database
- [x] AppNavigator — AuthProvider + auth-based routing
- [x] `.env.local` — Supabase keys configured
- [x] `eas.json` — APK build config added

### Phase 2: Features ✅ (August 26-27, 2026)
- [x] Like/Unlike songs — `useLikeSong` hook, Supabase `user_likes` table
- [x] Follow/Unfollow DJs — `useFollowDJ` hook, Supabase `user_follows` table
- [x] Notifications — Supabase `notifications` table, mark read, delete, select mode
- [x] Creator/Listener mode — Properly separated with different UIs
- [x] Creator Home — Stats Dashboard, Upload Button, Your Uploads, Earnings
- [x] Creator Library — My Uploads (DB), Playlists, Drafts tabs
- [x] DJProfile — Follow button connected to `useFollowDJ` hook
- [x] Creator Dashboard — Real Supabase data (plays, followers, coins, earnings)
- [x] **Mock Data Removed** — All screens now fetch ONLY from database
- [x] Empty states added for all screens (no more fake data)

### Phase 3: Audio Player ✅ (August 27, 2026)
- [x] `useAudioPlayer` hook — Basic audio playback with expo-av
- [x] **AudioContext** — Global audio state management (`src/contexts/AudioContext.tsx`)
- [x] **MiniPlayer** — Compact player on tab screens (`src/components/MiniPlayer.tsx`)
- [x] **Queue Management** — Next/Previous song support
- [x] PlayerScreen updated with AudioContext
- [x] Queue list UI in PlayerScreen (Up Next section)
- [x] HomeScreen sets queue when song is played
- [x] LibraryScreen sets queue when song is played

### Phase 4: Notifications ✅ (August 26, 2026)
- [x] NotificationsScreen — Real data from Supabase
- [x] Mark as read functionality
- [x] Delete notifications
- [x] Select mode for bulk actions
- [x] Notification badge on HomeScreen

### Phase 5: Upload Screen ✅ (August 28, 2026)
- [x] `expo-document-picker` installed for audio file selection
- [x] `expo-image-picker` installed for cover image selection
- [x] Audio file uploads to Supabase Storage `remix-uploads` bucket
- [x] Cover image uploads to Supabase Storage
- [x] Song metadata (title, genre, description) saved to `songs` table
- [x] Real upload progress indicator with step-by-step status
- [x] Error handling with retry support
- [x] `supabase/phase3_upload_tables.sql` — RLS policies + storage bucket setup
- [x] `audio_url` and `description` columns added to songs table
- [x] **Mix interface** updated with `audioUrl` and `description` fields
- [x] **PlayerScreen** now uses real `audio_url` from database (fixed mock URL bug)
- [x] **All screens** (Home, Library, Search, DJProfile) pass `audioUrl` from DB

### Phase 6: Background Audio ✅ (August 28, 2026)
- [x] Audio continues when app goes to background (`staysActiveInBackground`)
- [x] Audio controls in notification shade (Android)
- [x] Lock screen controls (iOS + Android)
- [x] `Audio.setIsEnabledAsync(true)` on app init
- [x] Auto-play next song when current ends
- [x] `app.json` — iOS `UIBackgroundModes: ["audio"]` added
- [x] `expo-av` plugin added to app.json

### Phase 7: Queue UI Improvements ✅ (August 28, 2026)
- [x] Swipe left to delete song from queue
- [x] Drag-and-drop to reorder songs in queue
- [x] `reorderQueue` method added to AudioContext
- [x] Drag handle icon on each queue item
- [x] Visual feedback during drag (scale + elevation)
- [x] currentIndex properly updates after reorder
- [x] Queue wrapped in `GestureHandlerRootView`
- [x] Queue hint text added ("Drag to reorder • Swipe left to delete")

### Phase 8: HomeScreen Bug Fixes ✅ (August 28, 2026)
- [x] **Top DJs** — Now fetched from DB (real users who uploaded songs, sorted by plays)
- [x] **Trending** — Now sorted by `plays_count DESC` (was random slice)
- [x] **New Releases** — Now sorted by `created_at DESC` (was random slice)
- [x] **Because You Liked** — Now based on user's actual liked genres (was fake)
- [x] **Mock data fallback removed** — Empty states shown instead of fake songs
- [x] **Like revert on error** — UI reverts if Supabase like fails
- [x] **Like updates all lists** — Trending, New Releases, Recommended all update together

### Phase 9: Push Notifications ✅ (August 29, 2026)
- [x] `expo-notifications` package installed
- [x] `src/contexts/PushNotificationContext.tsx` — Global push notification state
- [x] `src/utils/notifications.ts` — Helper functions for sending notifications
- [x] `app.json` — Android notification channel + iOS entitlements configured
- [x] Device token saved to Supabase `profiles.push_tokens` on login
- [x] `supabase/push_notifications.sql` — SQL for push_tokens column + helper functions
- [x] **Like notification** — When user likes song, owner gets notified
- [x] **Follow notification** — When user follows DJ, DJ gets notified
- [x] **Upload notification** — When DJ uploads song, all followers get notified
- [x] **Notification tap handler** — Deep linking support for song/DJ profile
- [x] **Android notification channels** — Default + Song Uploads channel
- [x] `AppNavigator.tsx` — PushNotificationProvider added inside AuthProvider

---

## 🔜 PENDING WORK (August 29, 2026)

### Priority 1: Push Notifications Polish 🟡 MEDIUM
- [ ] Add notification tap deep linking in AppNavigator
- [ ] Update HomeScreen notification badge with real-time Supabase subscription
- [ ] Add notification settings screen (enable/disable by type)
- [ ] Test on real devices (iOS + Android)

### Priority 2: Coins System ✅ (August 29, 2026)
- [x] Create `coins` table in Supabase
- [x] Coins earn logic (listening rewards — 1 coin per song played)
- [x] Coins spend logic (tips to DJs, boost songs)
- [x] Coins balance in Creator Dashboard (real data from DB)
- [x] Tip button on PlayerScreen → deduct coins, notify DJ
- [x] `src/contexts/CoinsContext.tsx` — Global coins state management
- [x] `supabase/coins_system.sql` — SQL for coins + transactions tables

### Priority 3: Playlist CRUD ✅ (August 29, 2026)
- [x] Create playlist from Library screen
- [x] Add songs to playlist from PlayerScreen
- [x] Remove songs from playlist
- [x] Delete playlist
- [x] Playlist detail screen with song list
- [x] `src/contexts/PlaylistContext.tsx` — Global playlist state management
- [x] `supabase/playlists.sql` — SQL for playlists + playlist_songs tables

### Priority 4: Queue Persistence 🟡 MEDIUM
- [ ] Save current queue to AsyncStorage when app goes to background
- [ ] Restore queue on app restart
- [ ] Remember last played song and position

### Priority 5: Payments & Subscriptions 🔴 HIGH
- [ ] Stripe integration for premium subscriptions
- [ ] Listener Plus ($6.99/month) — ad-free, downloads, hi-fi
- [ ] Creator Pro ($14.99/month) — unlimited uploads, analytics
- [ ] Revenue management for creators

### Priority 6: Search Improvements 🟠 LOW
- [ ] Search by DJ name from `profiles` table
- [ ] Search history with timestamps
- [ ] Trending searches
- [ ] Voice search

### Priority 7: Offline Mode 🟠 LOW
- [ ] Download songs for offline listening
- [ ] Storage management in Settings
- [ ] Download indicator on song cards

### Priority 8: Polish & Launch ⚪ FINAL
- [ ] Performance optimization (FlatList, image caching)
- [ ] App Store screenshots and descriptions
- [ ] Production email verification ON
- [ ] Security audit
- [ ] EAS Production build

---

## 📊 Progress

```
Phase 0: Setup          ████████████████████ 100% ✅
Phase 1: Backend        ████████████████████ 100% ✅
Phase 2: Features       ████████████████████ 100% ✅
Phase 3: Audio Player   ████████████████████ 100% ✅
Phase 4: Notifications  ████████████████████ 100% ✅
Phase 5: Upload Screen  ████████████████████ 100% ✅
Phase 6: Background     ████████████████████ 100% ✅
Phase 7: Queue UI       ████████████████████ 100% ✅
Phase 8: HomeScreen Fix ████████████████████ 100% ✅
Phase 9: Push Notifs    ████████████████████ 100% ✅
Phase 10: Coins         ████████████████████ 100% ✅
Phase 11: Playlists     ████████████████████ 100% ✅
Phase 12: Payments      ░░░░░░░░░░░░░░░░░░░░   0%
Phase 13: Polish        ░░░░░░░░░░░░░░░░░░░░   0%

Overall: ~95% Complete
```

---

## 📁 Key Files

### Contexts
- `src/contexts/AuthContext.tsx` — Authentication state
- `src/contexts/AudioContext.tsx` — Audio player + Queue + Background + Lock screen
- `src/contexts/PushNotificationContext.tsx` — Push notifications + device tokens
- `src/contexts/CoinsContext.tsx` — Coins balance + earn/spend/tip logic
- `src/contexts/PlaylistContext.tsx` — Playlists CRUD + add/remove songs

### Hooks
- `src/hooks/useLikeSong.ts` — Like/Unlike songs (sends notification)
- `src/hooks/useFollowDJ.ts` — Follow/Unfollow DJs (sends notification)
- `src/hooks/useAudioPlayer.ts` — Basic audio player

### Components
- `src/components/MiniPlayer.tsx` — Compact player bar
- `src/components/MixCard.tsx` — Song card component
- `src/components/DJCard.tsx` — DJ card component

### Utils
- `src/utils/notifications.ts` — Push notification helpers (like, follow, upload, tip)
- `src/utils/haptics.ts` — Haptic feedback
- `src/utils/authErrors.ts` — Auth error messages

### SQL Files
- `supabase/phase2_tables.sql` — Likes, follows, notifications, songs columns
- `supabase/phase3_upload_tables.sql` — Upload: RLS policies, storage bucket
- `supabase/push_notifications.sql` — Push tokens column + helper functions
- `supabase/coins_system.sql` — Coins + transactions tables + earn/spend functions
- `supabase/playlists.sql` — Playlists + playlist_songs tables with RLS

### Packages
- `expo-notifications` — Push notifications (FCM + APNs)
- `expo-document-picker` — Audio file selection
- `expo-image-picker` — Cover image selection
- `react-native-gesture-handler` — Swipe + Drag-drop in queue
- `expo-av` — Audio playback + background + lock screen

### Screens Updated
- `src/screens/main/HomeScreen.tsx` — DB-sourced trending, new releases, top DJs, recommendations, real coins
- `src/screens/main/LibraryScreen.tsx` — Queue support, creator mode, playlists tab
- `src/screens/main/SearchScreen.tsx` — DB search, no mock data
- `src/screens/main/PlaylistScreen.tsx` — Full CRUD: create, add/remove songs, delete
- `src/screens/player/PlayerScreen.tsx` — Queue UI + tip modal + coin earning + add to playlist
- `src/screens/dj/DJProfileScreen.tsx` — Follow hook, real songs from DB
- `src/screens/dj/CreatorDashboardScreen.tsx` — Real Supabase analytics + real coins balance
- `src/screens/dj/UploadScreen.tsx` — Real Supabase Storage upload + follower notifications

---

## 🔑 Important Info

### Supabase Project
- **URL:** https://foedmmpuojcrbesldvyk.supabase.co
- **Dashboard:** https://supabase.com/dashboard/project/foedmmpuojcrbesldvyk

### Database Tables
- `profiles` — User profiles (with `push_tokens` column)
- `songs` — Music tracks (with `audio_url`, `description`)
- `playlists` — User playlists
- `playlist_songs` — Playlist-song junction
- `user_likes` — User likes
- `user_follows` — User follows DJs
- `notifications` — User notifications (in-app)
- `coins` — User coin balances
- `coin_transactions` — All coin earn/spend transactions

### Storage Buckets
- `remix-uploads` — Audio files + cover images (500MB limit, public read)

### Build
- **EAS Build:** `eas build --platform android --profile preview`
- **APK Type:** Debug (for testing)

---

## 💡 Notes
- Email verification is OFF for development (turn ON for production)
- All mock data removed — app only shows real database content
- AudioContext provides global audio state across all screens
- Queue system supports drag-reorder and swipe-delete
- Background audio works on both iOS and Android with lock screen controls
- HomeScreen fetches all data from Supabase — zero mock data
- Push notifications work via Expo Push API (FCM + APNs)
- Run `supabase/push_notifications.sql` to add push_tokens column to profiles table
- Coins system: 1 coin per song play (24h cooldown), tip DJs from PlayerScreen
- Run `supabase/coins_system.sql` to add coins + transactions tables
- Playlist CRUD: create, add/remove songs, delete from Library/PlayerScreen
- Run `supabase/playlists.sql` to add playlists + playlist_songs tables
