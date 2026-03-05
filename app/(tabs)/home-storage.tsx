import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text, FAB, Portal, Dialog, TextInput, Button,
  ActivityIndicator, Checkbox, IconButton, Divider, Surface, Snackbar, Searchbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { useStorageStore } from '../../stores/useStorageStore';
import { useShoppingStore } from '../../stores/useShoppingStore';
import { colors, spacing } from '../../constants/theme';
import { SwipeableRow } from '../../components/SwipeableRow';
import type { StorageLocationWithItems } from '../../types/app.types';

const today = new Date().toISOString().split('T')[0];

export default function HomeStorageScreen() {
  const { user } = useAuthStore();
  const { locations, isLoading, fetchLocations, addLocation, deleteLocation, addItem, deleteItem } =
    useStorageStore();
  const { shoppingList, fetchShoppingList, addToList, removeFromList } = useShoppingStore();

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [locationDialog, setLocationDialog] = useState(false);
  const [locationName, setLocationName] = useState('');
  const [itemDialog, setItemDialog] = useState(false);
  const [itemName, setItemName] = useState('');
  const [targetLocationId, setTargetLocationId] = useState('');
  const [snackbar, setSnackbar] = useState('');
  const [search, setSearch] = useState('');
  const [qtyDialog, setQtyDialog] = useState(false);
  const [qtyTarget, setQtyTarget] = useState<{ id: string; name: string } | null>(null);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!user) return;
    fetchLocations(user.id);
    fetchShoppingList(user.id, today);
  }, [user?.id]);

  const isInList = (itemId: string) => shoppingList.some((s) => s.item_id === itemId);

  const toggleItem = async (itemId: string, itemName: string) => {
    if (!user) return;
    const existing = shoppingList.find((s) => s.item_id === itemId);
    if (existing) {
      await removeFromList(existing.id);
      setSnackbar(`${itemName} removed from list`);
    } else {
      setQtyTarget({ id: itemId, name: itemName });
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
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  const handleAddLocation = async () => {
    if (!user || !locationName.trim()) return;
    await addLocation(user.id, locationName.trim());
    setLocationName('');
    setLocationDialog(false);
  };

  const handleAddItem = async () => {
    if (!user || !itemName.trim() || !targetLocationId) return;
    await addItem(user.id, targetLocationId, itemName.trim());
    setItemName('');
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
      {/* Header */}
      <Surface style={styles.headerSurface} elevation={1}>
        <Text variant="headlineMedium" style={styles.headerTitle}>Home Storage</Text>
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

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {locations.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="home-outline" size={64} color={colors.textLight} />
            <Text variant="titleLarge" style={styles.emptyTitle}>No locations yet</Text>
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
          locations.map((location) => {
            const filtered = search.trim()
              ? location.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
              : location.items;
            if (search.trim() && filtered.length === 0) return null;
            return (
              <LocationSection
                key={location.id}
                location={{ ...location, items: filtered }}
                expanded={expanded.has(location.id) || !!search.trim()}
                onToggle={() => toggleSection(location.id)}
                isInList={isInList}
                onToggleItem={toggleItem}
                onAddItem={() => openAddItem(location.id)}
                onDeleteItem={deleteItem}
                onDeleteLocation={() => deleteLocation(location.id)}
              />
            );
          })
        )}
      </ScrollView>

      <Snackbar
        visible={!!snackbar}
        onDismiss={() => setSnackbar('')}
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
        <Dialog visible={locationDialog} onDismiss={() => setLocationDialog(false)}>
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
            <Button onPress={() => { setLocationName(''); setLocationDialog(false); }}>
              Cancel
            </Button>
            <Button onPress={handleAddLocation} disabled={!locationName.trim()}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={qtyDialog} onDismiss={() => setQtyDialog(false)}>
          <Dialog.Title>Add to Shopping List</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: spacing.md, color: colors.text }}>
              {qtyTarget?.name}
            </Text>
            <View style={styles.qtyStepper}>
              <IconButton
                icon="minus"
                mode="contained-tonal"
                size={20}
                onPress={() => setQty((q) => Math.max(1, q - 1))}
              />
              <Text variant="titleLarge" style={styles.qtyValue}>{qty}</Text>
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
            <Button onPress={confirmAddToList} mode="contained">Add</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={itemDialog} onDismiss={() => setItemDialog(false)}>
          <Dialog.Title>Add Item</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Item name"
              value={itemName}
              onChangeText={setItemName}
              mode="outlined"
              autoFocus
              onSubmitEditing={handleAddItem}
            />
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

