import { useEffect, useState, useRef } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
} from "react-native";
import {
  Text,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Button,
  ActivityIndicator,
  Checkbox,
  IconButton,
  Divider,
  Surface,
  Snackbar,
  Searchbar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/useAuthStore";
import { useStorageStore } from "../../stores/useStorageStore";
import { useShoppingStore } from "../../stores/useShoppingStore";
import { useItemStore } from "../../stores/useItemStore";
import { FoodSearch } from "../../components/FoodSearch";
import { ItemDetailModal } from "../../components/ItemDetailModal";
import { DragHandle } from "../../components/DraggableList";
import type { FoodSuggestion } from "../../hooks/useOpenFoodFacts";
import { colors, spacing } from "../../constants/theme";
import type { StorageLocationWithItems } from "../../types/app.types";

const today = new Date().toISOString().split("T")[0];

export default function HomeStorageScreen() {
  const { user } = useAuthStore();
  const {
    locations,
    isLoading,
    fetchLocations,
    addLocation,
    deleteLocation,
    moveLocation,
    addItem,
    unlinkItem,
    moveItem,
  } = useStorageStore();
  const { shoppingList, fetchShoppingList, addToList, removeFromList } =
    useShoppingStore();
  const { items: globalItems, fetchItems } = useItemStore();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [locationDialog, setLocationDialog] = useState(false);
  const [locationName, setLocationName] = useState("");
  const [itemDialog, setItemDialog] = useState(false);
  const [itemName, setItemName] = useState("");
  const [targetLocationId, setTargetLocationId] = useState("");
  const [snackbar, setSnackbar] = useState("");
  const [search, setSearch] = useState("");
  const [qtyDialog, setQtyDialog] = useState(false);
  const [qtyTarget, setQtyTarget] = useState<{
    id: string;
    name: string;
  } | null>(null);
  const [qty, setQty] = useState(1);
  const [pendingSuggestion, setPendingSuggestion] =
    useState<FoodSuggestion | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    action: () => void;
    message: string;
  } | null>(null);

  // Suggestions from global items that are not already in a home location
  const itemSuggestions =
    itemName.trim().length > 0
      ? globalItems
          .filter(
            (i) =>
              !i.hasHomeLocation &&
              i.name.toLowerCase().includes(itemName.toLowerCase()),
          )
          .slice(0, 5)
      : [];

  useEffect(() => {
    if (!user) return;
    fetchLocations(user.id);
    fetchShoppingList(user.id, today);
    fetchItems(user.id);
  }, [user?.id]);

  const isInList = (itemId: string) =>
    shoppingList.some((s) => s.item_id === itemId);

  const toggleItem = async (itemId: string, name: string) => {
    if (!user) return;
    const existing = shoppingList.find((s) => s.item_id === itemId);
    if (existing) {
      await removeFromList(existing.id);
      setSnackbar(`${name} removed from list`);
    } else {
      setQtyTarget({ id: itemId, name });
      setQty(1);
      setQtyDialog(true);
    }
  };

  const confirmAddToList = async () => {
    if (!user || !qtyTarget) return;
    await addToList(user.id, qtyTarget.id, qty);
    setSnackbar(`${qtyTarget.name} added to shopping list`);
    setQtyDialog(false);
    setQtyTarget(null);
  };

  const toggleSection = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAddLocation = async () => {
    if (!user || !locationName.trim()) return;
    await addLocation(user.id, locationName.trim());
    setLocationName("");
    setLocationDialog(false);
  };

  const handleAddItem = async () => {
    if (!user || !itemName.trim() || !targetLocationId) return;
    const meta = pendingSuggestion
      ? {
          brand: pendingSuggestion.brand ?? null,
          quantity: pendingSuggestion.quantity ?? null,
          image_url: pendingSuggestion.imageUrl ?? null,
        }
      : undefined;
    await addItem(user.id, targetLocationId, itemName.trim(), meta);
    fetchItems(user.id);
    setItemName("");
    setPendingSuggestion(null);
    setItemDialog(false);
  };

  const openAddItem = (locationId: string) => {
    setTargetLocationId(locationId);
    setItemDialog(true);
  };

  if (isLoading && locations.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.headerSurface} elevation={1}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Home Storage
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
          Check items you need to buy
        </Text>
      </Surface>

      <Searchbar
        placeholder="Search items..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={styles.searchbarInput}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {locations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="home-outline"
              size={64}
              color={colors.textLight}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No locations yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Add locations like Pantry, Fridge, or Freezer
            </Text>
            <Button
              mode="contained"
              icon="plus"
              onPress={() => setLocationDialog(true)}
              style={styles.emptyAction}
            >
              Add Location
            </Button>
          </View>
        ) : (
          locations.map((location, locIdx) => {
            const filtered = search.trim()
              ? location.items.filter((i) =>
                  i.name.toLowerCase().includes(search.toLowerCase()),
                )
              : location.items;
            if (search.trim() && filtered.length === 0) return null;
            return (
              <LocationSection
                key={location.id}
                location={{ ...location, items: filtered }}
                locationIndex={locIdx}
                totalLocations={locations.length}
                expanded={expanded.has(location.id) || !!search.trim()}
                onToggle={() => toggleSection(location.id)}
                isInList={isInList}
                onToggleItem={toggleItem}
                onAddItem={() => openAddItem(location.id)}
                onUnlinkItem={(itemId) => {
                  let name = "this item";
                  for (const loc of locations) {
                    const found = loc.items.find((i) => i.id === itemId);
                    if (found) {
                      name = found.name;
                      break;
                    }
                  }
                  setConfirmDialog({
                    action: () => unlinkItem(itemId),
                    message: `Remove "${name}" from this location?`,
                  });
                }}
                onDeleteLocation={() =>
                  setConfirmDialog({
                    action: () => deleteLocation(location.id),
                    message: `Delete "${location.name}"? All items inside will be unlinked.`,
                  })
                }
                onMoveLocation={(dir) => moveLocation(location.id, dir)}
                onMoveItem={(itemId, dir) => moveItem(location.id, itemId, dir)}
                onOpenDetail={setDetailItemId}
              />
            );
          })
        )}
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar("")}
        duration={2500}
        style={styles.snackbar}
      >
        {snackbar}
      </Snackbar>

      <FAB
        icon="plus"
        label="Add Location"
        style={styles.fab}
        onPress={() => setLocationDialog(true)}
      />

      <Portal>
        <Dialog
          visible={locationDialog}
          onDismiss={() => setLocationDialog(false)}
        >
          <Dialog.Title>Add Storage Location</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name (e.g. Pantry, Fridge, Freezer)"
              value={locationName}
              onChangeText={setLocationName}
              mode="outlined"
              autoFocus
              onSubmitEditing={handleAddLocation}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setLocationName("");
                setLocationDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button onPress={handleAddLocation} disabled={!locationName.trim()}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog
          visible={!!confirmDialog}
          onDismiss={() => setConfirmDialog(null)}
        >
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.text }}>
              {confirmDialog?.message}
            </Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog(null)}>Cancel</Button>
            <Button
              textColor={colors.error}
              onPress={() => {
                confirmDialog?.action();
                setConfirmDialog(null);
              }}
            >
              Delete
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={qtyDialog} onDismiss={() => setQtyDialog(false)}>
          <Dialog.Title>Add to Shopping List</Dialog.Title>
          <Dialog.Content>
            <Text
              variant="bodyMedium"
              style={{ marginBottom: spacing.md, color: colors.text }}
            >
              {qtyTarget?.name}
            </Text>
            <View style={styles.qtyStepper}>
              <IconButton
                icon="minus"
                mode="contained-tonal"
                size={20}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              />
              <Text variant="titleLarge" style={styles.qtyValue}>
                {qty}
              </Text>
              <IconButton
                icon="plus"
                mode="contained-tonal"
                size={20}
                onPress={() => setQty((q) => q + 1)}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQtyDialog(false)}>Cancel</Button>
            <Button onPress={confirmAddToList} mode="contained">
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Modal
        visible={itemDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setItemName("");
          setPendingSuggestion(null);
          setItemDialog(false);
        }}
      >
        <View style={styles.addItemOverlay}>
          <Surface style={styles.addItemSheet} elevation={4}>
            <Text variant="titleLarge" style={styles.addItemTitle}>
              Add Item
            </Text>
            <FoodSearch
              value={itemName}
              onChangeText={(t) => {
                setItemName(t);
                setPendingSuggestion(null);
              }}
              onSelect={(name, suggestion) => {
                setItemName(name);
                setPendingSuggestion(suggestion ?? null);
              }}
              localSuggestions={itemSuggestions}
              autoFocus
            />
            <View style={styles.addItemActions}>
              <Button
                onPress={() => {
                  setItemName("");
                  setPendingSuggestion(null);
                  setItemDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button onPress={handleAddItem} disabled={!itemName.trim()}>
                Add
              </Button>
            </View>
          </Surface>
        </View>
      </Modal>

      <ItemDetailModal
        itemId={detailItemId}
        onDismiss={() => setDetailItemId(null)}
      />
    </View>
  );
}

