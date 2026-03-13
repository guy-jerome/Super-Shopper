import { useEffect } from "react";
import { Platform, StyleSheet, View } from "react-native";
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

  // Handle password-reset deep links (super-shopper://auth/reset-password?code=xxx)
  useEffect(() => {
    const handleUrl = async (url: string) => {
      const parsed = Linking.parse(url);
      const code = parsed.queryParams?.code;
      if (typeof code === "string") {
        await supabase.auth.exchangeCodeForSession(code);
      }
    };
    Linking.getInitialURL().then((url) => {
      if (url) handleUrl(url);
    });
    const sub = Linking.addEventListener("url", ({ url }) => handleUrl(url));
    return () => sub.remove();
  }, []);

  // When Supabase puts us in recovery mode, navigate to the reset-password screen
  useEffect(() => {
    if (isRecovery) router.replace("/auth/reset-password");
  }, [isRecovery]);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "auth";
    if (!user && !inAuthGroup) {
      router.replace("/auth/login");
    } else if (user && inAuthGroup && !isRecovery) {
      router.replace("/(tabs)/home-storage");
    }
  }, [user, isLoading, segments, isRecovery]);

  // On web fonts load in the background — don't block render
  if (!fontsLoaded && Platform.OS !== "web") return null;

  return (
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
