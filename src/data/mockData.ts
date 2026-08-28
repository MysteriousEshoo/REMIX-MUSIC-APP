// ==================== MOCK DATA ====================
// Real backend lagne tak ye data use hoga

export interface DJ {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  bio: string;
  followers: number;
  mixes: number;
  isVerified: boolean;
  totalEarnings: number;
  genre: string;
  isFollowing: boolean;
}

export interface Mix {
  id: string;
  title: string;
  artist: DJ;
  coverImage: string;
  duration: number;
  plays: number;
  likes: number;
  isLiked: boolean;
  isDownloaded: boolean;
  genre: string;
  uploadedAt: string;
  isExclusive: boolean;
  audioUrl?: string;
  description?: string;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  coverImage: string;
  mixCount: number;
  totalDuration: number;
  isOwner: boolean;
}

export interface Notification {
  id: string;
  type: 'follow' | 'like' | 'tip' | 'release' | 'contest' | 'system';
  title: string;
  message: string;
  timeAgo: string;
  isRead: boolean;
  dj?: DJ;
  mix?: Mix;
}

export interface CoinTransaction {
  id: string;
  type: 'earned' | 'spent' | 'tip_sent' | 'tip_received' | 'payout';
  amount: number;
  description: string;
  date: string;
}

// Mock Artists
export const mockDJs: DJ[] = [
  {
    id: 'dj1',
    name: 'DJ Shadow',
    handle: '@djshadow',
    avatar: 'https://picsum.photos/seed/dj1/200/200',
    bio: 'Electronic music producer & DJ from LA. 15 years of beats.',
    followers: 45200,
    mixes: 89,
    isVerified: true,
    totalEarnings: 125000,
    genre: 'Electronic',
    isFollowing: true,
  },
  {
    id: 'dj2',
    name: 'Nora En Pure',
    handle: '@noraenpure',
    avatar: 'https://picsum.photos/seed/dj2/200/200',
    bio: 'Deep house & melodic techno. Bringing nature to the dancefloor.',
    followers: 82300,
    mixes: 134,
    isVerified: true,
    totalEarnings: 289000,
    genre: 'Deep House',
    isFollowing: false,
  },
  {
    id: 'dj3',
    name: 'Black Coffee',
    handle: '@blackcoffee',
    avatar: 'https://picsum.photos/seed/dj3/200/200',
    bio: 'South African DJ and record producer. Afro house pioneer.',
    followers: 156000,
    mixes: 201,
    isVerified: true,
    totalEarnings: 567000,
    genre: 'Afro House',
    isFollowing: true,
  },
  {
    id: 'dj4',
    name: 'Peggy Gou',
    handle: '@peggygou',
    avatar: 'https://picsum.photos/seed/dj4/200/200',
    bio: 'Korean-born, Berlin-based DJ. House music with attitude.',
    followers: 234000,
    mixes: 178,
    isVerified: true,
    totalEarnings: 890000,
    genre: 'House',
    isFollowing: false,
  },
  {
    id: 'dj5',
    name: 'Amelie Lens',
    handle: '@amelielens',
    avatar: 'https://picsum.photos/seed/dj5/200/200',
    bio: 'Belgian techno queen. Raw, powerful, relentless beats.',
    followers: 189000,
    mixes: 156,
    isVerified: true,
    totalEarnings: 678000,
    genre: 'Techno',
    isFollowing: true,
  },
  {
    id: 'dj6',
    name: 'Tale Of Us',
    handle: '@taleofus',
    avatar: 'https://picsum.photos/seed/dj6/200/200',
    bio: 'Italian duo. Afterlife founders. Melodic journeys.',
    followers: 167000,
    mixes: 142,
    isVerified: true,
    totalEarnings: 445000,
    genre: 'Melodic Techno',
    isFollowing: false,
  },
  {
    id: 'dj7',
    name: 'Fisher',
    handle: '@fisher',
    avatar: 'https://picsum.photos/seed/dj7/200/200',
    bio: 'Australian DJ. Losing It was just the beginning.',
    followers: 312000,
    mixes: 98,
    isVerified: true,
    totalEarnings: 1200000,
    genre: 'Tech House',
    isFollowing: true,
  },
  {
    id: 'dj8',
    name: 'Charlotte de Witte',
    handle: '@charlottedewitte',
    avatar: 'https://picsum.photos/seed/dj8/200/200',
    bio: 'Belgian DJ and record producer. Techno is my weapon.',
    followers: 198000,
    mixes: 167,
    isVerified: true,
    totalEarnings: 780000,
    genre: 'Techno',
    isFollowing: false,
  },
];

