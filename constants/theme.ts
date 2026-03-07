import { MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { useSettingsStore } from '../stores/useSettingsStore';

export const colors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  error: '#F44336',
  warning: '#FF9800',
  background: '#FFFFFF',
  surface: '#F5F5F5',
  text: '#212121',
  textLight: '#757575',
};

export const darkColors = {
  primary: '#4CAF50',
  secondary: '#2196F3',
  error: '#F44336',
  warning: '#FF9800',
  background: '#121212',
  surface: '#1E1E1E',
  text: '#E0E0E0',
  textLight: '#9E9E9E',
};

export type Colors = typeof colors;

export function useColors(): Colors {
  const isDarkMode = useSettingsStore((s) => s.isDarkMode);
  return isDarkMode ? darkColors : colors;
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

export const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: colors.primary,
    secondary: colors.secondary,
    error: colors.error,
    background: colors.background,
    surface: colors.surface,
  },
};

export const darkTheme = {
  ...MD3DarkTheme,
  colors: {
    ...MD3DarkTheme.colors,
    primary: darkColors.primary,
    secondary: darkColors.secondary,
    error: darkColors.error,
    background: darkColors.background,
    surface: darkColors.surface,
  },
};
