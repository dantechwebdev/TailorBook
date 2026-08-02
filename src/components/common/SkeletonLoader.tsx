/**
 * SkeletonLoader
 *
 * LoadingScreen (existing) is a full-screen spinner — right for "we don't
 * know anything about this screen yet." SkeletonLoader is for the far more
 * common case: we know the SHAPE of the content (a list of job cards, a
 * customer row) and want that shape to appear instantly, filling in with
 * real content the moment it's ready — no layout jump, no blank flash.
 *
 * Usage:
 *   <SkeletonBlock width="60%" height={16} />
 *   <SkeletonRow />              — pre-built list-row shape (avatar + 2 lines)
 *   <SkeletonCard />             — pre-built card shape
 */

import React from 'react';
import { View, Animated, ViewStyle } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Radius, Spacing } from '../../constants/theme';
import { usePulseLoop } from '../../utils/animations';

// ─── Primitive block ────────────────────────────────────────────────────────

interface SkeletonBlockProps {
  width?: number | `${number}%`;
  height?: number;
  radius?: number;
  style?: ViewStyle;
}

export const SkeletonBlock: React.FC<SkeletonBlockProps> = ({
  width = '100%',
  height = 14,
  radius = Radius.sm,
  style,
}) => {
  const { colors } = useTheme();
  const pulse = usePulseLoop(true);

  return (
    <Animated.View
      style={[
        { width, height, borderRadius: radius, backgroundColor: colors.border },
        pulse.style,
        style,
      ]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  );
};

// ─── Composite shapes ───────────────────────────────────────────────────────

export const SkeletonRow: React.FC = () => (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.sm }}>
    <SkeletonBlock width={44} height={44} radius={22} />
    <View style={{ flex: 1, gap: Spacing.xs }}>
      <SkeletonBlock width="55%" height={14} />
      <SkeletonBlock width="35%" height={11} />
    </View>
  </View>
);

export const SkeletonCard: React.FC = () => {
  const { colors, shadow } = useTheme();
  return (
    <View style={{
      backgroundColor: colors.surface,
      borderRadius: Radius.lg,
      padding: Spacing.base,
      gap: Spacing.sm,
      ...shadow.sm,
    }}>
      <SkeletonBlock width="45%" height={16} />
      <SkeletonBlock width="80%" height={12} />
      <SkeletonBlock width="60%" height={12} />
    </View>
  );
};

/** Renders `count` SkeletonRow instances with spacing — for list loading states. */
export const SkeletonList: React.FC<{ count?: number }> = ({ count = 5 }) => (
  <View style={{ paddingHorizontal: Spacing.base }}>
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonRow key={i} />
    ))}
  </View>
);