// Mock Mixes
export const mockMixes: Mix[] = [
  {
    id: 'mix1',
    title: 'Late Night Frequencies Vol. 12',
    artist: mockDJs[0],
    coverImage: 'https://picsum.photos/seed/mix1/400/400',
    duration: 3840,
    plays: 245000,
    likes: 12400,
    isLiked: false,
    isDownloaded: true,
    genre: 'Electronic',
    uploadedAt: '2 hours ago',
    isExclusive: false,
  },
  {
    id: 'mix2',
    title: 'Purified Radio 189',
    artist: mockDJs[1],
    coverImage: 'https://picsum.photos/seed/mix2/400/400',
    duration: 3600,
    plays: 567000,
    likes: 34200,
    isLiked: true,
    isDownloaded: false,
    genre: 'Deep House',
    uploadedAt: '1 day ago',
    isExclusive: false,
  },
  {
    id: 'mix3',
    title: 'Drumbeat Journey Live @ Tomorrowland',
    artist: mockDJs[2],
    coverImage: 'https://picsum.photos/seed/mix3/400/400',
    duration: 7200,
    plays: 890000,
    likes: 67000,
    isLiked: true,
    isDownloaded: true,
    genre: 'Afro House',
    uploadedAt: '3 days ago',
    isExclusive: true,
  },
  {
    id: 'mix4',
    title: 'K-Juice Mixtape #45',
    artist: mockDJs[3],
    coverImage: 'https://picsum.photos/seed/mix4/400/400',
    duration: 2700,
    plays: 423000,
    likes: 28900,
    isLiked: false,
    isDownloaded: false,
    genre: 'House',
    uploadedAt: '5 days ago',
    isExclusive: false,
  },
  {
    id: 'mix5',
    title: 'Aura Warehouse Set',
    artist: mockDJs[4],
    coverImage: 'https://picsum.photos/seed/mix5/400/400',
    duration: 5400,
    plays: 678000,
    likes: 45600,
    isLiked: true,
    isDownloaded: false,
    genre: 'Techno',
    uploadedAt: '1 week ago',
    isExclusive: true,
  },
  {
    id: 'mix6',
    title: 'Afterlife Tulum 2026',
    artist: mockDJs[5],
    coverImage: 'https://picsum.photos/seed/mix6/400/400',
    duration: 6300,
    plays: 345000,
    likes: 23400,
    isLiked: false,
    isDownloaded: true,
    genre: 'Melodic Techno',
    uploadedAt: '2 weeks ago',
    isExclusive: false,
  },
  {
    id: 'mix7',
    title: 'Losing It (Remix Collection)',
    artist: mockDJs[6],
    coverImage: 'https://picsum.photos/seed/mix7/400/400',
    duration: 3200,
    plays: 1200000,
    likes: 89000,
    isLiked: true,
    isDownloaded: false,
    genre: 'Tech House',
    uploadedAt: '3 weeks ago',
    isExclusive: false,
  },
  {
    id: 'mix8',
    title: 'Headstrong Radio Ep. 234',
    artist: mockDJs[7],
    coverImage: 'https://picsum.photos/seed/mix8/400/400',
    duration: 4500,
    plays: 567000,
    likes: 34500,
    isLiked: false,
    isDownloaded: false,
    genre: 'Techno',
    uploadedAt: '4 weeks ago',
    isExclusive: false,
  },
  {
    id: 'mix9',
    title: 'Sunset Sessions Vol. 8',
    artist: mockDJs[1],
    coverImage: 'https://picsum.photos/seed/mix9/400/400',
    duration: 4200,
    plays: 189000,
    likes: 11200,
    isLiked: false,
    isDownloaded: false,
    genre: 'Deep House',
    uploadedAt: '1 day ago',
    isExclusive: false,
  },
  {
    id: 'mix10',
    title: 'Basement Techno Vol. 66',
    artist: mockDJs[4],
    coverImage: 'https://picsum.photos/seed/mix10/400/400',
    duration: 5100,
    plays: 345000,
    likes: 22100,
    isLiked: true,
    isDownloaded: false,
    genre: 'Techno',
    uploadedAt: '5 days ago',
    isExclusive: true,
  },
];

// Mock Playlists
export const mockPlaylists: Playlist[] = [
  {
    id: 'pl1',
    name: 'Late Night Vibes',
    description: 'Best mixes for the late night sessions',
    coverImage: 'https://picsum.photos/seed/pl1/400/400',
    mixCount: 24,
    totalDuration: 86400,
    isOwner: true,
  },
  {
    id: 'pl2',
    name: 'Techno Essentials',
    description: 'Hard hitting techno from the best DJs',
    coverImage: 'https://picsum.photos/seed/pl2/400/400',
    mixCount: 18,
    totalDuration: 64800,
    isOwner: true,
  },
  {
    id: 'pl3',
    name: 'Deep House Chill',
    description: 'Relaxing deep house for any mood',
    coverImage: 'https://picsum.photos/seed/pl3/400/400',
    mixCount: 32,
    totalDuration: 115200,
    isOwner: true,
  },
  {
    id: 'pl4',
    name: 'Workout Beats',
    description: 'High energy mixes for your workout',
    coverImage: 'https://picsum.photos/seed/pl4/400/400',
    mixCount: 15,
    totalDuration: 54000,
    isOwner: false,
  },
];