type LocationSectionProps = {
  location: StorageLocationWithItems;
  expanded: boolean;
  onToggle: () => void;
  isInList: (itemId: string) => boolean;
  onToggleItem: (itemId: string, itemName: string) => void;
  onAddItem: () => void;
  onDeleteItem: (itemId: string) => void;
  onDeleteLocation: () => void;
};

function LocationSection({
  location, expanded, onToggle, isInList, onToggleItem, onAddItem, onDeleteItem, onDeleteLocation,
}: LocationSectionProps) {
  const checkedCount = location.items.filter((i) => isInList(i.id)).length;

  return (
    <View style={sectionStyles.container}>
      {/* Section Header */}
      <View style={sectionStyles.header}>
        <TouchableOpacity style={sectionStyles.titleArea} onPress={onToggle} activeOpacity={0.7}>
          <MaterialCommunityIcons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={24}
            color={colors.textLight}
          />
          <View style={sectionStyles.titleText}>
            <Text variant="titleMedium" style={sectionStyles.name}>{location.name}</Text>
            {checkedCount > 0 && (
              <Text variant="bodySmall" style={sectionStyles.badge}>
                {checkedCount} on list
              </Text>
            )}
          </View>
        </TouchableOpacity>
        <IconButton icon="plus-circle-outline" size={22} iconColor={colors.primary} onPress={onAddItem} />
        <IconButton icon="delete-outline" size={22} iconColor={colors.error} onPress={onDeleteLocation} />
      </View>

      {/* Items */}
      {expanded && (
        <View style={sectionStyles.itemsContainer}>
          {location.items.length === 0 ? (
            <Text style={sectionStyles.emptyItems}>No items — tap + to add</Text>
          ) : (
            location.items.map((item) => {
              const checked = isInList(item.id);
              return (
                <SwipeableRow key={item.id} onDelete={() => onDeleteItem(item.id)}>
                  <View style={sectionStyles.itemRow}>
                    <Checkbox
                      status={checked ? 'checked' : 'unchecked'}
                      onPress={() => onToggleItem(item.id, item.name)}
                      color={colors.primary}
                    />
                    <Text
                      variant="bodyLarge"
                      style={[sectionStyles.itemName, checked && sectionStyles.itemChecked]}
                    >
                      {item.name}
                    </Text>
                  </View>
                </SwipeableRow>
              );
            })
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
  emptyAction: { marginTop: spacing.lg },
  fab: { position: 'absolute', bottom: spacing.lg, right: spacing.md, backgroundColor: colors.primary },
  searchbar: { margin: spacing.sm, elevation: 0, backgroundColor: colors.surface },
  searchbarInput: { fontSize: 14 },
  snackbar: { marginBottom: 80 },
  qtyStepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.lg },
  qtyValue: { minWidth: 40, textAlign: 'center', color: colors.text },
});

const sectionStyles = StyleSheet.create({
  container: { backgroundColor: colors.background },
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
  badge: { color: colors.primary },
  itemsContainer: { backgroundColor: colors.background },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    minHeight: 48,
  },
  itemName: { flex: 1, color: colors.text, marginLeft: spacing.sm },
  itemChecked: { textDecorationLine: 'line-through', color: colors.textLight },
  emptyItems: {
    color: colors.textLight,
    fontStyle: 'italic',
    paddingVertical: spacing.sm,
    paddingLeft: spacing.xl,
  },
});
