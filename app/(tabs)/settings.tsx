import { useMemo, useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Platform, ScrollView, Share } from 'react-native';
import { Text, List, Divider, Button, Avatar, Surface, Portal, Dialog, TextInput, Snackbar, IconButton, Menu } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import { useAuthStore } from '../../stores/useAuthStore';
import { useSettingsStore, type Season } from '../../stores/useSettingsStore';
import { useShareStore } from '../../stores/useShareStore';
import { useHouseholdStore } from '../../stores/useHouseholdStore';
import { useColors, spacing, radius, seasonPalettes, type Colors, useSeasonalBgStyle } from '../../constants/theme';
import { PageHeader } from '../../components/PageHeader';
import { TabBackground } from '../../components/TabBackground';

const SEASONS: { id: Season; label: string; icon: string; swatches: string[] }[] = [
  { id: 'spring', label: 'Spring', icon: 'flower-tulip-outline', swatches: ['#F5D2D2', '#F8F7BA', '#BDE3C3', '#A3CCDA'] },
  { id: 'summer', label: 'Summer', icon: 'white-balance-sunny',  swatches: ['#84B179', '#A2CB8B', '#C7EABB', '#E8F5BD'] },
  { id: 'autumn', label: 'Autumn', icon: 'leaf-maple',           swatches: ['#A5B68D', '#ECDCCC', '#FCFAEE', '#DA8359'] },
  { id: 'winter', label: 'Winter', icon: 'snowflake',            swatches: ['#213448', '#547792', '#94B4C1', '#EAE0CF'] },
];

