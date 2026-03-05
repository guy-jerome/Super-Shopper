import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text, FAB, Portal, Dialog, TextInput, Button, ActivityIndicator,
  IconButton, Divider, Surface, Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStoreStore } from '../../stores/useStoreStore';
import { useStorageStore } from '../../stores/useStorageStore';
import { colors, spacing } from '../../constants/theme';
import type { Aisle } from '../../types/app.types';

type Screen = 'list' | 'detail';
type AisleSide = Aisle['side'];

export default function StoresScreen() {
  const { user } = useAuthStore();
  const {
    stores, activeStore, isLoading,
    fetchStores, fetchStoreWithAisles,
    addStore, deleteStore,
    addAisle, deleteAisle,
    addItemToAisle, removeItemFromAisle,
  } = useStoreStore();
  const { locations } = useStorageStore();

  const [screen, setScreen] = useState<Screen>('list');
  const [storeDialog, setStoreDialog] = useState(false);
  const [storeName, setStoreName] = useState('');
  const [aisleDialog, setAisleDialog] = useState(false);
  const [aisleName, setAisleName] = useState('');
  const [aisleSide, setAisleSide] = useState<AisleSide>('left');
  const [itemDialog, setItemDialog] = useState(false);
  const [itemName, setItemName] = useState('');
  const [targetAisleId, setTargetAisleId] = useState('');
  const [expandedAisles, setExpandedAisles] = useState<Set<string>>(new Set());

  // Autocomplete: all items from home storage, filtered by current input
  const allItems = locations.flatMap((l) => l.items);
  const suggestions = itemName.trim().length > 0
    ? allItems.filter((i) => i.name.toLowerCase().includes(itemName.toLowerCase())).slice(0, 5)
    : [];

  useEffect(() => {
    if (!user) return;
    fetchStores(user.id);
  }, [user?.id]);

  const openStore = async (storeId: string) => {
    await fetchStoreWithAisles(storeId);
    setScreen('detail');
    setExpandedAisles(new Set());
  };

  const handleAddStore = async () => {
    if (!user || !storeName.trim()) return;
    await addStore(user.id, storeName.trim());
    setStoreName('');
    setStoreDialog(false);
  };

  const handleAddAisle = async () => {
    if (!activeStore || !aisleName.trim()) return;
    await addAisle(activeStore.id, aisleName.trim(), aisleSide);
    setAisleName('');
    setAisleDialog(false);
  };

  const handleAddItem = async () => {
    if (!user || !itemName.trim() || !targetAisleId) return;
    await addItemToAisle(user.id, targetAisleId, itemName.trim());
    setItemName('');
    setItemDialog(false);
  };

  const openAddItem = (aisleId: string) => {
    setTargetAisleId(aisleId);
    setItemDialog(true);
  };

  const toggleAisle = (id: string) =>
    setExpandedAisles((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
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
  if (screen === 'detail' && activeStore) {
    return (
      <View style={styles.container}>
        <Surface style={styles.headerSurface} elevation={1}>
          <View style={styles.headerRow}>
            <IconButton icon="arrow-left" onPress={() => setScreen('list')} />
            <View style={styles.headerText}>
              <Text variant="headlineSmall" style={styles.headerTitle}>{activeStore.name}</Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {activeStore.aisles.length} aisle{activeStore.aisles.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <IconButton
              icon="plus-circle-outline"
              iconColor={colors.primary}
              onPress={() => setAisleDialog(true)}
            />
          </View>
        </Surface>

        <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
          {activeStore.aisles.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="store-outline" size={64} color={colors.textLight} />
              <Text variant="titleLarge" style={styles.emptyTitle}>No aisles yet</Text>
              <Text variant="bodyMedium" style={styles.emptySubtitle}>
                Tap + to add aisles like Bakery, Produce, or Dairy
              </Text>
            </View>
          ) : (
            activeStore.aisles.map((aisle) => {
              const isExpanded = expandedAisles.has(aisle.id);
              return (
                <View key={aisle.id}>
                  <View style={sectionStyles.header}>
                    <TouchableOpacity
                      style={sectionStyles.titleArea}
                      onPress={() => toggleAisle(aisle.id)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={colors.textLight}
                      />
                      <View style={sectionStyles.titleText}>
                        <Text variant="titleMedium" style={sectionStyles.name}>{aisle.name}</Text>
                        {aisle.side && (
                          <Text variant="bodySmall" style={sectionStyles.side}>
                            {aisle.side.charAt(0).toUpperCase() + aisle.side.slice(1)} side
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
                      onPress={() => openAddItem(aisle.id)}
                    />
                    <IconButton
                      icon="delete-outline"
                      size={22}
                      iconColor={colors.error}
                      onPress={() => deleteAisle(aisle.id)}
                    />
                  </View>

                  {isExpanded && (
                    <View style={sectionStyles.itemsContainer}>
                      {aisle.item_store_locations.length === 0 ? (
                        <Text style={sectionStyles.emptyItems}>No items — tap + to add</Text>
                      ) : (
                        aisle.item_store_locations.map((loc) => (
                          <View key={loc.id} style={sectionStyles.itemRow}>
                            <MaterialCommunityIcons
                              name="drag-horizontal-variant"
                              size={20}
                              color={colors.textLight}
                              style={sectionStyles.dragHandle}
                            />
                            <Text variant="bodyLarge" style={sectionStyles.itemName}>
                              {loc.items.name}
                            </Text>
                            <IconButton
                              icon="delete-outline"
                              size={18}
                              iconColor={colors.textLight}
                              onPress={() => removeItemFromAisle(loc.id)}
                            />
                          </View>
                        ))
                      )}
                    </View>
                  )}
                  <Divider />
                </View>
              );
            })
          )}
        </ScrollView>

        <Portal>
          <Dialog visible={aisleDialog} onDismiss={() => setAisleDialog(false)}>
            <Dialog.Title>Add Aisle</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Aisle name (e.g. Bakery, Produce)"
                value={aisleName}
                onChangeText={setAisleName}
                mode="outlined"
                autoFocus
                style={{ marginBottom: spacing.md }}
              />
              <Text variant="bodyMedium" style={{ marginBottom: spacing.sm, color: colors.textLight }}>
                Side
              </Text>
              <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                {(['left', 'right', 'center'] as AisleSide[]).map((s) => (
                  <Chip
                    key={s}
                    selected={aisleSide === s}
                    onPress={() => setAisleSide(s)}
                    style={{ flex: 1 }}
                  >
                    {s ? s.charAt(0).toUpperCase() + s.slice(1) : 'None'}
                  </Chip>
                ))}
              </View>
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => { setAisleName(''); setAisleDialog(false); }}>Cancel</Button>
              <Button onPress={handleAddAisle} disabled={!aisleName.trim()}>Add</Button>
            </Dialog.Actions>
          </Dialog>

          <Dialog visible={itemDialog} onDismiss={() => { setItemName(''); setItemDialog(false); }}>
            <Dialog.Title>Add Item to Aisle</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Item name"
                value={itemName}
                onChangeText={setItemName}
                mode="outlined"
                autoFocus
                onSubmitEditing={handleAddItem}
              />
              {suggestions.length > 0 && (
                <View style={suggestionStyles.container}>
                  {suggestions.map((item) => (
                    <Chip
                      key={item.id}
                      onPress={() => setItemName(item.name)}
                      style={suggestionStyles.chip}
                      compact
                    >
                      {item.name}
                    </Chip>
                  ))}
                </View>
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => { setItemName(''); setItemDialog(false); }}>Cancel</Button>
              <Button onPress={handleAddItem} disabled={!itemName.trim()}>Add</Button>
            </Dialog.Actions>
          </Dialog>
        </Portal>
      </View>
    );
  }

  // ── Store list view ────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <Surface style={styles.headerSurface} elevation={1}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Stores</Text>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
          Manage your store layouts
        </Text>
      </Surface>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {stores.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="store-outline" size={64} color={colors.textLight} />
            <Text variant="titleLarge" style={styles.emptyTitle}>No stores yet</Text>
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
                <MaterialCommunityIcons name="store" size={28} color={colors.primary} />
                <Text variant="titleMedium" style={storeListStyles.name}>{store.name}</Text>
                <MaterialCommunityIcons name="chevron-right" size={24} color={colors.textLight} />
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={colors.error}
                  onPress={() => deleteStore(store.id)}
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
            <Button onPress={() => { setStoreName(''); setStoreDialog(false); }}>Cancel</Button>
            <Button onPress={handleAddStore} disabled={!storeName.trim()}>Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  headerText: { flex: 1 },
  headerTitle: { color: colors.text, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textLight, marginTop: 2 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 100 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
  emptySubtitle: { color: colors.textLight, textAlign: 'center' },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.md, backgroundColor: colors.primary },
});

const storeListStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  name: { flex: 1, color: colors.text },
});

const sectionStyles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.sm,
    paddingRight: spacing.xs,
    paddingVertical: spacing.xs,
    backgroundColor: colors.surface,
  },
  titleArea: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  titleText: { flex: 1 },
  name: { color: colors.text, fontWeight: '600' },
  side: { color: colors.textLight },
  count: { color: colors.textLight, marginRight: spacing.xs },
  itemsContainer: { backgroundColor: colors.background },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 48,
  },
  dragHandle: { marginRight: spacing.sm },
  itemName: { flex: 1, color: colors.text },
  emptyItems: {
    color: colors.textLight,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl,
  },
});

const suggestionStyles = StyleSheet.create({
  container: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: spacing.sm },
  chip: { backgroundColor: colors.surface },
});
