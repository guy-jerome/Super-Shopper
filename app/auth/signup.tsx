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

export default function SignupScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  const { signUp } = useAuthStore();
  const router = useRouter();

  const handleSignUp = async () => {
    if (!email.trim() || !password || !confirmPassword) {
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
      const redirectTo = Linking.createURL("auth/confirm");
      await signUp(email.trim(), password, redirectTo);
      setEmailSent(true);
    } catch (e: any) {
      setError(e.message ?? "Sign up failed. Please try again.");
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
            Create an account
          </Text>
        </View>

        <Banner
          visible={emailSent}
          icon={({ size }) => (
            <MaterialCommunityIcons
              name="email-check-outline"
              size={size}
              color="green"
            />
          )}
          actions={[
            { label: "Sign In", onPress: () => router.push("/auth/login") },
          ]}
          style={styles.banner}
        >
          Account created! Check your inbox at {email.trim()} and click the
          verification link before signing in.
        </Banner>

        <View style={styles.form}>
          <TextInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
          />
          <TextInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            style={styles.input}
            mode="outlined"
            onSubmitEditing={handleSignUp}
          />
          {!!error && (
            <HelperText type="error" visible>
              {error}
            </HelperText>
          )}
          <Button
            mode="contained"
            onPress={handleSignUp}
            loading={loading}
            disabled={loading}
            style={styles.button}
            contentStyle={styles.buttonContent}
          >
            Create Account
          </Button>
          <Button
            mode="text"
            onPress={() => router.push("/auth/login")}
            style={styles.linkButton}
          >
            Already have an account? Sign In
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
    banner: { marginBottom: spacing.md },
    form: { width: "100%" },
    input: { marginBottom: spacing.md },
    button: { marginTop: spacing.sm },
    buttonContent: { paddingVertical: spacing.xs },
    linkButton: { marginTop: spacing.sm },
  });
}
