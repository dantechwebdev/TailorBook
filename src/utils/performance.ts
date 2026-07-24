/**
 * performance.ts
 *
 * Shared utilities for React Native performance optimization.
 *
 * Guidelines applied throughout TailorBook:
 *   1. FlatList keyExtractor must be stable (id-based, not index-based)
 *   2. getItemLayout speeds up FlatList when items have fixed height
 *   3. windowSize and maxToRenderPerBatch reduce memory for long lists
 *   4. removeClippedSubviews clips off-screen items on Android
 *   5. initialNumToRender limits first-render work
 */

import { useCallback, useRef } from 'react';

// ─── FlatList Performance Props ───────────────────────────────────────────────
// Apply to any FlatList where items have a known fixed height.

export function getFlatListPerf(itemHeight: number) {
  return {
    initialNumToRender: 10,
    maxToRenderPerBatch: 8,
    windowSize: 5,
    removeClippedSubviews: true,
    getItemLayout: (_: unknown, index: number) => ({
      length: itemHeight,
      offset: itemHeight * index,
      index,
    }),
  } as const;
}

// ─── Stable Key Extractor ─────────────────────────────────────────────────────
// Always use entity.id, never array index.

export function keyExtractorById(item: { id: string }): string {
  return item.id;
}

// ─── Debounce Hook ────────────────────────────────────────────────────────────
// Prevents excessive calls during search input.

export function useDebounce<T extends (...args: any[]) => void>(
  fn: T,
  delay: number
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;
}

// ─── Stable Callback ──────────────────────────────────────────────────────────
// Returns a ref-backed stable function reference that always calls the latest version.
// Useful when passing handlers to memoized children without triggering re-renders.

export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const ref = useRef(fn);
  ref.current = fn;

  return useCallback((...args: Parameters<T>): ReturnType<T> => {
    return ref.current(...args);
  }, []) as T;
}
