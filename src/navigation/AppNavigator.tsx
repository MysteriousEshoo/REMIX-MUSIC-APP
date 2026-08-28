import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { View, Text, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Colors, Typography, Spacing, BorderRadius, Layout } from '../theme';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { AudioProvider } from '../contexts/AudioContext';
import { MiniPlayer } from '../components/MiniPlayer';

// Screens
import { SplashScreen } from '../screens/SplashScreen';
import { OnboardingScreen } from '../screens/OnboardingScreen';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { SignupScreen } from '../screens/auth/SignupScreen';
import { ForgotPasswordScreen } from '../screens/auth/ForgotPasswordScreen';
import { HomeScreen } from '../screens/main/HomeScreen';
import { SearchScreen } from '../screens/main/SearchScreen';
import { LibraryScreen } from '../screens/main/LibraryScreen';
import { ProfileScreen } from '../screens/main/ProfileScreen';
import { PlayerScreen } from '../screens/player/PlayerScreen';
import { DJProfileScreen } from '../screens/dj/DJProfileScreen';
import { CreatorDashboardScreen } from '../screens/dj/CreatorDashboardScreen';
import { UploadScreen } from '../screens/dj/UploadScreen';
import { SubscriptionScreen } from '../screens/main/SubscriptionScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';
import { NotificationsScreen } from '../screens/main/NotificationsScreen';
import { PlaylistScreen } from '../screens/main/PlaylistScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const AuthStack = createNativeStackNavigator();
const MainStack = createNativeStackNavigator();

// ==================== TAB NAVIGATOR ====================
function MainTabNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.tabBarActive,
          tabBarInactiveTintColor: Colors.tabBarInactive,
          tabBarLabelStyle: styles.tabBarLabel,
          tabBarHideOnKeyboard: true,
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={24}
                color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Search"
          component={SearchScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'search' : 'search-outline'}
                size={24}
                color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Library"
          component={LibraryScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'library' : 'library-outline'}
                size={24}
                color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
              />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            tabBarIcon: ({ focused }) => (
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={24}
                color={focused ? Colors.tabBarActive : Colors.tabBarInactive}
              />
            ),
          }}
        />
      </Tab.Navigator>
      {/* MiniPlayer — sirf tab screens pe dikhega jab gaana chal raha ho */}
      <MiniPlayer />
    </View>
  );
}

// ==================== MAIN STACK (Tabs + Modal Screens) ====================
function MainStackNavigator() {
  return (
    <MainStack.Navigator screenOptions={{ headerShown: false }}>
      <MainStack.Screen name="MainTabs" component={MainTabNavigator} />
      <MainStack.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <MainStack.Screen name="DJProfile" component={DJProfileScreen} />
      <MainStack.Screen name="CreatorDashboard" component={CreatorDashboardScreen} />
      <MainStack.Screen name="Upload" component={UploadScreen} />
      <MainStack.Screen name="Subscription" component={SubscriptionScreen} />
      <MainStack.Screen name="Settings" component={SettingsScreen} />
      <MainStack.Screen name="Notifications" component={NotificationsScreen} />
      <MainStack.Screen name="Playlist" component={PlaylistScreen} />
    </MainStack.Navigator>
  );
}

// ==================== AUTH STACK ====================
function AuthStackNavigator() {
  return (
    <AuthStack.Navigator screenOptions={{ headerShown: false }}>
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Signup" component={SignupScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// ==================== INNER NAVIGATOR (auth state ke hisaab se screen dikhata hai) ====================
const InnerNavigator: React.FC = () => {
  const { session, loading } = useAuth();

  // Loading — jab tak Supabase session check ho raha hai
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={{ color: Colors.textSecondary, marginTop: 16 }}>Loading...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Agar session hai (user login hai) → Main screen dikhao */}
        {/* Agar session nahi hai → Auth screen dikhao */}
        {session ? (
          <Stack.Screen name="Main" component={MainStackNavigator} />
        ) : (
          <Stack.Screen name="Auth" component={AuthStackNavigator} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ==================== APP NAVIGATOR (AuthProvider wrap karta hai) ====================
export const AppNavigator: React.FC = () => {
  return (
    <AuthProvider>
      <AudioProvider>
        <InnerNavigator />
      </AudioProvider>
    </AuthProvider>
  );
};

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 85 : 65,
    paddingTop: Spacing.sm,
    paddingBottom: Platform.OS === 'ios' ? 20 : Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  tabBarLabel: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});
