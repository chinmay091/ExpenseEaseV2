import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import 'react-native-reanimated';

import { useColorScheme } from '@/hooks/use-color-scheme';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { useNotifications } from '@/hooks/useNotifications';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootLayoutNav() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useNotifications();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(tabs)';
    const inOnboarding = (segments[0] as string) === 'onboarding';

    if (!isAuthenticated && (inAuthGroup || inOnboarding)) {
      // Not authenticated, redirect to login
      router.replace('/login');
    } else if (isAuthenticated && (segments[0] === 'login' || segments[0] === 'signup')) {
      // Just logged in - check if onboarding needed
      if (user && !user.balanceSetAt) {
        router.replace('/onboarding' as any);
      } else {
        router.replace('/(tabs)');
      }
    } else if (isAuthenticated && inAuthGroup && user && !user.balanceSetAt) {
      // In app but hasn't set balance yet
      router.replace('/onboarding' as any);
    }
  }, [isAuthenticated, isLoading, segments, user]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0a7ea4" />
      </View>
    );
  }

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack>
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="signup" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="bills" options={{ headerShown: false }} />
        <Stack.Screen name="analytics" options={{ headerShown: false }} />
        <Stack.Screen name="groups/index" options={{ headerShown: false }} />
        <Stack.Screen name="groups/[id]" options={{ headerShown: false }} />
        <Stack.Screen name="import" options={{ headerShown: false }} />
        <Stack.Screen name="reports" options={{ headerShown: false }} />
        <Stack.Screen name="settings" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="auto" />
    </ThemeProvider>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <RootLayoutNav />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
