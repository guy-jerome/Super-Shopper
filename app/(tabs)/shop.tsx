import { useEffect, useState, useMemo, useRef } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text, Button, ActivityIndicator, Checkbox, IconButton,
  Divider, Surface, TextInput, ProgressBar, Menu, Dialog, Portal, FAB,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { useShoppingStore } from '../../stores/useShoppingStore';
import { useStoreStore } from '../../stores/useStoreStore';
import { useItemStore } from '../../stores/useItemStore';
import { FoodSearch } from '../../components/FoodSearch';
import type { FoodSuggestion } from '../../hooks/useOpenFoodFacts';
import { SwipeableRow } from '../../components/SwipeableRow';
import { colors, spacing } from '../../constants/theme';

const today = new Date().toISOString().split('T')[0];

export default function ShopScreen() {
  const { user } = useAuthStore();
  const {
    shoppingList, notes, currentStore, isLoading,
    fetchShoppingList, toggleChecked, updateNotes, updateQuantity,
    clearCheckedItems, setCurrentStore, removeFromList, addToList,
  } = useShoppingStore();
  const { stores, fetchStores } = useStoreStore();
  const { addItem } = useItemStore();

  const [editingNotes, setEditingNotes] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [pendingSuggestion, setPendingSuggestion] = useState<FoodSuggestion | null>(null);
  const [notesValue, setNotesValue] = useState('');
  const [storeMenuVisible, setStoreMenuVisible] = useState(false);
  const [activeAisle, setActiveAisle] = useState<string | null>(null);
  const [qtyDialog, setQtyDialog] = useState(false);
  const [qtyTarget, setQtyTarget] = useState<{ id: string; name: string; current: number } | null>(null);
  const [qtyValue, setQtyValue] = useState(1);
  const scrollRef = useRef<ScrollView>(null);
  const aisleSectionOffsets = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!user) return;
    fetchShoppingList(user.id, today);
    fetchStores(user.id);
  }, [user?.id]);

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
    const meta = pendingSuggestion ? {
      brand: pendingSuggestion.brand ?? null,
      quantity: pendingSuggestion.quantity ?? null,
      image_url: pendingSuggestion.imageUrl ?? null,
    } : undefined;
    const newItem = await addItem(user.id, newItemName.trim(), [], meta);
    if (newItem) {
      await addToList(user.id, newItem.id, 1);
    }
    setNewItemName('');
    setPendingSuggestion(null);
    setAddDialog(false);
  };

  const total = shoppingList.length;
  const checkedCount = shoppingList.filter((i) => i.checked).length;
  const progress = total > 0 ? checkedCount / total : 0;

  // Group items by aisle when a store is selected — keyed by aisle_id to avoid duplicate name issues
  const aisleGroups = useMemo(() => {
    if (!currentStore) return null;
    const map = new Map<string, { aisleId: string; name: string; order: number; items: typeof shoppingList }>();
    const general: typeof shoppingList = [];

    for (const item of shoppingList) {
      const loc = item.store_locations.find((l) => l.aisles.store_id === currentStore.id);
      if (loc) {
        if (!map.has(loc.aisle_id)) {
          map.set(loc.aisle_id, { aisleId: loc.aisle_id, name: loc.aisles.name, order: loc.aisles.order_index, items: [] });
        }
        map.get(loc.aisle_id)!.items.push(item);
      } else {
        general.push(item);
      }
    }

    const sorted = [...map.values()].sort((a, b) => a.order - b.order);
    if (general.length > 0) sorted.push({ aisleId: '__general__', name: 'General', order: 9999, items: general });
    return sorted;
  }, [shoppingList, currentStore]);

  if (isLoading && shoppingList.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={styles.headerSurface} elevation={1}>
        <View style={styles.headerRow}>
          <Text variant="headlineMedium" style={styles.headerTitle}>Shop</Text>
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
                {currentStore?.name ?? 'No store'}
              </Button>
            }
          >
            <Menu.Item
              title="No store"
              onPress={() => { setCurrentStore(null); setStoreMenuVisible(false); }}
            />
            {stores.map((s) => (
              <Menu.Item
                key={s.id}
                title={s.name}
                onPress={() => { setCurrentStore(s); setStoreMenuVisible(false); }}
              />
            ))}
          </Menu>
        </View>

        {total > 0 && (
          <View style={styles.progressRow}>
            <ProgressBar progress={progress} color={colors.primary} style={styles.progressBar} />
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
              style={[styles.jumpPill, activeAisle === group.aisleId && styles.jumpPillActive]}
              onPress={() => {
                setActiveAisle(group.aisleId);
                const offset = aisleSectionOffsets.current[group.aisleId];
                if (offset !== undefined) scrollRef.current?.scrollTo({ y: offset, animated: true });
              }}
            >
              <Text style={[styles.jumpPillText, activeAisle === group.aisleId && styles.jumpPillTextActive]}>
                {group.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <ScrollView ref={scrollRef} style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {/* Notes */}
        <View style={styles.notesSection}>
          <View style={styles.notesHeader}>
            <MaterialCommunityIcons name="note-text-outline" size={18} color={colors.textLight} />
            <Text variant="labelLarge" style={styles.notesLabel}>Notes</Text>
            <IconButton
              icon={editingNotes ? 'check' : 'pencil-outline'}
              size={18}
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
              <Text style={[styles.notesText, !notes && styles.notesPlaceholder]}>
                {notes || 'Tap to add notes...'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
        <Divider />

        {/* Shopping list */}
        {shoppingList.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="cart-outline" size={64} color={colors.textLight} />
            <Text variant="titleLarge" style={styles.emptyTitle}>List is empty</Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              Go to Home Storage and check items you need to buy
            </Text>
          </View>
        ) : aisleGroups ? (
          aisleGroups.map((group) => (
            <View
              key={group.aisleId}
              onLayout={(e) => { aisleSectionOffsets.current[group.aisleId] = e.nativeEvent.layout.y; }}
            >
              <View style={styles.aisleHeader}>
                <MaterialCommunityIcons name="map-marker-outline" size={16} color={colors.primary} />
                <Text variant="labelLarge" style={styles.aisleHeaderText}>{group.name}</Text>
              </View>
              {group.items.map((item) => (
                <SwipeableRow key={item.id} onDelete={() => removeFromList(item.id)}>
                  <ShoppingItem
                    item={item}
                    onToggle={() => toggleChecked(item.id, !item.checked)}
                    onEditQty={() => openQtyEdit(item.id, item.item_name, item.quantity)}
                  />
                  <Divider style={styles.itemDivider} />
                </SwipeableRow>
              ))}
            </View>
          ))
        ) : (
          shoppingList.map((item) => (
            <SwipeableRow key={item.id} onDelete={() => removeFromList(item.id)}>
              <ShoppingItem
                item={item}
                onToggle={() => toggleChecked(item.id, !item.checked)}
                onEditQty={() => openQtyEdit(item.id, item.item_name, item.quantity)}
              />
              <Divider style={styles.itemDivider} />
            </SwipeableRow>
          ))
        )}

        {checkedCount > 0 && (
          <Button
            mode="outlined"
            onPress={clearCheckedItems}
            style={styles.clearButton}
            textColor={colors.error}
          >
            Clear {checkedCount} completed item{checkedCount !== 1 ? 's' : ''}
          </Button>
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Item"
        style={styles.fab}
        onPress={() => setAddDialog(true)}
      />

      <Portal>
        <Dialog visible={addDialog} onDismiss={() => { setNewItemName(''); setPendingSuggestion(null); setAddDialog(false); }}>
          <Dialog.Title>Add to List</Dialog.Title>
          <Dialog.Content>
            <FoodSearch
              value={newItemName}
              onChangeText={(t) => { setNewItemName(t); setPendingSuggestion(null); }}
              onSelect={(name, suggestion) => { setNewItemName(name); setPendingSuggestion(suggestion ?? null); }}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setNewItemName(''); setPendingSuggestion(null); setAddDialog(false); }}>
              Cancel
            </Button>
            <Button onPress={handleAddItem} disabled={!newItemName.trim()}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={qtyDialog} onDismiss={() => setQtyDialog(false)}>
          <Dialog.Title>Edit Quantity</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: spacing.md, color: colors.text }}>
              {qtyTarget?.name}
            </Text>
            <View style={styles.qtyStepper}>
              <IconButton
                icon="minus"
                mode="contained-tonal"
                size={20}
                onPress={() => setQtyValue((q) => Math.max(1, q - 1))}
              />
              <Text variant="titleLarge" style={styles.qtyValue}>{qtyValue}</Text>
              <IconButton
                icon="plus"
                mode="contained-tonal"
                size={20}
                onPress={() => setQtyValue((q) => q + 1)}
              />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQtyDialog(false)}>Cancel</Button>
            <Button onPress={saveQty} mode="contained">Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function ShoppingItem({
  item,
  onToggle,
  onEditQty,
}: {
  item: { id: string; item_name: string; quantity: number; checked: boolean };
  onToggle: () => void;
  onEditQty: () => void;
}) {
  return (
    <View style={styles.itemRow}>
      <Checkbox
        status={item.checked ? 'checked' : 'unchecked'}
        onPress={onToggle}
        color={colors.primary}
      />
      <View style={styles.itemInfo}>
        <Text
          variant="bodyLarge"
          style={[styles.itemName, item.checked && styles.itemChecked]}
        >
          {item.item_name}
        </Text>
        <TouchableOpacity onPress={onEditQty} style={styles.qtyBadge}>
          <Text variant="bodySmall" style={styles.qtyBadgeText}>× {item.quantity}</Text>
          <MaterialCommunityIcons name="pencil-outline" size={11} color={colors.primary} />
        </TouchableOpacity>
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
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  headerTitle: { color: colors.text, fontWeight: 'bold' },
  progressRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  progressBar: { flex: 1, height: 6, borderRadius: 3 },
  progressText: { color: colors.textLight, minWidth: 90, textAlign: 'right' },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.md, backgroundColor: colors.primary },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  notesSection: { padding: spacing.md },
  notesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.xs,
  },
  notesLabel: { flex: 1, color: colors.textLight },
  notesInput: { minHeight: 60 },
  notesText: { color: colors.text, lineHeight: 22, paddingVertical: spacing.xs },
  notesPlaceholder: { color: colors.textLight, fontStyle: 'italic' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  emptySubtitle: { color: colors.textLight, textAlign: 'center' },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: spacing.md,
    minHeight: 56,
  },
  itemInfo: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  itemName: { flex: 1, color: colors.text },
  itemChecked: { textDecorationLine: 'line-through', color: colors.textLight },
  qtyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
  },
  aisleHeaderText: { color: colors.primary, fontWeight: '600' },
  jumpBar: { maxHeight: 44, backgroundColor: colors.background },
  jumpBarContent: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, gap: spacing.xs },
  jumpPill: {
    paddingHorizontal: spacing.md,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.surface,
  },
  jumpPillActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  jumpPillText: { color: colors.text, fontSize: 13, fontWeight: '500' },
  jumpPillTextActive: { color: '#fff' },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  qtyValue: { minWidth: 40, textAlign: 'center', color: colors.text },
});
