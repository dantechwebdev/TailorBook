/**
 * SuccessBanner
 *
 * For genuine completion moments — a job marked Delivered, a payment fully
 * settled — not routine confirmations (that's what Toast is for). Appears
 * inline (not as an overlay), holds attention briefly, then can be dismissed
 * or auto-fades. Motion is the one place in this app allowed to feel a
 * little celebratory, used sparingly and only here.
 */

import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../context/ThemeContext';
import { Typography, Spacing, Radius, Motion, IconSize, Opacity } from '../../constants/theme';

interface SuccessBannerProps {
  message: string;
  subtitle?: string;
  onDismiss?: () => void;
}

export const SuccessBanner: React.FC<SuccessBannerProps> = ({ message, subtitle, onDismiss }) => {
  const { colors, shadow } = useTheme();
  const scale = useRef(new Animated.Value(0.9)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, tension: 120, friction: 8 }),
      Animated.timing(opacity, { toValue: 1, duration: Motion.duration.base, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.wrap,
        { backgroundColor: colors.readyLight, transform: [{ scale }], opacity },
        shadow.sm,
      ]}
      accessible
      accessibilityRole="alert"
      accessibilityLabel={subtitle ? `${message}. ${subtitle}` : message}
    >
      <View style={[styles.iconWrap, { backgroundColor: colors.ready }]}>
        <Ionicons name="checkmark" size={IconSize.md} color={colors.white} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.message, { color: colors.textPrimary }]}>{message}</Text>
        {subtitle && <Text style={[styles.subtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
      </View>
      {onDismiss && (
        <TouchableOpacity
          onPress={onDismiss}
          activeOpacity={Opacity.pressed}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          accessibilityRole="button"
          accessibilityLabel="Dismiss"
        >
          <Ionicons name="close" size={IconSize.sm} color={colors.textTertiary} />
        </TouchableOpacity>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    borderRadius: Radius.lg,
    padding: Spacing.md,
  },
  iconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  message: {
    fontSize: Typography.base,
    fontWeight: Typography.bold,
  },
  subtitle: {
    fontSize: Typography.xs,
    marginTop: 2,
  },
});
