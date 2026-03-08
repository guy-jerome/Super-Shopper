import { useEffect } from 'react';
import { StyleSheet, View, useColorScheme } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider, Text } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { theme, darkTheme } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useItemStore } from '../stores/useItemStore';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function RootLayout() {
  const { user, isLoading, initialize } = useAuthStore();
  const { themeMode, loadTheme } = useSettingsStore();
  const systemScheme = useColorScheme();
  const isDarkMode = themeMode === 'dark' || (themeMode === 'system' && systemScheme === 'dark');
  const { loadSortOrder } = useItemStore();
  const { status } = useOfflineSync();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
    loadTheme();
    loadSortOrder();
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
        {status !== 'online' && (
          <View style={status === 'offline' ? styles.offlineBanner : styles.syncBanner}>
            <Text style={styles.bannerText}>
              {status === 'offline' ? 'No internet connection' : 'Syncing...'}
            </Text>
          </View>
        )}
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
  offlineBanner: {
    backgroundColor: '#B71C1C',
    paddingVertical: 6,
    alignItems: 'center',
  },
  syncBanner: {
    backgroundColor: '#1565C0',
    paddingVertical: 6,
    alignItems: 'center',
  },
  bannerText: { color: '#fff', fontSize: 13, fontWeight: '600' },
});