type LocationSectionProps = {
  location: StorageLocationWithItems;
  locationIndex: number;
  totalLocations: number;
  expanded: boolean;
  onToggle: () => void;
  isInList: (itemId: string) => boolean;
  onToggleItem: (itemId: string, itemName: string) => void;
  onAddItem: () => void;
  onUnlinkItem: (itemId: string) => void;
  onDeleteLocation: () => void;
  onMoveLocation: (direction: "up" | "down") => void;
  onMoveItem: (itemId: string, direction: "up" | "down") => void;
  onOpenDetail: (itemId: string) => void;
};

type AnimatedItemRowProps = {
  item: StorageLocationWithItems["items"][0];
  itemIdx: number;
  totalItems: number;
  isInList: (id: string) => boolean;
  onToggleItem: (id: string, name: string) => void;
  onUnlinkItem: (id: string) => void;
  onMoveItem: (id: string, dir: "up" | "down") => void;
  onOpenDetail: (id: string) => void;
};

function AnimatedItemRow({
  item,
  itemIdx,
  totalItems,
  isInList,
  onToggleItem,
  onUnlinkItem,
  onMoveItem,
  onOpenDetail,
}: AnimatedItemRowProps) {
  const rowAnim = useRef(new Animated.Value(0)).current;
  const checked = isInList(item.id);

  const handleActiveChange = (active: boolean) => {
    Animated.timing(rowAnim, {
      toValue: active ? 1 : 0,
      duration: active ? 200 : 350,
      easing: active ? Easing.out(Easing.quad) : Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const backgroundColor = rowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.background, colors.primary + "22"],
  });

  return (
    <Animated.View style={[sectionStyles.itemRow, { backgroundColor }]}>
      <DragHandle
        canMoveUp={itemIdx > 0}
        canMoveDown={itemIdx < totalItems - 1}
        onMoveUp={() => onMoveItem(item.id, "up")}
        onMoveDown={() => onMoveItem(item.id, "down")}
        onActiveChange={handleActiveChange}
        size="sm"
      />
      <Checkbox
        status={checked ? "checked" : "unchecked"}
        onPress={() => onToggleItem(item.id, item.name)}
        color={colors.primary}
      />
      <Text
        variant="bodyLarge"
        style={[sectionStyles.itemName, checked && sectionStyles.itemChecked]}
      >
        {item.name}
      </Text>
      <IconButton
        icon="eye-outline"
        size={18}
        iconColor={colors.textLight}
        onPress={() => onOpenDetail(item.id)}
      />
      <IconButton
        icon="delete-outline"
        size={18}
        iconColor={colors.error}
        onPress={() => onUnlinkItem(item.id)}
      />
    </Animated.View>
  );
}

