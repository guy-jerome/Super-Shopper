import { useEffect, useState, useRef, useMemo } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
} from "react-native";
import {
  Text,
  FAB,
  Portal,
  Dialog,
  TextInput,
  Button,
  ActivityIndicator,
  IconButton,
  Divider,
  Surface,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/useAuthStore";
import { useStoreStore } from "../../stores/useStoreStore";
import { useItemStore } from "../../stores/useItemStore";
import { FoodSearch } from "../../components/FoodSearch";
import { ItemDetailModal } from "../../components/ItemDetailModal";
import { DragHandle } from "../../components/DraggableList";
import { useColors, spacing, type Colors } from "../../constants/theme";

type Screen = "list" | "detail";

export default function StoresScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const storeListStyles = useMemo(() => createStoreListStyles(colors), [colors]);
  const { user } = useAuthStore();
  const {
    stores,
    activeStore,
    isLoading,
    fetchStores,
    fetchStoreWithAisles,
    addStore,
    deleteStore,
    addAisle,
    deleteAisle,
    moveAisle,
    addItemToAisle,
    removeItemFromAisle,
    moveItemInAisle,
    updateItemInAisle,
  } = useStoreStore();
  const { items: globalItems, fetchItems } = useItemStore();

  const [screen, setScreen] = useState<Screen>("list");
  const [storeDialog, setStoreDialog] = useState(false);
  const [storeName, setStoreName] = useState("");
  const [aisleDialog, setAisleDialog] = useState(false);
  const [aisleName, setAisleName] = useState("");
  const [itemDialog, setItemDialog] = useState(false);
  const [itemName, setItemName] = useState("");
  const [itemPositionTag, setItemPositionTag] = useState("");
  const [targetAisleId, setTargetAisleId] = useState("");
  const [expandedAisles, setExpandedAisles] = useState<Set<string>>(new Set());
  const [confirmDialog, setConfirmDialog] = useState<{
    action: () => void;
    message: string;
  } | null>(null);
  const [editItemDialog, setEditItemDialog] = useState(false);
  const [editLocId, setEditLocId] = useState("");
  const [editPositionTag, setEditPositionTag] = useState("");
  const [detailItemId, setDetailItemId] = useState<string | null>(null);

  // Suggestions from the global items list
  const localSuggestions =
    itemName.trim().length > 0
      ? globalItems
          .filter((i) => i.name.toLowerCase().includes(itemName.toLowerCase()))
          .slice(0, 5)
      : [];

  useEffect(() => {
    if (!user) return;
    fetchStores(user.id);
    fetchItems(user.id);
  }, [user?.id]);

  const openStore = async (storeId: string) => {
    await fetchStoreWithAisles(storeId);
    setScreen("detail");
    setExpandedAisles(new Set());
  };

  const handleAddStore = async () => {
    if (!user || !storeName.trim()) return;
    await addStore(user.id, storeName.trim());
    setStoreName("");
    setStoreDialog(false);
  };

  const handleAddAisle = async () => {
    if (!activeStore || !aisleName.trim()) return;
    await addAisle(activeStore.id, aisleName.trim());
    setAisleName("");
    setAisleDialog(false);
  };

  const handleAddItem = async () => {
    if (!user || !itemName.trim() || !targetAisleId) return;
    await addItemToAisle(
      user.id,
      targetAisleId,
      itemName.trim(),
      itemPositionTag.trim() || undefined,
    );
    setItemName("");
    setItemPositionTag("");
    setItemDialog(false);
    // Refresh global items so new items appear
    fetchItems(user.id);
  };

  const openEditItem = (locId: string, currentPositionTag: string | null) => {
    setEditLocId(locId);
    setEditPositionTag(currentPositionTag ?? "");
    setEditItemDialog(true);
  };

  const handleSaveEditItem = async () => {
    await updateItemInAisle(editLocId, editPositionTag.trim() || null);
    setEditItemDialog(false);
  };

  const openAddItem = (aisleId: string) => {
    setTargetAisleId(aisleId);
    setItemDialog(true);
  };

  const toggleAisle = (id: string) =>
    setExpandedAisles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (isLoading && stores.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  // ── Store detail view ──────────────────────────────────────────────────────
  if (screen === "detail" && activeStore) {
    return (
      <View style={styles.container}>
        <Surface style={styles.headerSurface} elevation={1}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" onPress={() => setScreen("list")} />
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                {activeStore.name}
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {activeStore.aisles.length} aisle
                {activeStore.aisles.length !== 1 ? "s" : ""}
              </Text>
            </View>
            <IconButton
              icon="plus-circle-outline"
              iconColor={colors.primary}
              onPress={() => setAisleDialog(true)}
            />
          </View>
        </Surface>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
        >
          {activeStore.aisles.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="store-outline"
                size={64}
                color={colors.textLight}
              />
              <Text variant="titleLarge" style={styles.emptyTitle}>
                No aisles yet
              </Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Tap + to add aisles like Bakery, Produce, or Dairy
              </Text>
            </View>
          ) : (
            activeStore.aisles.map((aisle, aisleIdx) => (
              <AisleSection
                key={aisle.id}
                aisle={aisle}
                aisleIdx={aisleIdx}
                totalAisles={activeStore.aisles.length}
                isExpanded={expandedAisles.has(aisle.id)}
                onToggle={() => toggleAisle(aisle.id)}
                onMoveAisle={moveAisle}
                onDeleteAisle={(id) =>
                  setConfirmDialog({
                    action: () => deleteAisle(id),
                    message: `Delete aisle "${aisle.name}"? All item locations inside will be removed.`,
                  })
                }
                onAddItem={openAddItem}
                onMoveItem={moveItemInAisle}
                onRemoveItem={(locId) => {
                  const item = aisle.item_store_locations.find(
                    (l: any) => l.id === locId,
                  );
                  setConfirmDialog({
                    action: () => removeItemFromAisle(locId),
                    message: `Remove "${item?.items?.name ?? "this item"}" from this aisle?`,
                  });
                }}
                onEditItem={openEditItem}
                onOpenDetail={setDetailItemId}
                colors={colors}
              />
            ))
          )}
        </ScrollView>

        <Portal>
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

          <Dialog visible={aisleDialog} onDismiss={() => setAisleDialog(false)}>
            <Dialog.Title>Add Aisle</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Aisle name (e.g. Bakery, Produce)"
                value={aisleName}
                onChangeText={setAisleName}
                mode="outlined"
                autoFocus
                onSubmitEditing={handleAddAisle}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setAisleName("");
                  setAisleDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button onPress={handleAddAisle} disabled={!aisleName.trim()}>
                Add
              </Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog
            visible={editItemDialog}
            onDismiss={() => setEditItemDialog(false)}
          >
            <Dialog.Title>Edit Position Tag</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Position tag (optional)"
                value={editPositionTag}
                onChangeText={setEditPositionTag}
                mode="outlined"
                placeholder="e.g. Far wall, Refrigerators, Left shelf"
                autoFocus
                onSubmitEditing={handleSaveEditItem}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => setEditItemDialog(false)}>Cancel</Button>
              <Button onPress={handleSaveEditItem}>Save</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog
            visible={itemDialog}
            onDismiss={() => {
              setItemName("");
              setItemPositionTag("");
              setItemDialog(false);
            }}
          >
            <Dialog.Title>Add Item to Aisle</Dialog.Title>
            <Dialog.Content style={styles.itemDialogContent}>
              <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
              >
                <FoodSearch
                  value={itemName}
                  onChangeText={(t) => setItemName(t)}
                  onSelect={(name) => setItemName(name)}
                  localSuggestions={localSuggestions}
                  autoFocus
                />
                <TextInput
                  label="Position tag (optional)"
                  value={itemPositionTag}
                  onChangeText={setItemPositionTag}
                  mode="outlined"
                  placeholder="e.g. Far wall, Refrigerators, Left shelf"
                  onSubmitEditing={handleAddItem}
                  style={{ marginTop: spacing.md }}
                />
              </ScrollView>
            </Dialog.Content>
            <Dialog.Actions>
              <Button
                onPress={() => {
                  setItemName("");
                  setItemPositionTag("");
                  setItemDialog(false);
                }}
              >
                Cancel
              </Button>
              <Button onPress={handleAddItem} disabled={!itemName.trim()}>
                Add
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

  // ── Store list view ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Surface style={styles.headerSurface} elevation={1}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Stores
        </Text>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
          Manage your store layouts
        </Text>
      </Surface>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
      >
        {stores.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="store-outline"
              size={64}
              color={colors.textLight}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              No stores yet
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Tap + to add stores like Walmart or Costco
            </Text>
          </View>
        ) : (
          stores.map((store) => (
            <View key={store.id}>
              <TouchableOpacity
                style={storeListStyles.row}
                onPress={() => openStore(store.id)}
                activeOpacity={0.7}
              >
                <MaterialCommunityIcons
                  name="store"
                  size={28}
                  color={colors.primary}
                />
                <Text variant="titleMedium" style={storeListStyles.name}>
                  {store.name}
                </Text>
                <MaterialCommunityIcons
                  name="chevron-right"
                  size={24}
                  color={colors.textLight}
                />
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={colors.error}
                  onPress={() =>
                    setConfirmDialog({
                      action: () => deleteStore(store.id),
                      message: `Delete "${store.name}"? All aisles and item locations will be removed.`,
                    })
                  }
                />
              </TouchableOpacity>
              <Divider />
            </View>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Store"
        style={styles.fab}
        onPress={() => setStoreDialog(true)}
      />

      <Portal>
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

        <Dialog visible={storeDialog} onDismiss={() => setStoreDialog(false)}>
          <Dialog.Title>Add Store</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Store name (e.g. Walmart, Costco)"
              value={storeName}
              onChangeText={setStoreName}
              mode="outlined"
              autoFocus
              onSubmitEditing={handleAddStore}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setStoreName("");
                setStoreDialog(false);
              }}
            >
              Cancel
            </Button>
            <Button onPress={handleAddStore} disabled={!storeName.trim()}>
              Add
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function AnimatedAisleItem({
  loc,
  locIdx,
  totalItems,
  aisleId,
  onMoveItem,
  onRemoveItem,
  onEditItem,
  onOpenDetail,
  colors,
}: {
  loc: any;
  locIdx: number;
  totalItems: number;
  aisleId: string;
  onMoveItem: (aisleId: string, locId: string, dir: "up" | "down") => void;
  onRemoveItem: (locId: string) => void;
  onEditItem: (locId: string, positionTag: string | null) => void;
  onOpenDetail: (itemId: string) => void;
  colors: Colors;
}) {
  const sectionStyles = useMemo(() => createSectionStyles(colors), [colors]);
  const rowAnim = useRef(new Animated.Value(0)).current;

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
        canMoveUp={locIdx > 0}
        canMoveDown={locIdx < totalItems - 1}
        onMoveUp={() => onMoveItem(aisleId, loc.id, "up")}
        onMoveDown={() => onMoveItem(aisleId, loc.id, "down")}
        onActiveChange={handleActiveChange}
        size="sm"
      />
      <View style={sectionStyles.itemInfo}>
        <Text variant="bodyLarge" style={sectionStyles.itemName}>
          {loc.items.name}
        </Text>
        {loc.position_tag ? (
          <Text variant="bodySmall" style={sectionStyles.positionTag}>
            {loc.position_tag}
          </Text>
        ) : null}
      </View>
      <IconButton
        icon="eye-outline"
        size={18}
        iconColor={colors.textLight}
        onPress={() => onOpenDetail(loc.items.id)}
      />
      <IconButton
        icon="pencil-outline"
        size={18}
        iconColor={colors.textLight}
        onPress={() => onEditItem(loc.id, loc.position_tag ?? null)}
      />
      <IconButton
        icon="delete-outline"
        size={18}
        iconColor={colors.textLight}
        onPress={() => onRemoveItem(loc.id)}
      />
    </Animated.View>
  );
}

function AisleSection({
  aisle,
  aisleIdx,
  totalAisles,
  isExpanded,
  onToggle,
  onMoveAisle,
  onDeleteAisle,
  onAddItem,
  onMoveItem,
  onRemoveItem,
  onEditItem,
  onOpenDetail,
  colors,
}: {
  aisle: any;
  aisleIdx: number;
  totalAisles: number;
  isExpanded: boolean;
  onToggle: () => void;
  onMoveAisle: (id: string, dir: "up" | "down") => void;
  onDeleteAisle: (id: string) => void;
  onAddItem: (aisleId: string) => void;
  onMoveItem: (aisleId: string, locId: string, dir: "up" | "down") => void;
  onRemoveItem: (locId: string) => void;
  onEditItem: (locId: string, positionTag: string | null) => void;
  onOpenDetail: (itemId: string) => void;
  colors: Colors;
}) {
  const sectionStyles = useMemo(() => createSectionStyles(colors), [colors]);
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
    <View>
      <Animated.View
        style={[sectionStyles.header, { backgroundColor: headerBg }]}
      >
        <DragHandle
          canMoveUp={aisleIdx > 0}
          canMoveDown={aisleIdx < totalAisles - 1}
          onMoveUp={() => onMoveAisle(aisle.id, "up")}
          onMoveDown={() => onMoveAisle(aisle.id, "down")}
          onActiveChange={handleHeaderActiveChange}
          size="md"
        />
        <TouchableOpacity
          style={sectionStyles.titleArea}
          onPress={onToggle}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={20}
            color={colors.textLight}
          />
          <View style={sectionStyles.titleText}>
            <Text variant="titleMedium" style={sectionStyles.name}>
              {aisle.name}
            </Text>
            {aisle.side && (
              <Text variant="bodySmall" style={sectionStyles.side}>
                {aisle.side}
              </Text>
            )}
          </View>
          <Text variant="bodySmall" style={sectionStyles.count}>
            {aisle.item_store_locations.length} items
          </Text>
        </TouchableOpacity>
        <IconButton
          icon="plus-circle-outline"
          size={22}
          iconColor={colors.primary}
          onPress={() => onAddItem(aisle.id)}
        />
        <IconButton
          icon="delete-outline"
          size={22}
          iconColor={colors.error}
          onPress={() => onDeleteAisle(aisle.id)}
        />
      </Animated.View>

      {isExpanded && (
        <View style={sectionStyles.itemsContainer}>
          {aisle.item_store_locations.length === 0 ? (
            <Text style={sectionStyles.emptyItems}>
              No items — tap + to add
            </Text>
          ) : (
            aisle.item_store_locations.map((loc: any, locIdx: number) => (
              <AnimatedAisleItem
                key={loc.id}
                loc={loc}
                locIdx={locIdx}
                totalItems={aisle.item_store_locations.length}
                aisleId={aisle.id}
                onMoveItem={onMoveItem}
                onRemoveItem={onRemoveItem}
                onEditItem={onEditItem}
                onOpenDetail={onOpenDetail}
                colors={colors}
              />
            ))
          )}
        </View>
      )}
      <Divider />
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
  headerRow: { flexDirection: "row", alignItems: "center" },
  headerText: { flex: 1 },
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
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.md,
    backgroundColor: colors.primary,
  },
  itemDialogContent: { maxHeight: 480 },
}); }

function createStoreListStyles(colors: Colors) { return StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  name: { flex: 1, color: colors.text },
}); }

function createSectionStyles(colors: Colors) { return StyleSheet.create({
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
  side: { color: colors.textLight, fontSize: 12 },
  count: { color: colors.textLight, marginRight: spacing.xs },
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
  itemInfo: { flex: 1 },
  itemName: { color: colors.text },
  positionTag: {
    color: colors.primary,
    fontSize: 11,
    marginTop: 1,
  },
  emptyItems: {
    color: colors.textLight,
    fontStyle: "italic",
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl,
  },
}); }
