import 'react-native-gesture-handler';
import React, { useEffect, useCallback, useState } from 'react';
import { StatusBar, View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import * as SplashScreen from 'expo-splash-screen';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import AppNavigator from './src/navigation/AppNavigator';
import { useStore } from './src/context/store';
import { requestNotificationPermissions, addNotificationResponseListener } from './src/utils/notifications';
import { Colors, Typography, Spacing } from './src/constants/theme';
import { TailorIcon } from './src/components/common/Icons';

// Prevent splash screen auto-hide
SplashScreen.preventAutoHideAsync();

// ─── Loading Screen ────────────────────────────────────────────────────────────

const SplashView: React.FC<{ onReady: () => void }> = ({ onReady }) => {
  useEffect(() => {
    // Show for minimum 1.5s for brand impression
    const timeout = setTimeout(onReady, 1500);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <View style={splashStyles.container}>
      <View style={splashStyles.logoWrap}>
        <TailorIcon size={72} color={Colors.white} />
      </View>
      <Text style={splashStyles.title}>TailorBook</Text>
      <Text style={splashStyles.subtitle}>Your digital customer book</Text>
    </View>
  );
};

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.primary,
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
    color: Colors.white,
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: Typography.base,
    color: 'rgba(255,255,255,0.7)',
    fontWeight: '400',
  },
});

// ─── App Root ──────────────────────────────────────────────────────────────────

function AppContent() {
  const { initialize, isInitialized } = useStore();
  const [showSplash, setShowSplash] = useState(true);
  const [appReady, setAppReady] = useState(false);

  useEffect(() => {
    const boot = async () => {
      try {
        await initialize();
        await requestNotificationPermissions();
      } catch (e) {
        console.warn('Boot error:', e);
      } finally {
        setAppReady(true);
        SplashScreen.hideAsync();
      }
    };
    boot();
  }, []);

  // Listen for notification taps
  useEffect(() => {
    const sub = addNotificationResponseListener((jobId) => {
      // Navigation is handled via the NavigationContainer ref
      console.log('Notification tapped, jobId:', jobId);
    });
    return () => sub.remove();
  }, []);

  if (showSplash || !appReady) {
    return <SplashView onReady={() => setShowSplash(false)} />;
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} translucent={false} />
      <AppNavigator />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppContent />
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
