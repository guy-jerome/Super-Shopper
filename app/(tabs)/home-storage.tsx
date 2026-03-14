import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useFocusEffect } from '@react-navigation/native';
import * as Haptics from "expo-haptics";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Modal,
  RefreshControl,
  Platform,
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
  Surface,
  Snackbar,
  Searchbar,
  Chip,
  Menu,
} from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/useAuthStore";
import { useStorageStore } from "../../stores/useStorageStore";
import { useShoppingStore } from "../../stores/useShoppingStore";
import { useItemStore } from "../../stores/useItemStore";
import { useLowStockStore } from "../../stores/useLowStockStore";
import { FoodSearch } from "../../components/FoodSearch";
import { ItemDetailModal } from "../../components/ItemDetailModal";
import { DragHandle } from "../../components/DraggableList";
import { SwipeableRow } from "../../components/SwipeableRow";
import type { FoodSuggestion } from "../../hooks/useOpenFoodFacts";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useColors, spacing, radius, type Colors, getCardStyle, useSeasonalBgStyle } from "../../constants/theme";
import type { StorageLocationWithItems } from "../../types/app.types";
import { STORAGE_TEMPLATES } from "../../constants/templates";
import { OnboardingModal } from "../../components/OnboardingModal";
import { BarcodeScannerModal } from "../../components/BarcodeScannerModal";
import { TabBackground } from "../../components/TabBackground";
import { SkeletonRow } from "../../components/SkeletonRow";
import { EmptyState } from "../../components/EmptyState";
import { SeasonalDivider } from "../../components/SeasonalDivider";
import { PageHeader } from "../../components/PageHeader";
import { useSettingsStore } from "../../stores/useSettingsStore";
import { locationSchema, itemSchema } from "@/utils/validators";

