import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ClerkProvider } from '@clerk/clerk-expo';
import { AuthProvider } from './src/context/AuthContext';
import AppNavigator from './src/navigation/AppNavigator';
import { tokenCache } from './src/utils/tokenCache';
import { CLERK_PUBLISHABLE_KEY } from './src/config/clerk';

export default function App() {
  const content = (
    <SafeAreaProvider>
      <AuthProvider>
        <StatusBar style="light" />
        <AppNavigator />
      </AuthProvider>
    </SafeAreaProvider>
  );

  // If publishable key is present, wrap in ClerkProvider with SecureStore cache
  if (CLERK_PUBLISHABLE_KEY && CLERK_PUBLISHABLE_KEY.trim().startsWith('pk_')) {
    return (
      <ClerkProvider publishableKey={CLERK_PUBLISHABLE_KEY} tokenCache={tokenCache}>
        {content}
      </ClerkProvider>
    );
  }

  // Graceful fallback if no Clerk key has been provided yet
  return content;
}
