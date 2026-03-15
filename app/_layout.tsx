import { useEffect, Component, type ReactNode } from "react";
import { Platform, StyleSheet, View, TouchableOpacity, Text as RNText } from "react-native";
import { Stack, useRouter, useSegments } from "expo-router";
import { PaperProvider, Text } from "react-native-paper";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import {
  useFonts,
  Nunito_400Regular,
  Nunito_600SemiBold,
  Nunito_700Bold,
  Nunito_800ExtraBold,
} from "@expo-google-fonts/nunito";
import { Caveat_700Bold } from "@expo-google-fonts/caveat";
import * as Linking from "expo-linking";
import * as SplashScreen from "expo-splash-screen";
import { seasonThemes } from "../constants/theme";
import { useAuthStore } from "../stores/useAuthStore";
import { useSettingsStore } from "../stores/useSettingsStore";
import { useItemStore } from "../stores/useItemStore";
import { useLowStockStore } from "../stores/useLowStockStore";
import { useHouseholdStore } from "../stores/useHouseholdStore";
import { useOfflineSync } from "../hooks/useOfflineSync";
import { supabase } from "../lib/supabase";

SplashScreen.preventAutoHideAsync();

// ─── Error Boundary ───────────────────────────────────────────────────────────

class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean; message: string }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, message: error?.message ?? 'Unknown error' };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReload = () => {
    if (Platform.OS === 'web') {
      // @ts-ignore
      window.location.reload();
    } else {
      this.setState({ hasError: false, message: '' });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={errorStyles.container}>
          <RNText style={errorStyles.emoji}>⚠️</RNText>
          <RNText style={errorStyles.title}>Something went wrong</RNText>
          <RNText style={errorStyles.detail} numberOfLines={3}>{this.state.message}</RNText>
          <TouchableOpacity style={errorStyles.button} onPress={this.handleReload}>
            <RNText style={errorStyles.buttonText}>Reload app</RNText>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const errorStyles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, backgroundColor: '#fff' },
  emoji: { fontSize: 48, marginBottom: 12 },
  title: { fontSize: 20, fontWeight: '700', color: '#333', marginBottom: 8 },
  detail: { fontSize: 13, color: '#888', textAlign: 'center', marginBottom: 24 },
  button: { backgroundColor: '#4A7C6F', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24 },
  buttonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Nunito_400Regular,
    Nunito_600SemiBold,
    Nunito_700Bold,
    Nunito_800ExtraBold,
    Caveat_700Bold,
  });
  const { user, isLoading, initialize, isRecovery } = useAuthStore();
  const { season, loadSeason } = useSettingsStore();
  const { loadSortOrder } = useItemStore();
  const { loadLowStock } = useLowStockStore();
  const { loadHousehold } = useHouseholdStore();
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
    if (user) loadHousehold();
  }, [user?.id]);

  useEffect(() => {
    if (fontsLoaded) SplashScreen.hideAsync();
  }, [fontsLoaded]);

  // Exchange PKCE code for email-confirm deep links (native only).
  // Recovery (password reset) is handled inside reset-password.tsx itself.
  useEffect(() => {
    const handleUrl = async (url: string) => {
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code;
      const type = parsed.queryParams?.type;
      if (typeof code === 'string' && type !== 'recovery') {
        await supabase.auth.exchangeCodeForSession(code);
      }
    };
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener('url', ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  // When Supabase puts us in recovery mode (native deep link), navigate to the reset-password screen
  useEffect(() => {
    if (isRecovery) router.replace("/auth/reset-password");
  }, [isRecovery]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "auth";
    // Never redirect away from reset-password — it handles its own session exchange
    if (segments[1] === "reset-password") return;
    if (!user && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)/home-storage");
    }
  }, [user, isLoading, segments, isRecovery]);

  // On web fonts load in the background — don't block render
  if (!fontsLoaded && Platform.OS !== "web") return null;

  return (
    <ErrorBoundary>
    <GestureHandlerRootView style={styles.root}>
      <PaperProvider theme={seasonThemes[season]}>
        {status !== "online" && (
          <View
            style={
              status === "offline" ? styles.offlineBanner : styles.syncBanner
            }
          >
            <Text style={styles.bannerText}>
              {status === "offline" ? "No internet connection" : "Syncing..."}
            </Text>
          </View>
        )}
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/login" />
          <Stack.Screen name="auth/signup" />
          <Stack.Screen name="auth/confirm" />
          <Stack.Screen name="auth/forgot-password" />
          <Stack.Screen name="auth/reset-password" />
        </Stack>
      </PaperProvider>
    </GestureHandlerRootView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  offlineBanner: {
    backgroundColor: "#B71C1C",
    paddingVertical: 6,
    alignItems: "center",
  },
  syncBanner: {
    backgroundColor: "#1565C0",
    paddingVertical: 6,
    alignItems: "center",
  },
  bannerText: { color: "#fff", fontSize: 13, fontWeight: "600" },
});