export default function HomeStorageScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const bgStyle = useSeasonalBgStyle(colors.background);
  const [today, setToday] = useState(() => new Date().toISOString().split("T")[0]);
  useFocusEffect(useCallback(() => { setToday(new Date().toISOString().split("T")[0]); }, []));
  const { user } = useAuthStore();
  const {
    locations,
    isLoading,
    fetchLocations,
    addLocation,
    updateLocation,
    deleteLocation,
    moveLocation,
    moveSubsection,
    addItem,
    unlinkItem,
    moveItem,
    transferItem,
  } = useStorageStore();
  const { shoppingList, fetchShoppingList, addToList, removeFromList, updateQuantity } =
    useShoppingStore();
  const { items: globalItems, fetchItems } = useItemStore();
  const { lowStockIds, toggleLowStock, isLowStock } = useLowStockStore();
  const { season } = useSettingsStore();
  const seasonIcon = season === 'spring' ? 'flower-tulip-outline' : season === 'summer' ? 'white-balance-sunny' : season === 'autumn' ? 'leaf-maple' : 'snowflake';

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [expandedSubs, setExpandedSubs] = useState<Set<string>>(new Set());

  // Template picker
  const [templateDialog, setTemplateDialog] = useState(false);

  // Add location dialog (custom)
  const [locationDialog, setLocationDialog] = useState(false);
  const [locationName, setLocationName] = useState("");

  // Add subsection dialog
  const [subsectionDialog, setSubsectionDialog] = useState(false);
  const [subsectionName, setSubsectionName] = useState("");
  const [targetParentId, setTargetParentId] = useState("");

  // Add item dialog
  const [itemDialog, setItemDialog] = useState(false);
  const [itemName, setItemName] = useState("");
  const [targetLocationId, setTargetLocationId] = useState("");
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);

  const [snackbar, setSnackbar] = useState("");
  const [search, setSearch] = useState("");

  // Qty stepper
  const [qtyDialog, setQtyDialog] = useState(false);
  const [qtyTarget, setQtyTarget] = useState<{ id: string; name: string } | null>(null);
  const [qty, setQty] = useState(1);

  const [pendingSuggestion, setPendingSuggestion] = useState<FoodSuggestion | null>(null);
  const [detailItemId, setDetailItemId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{ action: () => void; message: string } | null>(null);
  const [renameDialog, setRenameDialog] = useState<{ id: string; name: string } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  const [locationError, setLocationError] = useState('');
  const [subsectionError, setSubsectionError] = useState('');
  const [itemNameError, setItemNameError] = useState('');

  // Template applying state
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  const itemSuggestions =
    itemName.trim().length > 0
      ? globalItems
          .filter((i) => i.name.toLowerCase().includes(itemName.toLowerCase()))
          .slice(0, 5)
      : [];

  useEffect(() => {
    if (!user) return;
    fetchLocations(user.id);
    fetchShoppingList(user.id, today);
    fetchItems(user.id);
  }, [user?.id]);

  useEffect(() => {
    AsyncStorage.getItem("super-shopper:onboarding-done").then((value) => {
      if (value == null) {
        setShowOnboarding(true);
      }
    });
  }, []);

  const handleOnboardingDone = () => {
    setShowOnboarding(false);
    AsyncStorage.setItem("super-shopper:onboarding-done", "true");
  };

  const isInList = (itemId: string) => shoppingList.some((s) => s.item_id === itemId);

  const toggleItem = async (itemId: string, name: string) => {
    if (!user) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    const existing = shoppingList.find((s) => s.item_id === itemId);
    if (existing) {
      await removeFromList(existing.id);
      setSnackbar(`${name} removed from list`);
    } else {
      await addToList(user.id, itemId, 1, name);
      setSnackbar(`${name} added to list`);
    }
  };

  const handleRestockAll = async () => {
    if (!user) return;
    const lowItems = globalItems.filter(
      (i) => lowStockIds.has(i.id) && !isInList(i.id)
    );
    if (lowItems.length === 0) {
      setSnackbar('All low-stock items already on list');
      return;
    }
    await Promise.all(lowItems.map((i) => addToList(user.id, i.id, 1, i.name)));
    setSnackbar(`${lowItems.length} low-stock item${lowItems.length !== 1 ? 's' : ''} added to list`);
  };

  const addAllToList = async (location: StorageLocationWithItems) => {
    if (!user) return;
    const allItems = [
      ...location.items,
      ...location.subsections.flatMap((s) => s.items),
    ];
    const unlisted = allItems.filter((i) => !isInList(i.id));
    if (unlisted.length === 0) {
      setSnackbar("All items already on list");
      return;
    }
    await Promise.all(unlisted.map((i) => addToList(user.id, i.id, 1)));
    setSnackbar(`${unlisted.length} item${unlisted.length !== 1 ? "s" : ""} added to list`);
  };

  const openQtyDialog = (itemId: string, name: string) => {
    setQtyTarget({ id: itemId, name });
    setQty(1);
    setQtyDialog(true);
  };

  const confirmAddToList = async () => {
    if (!user || !qtyTarget) return;
    // If already on list, update quantity; otherwise add fresh
    const existing = shoppingList.find((s) => s.item_id === qtyTarget.id);
    if (existing) {
      await updateQuantity(existing.id, qty);
    } else {
      await addToList(user.id, qtyTarget.id, qty);
    }
    setSnackbar(`${qtyTarget.name} added ×${qty}`);
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

  const toggleSubsection = (id: string) =>
    setExpandedSubs((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleAddLocation = async () => {
    if (!user) return;
    const result = locationSchema.safeParse({ name: locationName.trim() });
    if (!result.success) {
      setLocationError(result.error.errors[0].message);
      return;
    }
    setLocationError('');
    await addLocation(user.id, locationName.trim());
    setLocationName("");
    setLocationError('');
    setLocationDialog(false);
  };

  const handleAddSubsection = async () => {
    if (!user || !targetParentId) return;
    const result = locationSchema.safeParse({ name: subsectionName.trim() });
    if (!result.success) {
      setSubsectionError(result.error.errors[0].message);
      return;
    }
    setSubsectionError('');
    await addLocation(user.id, subsectionName.trim(), targetParentId);
    setSubsectionName("");
    setSubsectionError('');
    setSubsectionDialog(false);
    // Auto-expand the parent so user sees the new subsection
    setExpanded((prev) => new Set([...prev, targetParentId]));
  };

  const handleApplyTemplate = async (templateIndex: number) => {
    if (!user) return;
    setTemplateDialog(false);
    setApplyingTemplate(true);
    const template = STORAGE_TEMPLATES[templateIndex];
    for (const loc of template.locations) {
      // Don't duplicate an existing location with the same name
      const currentLocs = useStorageStore.getState().locations;
      const existingLoc = currentLocs.find(
        (l) => l.name.toLowerCase() === loc.name.toLowerCase()
      );
      let parentId: string;
      if (existingLoc) {
        parentId = existingLoc.id;
      } else {
        const newLoc = await addLocation(user.id, loc.name);
        if (!newLoc) continue;
        parentId = newLoc.id;
      }
      if (loc.subsections) {
        const freshLocs = useStorageStore.getState().locations;
        const parent = freshLocs.find((l) => l.id === parentId);
        const existingSubs = parent?.subsections ?? [];
        for (const subName of loc.subsections) {
          const alreadyExists = existingSubs.some(
            (s) => s.name.toLowerCase() === subName.toLowerCase()
          );
          if (!alreadyExists) {
            await addLocation(user.id, subName, parentId);
          }
        }
      }
    }
    setApplyingTemplate(false);
    setSnackbar(`${template.label} template applied!`);
  };

  const handleAddItem = async () => {
    if (!user || !targetLocationId) return;
    const result = itemSchema.safeParse({ name: itemName.trim() });
    if (!result.success) {
      setItemNameError(result.error.errors[0].message);
      return;
    }
    setItemNameError('');
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
    setItemNameError('');
    setPendingSuggestion(null);
    setItemDialog(false);
  };

  const openAddItem = (locationId: string) => {
    setTargetLocationId(locationId);
    setItemDialog(true);
  };

  const handleRenameLocation = async () => {
    if (!renameDialog || !renameName.trim()) return;
    await updateLocation(renameDialog.id, renameName.trim());
    setRenameDialog(null);
    setRenameName("");
  };

  const handleRefresh = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await Promise.all([fetchLocations(user.id), fetchShoppingList(user.id, today)]);
    setRefreshing(false);
  }, [user?.id, today]);

  if (isLoading && locations.length === 0) {
    return (
      <View style={{ flex: 1 }}>
        {[...Array(5)].map((_, i) => <SkeletonRow key={i} />)}
      </View>
    );
  }

  return (
    <View style={[styles.container, bgStyle]}>
      <TabBackground tab="home-storage" />
      <PageHeader title="Home Storage" subtitle="Browse your pantry & fridge" colors={colors} tab="home-storage" titleFont="handwritten" />
      {Platform.OS === 'web' && (
        <View style={styles.seasonDecor} pointerEvents="none">
          <MaterialCommunityIcons name={seasonIcon as any} size={180} color={colors.primary} />
        </View>
      )}

      <Searchbar
        placeholder="Search items..."
        value={search}
        onChangeText={setSearch}
        style={styles.searchbar}
        inputStyle={styles.searchbarInput}
      />

      {lowStockIds.size > 0 && (
        <View style={styles.lowStockBanner}>
          <MaterialCommunityIcons name="alert-circle-outline" size={16} color={colors.warning} />
          <Text style={styles.lowStockBannerText}>
            {lowStockIds.size} item{lowStockIds.size !== 1 ? "s" : ""} running low
          </Text>
          <Button
            compact
            mode="text"
            onPress={handleRestockAll}
            labelStyle={{ fontSize: 12 }}
            style={{ marginLeft: 'auto' }}
          >
            Restock all
          </Button>
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing || applyingTemplate} onRefresh={handleRefresh} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {locations.length === 0 ? (
          <EmptyState
            icon="fridge-outline"
            title={season === 'spring' ? 'Your shelves are bare — time to plant some groceries!' : season === 'summer' ? "Basket's empty — let's fill it!" : season === 'autumn' ? 'Nothing on the shelves yet' : 'Cozy and empty in here'}
            subtitle="Add your kitchen zones — Fridge, Pantry, Freezer — to start tracking what you need."
            colors={colors}
          >
            <Button
              mode="contained"
              icon="lightning-bolt"
              onPress={() => setTemplateDialog(true)}
              style={[styles.emptyAction, { marginBottom: spacing.sm }]}
            >
              Use a Template
            </Button>
            <Button
              mode="outlined"
              icon="plus"
              onPress={() => setLocationDialog(true)}
              style={styles.emptyAction}
            >
              Add Custom Location
            </Button>
          </EmptyState>
        ) : (
          locations.map((location, locIdx) => {
            const allItems = [
              ...location.items,
              ...location.subsections.flatMap((s) => s.items),
            ];
            const filtered = search.trim()
              ? allItems.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
              : null;
            if (search.trim() && filtered!.length === 0) return null;
            return (
              <LocationSection
                key={location.id}
                location={location}
                locationIndex={locIdx}
                totalLocations={locations.length}
                expanded={expanded.has(location.id) || !!search.trim()}
                expandedSubs={expandedSubs}
                search={search}
                onToggle={() => toggleSection(location.id)}
                onToggleSub={toggleSubsection}
                isInList={isInList}
                isLowStock={isLowStock}
                onToggleLowStock={toggleLowStock}
                onToggleItem={toggleItem}
                onOpenQtyDialog={openQtyDialog}
                onAddItem={openAddItem}
                onAddAllToList={addAllToList}
                onUnlinkItem={(itemId) => {
                  let name = "this item";
                  const allLocs = [location, ...location.subsections];
                  for (const loc of allLocs) {
                    const found = loc.items.find((i) => i.id === itemId);
                    if (found) { name = found.name; break; }
                  }
                  setConfirmDialog({
                    action: () => unlinkItem(itemId),
                    message: `Remove "${name}" from this location?`,
                  });
                }}
                onRenameLocation={(id, name) => {
                  setRenameDialog({ id, name });
                  setRenameName(name);
                }}
                onDeleteLocation={(id, name) =>
                  setConfirmDialog({
                    action: () => deleteLocation(id),
                    message: `Delete "${name}"? All items inside will be unlinked.`,
                  })
                }
                onMoveLocation={(dir) => moveLocation(location.id, dir)}
                onMoveSubsection={(subId, dir) => moveSubsection(location.id, subId, dir)}
                onMoveItem={(locId, itemId, dir) => moveItem(locId, itemId, dir)}
                onTransferItem={(itemId, fromLocId, toLocId, atEnd) => transferItem(itemId, fromLocId, toLocId, atEnd)}
                onAddSubsection={() => {
                  setTargetParentId(location.id);
                  setSubsectionName("");
                  setSubsectionDialog(true);
                }}
                onOpenDetail={setDetailItemId}
                colors={colors}
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
        icon="plus-box-outline"
        label="Add Location"
        style={styles.fab}
        onPress={() => setLocationDialog(true)}
      />

      <Portal>
        {/* Rename dialog */}
        <Dialog visible={!!renameDialog} onDismiss={() => { setRenameDialog(null); setRenameName(""); }}>
          <Dialog.Title>Rename</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={renameName}
              onChangeText={setRenameName}
              mode="outlined"
              autoFocus
              onSubmitEditing={handleRenameLocation}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setRenameDialog(null); setRenameName(""); }}>Cancel</Button>
            <Button onPress={handleRenameLocation} disabled={!renameName.trim()}>Save</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Add location dialog */}
        <Dialog visible={locationDialog} onDismiss={() => { setLocationName(""); setLocationError(''); setLocationDialog(false); }}>
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
            {!!locationError && <Text style={styles.inputError}>{locationError}</Text>}
            <Button
              mode="text"
              icon="lightning-bolt"
              onPress={() => { setLocationDialog(false); setTemplateDialog(true); }}
              style={{ marginTop: spacing.sm }}
            >
              Use a template instead
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setLocationName(""); setLocationError(''); setLocationDialog(false); }}>Cancel</Button>
            <Button onPress={handleAddLocation} disabled={!locationName.trim()}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Add subsection dialog */}
        <Dialog visible={subsectionDialog} onDismiss={() => { setSubsectionName(""); setSubsectionError(''); setSubsectionDialog(false); }}>
          <Dialog.Title>Add Sub-section</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name (e.g. Upper Shelf, Door, Cheese Drawer)"
              value={subsectionName}
              onChangeText={setSubsectionName}
              mode="outlined"
              autoFocus
              onSubmitEditing={handleAddSubsection}
            />
            {!!subsectionError && <Text style={styles.inputError}>{subsectionError}</Text>}
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setSubsectionName(""); setSubsectionError(''); setSubsectionDialog(false); }}>Cancel</Button>
            <Button onPress={handleAddSubsection} disabled={!subsectionName.trim()}>Add</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Confirm delete dialog */}
        <Dialog visible={!!confirmDialog} onDismiss={() => setConfirmDialog(null)}>
          <Dialog.Title>Confirm Delete</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ color: colors.text }}>{confirmDialog?.message}</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setConfirmDialog(null)}>Cancel</Button>
            <Button textColor={colors.error} onPress={() => { confirmDialog?.action(); setConfirmDialog(null); }}>Delete</Button>
          </Dialog.Actions>
        </Dialog>

        {/* Qty dialog */}
        <Dialog visible={qtyDialog} onDismiss={() => setQtyDialog(false)}>
          <Dialog.Title>Add to Shopping List</Dialog.Title>
          <Dialog.Content>
            <Text variant="bodyMedium" style={{ marginBottom: spacing.md, color: colors.text }}>{qtyTarget?.name}</Text>
            <View style={styles.qtyStepper}>
              <IconButton icon="minus" mode="contained-tonal" size={22} onPress={() => setQty((q) => Math.max(1, q - 1))} />
              <Text variant="titleLarge" style={styles.qtyValue}>{qty}</Text>
              <IconButton icon="plus" mode="contained-tonal" size={22} onPress={() => setQty((q) => q + 1)} />
            </View>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setQtyDialog(false)}>Cancel</Button>
            <Button onPress={confirmAddToList} mode="contained">Add</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Template picker modal */}
      <Modal
        visible={templateDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setTemplateDialog(false)}
      >
        <View style={styles.templateOverlay}>
          <Surface style={styles.templateSheet} elevation={4}>
            <Text variant="titleLarge" style={styles.templateTitle}>Choose a Template</Text>
            <Text variant="bodySmall" style={styles.templateSubtitle}>
              Pre-fills your home storage with common locations
            </Text>
            <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
              {STORAGE_TEMPLATES.map((tmpl, i) => (
                <TouchableOpacity
                  key={tmpl.label}
                  style={[styles.templateCard, { borderColor: colors.surface }]}
                  onPress={() => handleApplyTemplate(i)}
                  activeOpacity={0.7}
                >
                  <MaterialCommunityIcons name={tmpl.icon as any} size={32} color={colors.primary} />
                  <View style={styles.templateCardText}>
                    <Text variant="titleMedium" style={{ color: colors.text, fontWeight: "600" }}>{tmpl.label}</Text>
                    <Text variant="bodySmall" style={{ color: colors.textLight }}>{tmpl.description}</Text>
                    <View style={styles.templateChips}>
                      {tmpl.locations.slice(0, 4).map((l) => (
                        <Chip key={l.name} compact style={styles.templateChip} textStyle={{ fontSize: 10 }}>{l.name}</Chip>
                      ))}
                      {tmpl.locations.length > 4 && (
                        <Chip compact style={styles.templateChip} textStyle={{ fontSize: 10 }}>+{tmpl.locations.length - 4} more</Chip>
                      )}
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Button
              mode="text"
              onPress={() => { setTemplateDialog(false); setLocationDialog(true); }}
              style={{ marginTop: spacing.sm }}
            >
              Add Custom Location Instead
            </Button>
            <Button onPress={() => setTemplateDialog(false)}>Cancel</Button>
          </Surface>
        </View>
      </Modal>

      {/* Add item modal */}
      <Modal
        visible={itemDialog}
        transparent
        animationType="fade"
        onRequestClose={() => { setItemName(""); setItemNameError(''); setPendingSuggestion(null); setItemDialog(false); }}
      >
        <View style={styles.addItemOverlay}>
          <Surface style={styles.addItemSheet} elevation={4}>
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
              <Text variant="titleLarge" style={styles.addItemTitle}>Add Item</Text>
              <IconButton icon="barcode-scan" size={22} iconColor={colors.primary} style={{ margin: 0 }} onPress={() => setShowBarcodeScanner(true)} />
            </View>
            <FoodSearch
              value={itemName}
              onChangeText={(t) => { setItemName(t); setPendingSuggestion(null); setItemNameError(''); }}
              onSelect={(name, suggestion) => { setItemName(name); setPendingSuggestion(suggestion ?? null); setItemNameError(''); }}
              localSuggestions={itemSuggestions}
              autoFocus
            />
            {!!itemNameError && <Text style={styles.inputError}>{itemNameError}</Text>}
            <View style={styles.addItemActions}>
              <Button onPress={() => { setItemName(""); setItemNameError(''); setPendingSuggestion(null); setItemDialog(false); }}>Cancel</Button>
              <Button onPress={handleAddItem} disabled={!itemName.trim()}>Add</Button>
            </View>
          </Surface>
        </View>
      </Modal>

      <BarcodeScannerModal
        visible={showBarcodeScanner}
        onDismiss={() => setShowBarcodeScanner(false)}
        onResult={(suggestion) => {
          setItemName(suggestion.name);
          setPendingSuggestion(suggestion);
          setShowBarcodeScanner(false);
        }}
      />

      <ItemDetailModal itemId={detailItemId} onDismiss={() => setDetailItemId(null)} />

      <OnboardingModal visible={showOnboarding} onDone={handleOnboardingDone} />
    </View>
  );
}

// ─── Sub-types ───────────────────────────────────────────────────────────────

type LocationSectionProps = {
  location: StorageLocationWithItems;
  locationIndex: number;
  totalLocations: number;
  expanded: boolean;
  expandedSubs: Set<string>;
  search: string;
  onToggle: () => void;
  onToggleSub: (id: string) => void;
  isInList: (itemId: string) => boolean;
  isLowStock: (itemId: string) => boolean;
  onToggleLowStock: (itemId: string) => void;
  onToggleItem: (itemId: string, itemName: string) => void;
  onOpenQtyDialog: (itemId: string, itemName: string) => void;
  onAddItem: (locationId: string) => void;
  onAddAllToList: (location: StorageLocationWithItems) => void;
  onUnlinkItem: (itemId: string) => void;
  onDeleteLocation: (id: string, name: string) => void;
  onRenameLocation: (id: string, name: string) => void;
  onMoveLocation: (direction: "up" | "down") => void;

  onMoveSubsection: (subId: string, direction: "up" | "down") => void;
  onMoveItem: (locationId: string, itemId: string, direction: "up" | "down") => void;
  onTransferItem: (itemId: string, fromLocId: string, toLocId: string, atEnd: boolean) => void;
  onAddSubsection: () => void;
  onOpenDetail: (itemId: string) => void;
  colors: Colors;
};

// ─── AnimatedItemRow ─────────────────────────────────────────────────────────

function AnimatedItemRow({
  item,
  itemIdx,
  totalItems,
  locationId,
  isInList,
  isLowStock,
  onToggleLowStock,
  onToggleItem,
  onOpenQtyDialog,
  onUnlinkItem,
  onMoveItem,
  onOpenDetail,
  prevSectionId,
  nextSectionId,
  onTransferItem,
  colors,
  indented = false,
}: {
  item: StorageLocationWithItems["items"][0];
  itemIdx: number;
  totalItems: number;
  locationId: string;
  isInList: (id: string) => boolean;
  isLowStock: (id: string) => boolean;
  onToggleLowStock: (id: string) => void;
  onToggleItem: (id: string, name: string) => void;
  onOpenQtyDialog: (id: string, name: string) => void;
  onUnlinkItem: (id: string) => void;
  onMoveItem: (locId: string, id: string, dir: "up" | "down") => void;
  onOpenDetail: (id: string) => void;
  prevSectionId?: string | null;
  nextSectionId?: string | null;
  onTransferItem?: (itemId: string, toLocId: string, atEnd: boolean) => void;
  colors: Colors;
  indented?: boolean;
}) {
  const sectionStyles = useMemo(() => createSectionStyles(colors), [colors]);
  const rowAnim = useRef(new Animated.Value(0)).current;
  const checked = isInList(item.id);
  const lowStock = isLowStock(item.id);

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
    <SwipeableRow onDelete={() => onUnlinkItem(item.id)}>
      <View style={[sectionStyles.itemCard, getCardStyle(colors) as any]}>
        {/* Left stripe */}
        <View style={[sectionStyles.itemStripe, { backgroundColor: colors.stripe }]} />
        {/* Existing row content */}
        <Animated.View style={[sectionStyles.itemRowInner, { backgroundColor }]}>
          <DragHandle
            canMoveUp={itemIdx > 0}
            canMoveDown={itemIdx < totalItems - 1}
            onMoveUp={() => onMoveItem(locationId, item.id, "up")}
            onMoveDown={() => onMoveItem(locationId, item.id, "down")}
            canMoveToPrev={itemIdx === 0 && !!prevSectionId}
            canMoveToNext={itemIdx === totalItems - 1 && !!nextSectionId}
            onMoveToPrev={() => prevSectionId && onTransferItem?.(item.id, prevSectionId, false)}
            onMoveToNext={() => nextSectionId && onTransferItem?.(item.id, nextSectionId, true)}
            onActiveChange={handleActiveChange}
            size="sm"
          />
          <TouchableOpacity
            onPress={() => onToggleItem(item.id, item.name)}
            onLongPress={() => onOpenQtyDialog(item.id, item.name)}
            activeOpacity={0.7}
            style={sectionStyles.itemTouchable}
          >
            <Checkbox
              status={checked ? "checked" : "unchecked"}
              onPress={() => onToggleItem(item.id, item.name)}
              color={colors.primary}
            />
            <View style={sectionStyles.itemNameWrap}>
              <View style={sectionStyles.itemNameRow}>
                <Text variant="bodyMedium" numberOfLines={1} ellipsizeMode="tail" style={[sectionStyles.itemName, checked && sectionStyles.itemChecked]}>
                  {item.name}
                </Text>
                {lowStock && (
                  <View style={sectionStyles.lowChip}>
                    <MaterialCommunityIcons name="leaf" size={10} color={colors.warning} />
                    <Text style={sectionStyles.lowChipText}>LOW</Text>
                  </View>
                )}
              </View>
              {(item.brand || item.quantity) ? (
                <Text variant="bodySmall" style={sectionStyles.itemMeta} numberOfLines={1}>
                  {[item.brand, item.quantity].filter(Boolean).join(" · ")}
                </Text>
              ) : null}
            </View>
          </TouchableOpacity>
          <IconButton
            icon={lowStock ? "alert-circle" : "alert-circle-outline"}
            size={18}
            iconColor={lowStock ? colors.warning : colors.textLight}
            style={{ margin: 0 }}
            onPress={() => onToggleLowStock(item.id)}
          />
          <IconButton icon="eye-outline" size={18} iconColor={colors.textLight} style={{ margin: 0 }} onPress={() => onOpenDetail(item.id)} />
          <IconButton icon="delete-outline" size={18} iconColor={colors.error} style={{ margin: 0 }} onPress={() => onUnlinkItem(item.id)} />
        </Animated.View>
      </View>
    </SwipeableRow>
  );
}

