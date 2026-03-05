import { View, StyleSheet } from 'react-native';
import { Text, List, Divider, Button, Avatar, Surface } from 'react-native-paper';
import { useAuthStore } from '../../stores/useAuthStore';
import { colors, spacing } from '../../constants/theme';

export default function SettingsScreen() {
  const { user, signOut } = useAuthStore();

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  return (
    <View style={styles.container}>
      <Surface style={styles.headerSurface} elevation={1}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Settings</Text>
      </Surface>

      {/* Account card */}
      <Surface style={styles.accountCard} elevation={1}>
        <Avatar.Text size={56} label={initials} style={styles.avatar} />
        <View style={styles.accountInfo}>
          <Text variant="titleMedium" style={styles.email}>{user?.email}</Text>
          <Text variant="bodySmall" style={styles.accountLabel}>Signed in</Text>
        </View>
      </Surface>

      {/* Settings list */}
      <View style={styles.section}>
        <List.Item
          title="Account"
          description="Manage your account details"
          left={(p) => <List.Icon {...p} icon="account-circle-outline" color={colors.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Shared Lists"
          description="Share your list with family"
          left={(p) => <List.Icon {...p} icon="account-group-outline" color={colors.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
        />
        <Divider />
        <List.Item
          title="Theme"
          description="Light mode"
          left={(p) => <List.Icon {...p} icon="palette-outline" color={colors.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
        />
        <Divider />
      </View>

      <View style={styles.signOutSection}>
        <Button
          mode="outlined"
          onPress={signOut}
          textColor={colors.error}
          style={styles.signOutButton}
          icon="logout"
        >
          Sign Out
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSurface: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerTitle: { color: colors.text, fontWeight: 'bold' },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: 12,
    gap: spacing.md,
    backgroundColor: colors.surface,
  },
  avatar: { backgroundColor: colors.primary },
  accountInfo: { flex: 1 },
  email: { color: colors.text },
  accountLabel: { color: colors.textLight, marginTop: 2 },
  section: { marginTop: spacing.sm },
  signOutSection: { marginTop: 'auto', padding: spacing.md },
  signOutButton: { borderColor: colors.error },
});
