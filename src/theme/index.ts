import { Dimensions, Platform } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ==================== COLORS ====================
export const Colors = {
  // Primary palette - Spotify-like dark theme
  primary: '#1DB954',           // Green accent (like Spotify green)
  primaryDark: '#1AA34A',       // Darker green for pressed states
  primaryLight: '#1ED760',      // Lighter green for highlights
  
  // Background colors
  background: '#121212',        // Main dark background
  backgroundElevated: '#181818', // Card/elevated surfaces
  backgroundHighlight: '#282828', // Hover/press states
  surface: '#1E1E1E',           // Surface cards
  surfaceLight: '#232323',      // Lighter surface
  
  // Text colors
  textPrimary: '#FFFFFF',       // Primary text (white)
  textSecondary: '#B3B3B3',     // Secondary text (gray)
  textTertiary: '#727272',      // Tertiary text (dimmer gray)
  textDisabled: '#535353',      // Disabled text
  
  // Accent colors
  gold: '#FFD700',              // Coins/rewards
  goldDark: '#B8960F',         // Darker gold
  diamond: '#4FC3F7',          // Diamonds
  diamondDark: '#0288D1',      // Darker diamond
  
  // Status colors
  success: '#1DB954',
  error: '#E53935',
  warning: '#FFB300',
  info: '#2196F3',
  
  // Overlay colors
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
  overlayDark: 'rgba(0, 0, 0, 0.9)',
  
  // Gradient colors
  gradientStart: '#1DB954',
  gradientMid: '#134E2B',
  gradientEnd: '#121212',
  
  // Player gradient
  playerGradientStart: '#2A1B3D',
  playerGradientEnd: '#44318D',
  
  // Borders
  border: '#282828',
  borderLight: '#333333',
  
  // Tab bar
  tabBarActive: '#FFFFFF',
  tabBarInactive: '#727272',
  
  // Transparent
  transparent: 'transparent',
  white: '#FFFFFF',
  black: '#000000',
};

// ==================== TYPOGRAPHY ====================
const getFontFamily = (weight: string): string => {
  if (Platform.OS === 'ios') {
    switch (weight) {
      case 'thin': return 'System';
      case 'light': return 'System';
      case 'regular': return 'System';
      case 'medium': return 'System';
      case 'semibold': return 'System';
      case 'bold': return 'System';
      case 'heavy': return 'System';
      default: return 'System';
    }
  }
  return 'Roboto';
};

export const Typography = {
  // Headings
  h1: {
    fontSize: 32,
    fontWeight: '700' as const,
    fontFamily: getFontFamily('bold'),
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '700' as const,
    fontFamily: getFontFamily('bold'),
    color: Colors.textPrimary,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    fontFamily: getFontFamily('semibold'),
    color: Colors.textPrimary,
  },
  h4: {
    fontSize: 18,
    fontWeight: '600' as const,
    fontFamily: getFontFamily('semibold'),
    color: Colors.textPrimary,
  },
  
  // Body text
  bodyLarge: {
    fontSize: 16,
    fontWeight: '400' as const,
    fontFamily: getFontFamily('regular'),
    color: Colors.textPrimary,
    lineHeight: 24,
  },
  body: {
    fontSize: 14,
    fontWeight: '400' as const,
    fontFamily: getFontFamily('regular'),
    color: Colors.textPrimary,
    lineHeight: 20,
  },
  bodySmall: {
    fontSize: 12,
    fontWeight: '400' as const,
    fontFamily: getFontFamily('regular'),
    color: Colors.textSecondary,
    lineHeight: 18,
  },
  
  // Labels
  labelLarge: {
    fontSize: 14,
    fontWeight: '600' as const,
    fontFamily: getFontFamily('semibold'),
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  label: {
    fontSize: 12,
    fontWeight: '600' as const,
    fontFamily: getFontFamily('semibold'),
    color: Colors.textSecondary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  labelSmall: {
    fontSize: 10,
    fontWeight: '600' as const,
    fontFamily: getFontFamily('semibold'),
    color: Colors.textTertiary,
    letterSpacing: 0.5,
    textTransform: 'uppercase' as const,
  },
  
  // Caption
  caption: {
    fontSize: 11,
    fontWeight: '400' as const,
    fontFamily: getFontFamily('regular'),
    color: Colors.textTertiary,
  },
  
  // Button text
  buttonLarge: {
    fontSize: 16,
    fontWeight: '700' as const,
    fontFamily: getFontFamily('bold'),
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  button: {
    fontSize: 14,
    fontWeight: '700' as const,
    fontFamily: getFontFamily('bold'),
    color: Colors.textPrimary,
    letterSpacing: 0.5,
  },
  buttonSmall: {
    fontSize: 12,
    fontWeight: '700' as const,
    fontFamily: getFontFamily('bold'),
    color: Colors.textPrimary,
    letterSpacing: 0.3,
  },
  
  // Coin/reward specific
  coinLarge: {
    fontSize: 28,
    fontWeight: '800' as const,
    fontFamily: getFontFamily('heavy'),
    color: Colors.gold,
  },
  coin: {
    fontSize: 18,
    fontWeight: '700' as const,
    fontFamily: getFontFamily('bold'),
    color: Colors.gold,
  },
};

// ==================== SPACING ====================
export const Spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
  xxxxl: 40,
  xxxxxl: 48,
};

// ==================== BORDER RADIUS ====================
export const BorderRadius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  full: 999,
};

// ==================== SHADOWS ====================
export const Shadows = {
  small: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.25,
      shadowRadius: 4,
    },
    android: {
      elevation: 3,
    },
    default: {},
  }),
  medium: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
  large: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.4,
      shadowRadius: 16,
    },
    android: {
      elevation: 12,
    },
    default: {},
  }),
  green: Platform.select({
    ios: {
      shadowColor: Colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 12,
    },
    android: {
      elevation: 8,
    },
    default: {},
  }),
};

// ==================== LAYOUT ====================
export const Layout = {
  screenWidth: SCREEN_WIDTH,
  screenHeight: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375,
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414,
  isLargeDevice: SCREEN_WIDTH >= 414,
  isTablet: SCREEN_WIDTH >= 768,
  
  // Responsive sizes
  headerHeight: Platform.OS === 'ios' ? 88 : 64,
  tabBarHeight: Platform.OS === 'ios' ? 85 : 65,
  miniPlayerHeight: 64,
  statusBarHeight: Platform.OS === 'ios' ? 44 : 0,
  bottomSafeArea: Platform.OS === 'ios' ? 34 : 0,
  
  // Content widths
  contentWidth: SCREEN_WIDTH - (Spacing.lg * 2),
  cardWidth: SCREEN_WIDTH * 0.4,
  avatarSmall: 32,
  avatarMedium: 48,
  avatarLarge: 64,
  avatarXL: 120,
};

// ==================== COMMON STYLES ====================
export const CommonStyles = {
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centeredContainer: {
    flex: 1,
    backgroundColor: Colors.background,
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
  },
  row: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
  },
  spaceBetween: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
  },
  card: {
    backgroundColor: Colors.backgroundElevated,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
  },
  chip: {
    backgroundColor: Colors.backgroundHighlight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  primaryButton: {
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  secondaryButton: {
    backgroundColor: Colors.transparent,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.textSecondary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  outlineButton: {
    backgroundColor: Colors.transparent,
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },
};

export default {
  Colors,
  Typography,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
  CommonStyles,
};
