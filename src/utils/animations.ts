/**
 * animations.ts — TailorBook animation hooks
 *
 * Philosophy: every animation here earns its place.
 * If removing it makes no difference, it doesn't belong.
 *
 * All hooks use useNativeDriver: true where possible (opacity, transform).
 * Falls back to JS driver only for layout-affecting props (height, width).
 *
 * Zero third-party dependencies — uses React Native's built-in Animated API only.
 */

import { useRef, useEffect, useCallback } from 'react';
import { Animated, Easing } from 'react-native';
import { Motion } from '../constants/theme';

// ─── 1. useEntrance ───────────────────────────────────────────────────────────
// Fade + slide up on mount. The most common entrance pattern.
// Use on: greeting blocks, section headers, cards entering screen.
//
// delay: stagger multiple calls to create cascade (0, 60, 120 …)

export function useEntrance(delay = 0, distance = 10) {
  const opacity   = useRef(new Animated.Value(0)).current;
  const translateY= useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 380,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 380,
        delay,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return {
    style: { opacity, transform: [{ translateY }] },
  };
}

// ─── 2. useStaggeredEntrance ──────────────────────────────────────────────────
// Returns an array of entrance styles, each delayed by `staggerMs` from the last.
// Use on: task card lists, customer list items, notification cards.

export function useStaggeredEntrance(count: number, staggerMs = 50, baseDelay = 0) {
  const values = useRef(
    Array.from({ length: count }, () => ({
      opacity:    new Animated.Value(0),
      translateY: new Animated.Value(12),
    }))
  ).current;

  useEffect(() => {
    const animations = values.flatMap(({ opacity, translateY }, i) => [
      Animated.timing(opacity, {
        toValue: 1,
        duration: 320,
        delay: baseDelay + i * staggerMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 320,
        delay: baseDelay + i * staggerMs,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]);
    Animated.parallel(animations).start();
  }, [count]);

  return values.map(({ opacity, translateY }) => ({
    opacity,
    transform: [{ translateY }],
  }));
}

// ─── 3. useCountUp ────────────────────────────────────────────────────────────
// Animates a number from 0 to `target` over `duration` ms.
// Use on: revenue figures, job counts, outstanding balances.
// Returns the current display value as a string.

export function useCountUp(target: number, duration = 500, delay = 0): string {
  const animValue = useRef(new Animated.Value(0)).current;
  const displayRef = useRef('0');

  // Update the display ref on every frame
  useEffect(() => {
    const id = animValue.addListener(({ value }) => {
      displayRef.current = Math.round(value).toLocaleString('en-NG');
    });
    return () => animValue.removeListener(id);
  }, []);

  useEffect(() => {
    if (target === 0) {
      displayRef.current = '0';
      return;
    }
    animValue.setValue(0);
    Animated.timing(animValue, {
      toValue: target,
      duration,
      delay,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // must be false — value drives text
    }).start();
  }, [target]);

  return displayRef.current;
}

// ─── 4. useFloatLoop ─────────────────────────────────────────────────────────
// Gentle perpetual float: translateY oscillates between 0 and -distance.
// Use on: empty state icons so they feel alive, not forgotten.

export function useFloatLoop(distance = 5, duration = 2400) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -distance,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: 0,
          duration: duration / 2,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [distance, duration]);

  return { style: { transform: [{ translateY }] } };
}

// ─── 5. useSpringScale ────────────────────────────────────────────────────────
// Spring-based press feedback or entrance scale.
// Use on: FAB mount (0.82 → 1.0), milestone badge pulse (1.0 → 1.14 → 1.0).

export function useSpringScale(
  from = 0.85,
  to = 1,
  delay = 0
): { style: { transform: { scale: Animated.Value }[] }; pulse: () => void } {
  const scale = useRef(new Animated.Value(from)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: to,
      delay,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, []);

  const pulse = useCallback(() => {
    Animated.sequence([
      Animated.spring(scale, {
        toValue: 1.14,
        useNativeDriver: true,
        tension: 120,
        friction: 5,
      }),
      Animated.spring(scale, {
        toValue: 1,
        useNativeDriver: true,
        tension: 80,
        friction: 8,
      }),
    ]).start();
  }, []);

  return {
    style: { transform: [{ scale }] },
    pulse,
  };
}

