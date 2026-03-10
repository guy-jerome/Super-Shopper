import { useEffect, useState, useMemo, useCallback } from "react";
import { View, FlatList, StyleSheet, TouchableOpacity, RefreshControl } from "react-native";
import {
  Text,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Button,
  ActivityIndicator,
  IconButton,
  Surface,
  Chip,
  Searchbar,
  Menu,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/useAuthStore";
import {
  useItemStore,
  type ItemSortOrder,
  type ItemWithLocations,
  type FilterMode,
} from "../../stores/useItemStore";
import { useStorageStore } from "../../stores/useStorageStore";
import { useStoreStore } from "../../stores/useStoreStore";
import { useShoppingStore } from "../../stores/useShoppingStore";
import { FoodSearch } from "../../components/FoodSearch";
import { ItemDetailModal } from "../../components/ItemDetailModal";
import type { FoodSuggestion } from "../../hooks/useOpenFoodFacts";
import { useColors, spacing, radius, type Colors } from "../../constants/theme";
import { SkeletonRow } from "../../components/SkeletonRow";

const TAG_COLORS = ['#D4E8C2', '#C8BEE8', '#E8BFB8', '#FFF3B0', '#FFD7BA', '#B8E8E0'];

export default function ItemsScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuthStore();
  const {
    items,
    isLoading,
    sortOrder,
    filterMode,
    setFilterMode,
    fetchItems,
    setSortOrder,
    addItem,
    updateItemTags,
    updateItemName,
    deleteItem,
  } = useItemStore();

  const [search, setSearch] = useState("");
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemTags, setNewItemTags] = useState("");
  const [pendingSuggestion, setPendingSuggestion] =
    useState<FoodSuggestion | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string;
    name: string;
    hasHomeLocation: boolean;
    hasStoreLocation: boolean;
  } | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { locations } = useStorageStore();
  const { activeStore } = useStoreStore();

  const { shoppingList, addToList, fetchShoppingList } = useShoppingStore();
  const today = new Date().toISOString().split("T")[0];

  useEffect(() => {
    if (!user) return;
    fetchItems(user.id);
    fetchShoppingList(user.id, today);
  }, [user?.id]);

  const isInList = (itemId: string) =>
    shoppingList.some((s) => s.item_id === itemId);

  const handleAddToList = async (item: ItemWithLocations) => {
    if (!user) return;
    if (isInList(item.id)) return;
    await addToList(user.id, item.id, 1);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      !search.trim() || item.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filterMode === "all" ||
      (filterMode === "no-home" && !item.hasHomeLocation) ||
      (filterMode === "no-store" && !item.hasStoreLocation);
    return matchesSearch && matchesFilter;
  });

  const locationContext = useMemo(() => {
    const map = new Map<string, { homeLocation?: string; storeAisles: string[] }>();
    const allLocs = locations.flatMap((l) => [l, ...(l.subsections ?? [])]);
    for (const loc of allLocs) {
      for (const item of loc.items ?? []) {
        map.set(item.id, { homeLocation: loc.name, storeAisles: map.get(item.id)?.storeAisles ?? [] });
      }
    }
    if (activeStore) {
      for (const aisle of activeStore.aisles ?? []) {
        for (const loc of aisle.item_store_locations ?? []) {
          const id = loc.item_id;
          const existing = map.get(id) ?? { storeAisles: [] };
          map.set(id, { ...existing, storeAisles: [...existing.storeAisles, `${activeStore.name} › ${aisle.name}`] });
        }
      }
    }
    return map;
  }, [locations, activeStore]);

  const handleAddItem = async () => {
    if (!user || !newItemName.trim()) return;
    const tags = newItemTags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const meta = pendingSuggestion
      ? {
          brand: pendingSuggestion.brand ?? null,
          quantity: pendingSuggestion.quantity ?? null,
          image_url: pendingSuggestion.imageUrl ?? null,
        }
      : undefined;
    await addItem(user.id, newItemName.trim(), tags, meta);
    setNewItemName("");
    setNewItemTags("");
    setPendingSuggestion(null);
    setAddDialog(false);
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchItems(user.id);
    setRefreshing(false);
  }, [user?.id]);

  const sortLabel: Record<ItemSortOrder, string> = {
    name: "Name (A–Z)",
    recent: "Recently Updated",
    tags: "By Tags",
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.background }}>
        {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.headerSurface} elevation={1}>
        <View style={styles.headerRow}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Items
          </Text>
          <Menu
            visible={sortMenuVisible}
            onDismiss={() => setSortMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                icon="sort"
                onPress={() => setSortMenuVisible(true)}
              >
                {sortLabel[sortOrder]}
              </Button>
            }
          >
            {(Object.keys(sortLabel) as ItemSortOrder[]).map((key) => (
              <Menu.Item
                key={key}
                title={sortLabel[key]}
                onPress={() => {
                  setSortOrder(key);
                  setSortMenuVisible(false);
                }}
                trailingIcon={sortOrder === key ? "check" : undefined}
              />
            ))}
          </Menu>
        </View>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
          {items.length} item{items.length !== 1 ? "s" : ""} total
        </Text>
      </Surface>

      <Searchbar
        placeholder="Search items..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={styles.searchbarInput}
      />

      {/* Filter chips */}
      <View style={styles.filterRow}>
        {(
          [
            { key: "all", label: "All" },
            { key: "no-home", label: "No home location" },
            { key: "no-store", label: "No store location" },
          ] as { key: FilterMode; label: string }[]
        ).map((f) => (
          <Chip
            key={f.key}
            selected={filterMode === f.key}
            onPress={() => setFilterMode(f.key)}
            style={filterMode === f.key ? styles.filterChipActive : styles.filterChip}
            textStyle={{ color: filterMode === f.key ? '#fff' : colors.text }}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>

      <FlatList
        data={filteredItems}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
              style={styles.itemRow}
              onPress={() => setDetailItemId(item.id)}
              activeOpacity={0.7}
            >
              <View style={styles.itemMain}>
                <Text variant="bodyLarge" style={styles.itemName}>
                  {item.name}
                </Text>
                <View style={styles.locationBadges}>
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
                {search.trim() ? (() => {
                  const ctx = locationContext.get(item.id);
                  if (!ctx || (!ctx.homeLocation && ctx.storeAisles.length === 0)) return null;
                  return (
                    <View style={styles.searchLocationBadges}>
                      {ctx.homeLocation && (
                        <View style={[styles.searchBadge, styles.searchBadgeHome]}>
                          <Text style={[styles.searchBadgeText, styles.searchBadgeHomeText]}>🏠 {ctx.homeLocation}</Text>
                        </View>
                      )}
                      {ctx.storeAisles.map((a, i) => (
                        <View key={i} style={[styles.searchBadge, styles.searchBadgeStore]}>
                          <Text style={[styles.searchBadgeText, styles.searchBadgeStoreText]}>🛒 {a}</Text>
                        </View>
                      ))}
                    </View>
                  );
                })() : null}
                {item.tags.length > 0 && (
                  <View style={styles.tagRow}>
                    {item.tags.map((tag, tagIndex) => (
                      <View key={tag} style={[styles.tag, { backgroundColor: TAG_COLORS[tagIndex % TAG_COLORS.length] }]}>
                        <Text style={styles.tagText}>{tag}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
              <IconButton
                icon="eye-outline"
                size={22}
                iconColor={colors.textLight}
                onPress={() => setDetailItemId(item.id)}
              />
              <IconButton
                icon={isInList(item.id) ? "cart-check" : "cart-plus"}
                size={22}
                iconColor={
                  isInList(item.id) ? colors.primary : colors.textLight
                }
                onPress={() => handleAddToList(item)}
              />
              <IconButton
                icon="delete-outline"
                size={22}
                iconColor={colors.error}
                onPress={() =>
                  setDeleteConfirm({ id: item.id, name: item.name, hasHomeLocation: item.hasHomeLocation, hasStoreLocation: item.hasStoreLocation })
                }
              />
            </TouchableOpacity>
        )}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="tag-multiple-outline"
              size={64}
              color={colors.primary}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              {search || filterMode !== "all"
                ? "No matching items"
                : "No items yet"}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {filterMode === "no-home"
                ? "All items have a home storage location"
                : filterMode === "no-store"
                  ? "All items have a store location"
                  : "Tap + to add your first item"}
            </Text>
          </View>
        }
        keyboardShouldPersistTaps="handled"
        style={styles.list}
      />

      <FAB
        icon="plus"
        label="Add Item"
        style={styles.fab}
        onPress={() => setAddDialog(true)}
      />

      <Portal>
        {/* Add item dialog */}
        <Dialog
          visible={addDialog}
          onDismiss={() => {
            setNewItemName("");
            setNewItemTags("");
            setPendingSuggestion(null);
            setAddDialog(false);
          }}
        >
          <Dialog.Title>Add Item</Dialog.Title>
          <Dialog.Content>
            <FoodSearch
              value={newItemName}
              onChangeText={(t) => {
                setNewItemName(t);
                setPendingSuggestion(null);
              }}
              onSelect={(name, suggestion) => {
                setNewItemName(name);
                setPendingSuggestion(suggestion ?? null);
              }}
              autoFocus
            />
            <TextInput
              label="Tags (comma-separated, optional)"
              value={newItemTags}
              onChangeText={setNewItemTags}
              mode="outlined"
              placeholder="e.g. dairy, frozen, organic"
              style={{ marginTop: spacing.md }}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setNewItemName("");
                setNewItemTags("");
                setPendingSuggestion(null);
                setAddDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button onPress={handleAddItem} disabled={!newItemName.trim()}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Delete confirm dialog */}
        <Dialog
          visible={!!deleteConfirm}
          onDismiss={() => setDeleteConfirm(null)}
        >
          <Dialog.Title>Delete Item</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.text }}>
              Delete "{deleteConfirm?.name}"? This cannot be undone.
            </Text>
            {(deleteConfirm?.hasHomeLocation || deleteConfirm?.hasStoreLocation) && (
              <Text variant="bodySmall" style={{ color: colors.textLight, marginTop: 8 }}>
                Also removes it from:{" "}
                {[
                  deleteConfirm.hasHomeLocation && "home storage",
                  deleteConfirm.hasStoreLocation && "store aisles",
                ]
                  .filter(Boolean)
                  .join(" and ")}
                .
              </Text>
            )}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setDeleteConfirm(null)}>Cancel</Button>
            <Button
              textColor={colors.error}
              onPress={() => {
                deleteItem(deleteConfirm!.id);
                setDeleteConfirm(null);
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <ItemDetailModal
        itemId={detailItemId}
        onDismiss={() => setDetailItemId(null)}
      />
    </View>
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
  const styles = useMemo(() => createLocBadgeStyles(colors), [colors]);
  return (
    <View
      style={[
        styles.badge,
        active ? styles.active : styles.inactive,
      ]}
    >
      <MaterialCommunityIcons
        name={icon as any}
        size={12}
        color={active ? colors.primary : colors.textLight}
      />
      <Text
        style={[styles.label, !active && styles.inactiveLabel]}
      >
        {label}
      </Text>
    </View>
  );
}

function createLocBadgeStyles(colors: Colors) { return StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
  },
  active: { borderColor: colors.primary, backgroundColor: colors.surface },
  inactive: { borderColor: colors.textLight, opacity: 0.45 },
  label: { fontSize: 11, color: colors.primary },
  inactiveLabel: { color: colors.textLight },
}); }

