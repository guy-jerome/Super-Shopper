import { useMemo, useState } from 'react';
import { View, StyleSheet, Switch } from 'react-native';
import { Text, List, Divider, Button, Avatar, Surface, Portal, Dialog, TextInput, Snackbar } from 'react-native-paper';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useColors, spacing, type Colors } from '../../constants/theme';

export default function SettingsScreen() {
  const { user, signOut, updatePassword, deleteAccount } = useAuthStore();
  const { isDarkMode, toggleTheme } = useSettingsStore();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [accountDialog, setAccountDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [snackbar, setSnackbar] = useState('');

  const initials = user?.email?.slice(0, 2).toUpperCase() ?? '??';

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }
    setIsSaving(true);
    try {
      await updatePassword(newPassword);
      setAccountDialog(false);
      setNewPassword('');
      setConfirmPassword('');
      setSnackbar('Password updated successfully');
    } catch (e: any) {
      setPasswordError(e.message ?? 'Failed to update password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsSaving(true);
    try {
      await deleteAccount();
    } catch {
      setDeleteDialog(false);
      setSnackbar('Could not delete account. Contact support.');
    } finally {
      setIsSaving(false);
    }
  };

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
          description="Change password or delete account"
          left={(p) => <List.Icon {...p} icon="account-circle-outline" color={colors.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => setAccountDialog(true)}
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
          title="Dark Mode"
          description={isDarkMode ? 'Dark' : 'Light'}
          left={(p) => <List.Icon {...p} icon="palette-outline" color={colors.primary} />}
          right={() => (
            <Switch
              value={isDarkMode}
              onValueChange={toggleTheme}
              trackColor={{ true: colors.primary }}
            />
          )}
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

      <Portal>
        {/* Account management dialog */}
        <Dialog visible={accountDialog} onDismiss={() => { setAccountDialog(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}>
          <Dialog.Title>Account</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={styles.dialogEmail}>{user?.email}</Text>
            <Text variant="titleSmall" style={styles.sectionLabel}>Change Password</Text>
            <TextInput
              label="New password"
              value={newPassword}
              onChangeText={(t) => { setNewPassword(t); setPasswordError(''); }}
              mode="outlined"
              secureTextEntry
              style={styles.input}
            />
            <TextInput
              label="Confirm new password"
              value={confirmPassword}
              onChangeText={(t) => { setConfirmPassword(t); setPasswordError(''); }}
              mode="outlined"
              secureTextEntry
              style={styles.input}
              onSubmitEditing={handleChangePassword}
            />
            {!!passwordError && (
              <Text style={styles.errorText}>{passwordError}</Text>
            )}
          </Dialog.Content>
          <Dialog.Actions style={styles.dialogActions}>
            <Button
              textColor={colors.error}
              onPress={() => { setAccountDialog(false); setDeleteDialog(true); }}
            >
              Delete Account
            </Button>
            <View style={styles.dialogRightActions}>
              <Button onPress={() => { setAccountDialog(false); setNewPassword(''); setConfirmPassword(''); setPasswordError(''); }}>
                Cancel
              </Button>
              <Button
                mode="contained"
                onPress={handleChangePassword}
                loading={isSaving}
                disabled={!newPassword || !confirmPassword || isSaving}
              >
                Save
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>

        {/* Delete account confirmation */}
        <Dialog visible={deleteDialog} onDismiss={() => setDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.text }}>
              This will permanently delete your account and all your data. This cannot be undone.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteDialog(false)}>Cancel</Button>
            <Button textColor={colors.error} onPress={handleDeleteAccount} loading={isSaving}>
              Delete Forever
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

function createStyles(colors: Colors) { return StyleSheet.create({
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
  dialogEmail: { color: colors.textLight, marginBottom: spacing.md },
  sectionLabel: { color: colors.text, marginBottom: spacing.sm },
  input: { marginBottom: spacing.sm },
  errorText: { color: colors.error, fontSize: 13, marginTop: spacing.xs },
  dialogActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dialogRightActions: { flexDirection: 'row', gap: spacing.xs },
}); }