// ─── 6. useStatusFill ────────────────────────────────────────────────────────
// Animates the progress line between two status rail dots filling left→right.
// Use on: StatusRail when user taps a new status stage.
// Returns: { width: Animated.Value } — connect to the connector line's width.

export function useStatusFill(totalStages: number) {
  const progress = useRef(new Animated.Value(0)).current;

  const fillTo = useCallback((stageIndex: number) => {
    Animated.timing(progress, {
      toValue: stageIndex / (totalStages - 1),
      duration: 340,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false, // drives width %
    }).start();
  }, [totalStages]);

  return { progress, fillTo };
}

// ─── 7. useBellShake ─────────────────────────────────────────────────────────
// Single oscillation on the notification bell when unread > 0.
// Runs once per mount, not in a loop — avoids becoming annoying.

export function useBellShake(hasUnread: boolean) {
  const rotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!hasUnread) return;
    // Small delay so it doesn't fight the screen entrance
    const timeout = setTimeout(() => {
      Animated.sequence([
        Animated.timing(rotate, { toValue:  6, duration: 60, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -6, duration: 80, useNativeDriver: true }),
        Animated.timing(rotate, { toValue:  4, duration: 70, useNativeDriver: true }),
        Animated.timing(rotate, { toValue: -4, duration: 70, useNativeDriver: true }),
        Animated.timing(rotate, { toValue:  0, duration: 60, useNativeDriver: true }),
      ]).start();
    }, 900);
    return () => clearTimeout(timeout);
  }, [hasUnread]);

  const rotateInterp = rotate.interpolate({
    inputRange: [-10, 0, 10],
    outputRange: ['-10deg', '0deg', '10deg'],
  });

  return { style: { transform: [{ rotate: rotateInterp }] } };
}

// ─── 8. useSpinLoop ──────────────────────────────────────────────────────────
// Continuous 360° rotation. Use on: cloud sync icon when syncing.

export function useSpinLoop(active: boolean, duration = 1200) {
  const spin = useRef(new Animated.Value(0)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (active) {
      spin.setValue(0);
      loopRef.current = Animated.loop(
        Animated.timing(spin, {
          toValue: 1,
          duration,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      loopRef.current.start();
    } else {
      loopRef.current?.stop();
      spin.setValue(0);
    }
    return () => loopRef.current?.stop();
  }, [active]);

  const spinInterp = spin.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return { style: { transform: [{ rotate: spinInterp }] } };
}

// ─── 9. useFadeIn ────────────────────────────────────────────────────────────
// Simple opacity 0→1. Lighter than useEntrance when no slide is needed.

export function useFadeIn(delay = 0, duration = 300) {
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1,
      duration,
      delay,
      easing: Easing.out(Easing.quad),
      useNativeDriver: true,
    }).start();
  }, []);

  return { style: { opacity } };
}

// ─── 10. useShimmerPress ──────────────────────────────────────────────────────
// Press-in scale: 1.0 → 0.96 on press, spring back on release.
// Returns handlers to attach to TouchableOpacity / Pressable.
// More physical than activeOpacity alone.

export function useShimmerPress() {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = useCallback(() => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      tension: 200,
      friction: 10,
    }).start();
  }, []);

  const onPressOut = useCallback(() => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      tension: 80,
      friction: 8,
    }).start();
  }, []);

  return {
    style: { transform: [{ scale }] },
    handlers: { onPressIn, onPressOut },
  };
}

// ─── 11. usePulseLoop ─────────────────────────────────────────────────────────
// Continuous opacity breathing (1 → 0.4 → 1). Use on: skeleton loading
// placeholders, so a loading list reads as "actively working" rather than a
// dead gray box.

export function usePulseLoop(active = true) {
  const opacity = useRef(new Animated.Value(1)).current;
  const loopRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (!active) {
      loopRef.current?.stop();
      opacity.setValue(1);
      return;
    }
    loopRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.4, duration: Motion.duration.slow, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: Motion.duration.slow, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    loopRef.current.start();
    return () => loopRef.current?.stop();
  }, [active]);

  return { style: { opacity } };
}