// ─── SubsectionSection ────────────────────────────────────────────────────────

function SubsectionSection({
  subsection,
  subIdx,
  totalSubs,
  parentId,
  isExpanded,
  search,
  onToggle,
  isInList,
  isLowStock,
  onToggleLowStock,
  onToggleItem,
  onOpenQtyDialog,
  onAddItem,
  onUnlinkItem,
  onMoveSubsection,
  onMoveItem,
  onTransferItem,
  prevSubId,
  nextSubId,
  onRenameLocation,
  onDeleteLocation,
  onOpenDetail,
  colors,
}: {
  subsection: StorageLocationWithItems;
  subIdx: number;
  totalSubs: number;
  parentId: string;
  isExpanded: boolean;
  search: string;
  onToggle: () => void;
  isInList: (id: string) => boolean;
  isLowStock: (id: string) => boolean;
  onToggleLowStock: (id: string) => void;
  onToggleItem: (id: string, name: string) => void;
  onOpenQtyDialog: (id: string, name: string) => void;
  onAddItem: (locId: string) => void;
  onUnlinkItem: (id: string) => void;
  onMoveSubsection: (subId: string, dir: "up" | "down") => void;
  onMoveItem: (locId: string, itemId: string, dir: "up" | "down") => void;
  onTransferItem?: (itemId: string, toLocId: string, atEnd: boolean) => void;
  prevSubId?: string | null;
  nextSubId?: string | null;
  onRenameLocation: (id: string, name: string) => void;
  onDeleteLocation: (id: string, name: string) => void;
  onOpenDetail: (id: string) => void;
  colors: Colors;
}) {
  const sectionStyles = useMemo(() => createSectionStyles(colors), [colors]);
  const { season } = useSettingsStore();
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
    outputRange: [colors.surface + "cc", colors.primary + "20"],
  });

  const filteredItems = search.trim()
    ? subsection.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : subsection.items;

  return (
    <View style={sectionStyles.subsectionContainer}>
      <Animated.View style={[
        sectionStyles.subsectionHeader,
        { backgroundColor: headerBg },
        season === 'summer' && { backgroundColor: colors.primaryDark },
        season === 'autumn' && { backgroundColor: colors.accentLight, transform: [{ rotate: '-0.3deg' }] },
        season === 'winter' && { backgroundColor: colors.cardBg },
        season === 'spring' && { backgroundColor: colors.accentLight },
      ]}>
        <DragHandle
          canMoveUp={subIdx > 0}
          canMoveDown={subIdx < totalSubs - 1}
          onMoveUp={() => onMoveSubsection(subsection.id, "up")}
          onMoveDown={() => onMoveSubsection(subsection.id, "down")}
          onActiveChange={handleHeaderActiveChange}
          size="sm"
        />
        <TouchableOpacity
          style={sectionStyles.titleArea}
          onPress={onToggle}
          onLongPress={() => onRenameLocation(subsection.id, subsection.name)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={16}
            color={colors.textLight}
          />
          <View style={sectionStyles.titleText}>
            <Text variant="bodyLarge" style={[sectionStyles.subsectionName, season === 'summer' && { color: '#F5F5DC' }, season === 'winter' && { color: colors.accent }]}>
              {season === 'winter' ? `·❄· ${subsection.name}` : subsection.name}
            </Text>
            <Text variant="bodySmall" style={sectionStyles.itemCount}>
              {subsection.items.length} item{subsection.items.length !== 1 ? "s" : ""}
              {subsection.items.filter((i) => isInList(i.id)).length > 0
                ? ` · ${subsection.items.filter((i) => isInList(i.id)).length} on list`
                : ""}
            </Text>
          </View>
        </TouchableOpacity>
        <IconButton icon="pencil-outline" size={18} iconColor={colors.textLight} style={{ margin: 0 }} onPress={() => onRenameLocation(subsection.id, subsection.name)} />
        <IconButton icon="plus-circle-outline" size={18} iconColor={colors.primary} style={{ margin: 0 }} onPress={() => onAddItem(subsection.id)} />
        <IconButton
          icon="delete-outline"
          size={18}
          iconColor={colors.error}
          style={{ margin: 0 }}
          onPress={() => onDeleteLocation(subsection.id, subsection.name)}
        />
      </Animated.View>

      {(isExpanded || !!search.trim()) && (
        <View style={sectionStyles.itemsContainer}>
          {filteredItems.length === 0 ? (
            <Text style={[sectionStyles.emptyItems, { paddingLeft: spacing.xl + spacing.md }]}>
              No items — tap + to add
            </Text>
          ) : (
            filteredItems.map((item, itemIdx) => (
              <AnimatedItemRow
                key={item.id}
                item={item}
                itemIdx={itemIdx}
                totalItems={filteredItems.length}
                locationId={subsection.id}
                isInList={isInList}
                isLowStock={isLowStock}
                onToggleLowStock={onToggleLowStock}
                onToggleItem={onToggleItem}
                onOpenQtyDialog={onOpenQtyDialog}
                onUnlinkItem={onUnlinkItem}
                onMoveItem={onMoveItem}
                onOpenDetail={onOpenDetail}
                prevSectionId={itemIdx === 0 ? prevSubId : null}
                nextSectionId={itemIdx === filteredItems.length - 1 ? nextSubId : null}
                onTransferItem={onTransferItem}
                colors={colors}
                indented
              />
            ))
          )}
        </View>
      )}
    </View>
  );
}