export default function SettingsScreen() {
  const { user, signOut, updatePassword, deleteAccount } = useAuthStore();
  const { season, setSeason } = useSettingsStore();
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bgStyle = useSeasonalBgStyle(colors.background);
  const seasonIcon = season === 'spring' ? 'flower-tulip-outline' : season === 'summer' ? 'white-balance-sunny' : season === 'autumn' ? 'leaf-maple' : 'snowflake';

  const { myShares, loadShares, shareWithEmail, removeShare } = useShareStore();
  const { household, members, loadHousehold, createHousehold, joinHousehold, leaveHousehold, generateInviteCode } = useHouseholdStore();

  const [accountDialog, setAccountDialog] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [shareDialog, setShareDialog] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [shareEmail, setShareEmail] = useState('');
  const [shareError, setShareError] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [snackbar, setSnackbar] = useState('');
  const [accountMenu, setAccountMenu] = useState(false);
  const [householdDialog, setHouseholdDialog] = useState(false);
  const [householdName, setHouseholdName] = useState('');
  const [joinCode, setJoinCode] = useState('');
  const [householdLoading, setHouseholdLoading] = useState(false);
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);
  const [householdError, setHouseholdError] = useState('');
  const [leaveConfirm, setLeaveConfirm] = useState(false);

  useEffect(() => { loadShares(); }, []);

  const handleCreateHousehold = async () => {
    setHouseholdError('');
    if (!householdName.trim()) return;
    setHouseholdLoading(true);
    try {
      await createHousehold(householdName.trim());
      setHouseholdName('');
      setSnackbar('Household created!');
    } catch (e: any) {
      setHouseholdError(e.message ?? 'Failed to create household');
    } finally {
      setHouseholdLoading(false);
    }
  };

  const handleJoinHousehold = async () => {
    setHouseholdError('');
    if (!joinCode.trim()) return;
    setHouseholdLoading(true);
    try {
      await joinHousehold(joinCode.trim().toUpperCase());
      setJoinCode('');
      setSnackbar('Joined household!');
    } catch (e: any) {
      setHouseholdError(e.message ?? 'Failed to join household');
    } finally {
      setHouseholdLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setHouseholdLoading(true);
    try {
      const code = await generateInviteCode();
      setGeneratedCode(code);
    } catch (e: any) {
      setHouseholdError(e.message ?? 'Failed to generate code');
    } finally {
      setHouseholdLoading(false);
    }
  };

  const handleLeaveHousehold = async () => {
    setHouseholdLoading(true);
    try {
      await leaveHousehold();
      setLeaveConfirm(false);
      setHouseholdDialog(false);
      setSnackbar('Left household');
    } finally {
      setHouseholdLoading(false);
    }
  };

  const handleShare = async () => {
    setShareError('');
    if (!shareEmail.trim()) return;
    setIsSharing(true);
    try {
      await shareWithEmail(shareEmail);
      setShareEmail('');
      setSnackbar('List shared successfully');
    } catch (e: any) {
      setShareError(e.message ?? 'Failed to share');
    } finally {
      setIsSharing(false);
    }
  };

  const handleRemoveShare = async (shareId: string, email: string) => {
    await removeShare(shareId);
    setSnackbar(`Removed share with ${email}`);
  };

  const initials = user?.email
    ? user.email.split('@')[0].slice(0, 2).toUpperCase()
    : '??';

  const handleChangePassword = async () => {
    setPasswordError('');
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters');
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
    <View style={[styles.container, bgStyle]}>
      <TabBackground tab="settings" />
      <PageHeader title="Settings" colors={colors} tab="settings" titleFont="handwritten" />
      {Platform.OS === 'web' && (
        <View style={styles.seasonDecor} pointerEvents="none">
          <MaterialCommunityIcons name={seasonIcon as any} size={180} color={colors.primary} />
        </View>
      )}

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      {/* Account card — tap for sign out */}
      <Menu
        visible={accountMenu}
        onDismiss={() => setAccountMenu(false)}
        anchor={
          <TouchableOpacity onPress={() => setAccountMenu(true)} activeOpacity={0.7}>
            <Surface style={styles.accountCard} elevation={1}>
              <Avatar.Text size={56} label={initials} style={styles.avatar} />
              <View style={styles.accountInfo}>
                <Text variant="titleMedium" style={styles.email}>{user?.email}</Text>
                <Text variant="bodySmall" style={styles.accountLabel}>Tap to manage account</Text>
              </View>
              <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textLight} />
            </Surface>
          </TouchableOpacity>
        }
      >
        <Menu.Item
          leadingIcon="logout"
          onPress={() => { setAccountMenu(false); signOut(); }}
          title="Sign Out"
          titleStyle={{ color: colors.error }}
        />
      </Menu>

      {/* Settings list */}
      <View style={styles.section}>
        <List.Item
          title="Account"
          description="Change password or delete account"
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
          left={(p) => <List.Icon {...p} icon="account-circle-outline" color={colors.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => setAccountDialog(true)}
        />
        <Divider style={styles.divider} />
        <List.Item
          title="Shared Lists"
          description={myShares.length > 0 ? `Shared with ${myShares.length} person${myShares.length !== 1 ? 's' : ''}` : 'Share your list with family'}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
          left={(p) => <List.Icon {...p} icon="account-group-outline" color={colors.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => setShareDialog(true)}
        />
        <Divider style={styles.divider} />
        <List.Item
          title="Household"
          description={household ? `${household.name} · ${members.length} member${members.length !== 1 ? 's' : ''}` : 'Share lists in real time with family'}
          titleStyle={styles.listItemTitle}
          descriptionStyle={styles.listItemDescription}
          left={(p) => <List.Icon {...p} icon="home-account" color={colors.primary} />}
          right={(p) => <List.Icon {...p} icon="chevron-right" />}
          onPress={() => { setHouseholdError(''); setGeneratedCode(null); setHouseholdDialog(true); }}
        />
        <Divider style={styles.divider} />
        <View style={styles.seasonSection}>
          <View style={styles.seasonSectionHeader}>
            <MaterialCommunityIcons name="palette-outline" size={20} color={colors.primary} />
            <Text variant="labelLarge" style={styles.seasonSectionLabel}>Season Theme</Text>
          </View>
          <View style={styles.seasonGrid}>
            {SEASONS.map((s) => {
              const p = seasonPalettes[s.id];
              const active = season === s.id;
              return (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.seasonCard, { borderColor: active ? p.primary : p.softShadow, borderWidth: active ? 2.5 : 1.5 }]}
                  onPress={() => setSeason(s.id)}
                  activeOpacity={0.8}
                >
                  {/* Canopy stripe */}
                  <View style={[styles.seasonCanopy, { backgroundColor: p.primary }]} />
                  {/* Palette swatches */}
                  <View style={styles.seasonSwatches}>
                    {s.swatches.map((hex, i) => (
                      <View key={i} style={[styles.seasonSwatch, { backgroundColor: hex }]} />
                    ))}
                  </View>
                  {/* Icon + label */}
                  <View style={[styles.seasonBody, { backgroundColor: p.background }]}>
                    <MaterialCommunityIcons name={s.icon as any} size={22} color={p.primary} />
                    <Text style={[styles.seasonName, { color: p.text }]}>{s.label}</Text>
                    {active && (
                      <MaterialCommunityIcons name="check-circle" size={14} color={p.primary} style={{ marginTop: 2 }} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>


      <Portal>
        {/* Household dialog */}
        <Dialog visible={householdDialog} onDismiss={() => { setHouseholdDialog(false); setHouseholdName(''); setJoinCode(''); setHouseholdError(''); setGeneratedCode(null); }}>
          <Dialog.Title>{household ? household.name : 'Household'}</Dialog.Title>
          <Dialog.Content>
            {household ? (
              <>
                <Text variant="bodySmall" style={styles.dialogEmail}>
                  Real-time shared shopping list with your household.
                </Text>
                <Text variant="titleSmall" style={[styles.sectionLabel, { marginTop: spacing.sm }]}>Members</Text>
                {members.map((m) => {
                  const initials = m.email.slice(0, 2).toUpperCase();
                  return (
                    <View key={m.user_id} style={styles.shareRow}>
                      <Avatar.Text size={32} label={initials} style={{ backgroundColor: colors.primary, marginRight: spacing.sm }} />
                      <Text style={{ flex: 1, color: colors.text }}>{m.email}</Text>
                    </View>
                  );
                })}
                {generatedCode ? (
                  <View style={styles.inviteCodeBox}>
                    <Text variant="bodySmall" style={styles.dialogEmail}>Share this code — expires in 24 hours:</Text>
                    <Text selectable style={styles.inviteCodeText}>{generatedCode}</Text>
                    <Button
                      icon="share-variant-outline"
                      mode="outlined"
                      compact
                      style={{ marginTop: 8 }}
                      onPress={() => Share.share({ message: `Join my Super Shopper household with code: ${generatedCode}` })}
                    >
                      Share Code
                    </Button>
                  </View>
                ) : null}
                {!!householdError && <Text style={styles.errorText}>{householdError}</Text>}
              </>
            ) : (
              <>
                <Text variant="bodySmall" style={styles.dialogEmail}>
                  Create a household or join one with an invite code.
                </Text>
                <TextInput
                  label="Household name"
                  value={householdName}
                  onChangeText={(t) => { setHouseholdName(t); setHouseholdError(''); }}
                  mode="outlined"
                  style={styles.input}
                />
                <Button
                  mode="contained"
                  onPress={handleCreateHousehold}
                  loading={householdLoading}
                  disabled={!householdName.trim() || householdLoading}
                  style={{ marginBottom: spacing.md }}
                >
                  Create Household
                </Button>
                <View style={styles.orDivider}>
                  <View style={styles.orLine} />
                  <Text style={styles.orText}>or</Text>
                  <View style={styles.orLine} />
                </View>
                <TextInput
                  label="Invite code"
                  value={joinCode}
                  onChangeText={(t) => { setJoinCode(t); setHouseholdError(''); }}
                  mode="outlined"
                  autoCapitalize="characters"
                  style={styles.input}
                />
                <Button
                  mode="outlined"
                  onPress={handleJoinHousehold}
                  loading={householdLoading}
                  disabled={!joinCode.trim() || householdLoading}
                >
                  Join with Code
                </Button>
                {!!householdError && <Text style={styles.errorText}>{householdError}</Text>}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions style={household ? styles.dialogActions : undefined}>
            {household && (
              <Button textColor={colors.error} onPress={() => setLeaveConfirm(true)}>
                Leave
              </Button>
            )}
            <View style={household ? styles.dialogRightActions : undefined}>
              {household && (
                <Button onPress={handleGenerateCode} loading={householdLoading} disabled={householdLoading}>
                  Invite Code
                </Button>
              )}
              <Button onPress={() => { setHouseholdDialog(false); setHouseholdName(''); setJoinCode(''); setHouseholdError(''); setGeneratedCode(null); }}>
                {household ? 'Close' : 'Cancel'}
              </Button>
            </View>
          </Dialog.Actions>
        </Dialog>

        {/* Leave household confirmation */}
        <Dialog visible={leaveConfirm} onDismiss={() => setLeaveConfirm(false)}>
          <Dialog.Title>Leave Household?</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.text }}>
              You will lose access to the shared list. You can rejoin with a new invite code.
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setLeaveConfirm(false)}>Cancel</Button>
            <Button textColor={colors.error} onPress={handleLeaveHousehold} loading={householdLoading}>
              Leave
            </Button>
          </Dialog.Actions>
        </Dialog>

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

        {/* Shared Lists dialog */}
        <Dialog visible={shareDialog} onDismiss={() => { setShareDialog(false); setShareEmail(''); setShareError(''); }}>
          <Dialog.Title>Shared Lists</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodySmall" style={styles.dialogEmail}>Share today's shopping list with another Super Shopper user.</Text>
            <TextInput
              label="Their email address"
              value={shareEmail}
              onChangeText={(t) => { setShareEmail(t); setShareError(''); }}
              mode="outlined"
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
              onSubmitEditing={handleShare}
            />
            {!!shareError && <Text style={styles.errorText}>{shareError}</Text>}
            <Button
              mode="contained"
              onPress={handleShare}
              loading={isSharing}
              disabled={!shareEmail.trim() || isSharing}
              style={{ marginBottom: spacing.md }}
            >
              Share
            </Button>
            {myShares.length > 0 && (
              <>
                <Text variant="titleSmall" style={[styles.sectionLabel, { marginTop: spacing.sm }]}>Currently sharing with</Text>
                {myShares.map((s) => (
                  <View key={s.id} style={styles.shareRow}>
                    <Text style={{ flex: 1, color: colors.text }}>{s.email}</Text>
                    <IconButton
                      icon="close-circle-outline"
                      size={20}
                      iconColor={colors.error}
                      onPress={() => handleRemoveShare(s.id, s.email)}
                    />
                  </View>
                ))}
              </>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setShareDialog(false); setShareEmail(''); setShareError(''); }}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete account confirmation */}
        <Dialog visible={deleteDialog} onDismiss={() => setDeleteDialog(false)}>
          <Dialog.Title>Delete Account</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.text }}>
              This will permanently delete all your shopping lists, locations, and items. You will be signed out. This cannot be undone.
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

      <Text style={styles.versionText}>
        Version {Constants.expoConfig?.version ?? '—'}
      </Text>
      </ScrollView>

      <Snackbar visible={!!snackbar} onDismiss={() => setSnackbar('')} duration={3000} style={{ bottom: 92 }}>
        {snackbar}
      </Snackbar>
    </View>
  );
}

function createStyles(colors: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  seasonDecor: {
    position: 'absolute' as const,
    right: -20,
    bottom: 60,
    opacity: 0.06,
    pointerEvents: 'none' as const,
  },
  accountCard: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: spacing.md,
    padding: spacing.md,
    borderRadius: radius.lg,
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    shadowColor: '#4A3728',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  avatar: { backgroundColor: colors.primary },
  accountInfo: { flex: 1 },
  email: { color: colors.text },
  accountLabel: { color: colors.textLight, marginTop: 2 },
  section: {
    marginTop: spacing.sm,
    marginHorizontal: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    shadowColor: '#4A3728',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: 'hidden',
  },
  divider: { backgroundColor: colors.softShadow },
  listItemTitle: { color: colors.text },
  listItemDescription: { color: colors.textLight },

  dialogEmail: { color: colors.textLight, marginBottom: spacing.md },
  sectionLabel: { color: colors.text, marginBottom: spacing.sm },
  input: { marginBottom: spacing.sm, borderColor: colors.softShadow },
  errorText: { color: colors.error, fontSize: 13, marginTop: spacing.xs },
  dialogActions: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  dialogRightActions: { flexDirection: 'row', gap: spacing.xs },
  versionText: {
    color: colors.textLight,
    fontSize: 12,
    textAlign: 'center',
    paddingBottom: spacing.md,
    fontStyle: 'italic',
    letterSpacing: 0.5,
  },
  seasonSection: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
  },
  seasonSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  seasonSectionLabel: { color: colors.textLight },
  seasonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  seasonCard: {
    width: '47%',
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
  },
  seasonCanopy: {
    height: 6,
  },
  seasonSwatches: {
    flexDirection: 'row',
    height: 18,
  },
  seasonSwatch: {
    flex: 1,
  },
  seasonBody: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: 4,
  },
  seasonName: {
    fontSize: 13,
    fontWeight: '600',
  },
  shareRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: colors.softShadow,
  },
  inviteCodeBox: {
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    alignItems: 'center' as const,
  },
  inviteCodeText: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: 6,
    color: colors.primary,
    fontFamily: 'Nunito_800ExtraBold',
  },
  orDivider: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    marginBottom: spacing.sm,
  },
  orLine: { flex: 1, height: 1, backgroundColor: colors.softShadow },
  orText: { color: colors.textLight, marginHorizontal: spacing.sm, fontSize: 12 },
}); }
