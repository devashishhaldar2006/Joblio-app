import React from 'react';
import { View, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../constants/theme';
import { AppBootShimmer } from '../components/ShimmerLoaders';

// Screens
import AuthScreen from '../screens/auth/AuthScreen';
import OnboardingScreen from '../screens/auth/OnboardingScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import GithubAnalyzerScreen from '../screens/github/GithubAnalyzerScreen';
import JobSearchScreen from '../screens/jobs/JobSearchScreen';
import MarketIntelligenceScreen from '../screens/market/MarketIntelligenceScreen';
import ContestTrackerScreen from '../screens/contests/ContestTrackerScreen';
import OpenSourceScreen from '../screens/opensource/OpenSourceScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Clean Minimal Lucide Icons
import {
  Home,
  Briefcase,
  TrendingUp,
  Trophy,
  User,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator() {
  const insets = useSafeAreaInsets();
  // Provide comfortable clearance above the Android system white gesture bar
  const bottomPadding = Math.max(insets.bottom, Platform.OS === 'android' ? 22 : 16);
  const topPadding = 10;
  const barHeight = 46 + topPadding + bottomPadding;

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        headerStyle: {
          backgroundColor: '#000000',
          borderBottomColor: '#1A1A1A',
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: '#FFFFFF',
          fontSize: 16,
          fontWeight: '600',
          fontFamily: FONTS.medium,
          letterSpacing: -0.3,
        },
        headerTintColor: '#FFFFFF',
        tabBarStyle: {
          backgroundColor: '#0A0A0A',
          borderTopColor: '#161616',
          borderTopWidth: 1,
          height: barHeight,
          paddingTop: topPadding,
          paddingBottom: bottomPadding,
          elevation: 0,
        },
        tabBarItemStyle: {
          height: 46,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '500',
          fontFamily: FONTS.regular,
          marginTop: 2,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          headerShown: false,
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Home color={color} size={20} strokeWidth={focused ? 2.2 : 1.6} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="JobsTab"
        component={JobSearchScreen}
        options={{
          headerTitle: 'Jobs',
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Briefcase color={color} size={20} strokeWidth={focused ? 2.2 : 1.6} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="MarketTab"
        component={MarketIntelligenceScreen}
        options={{
          headerTitle: 'Skills & Market',
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <TrendingUp color={color} size={20} strokeWidth={focused ? 2.2 : 1.6} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ContestsTab"
        component={ContestTrackerScreen}
        options={{
          headerTitle: 'Contests',
          tabBarLabel: 'Contests',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <Trophy color={color} size={20} strokeWidth={focused ? 2.2 : 1.6} />
            </View>
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          headerTitle: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIconWrapper, focused && styles.tabIconActive]}>
              <User color={color} size={20} strokeWidth={focused ? 2.2 : 1.6} />
            </View>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return <AppBootShimmer />;
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: '#000000' },
        }}
      >
        {user ? (
          !user.hasCompletedOnboarding ? (
            <Stack.Screen name="Onboarding" component={OnboardingScreen} />
          ) : (
            <>
              <Stack.Screen name="MainTabs" component={MainTabNavigator} />
              <Stack.Screen
                name="GithubAudit"
                component={GithubAnalyzerScreen}
                options={{ headerShown: false }}
              />
              <Stack.Screen
                name="OpenSource"
                component={OpenSourceScreen}
                options={{ headerShown: false }}
              />
            </>
          )
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabIconWrapper: {
    padding: 3,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: '#1E1E1E',
  },
});
