import { useState, useMemo, useEffect } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { Text, TextInput, Button, HelperText } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { supabase } from "../../lib/supabase";
import { useColors, spacing, type Colors } from "../../constants/theme";

export default function ResetPasswordScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [exchanging, setExchanging] = useState(false);
  const { updatePassword } = useAuthStore();
  const router = useRouter();
  const { code } = useLocalSearchParams<{ code?: string }>();

  // Exchange the PKCE code from the email link to establish the session.
  // This runs once on mount when the screen is opened from the email link.
  useEffect(() => {
    if (!code) return;
    setExchanging(true);
    supabase.auth.exchangeCodeForSession(code).finally(() => setExchanging(false));
  }, [code]);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setError("Please fill in all fields");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await updatePassword(password);
      router.replace("/(tabs)/home-storage");
    } catch (e: any) {
      setError(e.message ?? "Failed to update password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.header}>
          <Text variant="displaySmall" style={styles.appName}>
            Super Shopper
          </Text>
          <Text variant="bodyLarge" style={styles.subtitle}>
            Choose a new password
          </Text>
        </View>

        <View style={styles.form}>
          <TextInput
            label="New Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            disabled={exchanging}
          />
          <TextInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            onSubmitEditing={handleReset}
            disabled={exchanging}
          />
          {!!error && (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          )}
          <Button
            mode="contained"
            onPress={handleReset}
            loading={loading || exchanging}
            disabled={loading || exchanging}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            {exchanging ? "Verifying link..." : "Update Password"}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: Colors) {
  return StyleSheet.create({
    flex: { flex: 1, backgroundColor: colors.background },
    container: { flexGrow: 1, justifyContent: "center", padding: spacing.xl },
    header: { alignItems: "center", marginBottom: spacing.xl },
    appName: {
      color: colors.primary,
      fontWeight: "bold",
      marginBottom: spacing.sm,
    },
    subtitle: { color: colors.textLight },
    form: { width: "100%" },
    input: { marginBottom: spacing.md },
    button: { marginTop: spacing.sm },
    buttonContent: { paddingVertical: spacing.xs },
  });
}
