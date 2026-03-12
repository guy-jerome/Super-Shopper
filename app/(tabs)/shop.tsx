import { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { View, ScrollView, StyleSheet, TouchableOpacity, RefreshControl, Share } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  type SharedValue,
} from "react-native-reanimated";
import AsyncStorage from "@react-native-async-storage/async-storage";
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
import { useShareStore } from "../../stores/useShareStore";
import { useHouseholdStore } from "../../stores/useHouseholdStore";
import { useHouseholdRealtimeSubscription } from "../../hooks/useHouseholdRealtimeSubscription";
import { FoodSearch } from "../../components/FoodSearch";
import { ItemDetailModal } from "../../components/ItemDetailModal";
import type { FoodSuggestion } from "../../hooks/useOpenFoodFacts";
import { SwipeableRow } from "../../components/SwipeableRow";
import { useColors, spacing, radius, type Colors, getCardStyle, useSeasonalBgStyle } from "../../constants/theme";
import { useSettingsStore, type Season } from "../../stores/useSettingsStore";
import { useRealtimeSubscription } from "../../hooks/useRealtimeSubscription";
import { SkeletonRow } from "../../components/SkeletonRow";
import { SeasonalDivider } from "../../components/SeasonalDivider";

const SHOP_TAGLINES: Record<Season, string> = {
  spring: 'The bees approve of your shopping habits.',
  summer: 'Fresh picks and garden finds await.',
  autumn: 'Cozy up the pantry — harvest season calls.',
  winter: 'Stock up and stay warm by the fire.',
};

const today = new Date().toISOString().split("T")[0];

