import 'react-native-gesture-handler';
import React, { useEffect, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import OnboardingFlow from './src/screens/onboarding/OnboardingFlow';
import { useStore } from './src/context/store';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { Logo } from './src/components/common/Icons';
import { requestNotificationPermissions, addNotificationResponseListener, clearBadge } from './src/utils/notifications';
import { Typography, Spacing, LightColors } from './src/constants/theme';

SplashScreen.preventAutoHideAsync();

// ─── Loading / Splash View ─────────────────────────────────────────────────────

const SplashView: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const { colors } = useTheme();

  useEffect(() => {
    const timeout = setTimeout(onReady, 1400);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={[splashStyles.container, { backgroundColor: colors.brand }]}>
      <View style={splashStyles.logoWrap}>
        <Logo size={64} variant="white" />
      </View>
      <Text style={splashStyles.title}>TailorBook</Text>
      <Text style={splashStyles.subtitle}>Your digital customer book</Text>
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: LightColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.md,
  },
  logoWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 36,
    fontWeight: '800',
    color: LightColors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
});

// ─── App Content (inside ThemeProvider) ───────────────────────────────────────

function AppContent() {
  const { initialize, isInitialized, settings } = useStore();
  const { colors, isDark } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const boot = async () => {
      try {
        await initialize();
        await requestNotificationPermissions();
        await clearBadge();
      } catch (e) {
        // Boot errors are non-fatal — log for debugging in development
        if (__DEV__) console.warn('Boot error:', e);
      } finally {
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    };
    boot();
  }, []);

  // Navigate to job detail when notification is tapped
  useEffect(() => {
    const sub = addNotificationResponseListener((_jobId) => {
      // Navigation to the specific job happens via the NavigationContainer
      // jobId available for future deep-link integration
    });
    return () => sub.remove();
  }, []);

  if (showSplash || !appReady) {
    return <SplashView onReady={() => setShowSplash(false)} />;
  }

  // Show onboarding on first launch
  if (settings.onboardingComplete !== '1') {
    return <OnboardingFlow onComplete={() => {}} />;
  }

  return (
    <NavigationContainer>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={colors.background}
        translucent={false}
      />
      <AppNavigator />
    </NavigationContainer>
  );
}

// ─── Root App ──────────────────────────────────────────────────────────────────

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AppContent />
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
