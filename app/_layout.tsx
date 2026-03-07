import { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme, darkTheme } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSettingsStore';

export default function RootLayout() {
  const { user, isLoading, initialize } = useAuthStore();
  const { isDarkMode, loadTheme } = useSettingsStore();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
    loadTheme();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === 'auth';
    if (!user && !inAuthGroup) {
      router.replace('/auth/login');
    } else if (user && inAuthGroup) {
      router.replace('/(tabs)/home-storage');
    }
  }, [user, isLoading, segments]);

  return (
    <GestureHandlerRootView style={styles.root}>
      <PaperProvider theme={isDarkMode ? darkTheme : theme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});
