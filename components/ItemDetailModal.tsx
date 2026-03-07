import { useState, useEffect } from 'react';
import { View, ScrollView, Image, StyleSheet, Modal } from 'react-native';
import {
  Text, TextInput, Button, IconButton, Chip, ActivityIndicator, Divider,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useAuthStore } from '../stores/useAuthStore';
import { useItemStore, type ItemWithLocations } from '../stores/useItemStore';
import { colors, spacing } from '../constants/theme';

type Props = {
  itemId: string | null;
  onDismiss: () => void;
};

export function ItemDetailModal({ itemId, onDismiss }: Props) {
  const { user } = useAuthStore();
  const { items, updateItemName, updateItemTags, updateItemDetails, uploadItemImage } = useItemStore();
  const item = items.find((i) => i.id === itemId) ?? null;

  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBrand, setEditBrand] = useState('');
  const [editQuantity, setEditQuantity] = useState('');
  const [editTagList, setEditTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    if (item) {
      setImgError(false);
    }
  }, [item?.id]);

  const startEdit = () => {
    if (!item) return;
    setEditName(item.name);
    setEditBrand(item.brand ?? '');
    setEditQuantity(item.quantity ?? '');
    setEditTagList([...item.tags]);
    setTagInput('');
    setEditing(true);
  };

  const saveEdit = async () => {
    if (!item) return;
    if (editName.trim() && editName.trim() !== item.name) {
      await updateItemName(item.id, editName.trim());
    }
    await updateItemDetails(item.id, {
      brand: editBrand.trim() || null,
      quantity: editQuantity.trim() || null,
    });
    await updateItemTags(item.id, editTagList);
    setEditing(false);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !editTagList.includes(t)) setEditTagList((prev) => [...prev, t]);
    setTagInput('');
  };

  const pickImage = async (fromCamera: boolean) => {
    if (!user || !item) return;
    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await fn({
      mediaTypes: ['images'],
      quality: 0.75,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    setUploading(true);
    await uploadItemImage(item.id, user.id, result.assets[0].uri);
    setUploading(false);
    setImgError(false);
  };

  const dismiss = () => {
    setEditing(false);
    onDismiss();
  };

  if (!itemId) return null;

  return (
    <Modal visible animationType="slide" onRequestClose={dismiss}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <IconButton icon="close" onPress={dismiss} iconColor={colors.text} />
          <Text variant="titleMedium" style={styles.headerTitle} numberOfLines={1}>
            {item?.name ?? ''}
          </Text>
          {!editing ? (
            <IconButton icon="pencil-outline" onPress={startEdit} iconColor={colors.primary} />
          ) : (
            <IconButton icon="check" onPress={saveEdit} iconColor={colors.primary} />
          )}
        </View>
        <Divider />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {/* Image */}
          <View style={styles.imageSection}>
            {item?.image_url && !imgError ? (
              <Image
                source={{ uri: item.image_url }}
                style={styles.itemImage}
                onError={() => setImgError(true)}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                {uploading ? (
                  <ActivityIndicator size="large" color={colors.primary} />
                ) : (
                  <MaterialCommunityIcons name="food-outline" size={72} color={colors.textLight} />
                )}
              </View>
            )}
            <View style={styles.imageButtons}>
              <Button
                mode="outlined"
                icon="camera"
                onPress={() => pickImage(true)}
                style={styles.imageBtn}
                loading={uploading}
                disabled={uploading}
              >
                Camera
              </Button>
              <Button
                mode="outlined"
                icon="image"
                onPress={() => pickImage(false)}
                style={styles.imageBtn}
                loading={uploading}
                disabled={uploading}
              >
                Gallery
              </Button>
            </View>
          </View>

          <Divider style={styles.divider} />

          {/* Details — view or edit */}
          {editing ? (
            <View style={styles.details}>
              <TextInput
                label="Name"
                value={editName}
                onChangeText={setEditName}
                mode="outlined"
                style={styles.field}
              />
              <TextInput
                label="Brand"
                value={editBrand}
                onChangeText={setEditBrand}
                mode="outlined"
                style={styles.field}
                placeholder="e.g. General Mills"
              />
              <TextInput
                label="Size / Quantity"
                value={editQuantity}
                onChangeText={setEditQuantity}
                mode="outlined"
                style={styles.field}
                placeholder="e.g. 18 oz"
              />
              <Text variant="bodySmall" style={styles.sectionLabel}>Tags</Text>
              <View style={styles.tagRow}>
                {editTagList.map((tag) => (
                  <Chip
                    key={tag}
                    onClose={() => setEditTagList((prev) => prev.filter((t) => t !== tag))}
                    style={styles.tagChip}
                    compact
                  >
                    {tag}
                  </Chip>
                ))}
              </View>
              <View style={styles.tagInputRow}>
                <TextInput
                  label="Add tag"
                  value={tagInput}
                  onChangeText={setTagInput}
                  mode="outlined"
                  style={styles.tagInputField}
                  onSubmitEditing={addTag}
                />
                <Button onPress={addTag} disabled={!tagInput.trim()} style={styles.tagAddBtn}>
                  Add
                </Button>
              </View>
              <Button
                mode="contained"
                onPress={saveEdit}
                style={styles.saveBtn}
                disabled={!editName.trim()}
              >
                Save Changes
              </Button>
            </View>
          ) : (
            <View style={styles.details}>
              {!item ? (
                <ActivityIndicator color={colors.primary} />
              ) : (
                <>
                  {item.brand ? (
                    <View style={styles.detailRow}>
                      <Text variant="labelMedium" style={styles.detailLabel}>Brand</Text>
                      <Text variant="bodyLarge" style={styles.detailValue}>{item.brand}</Text>
                    </View>
                  ) : null}
                  {item.quantity ? (
                    <View style={styles.detailRow}>
                      <Text variant="labelMedium" style={styles.detailLabel}>Size</Text>
                      <Text variant="bodyLarge" style={styles.detailValue}>{item.quantity}</Text>
                    </View>
                  ) : null}
                  {item.tags.length > 0 ? (
                    <View style={styles.detailRow}>
                      <Text variant="labelMedium" style={styles.detailLabel}>Tags</Text>
                      <View style={styles.tagRow}>
                        {item.tags.map((tag) => (
                          <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  ) : null}
                  <View style={styles.detailRow}>
                    <Text variant="labelMedium" style={styles.detailLabel}>Locations</Text>
                    <View style={styles.badgeRow}>
                      <LocationBadge icon="home-outline" active={item.hasHomeLocation} label="Home" />
                      <LocationBadge icon="store-outline" active={item.hasStoreLocation} label="Store" />
                    </View>
                  </View>
                  {!item.brand && !item.quantity && item.tags.length === 0 && (
                    <Text style={styles.emptyHint}>Tap the pencil to add brand, size, and tags.</Text>
                  )}
                </>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

function LocationBadge({ icon, active, label }: { icon: string; active: boolean; label: string }) {
  return (
    <View style={[badgeStyles.badge, active ? badgeStyles.active : badgeStyles.inactive]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={13}
        color={active ? colors.primary : colors.textLight}
      />
      <Text style={[badgeStyles.label, !active && badgeStyles.inactiveLabel]}>{label}</Text>
    </View>
  );
}

const badgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
  },
  active: { borderColor: colors.primary, backgroundColor: colors.surface },
  inactive: { borderColor: colors.textLight, opacity: 0.45 },
  label: { fontSize: 12, color: colors.primary },
  inactiveLabel: { color: colors.textLight },
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerTitle: { flex: 1, color: colors.text, fontWeight: '600', textAlign: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  imageSection: { alignItems: 'center', paddingVertical: spacing.lg },
  itemImage: { width: 200, height: 200, borderRadius: 12, backgroundColor: colors.surface },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  imageButtons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
  imageBtn: { flex: 1 },
  divider: { marginVertical: spacing.xs },
  details: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  detailRow: { marginBottom: spacing.md },
  detailLabel: { color: colors.textLight, marginBottom: 2, textTransform: 'uppercase', letterSpacing: 0.5, fontSize: 11 },
  detailValue: { color: colors.text },
  badgeRow: { flexDirection: 'row', gap: spacing.sm, marginTop: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 4 },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  tagText: { fontSize: 12, color: colors.primary },
  emptyHint: { color: colors.textLight, fontStyle: 'italic', textAlign: 'center', marginTop: spacing.lg },
  field: { marginBottom: spacing.md },
  sectionLabel: { color: colors.textLight, marginBottom: spacing.xs },
  tagChip: { backgroundColor: colors.surface },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  tagInputField: { flex: 1 },
  tagAddBtn: { marginTop: spacing.xs },
  saveBtn: { marginTop: spacing.lg, backgroundColor: colors.primary },
});