// ─── LocationSection ──────────────────────────────────────────────────────────

function LocationSection({
  location,
  locationIndex,
  totalLocations,
  expanded,
  expandedSubs,
  search,
  onToggle,
  onToggleSub,
  isInList,
  isLowStock,
  onToggleLowStock,
  onToggleItem,
  onOpenQtyDialog,
  onAddItem,
  onAddAllToList,
  onUnlinkItem,
  onDeleteLocation,
  onRenameLocation,
  onMoveLocation,
  onMoveSubsection,
  onMoveItem,
  onTransferItem,
  onAddSubsection,
  onOpenDetail,
  colors,
}: LocationSectionProps) {
  const sectionStyles = useMemo(() => createSectionStyles(colors), [colors]);
  const [menuVisible, setMenuVisible] = useState(false);
  const checkedCount = location.items.filter((i) => isInList(i.id)).length +
    location.subsections.flatMap((s) => s.items).filter((i) => isInList(i.id)).length;
  const totalItems = location.items.length +
    location.subsections.reduce((sum, s) => sum + s.items.length, 0);
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

  const filteredItems = search.trim()
    ? location.items.filter((i) => i.name.toLowerCase().includes(search.toLowerCase()))
    : location.items;

  return (
    <View style={sectionStyles.container}>
      <Animated.View style={[sectionStyles.header, { backgroundColor: headerBg }]}>
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
          onLongPress={() => onRenameLocation(location.id, location.name)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={expanded ? "chevron-up" : "chevron-down"}
            size={22}
            color={colors.textLight}
          />
          <View style={sectionStyles.titleText}>
            <Text variant="titleMedium" style={sectionStyles.name}>{location.name}</Text>
            <Text variant="bodySmall" style={sectionStyles.itemCount}>
              {totalItems} item{totalItems !== 1 ? "s" : ""}
              {checkedCount > 0 ? ` · ${checkedCount} on list` : ""}
              {location.subsections.length > 0 ? ` · ${location.subsections.length} section${location.subsections.length !== 1 ? "s" : ""}` : ""}
            </Text>
          </View>
        </TouchableOpacity>
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <IconButton
              icon="dots-horizontal"
              size={22}
              iconColor={colors.textLight}
              onPress={() => setMenuVisible(true)}
            />
          }
        >
          <Menu.Item
            leadingIcon="pencil-outline"
            onPress={() => { setMenuVisible(false); onRenameLocation(location.id, location.name); }}
            title="Rename"
          />
          <Menu.Item
            leadingIcon="cart-arrow-down"
            onPress={() => { setMenuVisible(false); onAddAllToList(location); }}
            title="Add all to list"
          />
          <Menu.Item
            leadingIcon="folder-plus-outline"
            onPress={() => { setMenuVisible(false); onAddSubsection(); }}
            title="Add sub-section"
          />
        </Menu>
        <IconButton icon="plus-circle-outline" size={22} iconColor={colors.primary} onPress={() => onAddItem(location.id)} />
        <IconButton icon="delete-outline" size={22} iconColor={colors.error} onPress={() => onDeleteLocation(location.id, location.name)} />
      </Animated.View>

      {expanded && (
        <View style={sectionStyles.itemsContainer}>
          {/* Direct items on the parent location */}
          {filteredItems.map((item, itemIdx) => (
            <AnimatedItemRow
              key={item.id}
              item={item}
              itemIdx={itemIdx}
              totalItems={filteredItems.length}
              locationId={location.id}
              isInList={isInList}
              isLowStock={isLowStock}
              onToggleLowStock={onToggleLowStock}
              onToggleItem={onToggleItem}
              onOpenQtyDialog={onOpenQtyDialog}
              onUnlinkItem={onUnlinkItem}
              onMoveItem={onMoveItem}
              onOpenDetail={onOpenDetail}
              nextSectionId={itemIdx === filteredItems.length - 1 ? (location.subsections[0]?.id ?? null) : null}
              onTransferItem={(itemId, toLocId, atEnd) => onTransferItem(itemId, location.id, toLocId, atEnd)}
              colors={colors}
            />
          ))}

          {/* Subsections */}
          {location.subsections.map((sub, subIdx) => {
            const subHasMatch = !search.trim() ||
              sub.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase()));
            if (search.trim() && !subHasMatch) return null;
            return (
              <SubsectionSection
                key={sub.id}
                subsection={sub}
                subIdx={subIdx}
                totalSubs={location.subsections.length}
                parentId={location.id}
                isExpanded={expandedSubs.has(sub.id)}
                search={search}
                onToggle={() => onToggleSub(sub.id)}
                isInList={isInList}
                isLowStock={isLowStock}
                onToggleLowStock={onToggleLowStock}
                onToggleItem={onToggleItem}
                onOpenQtyDialog={onOpenQtyDialog}
                onAddItem={onAddItem}
                onUnlinkItem={onUnlinkItem}
                onMoveSubsection={onMoveSubsection}
                onMoveItem={onMoveItem}
                prevSubId={subIdx > 0 ? location.subsections[subIdx - 1].id : null}
                nextSubId={subIdx < location.subsections.length - 1 ? location.subsections[subIdx + 1].id : null}
                onTransferItem={(itemId, toLocId, atEnd) => onTransferItem(itemId, sub.id, toLocId, atEnd)}
                onRenameLocation={onRenameLocation}
                onDeleteLocation={onDeleteLocation}
                onOpenDetail={onOpenDetail}
                colors={colors}
              />
            );
          })}

          {filteredItems.length === 0 && location.subsections.length === 0 && (
            <Text style={sectionStyles.emptyItems}>No items — tap + to add</Text>
          )}
        </View>
      )}
      <SeasonalDivider />
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createStyles(colors: Colors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    seasonDecor: {
      position: 'absolute' as const,
      right: -20,
      bottom: 60,
      opacity: 0.06,
      pointerEvents: 'none' as const,
    },
    scroll: { flex: 1 },
    scrollContent: { paddingBottom: 100 },
    centered: { flex: 1, alignItems: "center", justifyContent: "center" },
    emptyState: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xl * 2,
      paddingHorizontal: spacing.xl,
    },
    emptyTitle: { color: colors.text, marginTop: spacing.md, marginBottom: spacing.sm },
    emptySubtitle: { color: colors.textLight, textAlign: "center", marginBottom: spacing.lg },
    emptyAction: { marginTop: spacing.sm, minWidth: 220 },
    fab: {
      position: "absolute",
      bottom: 92,
      right: spacing.md,
      backgroundColor: colors.primary,
    },
    searchbar: { margin: spacing.sm, elevation: 0, backgroundColor: colors.surface, borderRadius: radius.pill },
    searchbarInput: { fontSize: 14 },
    snackbar: { marginBottom: 92 },
    lowStockBanner: { flexDirection: "row", alignItems: "center", gap: spacing.xs, backgroundColor: '#FDE8C8', paddingHorizontal: spacing.md, paddingVertical: spacing.xs },
    lowStockBannerText: { color: colors.warning, fontSize: 13, fontWeight: "500" as const },
    inputError: { color: colors.error, fontSize: 12, marginTop: 2 },
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
    addItemTitle: { color: colors.text, fontWeight: "600", marginBottom: spacing.md },
    addItemActions: { flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.md, gap: spacing.sm },
    qtyStepper: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: spacing.lg },
    qtyValue: { minWidth: 40, textAlign: "center", color: colors.text },
    templateOverlay: {
      flex: 1,
      backgroundColor: "rgba(0,0,0,0.5)",
      justifyContent: "center",
      alignItems: "center",
      padding: spacing.lg,
    },
    templateSheet: {
      width: "100%",
      maxWidth: 520,
      maxHeight: "85%",
      borderRadius: 16,
      padding: spacing.lg,
      backgroundColor: colors.background,
    },
    templateTitle: { color: colors.text, fontWeight: "700" },
    templateSubtitle: { color: colors.textLight, marginTop: 2 },
    templateCard: {
      flexDirection: "row",
      alignItems: "flex-start",
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: 12,
      borderWidth: 1,
      marginBottom: spacing.sm,
    },
    templateCardText: { flex: 1 },
    templateChips: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: spacing.xs },
    templateChip: { height: 22 },
  });
}

