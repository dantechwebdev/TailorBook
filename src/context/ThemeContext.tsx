import React, { createContext, useContext } from 'react';
import { useColorScheme } from 'react-native';
import { LightColors, DarkColors, ColorPalette, AppearanceMode } from '../constants/theme';
import { useStore } from './store';

// ─── Theme Context ─────────────────────────────────────────────────────────────

interface ThemeContextValue {
  colors: ColorPalette;
  isDark: boolean;
  appearance: AppearanceMode;
}

const ThemeContext = createContext<ThemeContextValue>({
  colors: LightColors,
  isDark: false,
  appearance: 'system',
});

// ─── ThemeProvider ─────────────────────────────────────────────────────────────

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useStore();
  const systemScheme = useColorScheme();

  const appearance: AppearanceMode =
    (settings?.appearance as AppearanceMode) || 'system';

  const isDark =
    appearance === 'dark' ||
    (appearance === 'system' && systemScheme === 'dark');

  const colors: ColorPalette = isDark ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider value={{ colors, isDark, appearance }}>
      {children}
    </ThemeContext.Provider>
  );
};

// ─── useTheme Hook ─────────────────────────────────────────────────────────────

export function useTheme(): ThemeContextValue {
  return useContext(ThemeContext);
}
