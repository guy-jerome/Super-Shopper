import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Share } from "react-native";
import * as Haptics from "expo-haptics";
import {
  Text,
  Button,
  ActivityIndicator,
  Checkbox,
  IconButton,
  Divider,
  Surface,
  TextInput,
  ProgressBar,
  Menu,
  Dialog,
  Portal,
  FAB,
  Snackbar,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/useAuthStore";
import { useShoppingStore } from "../../stores/useShoppingStore";
import { useStoreStore } from "../../stores/useStoreStore";
import { useItemStore } from "../../stores/useItemStore";
import { useListTemplateStore } from "../../stores/useListTemplateStore";
import { FoodSearch } from "../../components/FoodSearch";
import { ItemDetailModal } from "../../components/ItemDetailModal";
import type { FoodSuggestion } from "../../hooks/useOpenFoodFacts";
import { SwipeableRow } from "../../components/SwipeableRow";
import { useColors, spacing, type Colors } from "../../constants/theme";
import { useRealtimeSubscription } from "../../hooks/useRealtimeSubscription";
import { SkeletonRow } from "../../components/SkeletonRow";

const today = new Date().toISOString().split("T")[0];

export default function ShopScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { user } = useAuthStore();
  const {
    shoppingList,
    notes,
    currentStore,
    isLoading,
    history,
    fetchShoppingList,
    fetchHistory,
    toggleChecked,
    updateNotes,
    updateQuantity,
    clearCheckedItems,
    setCurrentStore,
    removeFromList,
    markAllChecked,
    addToList,
  } = useShoppingStore();
  const { stores, fetchStores } = useStoreStore();
  const { addItem, fetchItems } = useItemStore();
  const { templates, loadTemplates, saveTemplate, deleteTemplate } = useListTemplateStore();

  const [editingNotes, setEditingNotes] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [pendingSuggestion, setPendingSuggestion] =
    useState<FoodSuggestion | null>(null);
  const [notesValue, setNotesValue] = useState("");
  const [storeMenuVisible, setStoreMenuVisible] = useState(false);
  const [activeAisle, setActiveAisle] = useState<string | null>(null);
  const [qtyDialog, setQtyDialog] = useState(false);
  const [qtyTarget, setQtyTarget] = useState<{
    id: string;
    name: string;
    current: number;
  } | null>(null);
  const [qtyValue, setQtyValue] = useState(1);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [historyOpen, setHistoryOpen] = useState(false);
  const [openHistoryDate, setOpenHistoryDate] = useState<string | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const aisleSectionOffsets = useRef<Record<string, number>>({});
  const [undoSnackbar, setUndoSnackbar] = useState<{ message: string; onUndo: () => void } | null>(null);
  const undoTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [showTemplateMenu, setShowTemplateMenu] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState('');
  const [showSaveDialog, setShowSaveDialog] = useState(false);
  const [showLoadDialog, setShowLoadDialog] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchShoppingList(user.id, today);
    fetchHistory();
    fetchStores(user.id);
    fetchItems(user.id);
    loadTemplates();
  }, [user?.id]);

  const handleRealtimeChange = useCallback(() => {
    if (user) fetchShoppingList(user.id, today);
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchShoppingList(user.id, today);
    setRefreshing(false);
  }, [user?.id]);

  useRealtimeSubscription('shopping_list', user?.id ?? '', handleRealtimeChange);

  const showUndo = (message: string, action: () => void, undo: () => void) => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSnackbar({ message, onUndo: undo });
    undoTimerRef.current = setTimeout(() => { action(); setUndoSnackbar(null); }, 5000);
  };

  const dismissUndo = () => {
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    setUndoSnackbar(null);
  };

  useEffect(() => {
    setNotesValue(notes);
  }, [notes]);

  const saveNotes = async () => {
    if (!user) return;
    await updateNotes(user.id, today, notesValue);
    setEditingNotes(false);
  };

  const openQtyEdit = (id: string, name: string, current: number) => {
    setQtyTarget({ id, name, current });
    setQtyValue(current);
    setQtyDialog(true);
  };

  const saveQty = async () => {
    if (!qtyTarget) return;
    await updateQuantity(qtyTarget.id, qtyValue);
    setQtyDialog(false);
    setQtyTarget(null);
  };

  const handleAddItem = async () => {
    if (!user || !newItemName.trim()) return;
    const meta = pendingSuggestion
      ? {
          brand: pendingSuggestion.brand ?? null,
          quantity: pendingSuggestion.quantity ?? null,
          image_url: pendingSuggestion.imageUrl ?? null,
        }
      : undefined;
    const newItem = await addItem(user.id, newItemName.trim(), [], meta);
    if (newItem) {
      await addToList(user.id, newItem.id, 1);
    }
    setNewItemName("");
    setPendingSuggestion(null);
    setAddDialog(false);
  };

  const handleToggleChecked = (id: string, checked: boolean) => {
    Haptics.impactAsync(checked ? Haptics.ImpactFeedbackStyle.Light : Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
    toggleChecked(id, checked);
  };

  const formatDate = (d: string) => new Date(d + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  const total = shoppingList.length;
  const checkedCount = shoppingList.filter((i) => i.checked).length;
  const progress = total > 0 ? checkedCount / total : 0;

  const handleExport = async () => {
    if (shoppingList.length === 0) return;
    const unchecked = shoppingList.filter((i) => !i.checked);
    const checked = shoppingList.filter((i) => i.checked);
    const lines: string[] = [`Shopping List — ${today}`, ""];
    if (unchecked.length > 0) {
      unchecked.forEach((i) => lines.push(`• ${i.item_name}${i.quantity > 1 ? ` ×${i.quantity}` : ""}`));
    }
    if (checked.length > 0) {
      lines.push("", "✓ Already collected:");
      checked.forEach((i) => lines.push(`  ✓ ${i.item_name}`));
    }
    await Share.share({ message: lines.join("\n"), title: "Shopping List" });
  };

  // Group items by aisle when a store is selected — keyed by aisle_id to avoid duplicate name issues
  const aisleGroups = useMemo(() => {
    if (!currentStore) return null;
    const map = new Map<
      string,
      {
        aisleId: string;
        name: string;
        order: number;
        items: { item: (typeof shoppingList)[0]; position_index: number }[];
      }
    >();
    const general: typeof shoppingList = [];

    for (const item of shoppingList) {
      const loc = item.store_locations.find(
        (l) => l.aisles.store_id === currentStore.id,
      );
      if (loc) {
        if (!map.has(loc.aisle_id)) {
          map.set(loc.aisle_id, {
            aisleId: loc.aisle_id,
            name: loc.aisles.name,
            order: loc.aisles.order_index,
            items: [],
          });
        }
        map.get(loc.aisle_id)!.items.push({ item, position_index: loc.position_index });
      } else {
        general.push(item);
      }
    }

    const sorted = [...map.values()]
      .sort((a, b) => a.order - b.order)
      .map((group) => ({
        ...group,
        items: group.items
          .sort((a, b) => a.position_index - b.position_index)
          .map((x) => x.item)
          .sort((a, b) => Number(a.checked) - Number(b.checked)),
      }));
    if (general.length > 0)
      sorted.push({
        aisleId: "__general__",
        name: "General",
        order: 9999,
        items: [...general].sort((a, b) => Number(a.checked) - Number(b.checked)),
      });
    return sorted;
  }, [shoppingList, currentStore]);

  if (isLoading && shoppingList.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.headerSurface} elevation={1}>
        <View style={styles.headerRow}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Shop
          </Text>
          {shoppingList.length > 0 && (
            <IconButton
              icon="share-variant-outline"
              size={22}
              iconColor={colors.primary}
              onPress={handleExport}
            />
          )}
          <Menu
            visible={showTemplateMenu}
            onDismiss={() => setShowTemplateMenu(false)}
            anchor={
              <IconButton icon="bookmark-outline" size={22} iconColor={colors.text} style={{ margin: 0 }} onPress={() => setShowTemplateMenu(true)} />
            }
          >
            <Menu.Item
              onPress={() => { setShowTemplateMenu(false); setSaveTemplateName(''); setShowSaveDialog(true); }}
              title="Save as template"
              leadingIcon="content-save-outline"
            />
            {templates.length > 0 && (
              <Menu.Item
                onPress={() => { setShowTemplateMenu(false); setShowLoadDialog(true); }}
                title="Load a template"
                leadingIcon="bookmark-multiple-outline"
              />
            )}
          </Menu>
          <Menu
            visible={storeMenuVisible}
            onDismiss={() => setStoreMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                compact
                onPress={() => setStoreMenuVisible(true)}
                icon="store"
              >
                {currentStore?.name ?? "Select store"}
              </Button>
            }
          >
            <Menu.Item
              title="No store"
              onPress={() => {
                setCurrentStore(null);
                setStoreMenuVisible(false);
              }}
            />
            {stores.map((s) => (
              <Menu.Item
                key={s.id}
                title={s.name}
                onPress={() => {
                  setCurrentStore(s);
                  setStoreMenuVisible(false);
                }}
              />
            ))}
          </Menu>
        </View>

        {total > 0 && (
          <View style={styles.progressRow}>
            <ProgressBar
              progress={progress}
              color={colors.primary}
              style={styles.progressBar}
            />
            <Text variant="bodySmall" style={styles.progressText}>
              {checkedCount}/{total} collected
            </Text>
          </View>
        )}
      </Surface>

      {/* Aisle quick-jump bar */}
      {aisleGroups && aisleGroups.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.jumpBar}
          contentContainerStyle={styles.jumpBarContent}
        >
          {aisleGroups.map((group) => (
            <TouchableOpacity
              key={group.aisleId}
              style={[
                styles.jumpPill,
                activeAisle === group.aisleId && styles.jumpPillActive,
              ]}
              onPress={() => {
                setActiveAisle(group.aisleId);
                const offset = aisleSectionOffsets.current[group.aisleId];
                if (offset !== undefined)
                  scrollRef.current?.scrollTo({ y: offset, animated: true });
              }}
            >
              <Text
                style={[
                  styles.jumpPillText,
                  activeAisle === group.aisleId && styles.jumpPillTextActive,
                ]}
              >
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {/* Notes */}
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <MaterialCommunityIcons
              name="note-text-outline"
              size={22}
              color={colors.textLight}
            />
            <Text variant="labelLarge" style={styles.notesLabel}>
              Notes
            </Text>
            <IconButton
              icon={editingNotes ? "check" : "pencil-outline"}
              size={22}
              onPress={editingNotes ? saveNotes : () => setEditingNotes(true)}
            />
          </View>
          {editingNotes ? (
            <TextInput
              value={notesValue}
              onChangeText={setNotesValue}
              multiline
              mode="outlined"
              placeholder="Add shopping notes..."
              style={styles.notesInput}
              autoFocus
            />
          ) : (
            <TouchableOpacity onPress={() => setEditingNotes(true)}>
              <Text
                style={[styles.notesText, !notes && styles.notesPlaceholder]}
              >
                {notes || "Tap to add notes..."}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Divider />

        {/* Shopping list */}
        {shoppingList.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={64}
              color={colors.textLight}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              List is empty
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Go to the Home tab and tap items you need to buy — they'll appear here organised by store aisle.
            </Text>
          </View>
        ) : aisleGroups ? (
          aisleGroups.map((group) => (
            <View
              key={group.aisleId}
              onLayout={(e) => {
                aisleSectionOffsets.current[group.aisleId] =
                  e.nativeEvent.layout.y;
              }}
            >
              <View style={styles.aisleHeader}>
                <MaterialCommunityIcons
                  name="map-marker-outline"
                  size={16}
                  color={colors.primary}
                />
                <Text variant="labelLarge" style={styles.aisleHeaderText}>
                  {group.name}
                </Text>
                <TouchableOpacity
                  onPress={() => {
                    const allDone = group.items.every((i) => i.checked);
                    markAllChecked(
                      group.items.map((i) => i.id),
                      !allDone,
                    );
                  }}
                  style={styles.markAllBtn}
                >
                  <Text variant="labelSmall" style={styles.markAllText}>
                    {group.items.every((i) => i.checked)
                      ? "Unmark all"
                      : "Mark all done"}
                  </Text>
                </TouchableOpacity>
              </View>
              {group.items.map((item) => (
                <SwipeableRow
                  key={item.id}
                  onDelete={() => {
                    const saved = item;
                    showUndo(
                      `${saved.item_name} removed`,
                      () => removeFromList(saved.id),
                      () => { if (user) addToList(user.id, saved.item_id, saved.quantity); },
                    );
                  }}
                >
                  <ShoppingItem
                    item={item}
                    onToggle={() => handleToggleChecked(item.id, !item.checked)}
                    onEditQty={() =>
                      openQtyEdit(item.id, item.item_name, item.quantity)
                    }
                    onOpenDetail={() => setDetailItemId(item.item_id)}
                    colors={colors}
                  />
                  <Divider style={styles.itemDivider} />
                </SwipeableRow>
              ))}
            </View>
          ))
        ) : (
          [...shoppingList].sort((a, b) => Number(a.checked) - Number(b.checked)).map((item) => (
            <SwipeableRow
              key={item.id}
              onDelete={() => removeFromList(item.id)}
            >
              <ShoppingItem
                item={item}
                onToggle={() => handleToggleChecked(item.id, !item.checked)}
                onEditQty={() =>
                  openQtyEdit(item.id, item.item_name, item.quantity)
                }
                onOpenDetail={() => setDetailItemId(item.item_id)}
                colors={colors}
              />
              <Divider style={styles.itemDivider} />
            </SwipeableRow>
          ))
        )}

        {checkedCount > 0 && (
          <Button
            mode="outlined"
            onPress={() => {
              const checkedItems = shoppingList.filter((i) => i.checked);
              showUndo(
                `${checkedItems.length} completed item${checkedItems.length !== 1 ? 's' : ''} cleared`,
                () => clearCheckedItems(),
                () => { if (user) checkedItems.forEach((it) => addToList(user.id, it.item_id, it.quantity)); },
              );
            }}
            style={styles.clearButton}
            textColor={colors.error}
          >
            Clear {checkedCount} completed item{checkedCount !== 1 ? "s" : ""}
          </Button>
        )}

        {Object.keys(history).length > 0 && (
          <View style={styles.historySection}>
            <TouchableOpacity style={styles.historyHeader} onPress={() => setHistoryOpen(o => !o)}>
              <Text variant="titleSmall" style={{ color: colors.textLight }}>Past 7 days</Text>
              <IconButton icon={historyOpen ? 'chevron-up' : 'chevron-down'} size={22} iconColor={colors.textLight} style={{ margin: 0 }} />
            </TouchableOpacity>
            {historyOpen && Object.keys(history).sort((a, b) => b.localeCompare(a)).map(date => (
              <View key={date}>
                <TouchableOpacity style={styles.historyDateRow} onPress={() => setOpenHistoryDate(openHistoryDate === date ? null : date)}>
                  <Text style={{ color: colors.text }}>{formatDate(date)}</Text>
                  <Text style={{ color: colors.textLight, fontSize: 12 }}>{history[date].length} items</Text>
                </TouchableOpacity>
                {openHistoryDate === date && history[date].map(item => (
                  <Text key={item.id} style={[styles.historyItem, item.checked && styles.historyItemChecked]}>
                    {item.checked ? '✓ ' : '• '}{item.item_name}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Item"
        style={styles.fab}
        onPress={() => setAddDialog(true)}
      />

      <Portal>
        <Dialog
          visible={addDialog}
          onDismiss={() => {
            setNewItemName("");
            setPendingSuggestion(null);
            setAddDialog(false);
          }}
        >
          <Dialog.Title>Add to List</Dialog.Title>
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setNewItemName("");
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

        <Dialog visible={qtyDialog} onDismiss={() => setQtyDialog(false)}>
          <Dialog.Title>Edit Quantity</Dialog.Title>
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
                size={22}
                onPress={() => setQtyValue((q) => Math.max(1, q - 1))}
              />
              <Text variant="titleLarge" style={styles.qtyValue}>
                {qtyValue}
              </Text>
              <IconButton
                icon="plus"
                mode="contained-tonal"
                size={22}
                onPress={() => setQtyValue((q) => q + 1)}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQtyDialog(false)}>Cancel</Button>
            <Button onPress={saveQty} mode="contained">
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showSaveDialog} onDismiss={() => setShowSaveDialog(false)}>
          <Dialog.Title>Save as Template</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Template name"
              value={saveTemplateName}
              onChangeText={setSaveTemplateName}
              mode="outlined"
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowSaveDialog(false)}>Cancel</Button>
            <Button
              onPress={async () => {
                if (!saveTemplateName.trim()) return;
                await saveTemplate(
                  saveTemplateName.trim(),
                  shoppingList.map(i => ({ item_id: i.item_id, item_name: i.item_name, quantity: i.quantity }))
                );
                setShowSaveDialog(false);
              }}
              disabled={!saveTemplateName.trim()}
            >
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showLoadDialog} onDismiss={() => setShowLoadDialog(false)}>
          <Dialog.Title>Load Template</Dialog.Title>
          <Dialog.Content>
            {templates.map(t => (
              <TouchableOpacity
                key={t.id}
                style={{ paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.surface }}
                onPress={async () => {
                  if (!user) return;
                  for (const item of t.items) {
                    await addToList(user.id, item.item_id, item.quantity);
                  }
                  setShowLoadDialog(false);
                }}
              >
                <Text style={{ color: colors.text, fontWeight: '500' }}>{t.name}</Text>
                <Text style={{ color: colors.textLight, fontSize: 12 }}>{t.items.length} items</Text>
              </TouchableOpacity>
            ))}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowLoadDialog(false)}>Close</Button>
          </Dialog.Actions>
        </Dialog>

        <Snackbar
          visible={!!undoSnackbar}
          onDismiss={dismissUndo}
          duration={5000}
          action={{ label: 'Undo', onPress: () => { undoSnackbar?.onUndo(); dismissUndo(); } }}
          style={{ backgroundColor: colors.surface }}
        >
          <Text style={{ color: colors.text }}>{undoSnackbar?.message}</Text>
        </Snackbar>
      </Portal>

      <ItemDetailModal
        itemId={detailItemId}
        onDismiss={() => setDetailItemId(null)}
      />
    </View>
  );
}

function ShoppingItem({
  item,
  onToggle,
  onEditQty,
  onOpenDetail,
  colors,
}: {
  item: {
    id: string;
    item_id: string;
    item_name: string;
    item_brand?: string | null;
    item_quantity?: string | null;
    quantity: number;
    checked: boolean;
  };
  onToggle: () => void;
  onEditQty: () => void;
  onOpenDetail: () => void;
  colors: Colors;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const meta = [item.item_brand, item.item_quantity].filter(Boolean).join(' · ');
  return (
    <View style={styles.itemRow}>
      <Checkbox
        status={item.checked ? "checked" : "unchecked"}
        onPress={onToggle}
        color={colors.primary}
      />
      <View style={styles.itemInfo}>
        <View style={styles.itemNameWrap}>
          <Text
            variant="bodyLarge"
            style={[styles.itemName, item.checked && styles.itemChecked]}
          >
            {item.item_name}
          </Text>
          {!!meta && (
            <Text variant="bodySmall" style={styles.itemMeta} numberOfLines={1}>
              {meta}
            </Text>
          )}
        </View>
        <TouchableOpacity onPress={onEditQty} style={styles.qtyBadge}>
          <Text variant="bodySmall" style={styles.qtyBadgeText}>
            × {item.quantity}
          </Text>
          <MaterialCommunityIcons
            name="pencil-outline"
            size={11}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
      <IconButton
        icon="eye-outline"
        size={22}
        iconColor={colors.textLight}
        onPress={onOpenDetail}
      />
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
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: spacing.sm,
  },
  headerTitle: { color: colors.text, fontWeight: "bold" },
  progressRow: { flexDirection: "row", alignItems: "center", gap: spacing.sm },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  progressText: { color: colors.textLight, minWidth: 90, textAlign: "right" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  fab: {
    position: "absolute",
    bottom: spacing.lg,
    right: spacing.md,
    backgroundColor: colors.primary,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  notesSection: { padding: spacing.md },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  notesLabel: { flex: 1, color: colors.textLight },
  notesInput: { minHeight: 60 },
  notesText: {
    color: colors.text,
    lineHeight: 22,
    paddingVertical: spacing.xs,
  },
  notesPlaceholder: { color: colors.textLight, fontStyle: "italic" },
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
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
    minHeight: 56,
  },
  itemInfo: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
  },
  itemNameWrap: { flex: 1 },
  itemName: { color: colors.text },
  itemMeta: { color: colors.textLight, marginTop: 1 },
  itemChecked: { textDecorationLine: "line-through", color: colors.textLight },
  qtyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
  },
  qtyBadgeText: { color: colors.primary },
  itemDivider: { marginLeft: spacing.md + 36 },
  clearButton: { margin: spacing.md, borderColor: colors.error },
  aisleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  aisleHeaderText: { flex: 1, color: colors.primary, fontWeight: "600" },
  markAllBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  markAllText: { color: colors.primary },
  jumpBar: { maxHeight: 44, backgroundColor: colors.background },
  jumpBarContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  jumpPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  jumpPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  jumpPillText: { color: colors.text, fontSize: 13, fontWeight: "500" },
  jumpPillTextActive: { color: "#fff" },
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  qtyValue: { minWidth: 40, textAlign: "center", color: colors.text },
}); }