function createStyles(colors: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSurface: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  headerTitle: { color: colors.text, fontWeight: "bold" },
  headerSubtitle: { color: colors.textLight },
  searchbar: {
    margin: spacing.sm,
    elevation: 0,
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.softShadow,
  },
  searchbarInput: { fontSize: 14 },
  filterRow: {
    flexDirection: "row",
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    flexWrap: "wrap",
  },
  filterChip: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.softShadow,
  },
  filterChipActive: {
    backgroundColor: colors.primary,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  list: { flex: 1 },
  listContent: { paddingBottom: 100, paddingTop: spacing.xs },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    color: colors.text,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  emptySubtitle: { color: colors.textLight, textAlign: "center" },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.md,
    backgroundColor: colors.primary,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    paddingLeft: spacing.md,
    borderLeftWidth: 3,
    borderLeftColor: colors.primaryLight,
    shadowColor: '#4A3728',
    shadowOpacity: 0.07,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  itemMain: { flex: 1 },
  itemName: { color: colors.text, fontWeight: "600", marginBottom: 4 },
  locationBadges: { flexDirection: "row", gap: spacing.xs, marginBottom: 4 },
  searchLocationBadges: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 2 },
  searchBadge: { borderRadius: 4, paddingHorizontal: 6, paddingVertical: 2 },
  searchBadgeHome: { backgroundColor: colors.primaryLight },
  searchBadgeHomeText: { color: colors.primaryDark },
  searchBadgeStore: { backgroundColor: colors.butter },
  searchBadgeStoreText: { color: colors.text },
  searchBadgeText: { fontSize: 11, color: colors.textLight },
  tagRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: 2,
  },
  tag: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: radius.pill,
  },
  tagText: { fontSize: 11, color: colors.text },
}); }
