import { useState, useEffect, useMemo } from "react";
import { View, ScrollView, Image, StyleSheet, Modal } from "react-native";
import {
  Text,
  TextInput,
  Button,
  IconButton,
  Chip,
  ActivityIndicator,
  Divider,
  Surface,
  Portal,
  Dialog,
  Snackbar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useAuthStore } from "../stores/useAuthStore";
import { useItemStore } from "../stores/useItemStore";
import { useShoppingStore } from "../stores/useShoppingStore";
import { useColors, spacing, type Colors } from "../constants/theme";

type Props = {
  itemId: string | null;
  onDismiss: () => void;
};

export function ItemDetailModal({ itemId, onDismiss }: Props) {
  const today = new Date().toISOString().split("T")[0];
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuthStore();
  const {
    items,
    updateItemName,
    updateItemTags,
    updateItemDetails,
    uploadItemImage,
    deleteItem,
    getAllTags,
  } = useItemStore();
  const { shoppingList, addToList, removeFromList } = useShoppingStore();
  const item = items.find((i) => i.id === itemId) ?? null;
  const listEntry = shoppingList.find((s) => s.item_id === itemId);
  const isOnList = !!listEntry;

  const [editing, setEditing] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState(false);
  const [editName, setEditName] = useState("");
  const [editBrand, setEditBrand] = useState("");
  const [editQuantity, setEditQuantity] = useState("");
  const [editTagList, setEditTagList] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [uploading, setUploading] = useState(false);

  const tagSuggestions = useMemo(() => {
    const q = tagInput.trim().toLowerCase();
    if (!q) return [];
    return getAllTags().filter(
      (t) => t.includes(q) && !editTagList.map((x) => x.toLowerCase()).includes(t)
    );
  }, [tagInput, editTagList]);
  const [imgError, setImgError] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (item) {
      setImgError(false);
    }
  }, [item?.id]);

  const startEdit = () => {
    if (!item) return;
    setEditName(item.name);
    setEditBrand(item.brand ?? "");
    setEditQuantity(item.quantity ?? "");
    setEditTagList([...item.tags]);
    setTagInput("");
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
    setTagInput("");
  };

  const pickImage = async (fromCamera: boolean) => {
    if (!user || !item) return;
    const fn = fromCamera
      ? ImagePicker.launchCameraAsync
      : ImagePicker.launchImageLibraryAsync;
    const result = await fn({
      mediaTypes: ["images"],
      quality: 0.75,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (result.canceled) return;
    setUploading(true);
    const success = await uploadItemImage(item.id, user.id, result.assets[0].uri);
    setUploading(false);
    if (success) {
      setImgError(false);
    } else {
      setUploadError("Image upload failed. Check your connection and try again.");
    }
  };

  const toggleList = async () => {
    if (!user || !item) return;
    if (listEntry) {
      await removeFromList(listEntry.id);
    } else {
      await addToList(user.id, item.id, 1);
    }
  };

  const confirmDelete = async () => {
    if (!item) return;
    await deleteItem(item.id);
    setDeleteDialog(false);
    onDismiss();
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
          <View style={styles.headerText}>
            <Text
              variant="titleMedium"
              style={styles.headerTitle}
              numberOfLines={1}
            >
              {editing ? "Edit Item" : "Item Details"}
            </Text>
            {!editing && item ? (
              <Text
                variant="bodySmall"
                style={styles.headerSubtitle}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            ) : null}
          </View>
          {!editing ? (
            <>
              <IconButton
                icon={isOnList ? "cart-check" : "cart-plus"}
                onPress={toggleList}
                iconColor={isOnList ? "#4caf50" : colors.primary}
              />
              <IconButton
                icon="trash-can-outline"
                onPress={() => setDeleteDialog(true)}
                iconColor={colors.error}
              />
              <IconButton
                icon="pencil-outline"
                onPress={startEdit}
                iconColor={colors.primary}
              />
            </>
          ) : (
            <IconButton
              icon="check"
              onPress={saveEdit}
              iconColor={colors.primary}
            />
          )}
        </View>
        <Divider />

        <Portal>
          <Dialog visible={deleteDialog} onDismiss={() => setDeleteDialog(false)}>
            <Dialog.Title>Delete Item?</Dialog.Title>
            <Dialog.Content>
              <Text>
                This will permanently delete {item?.name} and remove it from all locations.
              </Text>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setDeleteDialog(false)}>Cancel</Button>
              <Button textColor={colors.error} onPress={confirmDelete}>Delete</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          <Surface style={styles.heroCard} elevation={1}>
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
                    <MaterialCommunityIcons
                      name="food-outline"
                      size={72}
                      color={colors.textLight}
                    />
                  )}
                </View>
              )}

              <Text variant="titleLarge" style={styles.itemNameHero}>
                {item?.name ?? ""}
              </Text>

              {(item?.brand || item?.quantity) && (
                <View style={styles.metaPillRow}>
                  {item?.brand ? (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{item.brand}</Text>
                    </View>
                  ) : null}
                  {item?.quantity ? (
                    <View style={styles.metaPill}>
                      <Text style={styles.metaPillText}>{item.quantity}</Text>
                    </View>
                  ) : null}
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
                  {item?.image_url ? "Retake" : "Camera"}
                </Button>
                <Button
                  mode="outlined"
                  icon="image"
                  onPress={() => pickImage(false)}
                  style={styles.imageBtn}
                  loading={uploading}
                  disabled={uploading}
                >
                  {item?.image_url ? "Replace" : "Gallery"}
                </Button>
              </View>

              {!item?.image_url && !uploading ? (
                <Text variant="bodySmall" style={styles.imageHint}>
                  Add a photo to make the item easier to recognize while
                  shopping.
                </Text>
              ) : null}
            </View>
          </Surface>

          <Divider style={styles.divider} />

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
                placeholder="Optional"
              />
              <TextInput
                label="Size / Quantity"
                value={editQuantity}
                onChangeText={setEditQuantity}
                mode="outlined"
                style={styles.field}
                placeholder="Optional"
              />
              <Text variant="bodySmall" style={styles.sectionLabel}>
                Tags
              </Text>
              <View style={styles.tagRow}>
                {editTagList.map((tag) => (
                  <Chip
                    key={tag}
                    onClose={() =>
                      setEditTagList((prev) => prev.filter((t) => t !== tag))
                    }
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
                  onChangeText={(t) => { setTagInput(t); setShowTagSuggestions(true); }}
                  mode="outlined"
                  style={styles.tagInputField}
                  onSubmitEditing={addTag}
                  onFocus={() => setShowTagSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowTagSuggestions(false), 150)}
                />
                <Button
                  onPress={addTag}
                  disabled={!tagInput.trim()}
                  style={styles.tagAddBtn}
                >
                  Add
                </Button>
              </View>
              {showTagSuggestions && tagSuggestions.length > 0 && (
                <View style={styles.tagSuggestions}>
                  {tagSuggestions.map((t) => (
                    <Chip
                      key={t}
                      compact
                      style={styles.tagSuggestionChip}
                      onPress={() => {
                        setEditTagList((prev) => [...prev, t]);
                        setTagInput("");
                        setShowTagSuggestions(false);
                      }}
                    >
                      {t}
                    </Chip>
                  ))}
                </View>
              )}
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
                  <Surface style={styles.sectionCard} elevation={0}>
                    <Text variant="labelMedium" style={styles.sectionCardTitle}>
                      Core Details
                    </Text>
                    <View style={styles.detailGrid}>
                      <DetailStat
                        label="Brand"
                        value={item.brand || "Not set"}
                        muted={!item.brand}
                        colors={colors}
                      />
                      <DetailStat
                        label="Size"
                        value={item.quantity || "Not set"}
                        muted={!item.quantity}
                        colors={colors}
                      />
                    </View>
                  </Surface>

                  <Surface style={styles.sectionCard} elevation={0}>
                    <Text variant="labelMedium" style={styles.sectionCardTitle}>
                      Locations
                    </Text>
                    <View style={styles.badgeRow}>
                      <LocationBadge
                        icon="home-outline"
                        active={item.hasHomeLocation}
                        label="Home"
                        colors={colors}
                      />
                      <LocationBadge
                        icon="store-outline"
                        active={item.hasStoreLocation}
                        label="Store"
                        colors={colors}
                      />
                    </View>
                  </Surface>

                  <Surface style={styles.sectionCard} elevation={0}>
                    <Text variant="labelMedium" style={styles.sectionCardTitle}>
                      Tags
                    </Text>
                    {item.tags.length > 0 ? (
                      <View style={styles.tagRow}>
                        {item.tags.map((tag) => (
                          <View key={tag} style={styles.tag}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    ) : (
                      <Text style={styles.emptyHint}>
                        No tags yet. Tap the pencil to add a few.
                      </Text>
                    )}
                  </Surface>
                </>
              )}
            </View>
          )}
        </ScrollView>

        <Snackbar
          visible={!!uploadError}
          onDismiss={() => setUploadError("")}
          duration={4000}
          action={{ label: "OK", onPress: () => setUploadError("") }}
        >
          {uploadError}
        </Snackbar>
      </View>
    </Modal>
  );
}

function LocationBadge({
  icon,
  active,
  label,
  colors,
}: {
  icon: string;
  active: boolean;
  label: string;
  colors: Colors;
}) {
  const styles = useMemo(() => createBadgeStyles(colors), [colors]);
  return (
    <View style={[styles.badge, active ? styles.active : styles.inactive]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={13}
        color={active ? colors.primary : colors.textLight}
      />
      <Text style={[styles.label, !active && styles.inactiveLabel]}>
        {label}
      </Text>
    </View>
  );
}

function DetailStat({
  label,
  value,
  muted = false,
  colors,
}: {
  label: string;
  value: string;
  muted?: boolean;
  colors: Colors;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  return (
    <View style={styles.detailStat}>
      <Text variant="labelSmall" style={styles.detailStatLabel}>
        {label}
      </Text>
      <Text
        variant="bodyLarge"
        style={[styles.detailStatValue, muted && styles.detailStatValueMuted]}
      >
        {value}
      </Text>
    </View>
  );
}

function createBadgeStyles(colors: Colors) { return StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
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
}); }

function createStyles(colors: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.xs,
  },
  headerText: { flex: 1, alignItems: "center" },
  headerTitle: { color: colors.text, fontWeight: "600", textAlign: "center" },
  headerSubtitle: { color: colors.textLight, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xl * 2 },
  heroCard: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    borderRadius: 18,
    backgroundColor: colors.surface,
    overflow: "hidden",
  },
  imageSection: {
    alignItems: "center",
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  itemImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.surface,
  },
  imagePlaceholder: {
    width: 200,
    height: 200,
    borderRadius: 12,
    backgroundColor: colors.background,
    alignItems: "center",
    justifyContent: "center",
  },
  itemNameHero: {
    color: colors.text,
    fontWeight: "700",
    marginTop: spacing.md,
    textAlign: "center",
  },
  metaPillRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    justifyContent: "center",
    marginTop: spacing.sm,
  },
  metaPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.primary + "33",
  },
  metaPillText: { color: colors.primary, fontSize: 12, fontWeight: "600" },
  imageButtons: {
    flexDirection: "row",
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  imageBtn: { flex: 1 },
  imageHint: {
    color: colors.textLight,
    marginTop: spacing.sm,
    textAlign: "center",
  },
  divider: { marginVertical: spacing.xs },
  details: { paddingHorizontal: spacing.md, paddingTop: spacing.sm },
  sectionCard: {
    borderRadius: 16,
    padding: spacing.md,
    backgroundColor: colors.surface,
    marginBottom: spacing.md,
  },
  sectionCardTitle: {
    color: colors.textLight,
    marginBottom: spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailGrid: { flexDirection: "row", gap: spacing.sm },
  detailStat: {
    flex: 1,
    borderRadius: 12,
    padding: spacing.sm,
    backgroundColor: colors.background,
  },
  detailStatLabel: {
    color: colors.textLight,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.4,
  },
  detailStatValue: { color: colors.text, fontWeight: "600" },
  detailStatValueMuted: { color: colors.textLight, fontWeight: "400" },
  badgeRow: { flexDirection: "row", gap: spacing.sm, marginTop: 4 },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 4,
  },
  tag: {
    backgroundColor: colors.background,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + "44",
  },
  tagText: { fontSize: 12, color: colors.primary },
  emptyHint: { color: colors.textLight, fontStyle: "italic" },
  field: { marginBottom: spacing.md },
  sectionLabel: { color: colors.textLight, marginBottom: spacing.xs },
  tagChip: { backgroundColor: colors.surface },
  tagInputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tagInputField: { flex: 1 },
  tagAddBtn: { marginTop: spacing.xs },
  tagSuggestions: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.xs,
    padding: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: 8,
  },
  tagSuggestionChip: { backgroundColor: colors.background },
  saveBtn: { marginTop: spacing.lg, backgroundColor: colors.primary },
}); }
