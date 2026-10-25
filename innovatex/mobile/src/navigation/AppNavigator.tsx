import React from 'react';
import { View, ActivityIndicator } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useAuth } from '../context/AuthContext';
import { COLORS, FONTS } from '../constants/theme';

// Screens
import AuthScreen from '../screens/auth/AuthScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import GithubAnalyzerScreen from '../screens/github/GithubAnalyzerScreen';
import JobSearchScreen from '../screens/jobs/JobSearchScreen';
import MarketIntelligenceScreen from '../screens/market/MarketIntelligenceScreen';
import ContestTrackerScreen from '../screens/contests/ContestTrackerScreen';
import OpenSourceScreen from '../screens/opensource/OpenSourceScreen';
import ResearchScreen from '../screens/research/ResearchScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Icons
import {
  LayoutDashboard,
  Code2,
  Briefcase,
  TrendingUp,
  Trophy,
  User,
} from 'lucide-react-native';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: COLORS.bgCanvas,
          borderBottomColor: COLORS.border,
          borderBottomWidth: 1,
          elevation: 0,
          shadowOpacity: 0,
        },
        headerTitleStyle: {
          color: COLORS.textPrimary,
          fontSize: 15,
          fontWeight: '700',
          fontFamily: FONTS.medium,
        },
        headerTintColor: COLORS.textPrimary,
        tabBarStyle: {
          backgroundColor: COLORS.bgCanvas,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          elevation: 0,
          height: 56,
          paddingBottom: 6,
          paddingTop: 6,
        },
        tabBarActiveTintColor: COLORS.textPrimary,
        tabBarInactiveTintColor: COLORS.textMuted,
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
          fontFamily: FONTS.regular,
        },
      }}
    >
      <Tab.Screen
        name="DashboardTab"
        component={DashboardScreen}
        options={{
          title: 'Joblio',
          tabBarLabel: 'Overview',
          tabBarIcon: ({ color, size }) => <LayoutDashboard color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="GithubTab"
        component={GithubAnalyzerScreen}
        options={{
          title: 'GitHub Audit',
          tabBarLabel: 'GitHub',
          tabBarIcon: ({ color, size }) => <Code2 color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="JobsTab"
        component={JobSearchScreen}
        options={{
          title: 'Job Matching',
          tabBarLabel: 'Jobs',
          tabBarIcon: ({ color, size }) => <Briefcase color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="MarketTab"
        component={MarketIntelligenceScreen}
        options={{
          title: 'Market Intelligence',
          tabBarLabel: 'Market',
          tabBarIcon: ({ color, size }) => <TrendingUp color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="ContestsTab"
        component={ContestTrackerScreen}
        options={{
          title: 'Contests & Rounds',
          tabBarLabel: 'Contests',
          tabBarIcon: ({ color, size }) => <Trophy color={color} size={size - 2} />,
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'Profile',
          tabBarLabel: 'Account',
          tabBarIcon: ({ color, size }) => <User color={color} size={size - 2} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bgCanvas, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="small" color={COLORS.textPrimary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.bgCanvas },
        }}
      >
        {user ? (
          <>
            <Stack.Screen name="MainTabs" component={MainTabNavigator} />
            <Stack.Screen
              name="OpenSourceTab"
              component={OpenSourceScreen}
              options={{
                headerShown: true,
                title: 'Open Source',
                headerStyle: {
                  backgroundColor: COLORS.bgCanvas,
                },
                headerTintColor: COLORS.textPrimary,
                headerTitleStyle: {
                  fontFamily: FONTS.medium,
                  fontSize: 15,
                },
              }}
            />
            <Stack.Screen
              name="ResearchTab"
              component={ResearchScreen}
              options={{
                headerShown: true,
                title: 'Research Synthesis',
                headerStyle: {
                  backgroundColor: COLORS.bgCanvas,
                },
                headerTintColor: COLORS.textPrimary,
                headerTitleStyle: {
                  fontFamily: FONTS.medium,
                  fontSize: 15,
                },
              }}
            />
          </>
        ) : (
          <Stack.Screen name="Auth" component={AuthScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