function LocationSection({
  location,
  locationIndex,
  totalLocations,
  expanded,
  onToggle,
  isInList,
  onToggleItem,
  onAddItem,
  onUnlinkItem,
  onDeleteLocation,
  onMoveLocation,
  onMoveItem,
  onOpenDetail,
}: LocationSectionProps) {
  const checkedCount = location.items.filter((i) => isInList(i.id)).length;
  const headerAnim = useRef(new Animated.Value(0)).current;

  const handleHeaderActiveChange = (active: boolean) => {
    Animated.timing(headerAnim, {
      toValue: active ? 1 : 0,
      duration: active ? 200 : 350,
      easing: active ? Easing.out(Easing.quad) : Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const headerBg = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.primary + "28"],
  });

  return (
    <View style={sectionStyles.container}>
      <Animated.View
        style={[sectionStyles.header, { backgroundColor: headerBg }]}
      >
        <DragHandle
          canMoveUp={locationIndex > 0}
          canMoveDown={locationIndex < totalLocations - 1}
          onMoveUp={() => onMoveLocation("up")}
          onMoveDown={() => onMoveLocation("down")}
          onActiveChange={handleHeaderActiveChange}
          size="md"
        />
        <TouchableOpacity
          style={sectionStyles.titleArea}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textLight}
          />
          <View style={sectionStyles.titleText}>
            <Text variant="titleMedium" style={sectionStyles.name}>
              {location.name}
            </Text>
            <Text variant="bodySmall" style={sectionStyles.itemCount}>
              {location.items.length} item
              {location.items.length !== 1 ? "s" : ""}
              {checkedCount > 0 ? ` · ${checkedCount} on list` : ""}
            </Text>
          </View>
        </TouchableOpacity>
        <IconButton
          icon="plus-circle-outline"
          size={22}
          iconColor={colors.primary}
          onPress={onAddItem}
        />
        <IconButton
          icon="delete-outline"
          size={22}
          iconColor={colors.error}
          onPress={onDeleteLocation}
        />
      </Animated.View>

      {expanded && (
        <View style={sectionStyles.itemsContainer}>
          {location.items.length === 0 ? (
            <Text style={sectionStyles.emptyItems}>
              No items — tap + to add
            </Text>
          ) : (
            location.items.map((item, itemIdx) => (
              <AnimatedItemRow
                key={item.id}
                item={item}
                itemIdx={itemIdx}
                totalItems={location.items.length}
                isInList={isInList}
                onToggleItem={onToggleItem}
                onUnlinkItem={onUnlinkItem}
                onMoveItem={onMoveItem}
                onOpenDetail={onOpenDetail}
              />
            ))
          )}
        </View>
      )}
      <Divider />
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
  headerTitle: { color: colors.text, fontWeight: "bold" },
  headerSubtitle: { color: colors.textLight, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
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
  emptyAction: { marginTop: spacing.lg },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.md,
    backgroundColor: colors.primary,
  },
  searchbar: {
    margin: spacing.sm,
    elevation: 0,
    backgroundColor: colors.surface,
  },
  searchbarInput: { fontSize: 14 },
  snackbar: { marginBottom: 80 },
  addItemOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: spacing.lg,
  },
  addItemSheet: {
    width: "100%",
    maxWidth: 500,
    borderRadius: 12,
    padding: spacing.lg,
    backgroundColor: colors.background,
  },
  addItemTitle: {
    color: colors.text,
    fontWeight: "600",
    marginBottom: spacing.md,
  },
  addItemActions: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  qtyValue: { minWidth: 40, textAlign: "center", color: colors.text },
});

const sectionStyles = StyleSheet.create({
  container: { backgroundColor: colors.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  titleArea: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  titleText: { flex: 1 },
  name: { color: colors.text, fontWeight: "600" },
  badge: { color: colors.primary },
  itemCount: { color: colors.textLight },
  itemsContainer: { backgroundColor: colors.background },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: spacing.xs,
    paddingRight: spacing.xs,
    minHeight: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  itemName: { flex: 1, color: colors.text, marginLeft: spacing.xs },
  itemChecked: { textDecorationLine: "line-through", color: colors.textLight },
  emptyItems: {
    color: colors.textLight,
    fontStyle: "italic",
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl,
  },
});
