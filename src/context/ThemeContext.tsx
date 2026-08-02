import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, ColorPalette, AppearanceMode, getShadow, ShadowTokens } from '../constants/theme';
import { useStore } from './store';

// ─── Theme Context ─────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colors: ColorPalette;
  shadow: ShadowTokens;
  isDark: boolean;
  appearance: AppearanceMode;
  toggleTheme: () => void;
}

const DEFAULT_SHADOW = getShadow(false);

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightColors,
  shadow: DEFAULT_SHADOW,
  isDark: false,
  appearance: 'system',
  toggleTheme: () => {},
});

// ─── ThemeProvider ─────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings, saveSettings } = useStore();
  const systemScheme = useColorScheme();

  const appearance: AppearanceMode =
    (settings?.appearance as AppearanceMode) || 'system';

  const isDark =
    appearance === 'dark' ||
    (appearance === 'system' && systemScheme === 'dark');

  const colors: ColorPalette = isDark ? DarkColors : LightColors;
  const shadow = useMemo(() => getShadow(isDark), [isDark]);

  const toggleTheme = useCallback(() => {
    const next: AppearanceMode = appearance === 'light' ? 'dark' : appearance === 'dark' ? 'system' : 'light';
    saveSettings({ ...settings, appearance: next });
  }, [appearance, settings, saveSettings]);

  // Memoized: ThemeProvider sits at the app root and `settings` comes from the
  // Zustand store, which changes on unrelated updates (e.g. editing a job).
  // Without this, every themed component in the tree re-rendered on every
  // store write, not just theme changes.
  const value = useMemo<ThemeContextValue>(
    () => ({ colors, shadow, isDark, appearance, toggleTheme }),
    [colors, shadow, isDark, appearance, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── useTheme Hook ─────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
