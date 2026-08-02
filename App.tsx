import 'react-native-gesture-handler';
import React, { useEffect, useState, useRef } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import OnboardingFlow from './src/screens/onboarding/OnboardingFlow';
import { useStore } from './src/context/store';
import { ThemeProvider, useTheme } from './src/context/ThemeContext';
import { AuthProvider } from './src/context/AuthContext';
import { ToastProvider } from './src/components/common/Toast';
import { Logo } from './src/components/common/Icons';
import {
  requestNotificationPermissions,
  addNotificationResponseListener,
  clearBadge,
  getLastNotificationResponse,
} from './src/utils/notifications';
import { aiService } from './src/services/ai/AIService';
import { Typography, Spacing } from './src/constants/theme';

SplashScreen.preventAutoHideAsync();

// ─── Loading / Splash View ─────────────────────────────────────────────────────

const SplashView: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  const { colors } = useTheme();

  useEffect(() => {
    const timeout = setTimeout(onReady, 1400);
    return () => clearTimeout(timeout);
  }, []);

  const styles = splashStyles(colors);

  return (
    <View style={[styles.container, { backgroundColor: colors.brand }]}>
      <View style={styles.logoWrap}>
        <Logo size={64} variant="white" />
      </View>
      <Text style={styles.title}>TailorBook</Text>
      <Text style={styles.subtitle}>Your digital customer book</Text>
    </View>
  );
};

// Splash renders for 1.4s before any screen the tailor can toggle theme from —
// it always shows the brand color regardless of light/dark, by design. Text
// stays pure white on that fixed brand background either way, so `colors.white`
// (identical in both palettes) is the correct token here, not a hardcoded hex.
const splashStyles = (colors: ReturnType<typeof useTheme>['colors']) => StyleSheet.create({
  container: {
    flex: 1,
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
    color: colors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
});

// ─── Notification Deep-Link Navigation ─────────────────────────────────────────
// Tapping a reminder must open directly into that job — no dead ends. This
// works for three distinct cases: a tap while the app is foregrounded, a tap
// that brings a backgrounded app forward, and a tap that cold-starts the app
// from fully closed (checked once via getLastNotificationResponse on mount,
// since the live listener alone never fires for that last case).
function navigateToJob(navRef: ReturnType<typeof useNavigationContainerRef>, jobId: string) {
  if (!navRef.isReady()) return;
  // JobDetail is reachable from either the Jobs tab or Customers tab stack;
  // Jobs is the more direct path for a reminder tap.
  navRef.navigate('MainTabs' as never, {
    screen: 'JobsStack',
    params: { screen: 'JobDetail', params: { jobId } },
  } as never);
}

// ─── App Content (inside ThemeProvider) ───────────────────────────────────────

function AppContent() {
  const { initialize, isInitialized, settings } = useStore();
  const { colors, isDark } = useTheme();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);
  const navigationRef = useNavigationContainerRef();
  // A notification can be tapped before NavigationContainer finishes mounting
  // (cold start). Queue the target jobId and flush it once nav is ready,
  // instead of silently dropping it.
  const pendingJobIdRef = useRef<string | null>(null);

  useEffect(() => {
    const boot = async () => {
      try {
        await initialize();
        await requestNotificationPermissions();
        await clearBadge();
        // Cold start: the app was fully closed and opened by tapping a
        // reminder. The live response listener below never fires for this
        // case — it only catches taps while already running/backgrounded.
        const coldStartJobId = await getLastNotificationResponse();
        if (coldStartJobId) pendingJobIdRef.current = coldStartJobId;
        // Initialize AI service in background — non-blocking
        aiService.initialize().catch(() => {/* non-critical */});
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

  // Foreground / background tap: fires immediately since the app is already
  // alive to receive it.
  useEffect(() => {
    const sub = addNotificationResponseListener((jobId) => {
      if (navigationRef.isReady()) {
        navigateToJob(navigationRef, jobId);
      } else {
        pendingJobIdRef.current = jobId;
      }
    });
    return () => sub.remove();
  }, []);

  // Flush a queued cold-start (or early) tap once navigation is actually ready.
  const handleNavigationReady = () => {
    if (pendingJobIdRef.current) {
      const jobId = pendingJobIdRef.current;
      pendingJobIdRef.current = null;
      navigateToJob(navigationRef, jobId);
    }
  };

  if (showSplash || !appReady) {
    return <SplashView onReady={() => setShowSplash(false)} />;
  }

  // Show onboarding on first launch
  if (settings.onboardingComplete !== '1') {
    return <OnboardingFlow onComplete={() => {}} />;
  }

  return (
    <NavigationContainer ref={navigationRef} onReady={handleNavigationReady}>
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
          {/* ToastProvider needs theme colors, and must wrap every screen that
              might call useToast() — both satisfied by placing it here. */}
          <ToastProvider>
            {/* AuthProvider wraps everything below ThemeProvider so auth screens
                can read theme colors. It wraps AppContent so auth state is
                available to every screen without prop drilling. */}
            <AuthProvider>
              <AppContent />
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