// Mock Notifications
export const mockNotifications: Notification[] = [
  {
    id: 'n1',
    type: 'release',
    title: 'New Mix Released!',
    message: 'DJ Shadow just dropped "Late Night Frequencies Vol. 12"',
    timeAgo: '2 hours ago',
    isRead: false,
    dj: mockDJs[0],
    mix: mockMixes[0],
  },
  {
    id: 'n2',
    type: 'follow',
    title: 'New Follower',
    message: 'Peggy Gou started following you',
    timeAgo: '5 hours ago',
    isRead: false,
    dj: mockDJs[3],
  },
  {
    id: 'n3',
    type: 'tip',
    title: 'You Received a Tip!',
    message: 'Someone tipped you 50 coins on your latest mix',
    timeAgo: '1 day ago',
    isRead: true,
  },
  {
    id: 'n4',
    type: 'contest',
    title: 'Remix Contest',
    message: 'Enter the Summer Remix Contest and win 10,000 coins!',
    timeAgo: '2 days ago',
    isRead: true,
  },
  {
    id: 'n5',
    type: 'like',
    title: 'Mix Liked',
    message: 'Amelie Lens liked your mix "Underground Sessions"',
    timeAgo: '3 days ago',
    isRead: true,
    dj: mockDJs[4],
  },
  {
    id: 'n6',
    type: 'system',
    title: 'Payout Processed',
    message: 'Your payout of $245.00 has been processed',
    timeAgo: '5 days ago',
    isRead: true,
  },
];

// Mock Coin Transactions
export const mockCoinTransactions: CoinTransaction[] = [
  { id: 'c1', type: 'earned', amount: 1250, description: 'Monthly listening rewards', date: 'Aug 1, 2026' },
  { id: 'c2', type: 'tip_received', amount: 500, description: 'Tip from @listener_mike', date: 'Aug 3, 2026' },
  { id: 'c3', type: 'spent', amount: 200, description: 'Promoted placement boost', date: 'Aug 5, 2026' },
  { id: 'c4', type: 'earned', amount: 890, description: 'Active listener rewards', date: 'Aug 10, 2026' },
  { id: 'c5', type: 'payout', amount: -3000, description: 'Cash withdrawal to bank', date: 'Aug 12, 2026' },
  { id: 'c6', type: 'tip_received', amount: 150, description: 'Tip from @housefan99', date: 'Aug 14, 2026' },
  { id: 'c7', type: 'earned', amount: 2100, description: 'Weekly engagement bonus', date: 'Aug 15, 2026' },
];

// Genres list
export const genres = [
  { id: 'g1', name: 'Electronic', color: '#1DB954', icon: '⚡' },
  { id: 'g2', name: 'House', color: '#E91E63', icon: '🏠' },
  { id: 'g3', name: 'Techno', color: '#9C27B0', icon: '🎛️' },
  { id: 'g4', name: 'Deep House', color: '#2196F3', icon: '🌊' },
  { id: 'g5', name: 'Tech House', color: '#FF9800', icon: '🔧' },
  { id: 'g6', name: 'Trance', color: '#00BCD4', icon: '🔮' },
  { id: 'g7', name: 'Afro House', color: '#795548', icon: '🥁' },
  { id: 'g8', name: 'Melodic Techno', color: '#607D8B', icon: '🎹' },
  { id: 'g9', name: 'Drum & Bass', color: '#F44336', icon: '🥁' },
  { id: 'g10', name: 'Ambient', color: '#4CAF50', icon: '☁️' },
  { id: 'g11', name: 'Progressive', color: '#673AB7', icon: '📈' },
  { id: 'g12', name: 'Minimal', color: '#9E9E9E', icon: '➖' },
];

// Subscription plans
export const subscriptionPlans = [
  {
    id: 'free',
    name: 'Free',
    price: '$0',
    period: 'forever',
    features: [
      'Ad-supported streaming',
      'Standard audio quality',
      'Follow & like DJs',
      'Basic search',
    ],
    notIncluded: [
      'Offline downloads',
      'Ad-free experience',
      'High-fidelity audio',
      'Early access to drops',
    ],
  },
  {
    id: 'listener_plus',
    name: 'Listener Plus',
    price: '$6.99',
    period: '/month',
    yearlyPrice: '$59/year',
    features: [
      'Ad-free streaming',
      'Offline downloads',
      'High-fidelity audio (320kbps)',
      'Early access to drops',
      'Unlimited skips',
      'Priority support',
    ],
    notIncluded: [
      'Unlimited uploads',
      'Analytics dashboard',
      'Promoted placement',
    ],
    isPopular: true,
  },
  {
    id: 'creator_pro',
    name: 'Creator Pro',
    price: '$14.99',
    period: '/month',
    yearlyPrice: '$129/year',
    features: [
      'Everything in Listener Plus',
      'Unlimited uploads',
      'Advanced analytics dashboard',
      'Promoted placement',
      'Lower platform commission (10%)',
      'Creator badge',
      'Early feature access',
      'Priority support',
    ],
    notIncluded: [],
    isCreator: true,
  },
];
