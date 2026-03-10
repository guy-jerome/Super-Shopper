import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useColorScheme } from 'react-native';
import { useSettingsStore } from '../stores/useSettingsStore';

// ─── Cozy palette ────────────────────────────────────────────────────────────
// Light mode: warm parchment, house-plant sage, butter yellow notepad
export const colors = {
  // Brand
  primary: '#7BA05B',       // sage green (house plant)
  primaryDark: '#4E7C3A',   // deeper sage (pressed / active)
  primaryLight: '#D4E8C2',  // light sage (chip backgrounds, badges)
  // Status
  error: '#C0524A',         // muted terracotta
  warning: '#D4874A',       // earthy amber (low-stock)
  // Backgrounds
  background: '#FEFAE0',    // warm parchment (app bg)
  surface: '#FFFEF7',       // paper white (cards, dialogs)
  butter: '#FFF3B0',        // notepad yellow (shop tab)
  butterDark: '#EDE068',    // ruled-line yellow (dividers in shop)
  // Text
  text: '#4A3728',          // warm brown (pencil on paper)
  textLight: '#8C7B6E',     // muted warm grey
  // Accents
  dustyRose: '#E8BFB8',     // soft blush
  lavender: '#C8BEE8',      // soft purple
  softShadow: '#E0D5C8',    // borders / dividers
};

// Dark mode: cozy evening — deep espresso darks, candlelight accents
export const darkColors = {
  primary: '#8FC46A',
  primaryDark: '#7BA05B',
  primaryLight: '#2D4A1E',
  error: '#D4706A',
  warning: '#D4874A',
  background: '#1E1A16',
  surface: '#2C2520',
  butter: '#3A3010',
  butterDark: '#4A3E18',
  text: '#EDE4D8',
  textLight: '#A09080',
  dustyRose: '#6E3E38',
  lavender: '#4A4268',
  softShadow: '#3A3020',
};

export type Colors = typeof colors;

export function useColors(): Colors {
  const themeMode = useSettingsStore((s) => s.themeMode);
  const systemScheme = useColorScheme();
  const isDark = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  return isDark ? darkColors : colors;
}

// ─── Spacing ─────────────────────────────────────────────────────────────────
export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ─── Border radii ─────────────────────────────────────────────────────────────
export const radius = {
  sm: 8,
  md: 12,
  lg: 20,
  pill: 24,
};

// ─── React Native Paper MD3 themes ───────────────────────────────────────────
export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.dustyRose,
    error: colors.error,
    background: colors.background,
    surface: colors.surface,
    onPrimary: '#FFFFFF',
    onBackground: colors.text,
    onSurface: colors.text,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    secondary: darkColors.dustyRose,
    error: darkColors.error,
    background: darkColors.background,
    surface: darkColors.surface,
    onPrimary: '#FFFFFF',
    onBackground: darkColors.text,
    onSurface: darkColors.text,
  },
};
