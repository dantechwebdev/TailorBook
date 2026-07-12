import React, { createContext, useContext, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, ColorPalette, AppearanceMode } from '../constants/theme';
import { useStore } from './store';

// ─── Theme Context ─────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colors: ColorPalette;
  isDark: boolean;
  appearance: AppearanceMode;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightColors,
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

  const toggleTheme = useCallback(() => {
    const next: AppearanceMode = appearance === 'light' ? 'dark' : appearance === 'dark' ? 'system' : 'light';
    saveSettings({ ...settings, appearance: next });
  }, [appearance, settings, saveSettings]);

  return (
    <ThemeContext.Provider value={{ colors, isDark, appearance, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── useTheme Hook ─────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
