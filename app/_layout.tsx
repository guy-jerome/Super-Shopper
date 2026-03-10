import { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { Stack, useRouter, useSegments } from 'expo-router';
import { PaperProvider, Text } from 'react-native-paper';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { seasonThemes } from '../constants/theme';
import { useAuthStore } from '../stores/useAuthStore';
import { useSettingsStore } from '../stores/useSettingsStore';
import { useItemStore } from '../stores/useItemStore';
import { useLowStockStore } from '../stores/useLowStockStore';
import { useOfflineSync } from '../hooks/useOfflineSync';

export default function RootLayout() {
  const { user, isLoading, initialize } = useAuthStore();
  const { season, loadSeason } = useSettingsStore();
  const { loadSortOrder } = useItemStore();
  const { loadLowStock } = useLowStockStore();
  const { status } = useOfflineSync();
  const router = useRouter();
  const segments = useSegments();

  useEffect(() => {
    initialize();
    loadSeason();
    loadSortOrder();
    loadLowStock();
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
      <PaperProvider theme={seasonThemes[season]}>
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
