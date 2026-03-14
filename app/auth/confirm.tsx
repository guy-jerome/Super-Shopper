import { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { Text, ActivityIndicator } from "react-native-paper";
import { useRouter } from "expo-router";
import { supabase } from "../../lib/supabase";
import { useColors, spacing } from "../../constants/theme";

export default function ConfirmScreen() {
  const colors = useColors();
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your email…");

  useEffect(() => {
    // Supabase redirects here with the session already set via the URL fragment.
    // Just verify we have a session and navigate forward.
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) {
        setMessage("Email confirmed! Taking you in…");
        setTimeout(() => router.replace("/"), 1000);
      } else {
        setMessage("Confirmation link expired or already used.\nPlease sign in.");
        setTimeout(() => router.replace("/auth/login"), 2500);
      }
    });
  }, []);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ActivityIndicator size="large" color={colors.primary} />
      <Text style={[styles.message, { color: colors.text }]}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: spacing.md,
    padding: spacing.xl,
  },
  message: {
    textAlign: "center",
    fontSize: 16,
  },
});
