/**
 * Toast
 *
 * Didn't exist anywhere in the app. Every ephemeral confirmation ("Reminder
 * set", "Customer saved") had nowhere to go except a native Alert.alert
 * (blocking, requires a tap to dismiss, breaks flow) or nothing at all.
 *
 * Usage — anywhere inside <ToastProvider>:
 *   const { showToast } = useToast();
 *   showToast('Reminder scheduled', 'success');
 *
 * ToastProvider is mounted once, near the app root (inside ThemeProvider so
 * it can read theme colors, outside individual screens so it survives
 * navigation).
 */

import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import { View, Text, Animated, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius, Motion, IconSize } from '../../constants/theme';

type ToastType = 'success' | 'error' | 'info';

interface ToastState {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  showToast: (message: string, type?: ToastType) => void;
}

const ToastContext = createContext<ToastContextValue>({ showToast: () => {} });

export const useToast = () => useContext(ToastContext);

const ICONS: Record<ToastType, keyof typeof Ionicons.glyphMap> = {
  success: 'checkmark-circle',
  error: 'alert-circle',
  info: 'information-circle',
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastState | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(-20)).current;
  const dismissTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const idCounter = useRef(0);

  const dismiss = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: Motion.duration.fast, useNativeDriver: true }).start(() => {
      setToast(null);
    });
  }, []);

  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    if (dismissTimer.current) clearTimeout(dismissTimer.current);
    idCounter.current += 1;
    setToast({ id: idCounter.current, message, type });
    translateY.setValue(-20);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(opacity, { toValue: 1, duration: Motion.duration.fast, useNativeDriver: true }),
      Animated.spring(translateY, { toValue: 0, useNativeDriver: true, tension: 100, friction: 10 }),
    ]).start();
    dismissTimer.current = setTimeout(dismiss, 3000);
  }, [dismiss]);

  const typeColor = toast
    ? toast.type === 'success' ? colors.ready : toast.type === 'error' ? colors.overdue : colors.primary
    : colors.primary;

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast && (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.wrap,
            { top: insets.top + Spacing.sm, opacity, transform: [{ translateY }] },
          ]}
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
        >
          <View style={[styles.pill, { backgroundColor: colors.surfaceElevated, borderColor: typeColor + '30' }]}>
            <Ionicons name={ICONS[toast.type]} size={IconSize.md} color={typeColor} />
            <Text style={[styles.text, { color: colors.textPrimary }]} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}
    </ToastContext.Provider>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: Spacing.base,
    right: Spacing.base,
    alignItems: 'center',
    zIndex: 999,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Radius.lg,
    borderWidth: 1,
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  text: {
    fontSize: Typography.sm,
    fontWeight: Typography.medium,
    flexShrink: 1,
  },
});