function createSectionStyles(colors: Colors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.surface,
      marginHorizontal: spacing.sm,
      marginTop: spacing.sm,
      borderRadius: radius.md,
      overflow: "hidden",
      borderLeftWidth: 6,
      borderLeftColor: colors.primary,
      shadowColor: '#4A3728',
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 3,
    },
    header: {
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
      paddingVertical: spacing.sm,
      backgroundColor: colors.surface,
    },
    titleArea: { flex: 1, flexDirection: "row", alignItems: "center", gap: spacing.sm },
    titleText: { flex: 1 },
    name: { color: colors.text, fontWeight: "700", fontSize: 16 },
    itemCount: { color: colors.textLight },
    itemsContainer: { backgroundColor: colors.surface },
    itemRow: {
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
      minHeight: 48,
      borderBottomWidth: 1,
      borderBottomColor: colors.softShadow,
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
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
      height: 48,
    },
    itemTouchable: { flex: 1, flexDirection: "row", alignItems: "center", overflow: "hidden" },
    itemNameWrap: { flex: 1, marginLeft: spacing.xs, overflow: "hidden" },
    itemNameRow: { flexDirection: "row", alignItems: "center", gap: spacing.xs, overflow: "hidden", flexShrink: 1 },
    itemName: { color: colors.text, flexShrink: 1 },
    itemMeta: { color: colors.textLight, marginTop: 1 },
    itemChecked: { textDecorationLine: "line-through", color: colors.textLight },
    lowChip: {
      flexDirection: "row",
      alignItems: "center",
      gap: 3,
      backgroundColor: '#FDE8C8',
      borderRadius: 4,
      paddingHorizontal: 5,
      paddingVertical: 1,
    },
    lowChipText: { color: colors.warning, fontSize: 10, fontWeight: "700" as const },
    emptyItems: {
      color: colors.textLight,
      fontStyle: "italic",
      paddingVertical: spacing.sm,
      paddingLeft: spacing.xl,
    },
    // Subsection styles
    subsectionContainer: {
      backgroundColor: colors.surface,
      borderTopWidth: 1,
      borderTopColor: colors.primary + "30",
    },
    subsectionHeader: {
      flexDirection: "row",
      alignItems: "center",
      paddingLeft: spacing.xs,
      paddingRight: spacing.xs,
      paddingVertical: 2,
      backgroundColor: colors.softShadow,
    },
    subsectionLine: {
      width: 2,
      alignSelf: "stretch",
    },
    subsectionName: { color: colors.primary, fontWeight: "600", fontSize: 13 },
  });
}
