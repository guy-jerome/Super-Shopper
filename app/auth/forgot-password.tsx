import { useState, useMemo } from "react";
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import {
  Text,
  TextInput,
  Button,
  HelperText,
  Banner,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Linking from "expo-linking";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../stores/useAuthStore";
import { useColors, spacing, type Colors } from "../../constants/theme";

export default function ForgotPasswordScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { resetPasswordForEmail } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email.trim()) {
      setError("Please enter your email address");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const redirectTo = Linking.createURL("auth/reset-password");
      await resetPasswordForEmail(email.trim(), redirectTo);
      setSent(true);
    } catch (e: any) {
      setError(e.message ?? "Failed to send reset email. Please try again.");
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
            Reset your password
          </Text>
        </View>

        <Banner
          visible={sent}
          icon={({ size }) => (
            <MaterialCommunityIcons
              name="email-check-outline"
              size={size}
              color="green"
            />
          )}
          actions={[
            {
              label: "Back to Sign In",
              onPress: () => router.replace("/auth/login"),
            },
          ]}
          style={styles.banner}
        >
          Password reset email sent to {email.trim()}. Check your inbox and
          follow the link to set a new password.
        </Banner>

        {!sent && (
          <View style={styles.form}>
            <Text variant="bodyMedium" style={styles.instructions}>
              Enter your email address and we'll send you a link to reset your
              password.
            </Text>
            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              style={styles.input}
              mode="outlined"
              onSubmitEditing={handleSubmit}
            />
            {!!error && (
              <HelperText type="error" visible>
                {error}
              </HelperText>
            )}
            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              Send Reset Email
            </Button>
            <Button
              mode="text"
              onPress={() => router.back()}
              style={styles.linkButton}
            >
              Back to Sign In
            </Button>
          </View>
        )}
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
    banner: { marginBottom: spacing.md },
    form: { width: "100%" },
    instructions: { color: colors.textLight, marginBottom: spacing.md },
    input: { marginBottom: spacing.md },
    button: { marginTop: spacing.sm },
    buttonContent: { paddingVertical: spacing.xs },
    linkButton: { marginTop: spacing.sm },
  });
}
