import { useEffect, useState } from 'react';
import { View, ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import {
  Text, FAB, Portal, Dialog, TextInput, Button, ActivityIndicator,
  IconButton, Divider, Surface, Chip, Searchbar, Menu,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useAuthStore } from '../../stores/useAuthStore';
import { useItemStore, type ItemSortOrder, type ItemWithLocations } from '../../stores/useItemStore';
import { useShoppingStore } from '../../stores/useShoppingStore';
import { FoodSearch } from '../../components/FoodSearch';
import type { FoodSuggestion } from '../../hooks/useOpenFoodFacts';
import { colors, spacing } from '../../constants/theme';

type FilterMode = 'all' | 'no-home' | 'no-store';

export default function ItemsScreen() {
  const { user } = useAuthStore();
  const {
    items, isLoading, sortOrder,
    fetchItems, setSortOrder,
    addItem, updateItemTags, updateItemName, deleteItem,
  } = useItemStore();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [sortMenuVisible, setSortMenuVisible] = useState(false);
  const [addDialog, setAddDialog] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemTags, setNewItemTags] = useState('');
  const [pendingSuggestion, setPendingSuggestion] = useState<FoodSuggestion | null>(null);
  const [editDialog, setEditDialog] = useState(false);
  const [editTarget, setEditTarget] = useState<ItemWithLocations | null>(null);
  const [editName, setEditName] = useState('');
  const [editTags, setEditTags] = useState('');
  const [tagInput, setTagInput] = useState('');
  const [editTagList, setEditTagList] = useState<string[]>([]);

  const { shoppingList, addToList, fetchShoppingList } = useShoppingStore();
  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (!user) return;
    fetchItems(user.id);
    fetchShoppingList(user.id, today);
  }, [user?.id]);

  const isInList = (itemId: string) => shoppingList.some((s) => s.item_id === itemId);

  const handleAddToList = async (item: ItemWithLocations) => {
    if (!user) return;
    if (isInList(item.id)) return;
    await addToList(user.id, item.id, 1);
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch = !search.trim() || item.name.toLowerCase().includes(search.toLowerCase());
    const matchesFilter =
      filterMode === 'all' ||
      (filterMode === 'no-home' && !item.hasHomeLocation) ||
      (filterMode === 'no-store' && !item.hasStoreLocation);
    return matchesSearch && matchesFilter;
  });

  const handleAddItem = async () => {
    if (!user || !newItemName.trim()) return;
    const tags = newItemTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
    const meta = pendingSuggestion ? {
      brand: pendingSuggestion.brand ?? null,
      quantity: pendingSuggestion.quantity ?? null,
      image_url: pendingSuggestion.imageUrl ?? null,
    } : undefined;
    await addItem(user.id, newItemName.trim(), tags, meta);
    setNewItemName('');
    setNewItemTags('');
    setPendingSuggestion(null);
    setAddDialog(false);
  };

  const openEdit = (item: ItemWithLocations) => {
    setEditTarget(item);
    setEditName(item.name);
    setEditTags(item.tags.join(', '));
    setEditTagList([...item.tags]);
    setTagInput('');
    setEditDialog(true);
  };

  const addTag = () => {
    const t = tagInput.trim();
    if (t && !editTagList.includes(t)) {
      setEditTagList((prev) => [...prev, t]);
    }
    setTagInput('');
  };

  const removeTag = (tag: string) => {
    setEditTagList((prev) => prev.filter((t) => t !== tag));
  };

  const handleSaveEdit = async () => {
    if (!editTarget) return;
    if (editName.trim() !== editTarget.name) {
      await updateItemName(editTarget.id, editName.trim());
    }
    await updateItemTags(editTarget.id, editTagList);
    setEditDialog(false);
    setEditTarget(null);
  };

  const sortLabel: Record<ItemSortOrder, string> = {
    name: 'Name (A–Z)',
    recent: 'Recently Updated',
    tags: 'By Tags',
  };

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Surface style={styles.headerSurface} elevation={1}>
        <View style={styles.headerRow}>
          <Text variant="headlineMedium" style={styles.headerTitle}>Items</Text>
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
                onPress={() => { setSortOrder(key); setSortMenuVisible(false); }}
                trailingIcon={sortOrder === key ? 'check' : undefined}
              />
            ))}
          </Menu>
        </View>
        <Text variant="bodySmall" style={styles.headerSubtitle}>
          {items.length} item{items.length !== 1 ? 's' : ''} total
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
        {([
          { key: 'all', label: 'All' },
          { key: 'no-home', label: 'No home location' },
          { key: 'no-store', label: 'No store location' },
        ] as { key: FilterMode; label: string }[]).map((f) => (
          <Chip
            key={f.key}
            selected={filterMode === f.key}
            onPress={() => setFilterMode(f.key)}
            style={styles.filterChip}
            compact
          >
            {f.label}
          </Chip>
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        {filteredItems.length === 0 ? (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="tag-multiple-outline" size={64} color={colors.textLight} />
            <Text variant="titleLarge" style={styles.emptyTitle}>
              {search || filterMode !== 'all' ? 'No matching items' : 'No items yet'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptySubtitle}>
              {filterMode === 'no-home'
                ? 'All items have a home storage location'
                : filterMode === 'no-store'
                ? 'All items have a store location'
                : 'Tap + to add your first item'}
            </Text>
          </View>
        ) : (
          filteredItems.map((item) => (
            <View key={item.id}>
              <TouchableOpacity
                style={styles.itemRow}
                onPress={() => openEdit(item)}
                activeOpacity={0.7}
              >
                <View style={styles.itemMain}>
                  <Text variant="bodyLarge" style={styles.itemName}>{item.name}</Text>
                  <View style={styles.locationBadges}>
                    <LocationBadge
                      icon="home-outline"
                      active={item.hasHomeLocation}
                      label="Home"
                    />
                    <LocationBadge
                      icon="store-outline"
                      active={item.hasStoreLocation}
                      label="Store"
                    />
                  </View>
                  {item.tags.length > 0 && (
                    <View style={styles.tagRow}>
                      {item.tags.map((tag) => (
                        <View key={tag} style={styles.tag}>
                          <Text style={styles.tagText}>{tag}</Text>
                        </View>
                      ))}
                    </View>
                  )}
                </View>
                <IconButton
                  icon={isInList(item.id) ? 'cart-check' : 'cart-plus'}
                  size={20}
                  iconColor={isInList(item.id) ? colors.primary : colors.textLight}
                  onPress={() => handleAddToList(item)}
                />
                <IconButton
                  icon="delete-outline"
                  size={20}
                  iconColor={colors.error}
                  onPress={() => deleteItem(item.id)}
                />
              </TouchableOpacity>
              <Divider />
            </View>
          ))
        )}
      </ScrollView>

      <FAB
        icon="plus"
        label="Add Item"
        style={styles.fab}
        onPress={() => setAddDialog(true)}
      />

      <Portal>
        {/* Add item dialog */}
        <Dialog visible={addDialog} onDismiss={() => { setNewItemName(''); setNewItemTags(''); setPendingSuggestion(null); setAddDialog(false); }}>
          <Dialog.Title>Add Item</Dialog.Title>
          <Dialog.Content>
            <FoodSearch
              value={newItemName}
              onChangeText={(t) => { setNewItemName(t); setPendingSuggestion(null); }}
              onSelect={(name, suggestion) => { setNewItemName(name); setPendingSuggestion(suggestion ?? null); }}
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
            <Button onPress={() => { setNewItemName(''); setNewItemTags(''); setPendingSuggestion(null); setAddDialog(false); }}>
              Cancel
            </Button>
            <Button onPress={handleAddItem} disabled={!newItemName.trim()}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit item dialog */}
        <Dialog visible={editDialog} onDismiss={() => setEditDialog(false)}>
          <Dialog.Title>Edit Item</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Item name"
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
              style={{ marginBottom: spacing.md }}
            />
            <Text variant="bodySmall" style={styles.tagSectionLabel}>Tags</Text>
            <View style={styles.tagRow}>
              {editTagList.map((tag) => (
                <Chip
                  key={tag}
                  onClose={() => removeTag(tag)}
                  style={styles.editTagChip}
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
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditDialog(false)}>Cancel</Button>
            <Button onPress={handleSaveEdit} disabled={!editName.trim()}>Save</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

function LocationBadge({ icon, active, label }: { icon: string; active: boolean; label: string }) {
  return (
    <View style={[locBadgeStyles.badge, active ? locBadgeStyles.active : locBadgeStyles.inactive]}>
      <MaterialCommunityIcons
        name={icon as any}
        size={12}
        color={active ? colors.primary : colors.textLight}
      />
      <Text style={[locBadgeStyles.label, !active && locBadgeStyles.inactiveLabel]}>{label}</Text>
    </View>
  );
}

const locBadgeStyles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
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
});

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  headerSurface: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 2,
  },
  headerTitle: { color: colors.text, fontWeight: 'bold' },
  headerSubtitle: { color: colors.textLight },
  searchbar: { margin: spacing.sm, elevation: 0, backgroundColor: colors.surface },
  searchbarInput: { fontSize: 14 },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingBottom: spacing.sm,
    flexWrap: 'wrap',
  },
  filterChip: { backgroundColor: colors.surface },
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
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingVertical: spacing.sm,
  },
  itemMain: { flex: 1 },
  itemName: { color: colors.text, fontWeight: '500', marginBottom: 4 },
  locationBadges: { flexDirection: 'row', gap: spacing.xs, marginBottom: 4 },
  tagRow: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs, marginTop: 2 },
  tag: {
    backgroundColor: colors.surface,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.primary + '44',
  },
  tagText: { fontSize: 11, color: colors.primary },
  tagSectionLabel: { color: colors.textLight, marginBottom: spacing.xs },
  editTagChip: { backgroundColor: colors.surface },
  tagInputRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: spacing.sm },
  tagInputField: { flex: 1 },
  tagAddBtn: { marginTop: spacing.xs },
});