export default function ShopScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bgStyle = useSeasonalBgStyle(colors.butter);
  const season = useSettingsStore((s) => s.season);
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
    applyRealtimeChange,
  } = useShoppingStore();
  const { stores, fetchStores } = useStoreStore();
  const { addItem, fetchItems } = useItemStore();
  const { templates, loadTemplates, saveTemplate, deleteTemplate } = useListTemplateStore();
  const { sharedWithMe, loadSharedItems } = useShareStore();
  const household = useHouseholdStore((s) => s.household);
  const members = useHouseholdStore((s) => s.members);
  const memberEmailMap = useMemo(() => {
    const map: Record<string, string> = {};
    members.forEach((m) => { map[m.user_id] = m.email; });
    return map;
  }, [members]);

  const [notesCollapsed, setNotesCollapsed] = useState(true);
  const [editingNotes, setEditingNotes] = useState(false);
  const [couponsCollapsed, setCouponsCollapsed] = useState(true);
  const [couponsValue, setCouponsValue] = useState('');
  const [savedCoupons, setSavedCoupons] = useState('');
  const [editingCoupons, setEditingCoupons] = useState(false);
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
  const [collapsedAisles, setCollapsedAisles] = useState<Set<string>>(new Set());

  const toggleAisle = useCallback((aisleId: string) => {
    setCollapsedAisles(prev => {
      const next = new Set(prev);
      if (next.has(aisleId)) next.delete(aisleId);
      else next.add(aisleId);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchShoppingList(user.id, today);
    fetchHistory();
    fetchStores(user.id);
    fetchItems(user.id);
    loadTemplates();
    loadSharedItems(today);
  }, [user?.id]);

  const handleRealtimeChange = useCallback(() => {
    if (user) fetchShoppingList(user.id, today);
  }, [user?.id]);

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await Promise.all([fetchShoppingList(user.id, today), loadSharedItems(today)]);
    setRefreshing(false);
  }, [user?.id]);

  useRealtimeSubscription('shopping_list', user?.id ?? '', handleRealtimeChange);

  const handleHouseholdRealtimeChange = useCallback((payload: any) => {
    const { eventType, new: newRow, old: oldRow } = payload;
    if (eventType === 'INSERT') {
      // Partner added an item — do a full refresh to get item names from the join
      if (newRow?.user_id !== user?.id) {
        fetchShoppingList(user!.id, today);
      }
    } else if (eventType === 'UPDATE') {
      if (newRow?.user_id !== user?.id) {
        applyRealtimeChange('UPDATE', newRow);
      }
    } else if (eventType === 'DELETE') {
      applyRealtimeChange('DELETE', undefined, oldRow?.id);
    }
  }, [user?.id]);

  useHouseholdRealtimeSubscription(household?.id ?? null, handleHouseholdRealtimeChange);

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

  useEffect(() => {
    AsyncStorage.getItem(`super-shopper:coupons:${today}`).then((val) => {
      if (val) { setCouponsValue(val); setSavedCoupons(val); }
    });
  }, []);

  const saveNotes = async () => {
    if (!user) return;
    await updateNotes(user.id, today, notesValue);
    setEditingNotes(false);
  };

  const saveCoupons = async () => {
    await AsyncStorage.setItem(`super-shopper:coupons:${today}`, couponsValue);
    setSavedCoupons(couponsValue);
    setEditingCoupons(false);
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

  const [showConfetti, setShowConfetti] = useState(false);
  const prevChecked = useRef(0);

  useEffect(() => {
    if (total > 0 && checkedCount === total && prevChecked.current !== total) {
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
    }
    prevChecked.current = checkedCount;
  }, [checkedCount, total]);

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
    <View style={[styles.container, bgStyle]}>
      {/* Header */}
      <Surface style={styles.headerSurface} elevation={1}>
        <View style={styles.headerRow}>
          <View>
            <Text variant="headlineMedium" style={styles.headerTitle}>
              Shop
            </Text>
            <Text style={styles.headerDate}>
              {new Date(today + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>
          </View>
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

        <ShoppingProgress checked={checkedCount} total={total} colors={colors} />
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
        {/* Notes + Coupons */}
        <View style={styles.stickyPanels}>
          {/* Notes panel */}
          <View style={styles.panelHeader}>
            <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.textLight} />
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setNotesCollapsed((c) => !c)}>
              <Text variant="labelLarge" style={styles.panelLabel}>Notes</Text>
            </TouchableOpacity>
            <IconButton
              icon={editingNotes ? "check" : "pencil-outline"}
              size={18}
              style={styles.panelEditBtn}
              onPress={editingNotes ? saveNotes : () => { setNotesCollapsed(false); setEditingNotes(true); }}
            />
            <TouchableOpacity onPress={() => setNotesCollapsed((c) => !c)} style={styles.chevronBtn}>
              <MaterialCommunityIcons
                name={notesCollapsed ? "chevron-down" : "chevron-up"}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
          {!notesCollapsed && (
            <View style={styles.panelContent}>
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
                <TouchableOpacity onPress={() => setEditingNotes(true)} style={styles.noteDisplayBox}>
                  <Text style={[styles.notesText, !notes && styles.notesPlaceholder]}>
                    {notes || "Tap to add notes..."}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}

          <Divider style={styles.panelDivider} />

          {/* Coupons panel */}
          <View style={styles.panelHeader}>
            <MaterialCommunityIcons name="ticket-percent-outline" size={18} color={colors.textLight} />
            <TouchableOpacity style={{ flex: 1 }} onPress={() => setCouponsCollapsed((c) => !c)}>
              <Text variant="labelLarge" style={styles.panelLabel}>Coupons</Text>
            </TouchableOpacity>
            <IconButton
              icon={editingCoupons ? "check" : "pencil-outline"}
              size={18}
              style={styles.panelEditBtn}
              onPress={editingCoupons ? saveCoupons : () => { setCouponsCollapsed(false); setEditingCoupons(true); }}
            />
            <TouchableOpacity onPress={() => setCouponsCollapsed((c) => !c)} style={styles.chevronBtn}>
              <MaterialCommunityIcons
                name={couponsCollapsed ? "chevron-down" : "chevron-up"}
                size={20}
                color={colors.textLight}
              />
            </TouchableOpacity>
          </View>
          {!couponsCollapsed && (
            <View style={styles.panelContent}>
              {editingCoupons ? (
                <TextInput
                  value={couponsValue}
                  onChangeText={setCouponsValue}
                  multiline
                  mode="outlined"
                  placeholder="Add coupon codes or deals..."
                  style={styles.notesInput}
                  autoFocus
                />
              ) : (
                <TouchableOpacity onPress={() => setEditingCoupons(true)} style={styles.noteDisplayBox}>
                  <Text style={[styles.notesText, !savedCoupons && styles.notesPlaceholder]}>
                    {savedCoupons || "Tap to add coupons..."}
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Shopping list */}
        {shoppingList.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons
              name="cart-outline"
              size={72}
              color={colors.primaryLight}
            />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              {season === 'spring' ? "Nothing on the list — enjoy the freedom!" : season === 'summer' ? "List is clear — you're all set!" : season === 'autumn' ? "List is blank — what do you need?" : "Nothing to fetch — stay warm!"}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Head to the Home tab and tap items you're running low on — they'll appear here organised by aisle.
            </Text>
            <Text style={styles.emptyDecorative}>{SHOP_TAGLINES[season]}</Text>
          </View>
        ) : aisleGroups ? (
          aisleGroups.map((group) => (
            <View key={group.aisleId}>
              <View
                onLayout={(e) => {
                  aisleSectionOffsets.current[group.aisleId] =
                    e.nativeEvent.layout.y;
                }}
              >
                <View
                  style={[
                    styles.aisleHeader,
                    season === 'summer' && { backgroundColor: colors.primaryDark, borderLeftColor: colors.accent },
                    season === 'autumn' && { backgroundColor: colors.accentLight, borderLeftColor: colors.stripe, transform: [{ rotate: '-0.3deg' }] },
                    season === 'winter' && { backgroundColor: colors.cardBg, borderLeftColor: colors.accent },
                    season === 'spring' && { backgroundColor: colors.accentLight, borderLeftColor: colors.stripe },
                  ]}
                >
                  <TouchableOpacity style={{ flex: 1 }} onPress={() => toggleAisle(group.aisleId)}>
                    <Text variant="labelLarge" style={[
                      styles.aisleHeaderText,
                      season === 'summer' && { color: '#F5F5DC' },
                      season === 'autumn' && { color: colors.text },
                      season === 'winter' && { color: colors.text },
                    ]}>
                      {season === 'winter' ? `·❄· ${group.name} ·❄·` : group.name}
                    </Text>
                  </TouchableOpacity>
                  {!collapsedAisles.has(group.aisleId) && (
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
                      <Text variant="labelSmall" style={[
                        styles.markAllText,
                        season === 'summer' && { color: '#F5F5DC' },
                      ]}>
                        {group.items.every((i) => i.checked)
                          ? "Unmark all"
                          : "Mark all done"}
                      </Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity onPress={() => toggleAisle(group.aisleId)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                    <MaterialCommunityIcons
                      name={collapsedAisles.has(group.aisleId) ? "chevron-down" : "chevron-up"}
                      size={18}
                      color={season === 'summer' ? '#F5F5DC' : colors.primary}
                    />
                  </TouchableOpacity>
                </View>
                {!collapsedAisles.has(group.aisleId) && group.items.map((item) => (
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
                      addedByEmail={item.added_by && item.added_by !== user?.id ? (memberEmailMap[item.added_by] ?? null) : null}
                      onToggle={() => handleToggleChecked(item.id, !item.checked)}
                      onEditQty={() =>
                        openQtyEdit(item.id, item.item_name, item.quantity)
                      }
                      onOpenDetail={() => setDetailItemId(item.item_id)}
                      colors={colors}
                      styles={styles}
                    />
                    <Divider style={styles.itemDivider} />
                  </SwipeableRow>
                ))}
              </View>
              <SeasonalDivider />
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
                addedByEmail={item.added_by && item.added_by !== user?.id ? (memberEmailMap[item.added_by] ?? null) : null}
                onToggle={() => handleToggleChecked(item.id, !item.checked)}
                onEditQty={() =>
                  openQtyEdit(item.id, item.item_name, item.quantity)
                }
                onOpenDetail={() => setDetailItemId(item.item_id)}
                colors={colors}
                styles={styles}
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

        {sharedWithMe.map((shared) => (
          <View key={shared.ownerId} style={styles.sharedSection}>
            <View style={styles.sharedHeader}>
              <MaterialCommunityIcons name="account-heart-outline" size={16} color={colors.primary} />
              <Text variant="titleSmall" style={styles.sharedHeaderText}>
                {shared.ownerEmail}'s list
              </Text>
            </View>
            {shared.items.length === 0 ? (
              <Text style={styles.sharedEmpty}>No items on their list today</Text>
            ) : (
              shared.items.map((item) => (
                <View key={item.id} style={styles.sharedItem}>
                  <MaterialCommunityIcons
                    name={item.checked ? 'check-circle-outline' : 'circle-outline'}
                    size={20}
                    color={item.checked ? colors.primary : colors.textLight}
                  />
                  <Text style={[styles.sharedItemName, item.checked && styles.sharedItemChecked]}>
                    {item.item_name}
                  </Text>
                  {item.item_brand || item.item_quantity ? (
                    <Text style={styles.sharedItemMeta}>
                      {[item.item_brand, item.item_quantity].filter(Boolean).join(' · ')}
                    </Text>
                  ) : null}
                </View>
              ))
            )}
          </View>
        ))}

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

      <ConfettiBurst visible={showConfetti} />

      <FAB
        icon="pencil-plus"
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
              <View key={t.id} style={{ flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: colors.surface }}>
                <TouchableOpacity
                  style={{ flex: 1, paddingVertical: 12 }}
                  onPress={async () => {
                    if (!user) return;
                    for (const item of t.items) {
                      await addToList(user.id, item.item_id, item.quantity);
                    }
                    setShowLoadDialog(false);
                  }}
                >
                  <Text style={{ color: colors.text, fontWeight: '500' }}>{t.name}</Text>
                  <Text style={{ color: colors.textLight, fontSize: 12 }}>{t.items.length} item{t.items.length !== 1 ? 's' : ''}</Text>
                </TouchableOpacity>
                <IconButton icon="delete-outline" size={20} iconColor={colors.error} onPress={() => deleteTemplate(t.id)} />
              </View>
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
          style={{ backgroundColor: colors.surface, bottom: 92 }}
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
  addedByEmail,
  onToggle,
  onEditQty,
  onOpenDetail,
  colors,
  styles,
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
  addedByEmail?: string | null;
  onToggle: () => void;
  onEditQty: () => void;
  onOpenDetail: () => void;
  colors: Colors;
  styles: ReturnType<typeof createStyles>;
}) {
  const meta = [item.item_brand, item.item_quantity].filter(Boolean).join(' · ');
  const checkScale = useSharedValue(1);
  const checkAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
  }));

  const handleCheckPress = () => {
    checkScale.value = withSpring(1.2, { damping: 6, stiffness: 300 }, () => {
      checkScale.value = withSpring(1, { damping: 8, stiffness: 200 });
    });
    onToggle();
  };

  return (
    <View style={[styles.itemCard, getCardStyle(colors) as any, { opacity: item.checked ? 0.65 : 1 }]}>
      {/* Left stripe */}
      <View style={[styles.itemStripe, { backgroundColor: colors.stripe }]} />
      {/* Existing row content */}
      <View style={styles.itemRowInner}>
        <Animated.View style={checkAnimStyle}>
          <Checkbox
            status={item.checked ? "checked" : "unchecked"}
            onPress={handleCheckPress}
            color={colors.primary}
          />
        </Animated.View>
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
        {!!addedByEmail && (
          <View style={styles.addedByChip}>
            <Text style={styles.addedByText}>{addedByEmail[0].toUpperCase()}</Text>
          </View>
        )}
        <IconButton
          icon="eye-outline"
          size={22}
          iconColor={colors.textLight}
          onPress={onOpenDetail}
        />
      </View>
    </View>
  );
}

// ─── Shopping Progress Bar (W2) ───────────────────────────────────────────────

function ShoppingProgress({ checked, total, colors }: { checked: number; total: number; colors: Colors }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(total > 0 ? checked / total : 0, { duration: 500 });
  }, [checked, total]);

  const barStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%` as any,
  }));

  if (total === 0) return null;

  return (
    <View style={{ paddingHorizontal: 16, paddingVertical: 4 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
        <Text style={{ fontSize: 11, color: colors.textLight, fontWeight: '600' }}>
          {checked === total ? '✓ All done!' : `${checked} of ${total} items`}
        </Text>
        <Text style={{ fontSize: 11, color: colors.textLight }}>
          {total > 0 ? Math.round((checked / total) * 100) : 0}%
        </Text>
      </View>
      <View style={{ height: 4, backgroundColor: colors.softShadow, borderRadius: 2, overflow: 'hidden' }}>
        <Animated.View style={[{
          height: 4,
          backgroundColor: colors.accent,
          borderRadius: 2,
        }, barStyle]} />
      </View>
    </View>
  );
}

// ─── Confetti Burst (W2) ──────────────────────────────────────────────────────

const CONFETTI_COLORS = ['#DA8359', '#A3CCDA', '#84B179', '#F5D2D2', '#BDE3C3', '#ECDCCC', '#94B4C1'];

function ConfettiParticle({ anim, angle, distance, color, size }: {
  anim: SharedValue<number>;
  angle: number;
  distance: number;
  color: string;
  size: number;
}) {
  const style = useAnimatedStyle(() => {
    const p = anim.value;
    const tx = Math.cos(angle) * distance * p;
    const ty = Math.sin(angle) * distance * p - 60 * p * p; // arc upward
    return {
      transform: [{ translateX: tx }, { translateY: ty }],
      opacity: p < 0.7 ? 1 : 1 - (p - 0.7) / 0.3,
    };
  });

  return (
    <Animated.View
      style={[{
        position: 'absolute',
        top: '45%' as any,
        left: '50%' as any,
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
      }, style]}
    />
  );
}

function ConfettiBurst({ visible }: { visible: boolean }) {
  const anim = useSharedValue(0);

  useEffect(() => {
    if (visible) {
      anim.value = 0;
      anim.value = withTiming(1, { duration: 1200 });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999, pointerEvents: 'none' } as any}>
      {Array.from({ length: 20 }).map((_, i) => {
        const angle = (i / 20) * Math.PI * 2;
        const distance = 60 + (i % 5) * 25;
        const color = CONFETTI_COLORS[i % CONFETTI_COLORS.length];
        const size = 6 + (i % 4) * 2;
        return (
          <ConfettiParticle
            key={i}
            anim={anim}
            angle={angle}
            distance={distance}
            color={color}
            size={size}
          />
        );
      })}
    </View>
  );
}

function createStyles(colors: Colors) { return StyleSheet.create({
  // Overall container: butter yellow notepad
  container: { flex: 1, backgroundColor: colors.butter },
  // Header peeks above the notepad in parchment
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
  headerTitle: { color: colors.text, fontFamily: 'Caveat_700Bold', fontSize: 32 },
  headerDate: { color: colors.textLight, fontSize: 13 },
  // ScrollView area is the notepad itself
  scroll: { flex: 1, backgroundColor: colors.butter },
  scrollContent: { paddingBottom: 100 },
  fab: {
    position: "absolute",
    bottom: 92,
    right: spacing.md,
    backgroundColor: colors.primary,
  },
  centered: { flex: 1, alignItems: "center", justifyContent: "center" },
  // Sticky notes + coupons panels above the list
  stickyPanels: {
    backgroundColor: colors.butter,
    borderBottomWidth: 2,
    borderBottomColor: colors.butterDark,
  },
  panelHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
  },
  panelLabel: { color: colors.textLight },
  panelEditBtn: { margin: 0 },
  chevronBtn: { padding: 4 },
  panelContent: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: colors.accent,
    marginLeft: spacing.md,
  },
  panelDivider: { backgroundColor: colors.softShadow },
  notesInput: {
    minHeight: 60,
    backgroundColor: colors.cardBg,
    borderStyle: 'dashed' as const,
    borderColor: colors.divider,
    borderRadius: 6,
  },
  notesText: {
    color: colors.text,
    lineHeight: 22,
    paddingVertical: spacing.xs,
  },
  notesPlaceholder: { color: colors.textLight, fontStyle: "italic" },
  noteDisplayBox: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderStyle: 'dashed' as const,
    borderColor: colors.divider,
    borderRadius: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minHeight: 44,
  },
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
  emptyDecorative: { color: colors.textLight, fontStyle: 'italic', fontSize: 12, marginTop: spacing.sm },
  // Item rows: transparent so butter-yellow notepad shows through; ruled line at bottom
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
    minHeight: 52,
    backgroundColor: "transparent",
    borderBottomWidth: 1,
    borderBottomColor: colors.butterDark,
  },
  itemCard: {
    flexDirection: "row",
    marginHorizontal: spacing.sm,
    marginVertical: 2,
    overflow: "hidden",
  },
  itemStripe: {
    width: 5,
  },
  itemRowInner: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingRight: spacing.md,
    minHeight: 52,
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
  // Checked items: seasonal accent strikethrough
  itemChecked: { textDecorationLine: "line-through", color: colors.accent },
  // Qty badge: light sage chip
  qtyBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: 12,
  },
  qtyBadgeText: { color: colors.primary },
  // Divider between items hidden — ruled line on itemRow handles visual separation
  itemDivider: { marginLeft: spacing.md + 36, backgroundColor: "transparent" },
  clearButton: { margin: spacing.md, borderColor: colors.error },
  // Aisle headers: sticky-note tab style (full-width, light sage, left accent bar)
  aisleHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.primaryLight,
    borderRadius: 0,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  aisleHeaderText: { flex: 1, color: colors.primaryDark, fontWeight: "600" },
  markAllBtn: { paddingHorizontal: spacing.sm, paddingVertical: 4 },
  markAllText: { color: colors.primary },
  // Jump bar pills
  jumpBar: { maxHeight: 34, backgroundColor: colors.butter },
  jumpBarContent: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    gap: spacing.xs,
  },
  jumpPill: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.softShadow,
  },
  jumpPillActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  jumpPillText: { color: colors.text, fontSize: 11, fontWeight: "500" },
  jumpPillTextActive: { color: "#fff" },
  qtyStepper: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.lg,
  },
  qtyValue: { minWidth: 40, textAlign: "center", color: colors.text },
  // Shared section: paper-white card with soft shadow
  sharedSection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  sharedHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  sharedHeaderText: { color: colors.primary, fontWeight: '600' },
  sharedEmpty: { color: colors.textLight, fontSize: 13, fontStyle: 'italic' },
  sharedItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 4 },
  sharedItemName: { flex: 1, color: colors.text },
  sharedItemChecked: { textDecorationLine: 'line-through', color: colors.textLight },
  sharedItemMeta: { color: colors.textLight, fontSize: 12 },
  // History section: paper-white card with soft shadow
  historySection: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    shadowColor: colors.text,
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
    overflow: "hidden",
  },
  historyHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  historyDateRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.softShadow,
  },
  historyItem: { color: colors.text, paddingVertical: 4, paddingLeft: spacing.md + spacing.sm },
  historyItemChecked: { color: colors.textLight, textDecorationLine: "line-through" },
  addedByChip: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 2,
  },
  addedByText: { color: '#fff', fontSize: 11, fontWeight: '700' as const },
}); }
