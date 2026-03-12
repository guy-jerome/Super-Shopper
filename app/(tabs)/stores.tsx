import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import {
  View,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  RefreshControl,
  Modal,
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
  IconButton,
  Divider,
  Surface,
  Chip,
} from "react-native-paper";
import { STORE_TEMPLATES } from "../../constants/templates";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useAuthStore } from "../../stores/useAuthStore";
import { useStoreStore } from "../../stores/useStoreStore";
import { useItemStore } from "../../stores/useItemStore";
import { useStoreTemplateStore } from "../../stores/useStoreTemplateStore";
import { FoodSearch } from "../../components/FoodSearch";
import { ItemDetailModal } from "../../components/ItemDetailModal";
import { BarcodeScannerModal } from "../../components/BarcodeScannerModal";
import { DragHandle } from "../../components/DraggableList";
import { useColors, spacing, radius, type Colors, useSeasonalBgStyle } from "../../constants/theme";
import { EmptyState } from "../../components/EmptyState";
import { PageHeader } from "../../components/PageHeader";
import { useSettingsStore } from "../../stores/useSettingsStore";

const AISLE_COLORS = ['#D4E8C2', '#C8BEE8', '#E8BFB8', '#FFF3B0', '#FFD7BA'];

type Screen = "list" | "detail";

export default function StoresScreen() {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const storeListStyles = useMemo(() => createStoreListStyles(colors), [colors]);
  const bgStyle = useSeasonalBgStyle(colors.background);
  const { user } = useAuthStore();
  const { season } = useSettingsStore();
  const seasonIcon = season === 'spring' ? 'flower-tulip-outline' : season === 'summer' ? 'white-balance-sunny' : season === 'autumn' ? 'leaf-maple' : 'snowflake';
  const {
    stores,
    activeStore,
    isLoading,
    fetchStores,
    fetchStoreWithAisles,
    addStore,
    updateStore,
    deleteStore,
    addAisle,
    updateAisle,
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
  const [refreshing, setRefreshing] = useState(false);
  const [showBarcodeScanner, setShowBarcodeScanner] = useState(false);
  const [renameDialog, setRenameDialog] = useState<{ id: string; name: string; type: 'store' | 'aisle'; side?: string | null } | null>(null);
  const [renameName, setRenameName] = useState("");
  const [renameSide, setRenameSide] = useState("");
  const [templateDialog, setTemplateDialog] = useState(false);
  const [templateStoreName, setTemplateStoreName] = useState("");
  const [pendingTemplateIdx, setPendingTemplateIdx] = useState<number | null>(null);
  const [applyingTemplate, setApplyingTemplate] = useState(false);

  // User-created store templates
  const { templates: userTemplates, loadTemplates, saveTemplate, deleteTemplate } = useStoreTemplateStore();
  const [saveTemplateDialog, setSaveTemplateDialog] = useState(false);
  const [saveTemplateName, setSaveTemplateName] = useState("");
  const [userTemplateDialog, setUserTemplateDialog] = useState(false);
  const [userTemplateStoreName, setUserTemplateStoreName] = useState("");
  const [pendingUserTemplateId, setPendingUserTemplateId] = useState<string | null>(null);

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
    loadTemplates();
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

  const handleApplyTemplate = async () => {
    if (!user || !templateStoreName.trim() || pendingTemplateIdx === null) return;
    const template = STORE_TEMPLATES[pendingTemplateIdx];
    setApplyingTemplate(true);
    setPendingTemplateIdx(null);
    setTemplateDialog(false);
    await addStore(user.id, templateStoreName.trim());
    // addStore updates Zustand state synchronously, read it back
    const { stores: updated } = useStoreStore.getState();
    const created = updated.find((s) => s.name === templateStoreName.trim());
    if (created) {
      for (const aisleName of template.aisles) {
        await addAisle(created.id, aisleName);
      }
    }
    setTemplateStoreName("");
    setApplyingTemplate(false);
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

  const handleRefreshList = useCallback(async () => {
    if (!user) return;
    setRefreshing(true);
    await fetchStores(user.id);
    setRefreshing(false);
  }, [user?.id]);

  const handleRefreshDetail = useCallback(async () => {
    if (!activeStore) return;
    setRefreshing(true);
    await fetchStoreWithAisles(activeStore.id);
    setRefreshing(false);
  }, [activeStore?.id]);

  const handleRename = async () => {
    if (!renameDialog || !renameName.trim()) return;
    if (renameDialog.type === 'store') {
      await updateStore(renameDialog.id, renameName.trim());
    } else {
      await updateAisle(renameDialog.id, renameName.trim(), renameSide.trim() || null);
    }
    setRenameDialog(null);
    setRenameName("");
    setRenameSide("");
  };

  const openRename = (id: string, name: string, type: 'store' | 'aisle', side?: string | null) => {
    setRenameDialog({ id, name, type, side });
    setRenameName(name);
    setRenameSide(side ?? '');
  };

  const handleSaveAsTemplate = async () => {
    if (!activeStore || !saveTemplateName.trim()) return;
    const aisles = activeStore.aisles.map((a: any) => ({ name: a.name, side: a.side ?? null }));
    await saveTemplate(saveTemplateName.trim(), aisles);
    setSaveTemplateName("");
    setSaveTemplateDialog(false);
  };

  const handleApplyUserTemplate = async () => {
    if (!user || !userTemplateStoreName.trim() || !pendingUserTemplateId) return;
    const template = userTemplates.find(t => t.id === pendingUserTemplateId);
    if (!template) return;
    setApplyingTemplate(true);
    setPendingUserTemplateId(null);
    setUserTemplateDialog(false);
    await addStore(user.id, userTemplateStoreName.trim());
    const { stores: updated } = useStoreStore.getState();
    const created = updated.find((s) => s.name === userTemplateStoreName.trim());
    if (created) {
      for (const aisle of template.aisles) {
        await addAisle(created.id, aisle.name);
      }
    }
    setUserTemplateStoreName("");
    setApplyingTemplate(false);
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
      <View style={[styles.container, bgStyle]}>
        <Surface style={styles.headerSurface} elevation={0}>
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
              icon="pencil-outline"
              iconColor={colors.textLight}
              onPress={() => openRename(activeStore.id, activeStore.name, 'store')}
            />
            {activeStore.aisles.length > 0 && (
              <IconButton
                icon="content-save-outline"
                iconColor={colors.textLight}
                onPress={() => { setSaveTemplateName(activeStore.name); setSaveTemplateDialog(true); }}
              />
            )}
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
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefreshDetail} colors={[colors.primary]} tintColor={colors.primary} />
          }
        >
          {activeStore.aisles.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons
                name="sprout-outline"
                size={64}
                color={colors.primary}
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
                onRenameAisle={(id, name, side) => openRename(id, name, 'aisle', side)}
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
          <Dialog visible={!!renameDialog} onDismiss={() => { setRenameDialog(null); setRenameName(""); setRenameSide(""); }}>
            <Dialog.Title>Rename {renameDialog?.type === 'store' ? 'Store' : 'Aisle'}</Dialog.Title>
            <Dialog.Content>
              <TextInput
                label="Name"
                value={renameName}
                onChangeText={setRenameName}
                mode="outlined"
                autoFocus
                onSubmitEditing={handleRename}
              />
              {renameDialog?.type === 'aisle' && (
                <TextInput
                  label="Side / Section (optional)"
                  value={renameSide}
                  onChangeText={setRenameSide}
                  mode="outlined"
                  placeholder="e.g. Left, Right, Far wall"
                  style={{ marginTop: 12 }}
                  onSubmitEditing={handleRename}
                />
              )}
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => { setRenameDialog(null); setRenameName(""); setRenameSide(""); }}>Cancel</Button>
              <Button onPress={handleRename} disabled={!renameName.trim()}>Save</Button>
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

          <Dialog visible={saveTemplateDialog} onDismiss={() => { setSaveTemplateDialog(false); setSaveTemplateName(""); }}>
            <Dialog.Title>Save as Template</Dialog.Title>
            <Dialog.Content>
              <Text variant="bodySmall" style={{ color: colors.textLight, marginBottom: spacing.md }}>
                Saves the {activeStore?.aisles.length} aisle{activeStore?.aisles.length !== 1 ? 's' : ''} from "{activeStore?.name}" as a reusable layout.
              </Text>
              <TextInput
                label="Template name"
                value={saveTemplateName}
                onChangeText={setSaveTemplateName}
                mode="outlined"
                autoFocus
                onSubmitEditing={handleSaveAsTemplate}
              />
            </Dialog.Content>
            <Dialog.Actions>
              <Button onPress={() => { setSaveTemplateDialog(false); setSaveTemplateName(""); }}>Cancel</Button>
              <Button onPress={handleSaveAsTemplate} disabled={!saveTemplateName.trim()}>Save</Button>
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
                <View style={{ flexDirection: "row", alignItems: "center" }}>
                  <View style={{ flex: 1 }}>
                    <FoodSearch
                      value={itemName}
                      onChangeText={(t) => setItemName(t)}
                      onSelect={(name) => setItemName(name)}
                      localSuggestions={localSuggestions}
                      autoFocus
                    />
                  </View>
                  <IconButton icon="barcode-scan" size={22} iconColor={colors.primary} style={{ margin: 0 }} onPress={() => setShowBarcodeScanner(true)} />
                </View>
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

        <BarcodeScannerModal
          visible={showBarcodeScanner}
          onDismiss={() => setShowBarcodeScanner(false)}
          onResult={(suggestion) => {
            setItemName(suggestion.name);
            setShowBarcodeScanner(false);
          }}
        />
      </View>
    );
  }

  // ── Store list view ────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, bgStyle]}>
      <PageHeader title="Stores" subtitle="Manage your store layouts" colors={colors} tab="stores" />
      {Platform.OS === 'web' && (
        <View style={styles.seasonDecor} pointerEvents="none">
          <MaterialCommunityIcons name={seasonIcon as any} size={180} color={colors.primary} />
        </View>
      )}

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing || applyingTemplate} onRefresh={handleRefreshList} colors={[colors.primary]} tintColor={colors.primary} />
        }
      >
        {stores.length === 0 ? (
          <EmptyState
            icon="storefront-outline"
            title={season === 'spring' ? "No stores yet — add your favourite market" : season === 'summer' ? "No market set up yet" : season === 'autumn' ? "Add your shops here" : "No stores mapped yet"}
            subtitle="Add your grocery stores to organize shopping by aisle."
            colors={colors}
          >
            <Button
              mode="contained"
              icon="lightning-bolt"
              onPress={() => setTemplateDialog(true)}
              style={styles.emptyAction}
            >
              Use a Template
            </Button>
          </EmptyState>
        ) : (
          stores.map((store) => (
            <View key={store.id} style={storeListStyles.card}>
              <View style={storeListStyles.awningBar} />
              <TouchableOpacity
                style={storeListStyles.row}
                onPress={() => openStore(store.id)}
                onLongPress={() => openRename(store.id, store.name, 'store')}
                activeOpacity={0.7}
              >
                <View style={storeListStyles.storeAvatar}>
                  <Text style={storeListStyles.storeAvatarText}>
                    {store.name.slice(0, 2).toUpperCase()}
                  </Text>
                </View>
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
                  size={22}
                  iconColor={colors.error}
                  onPress={() =>
                    setConfirmDialog({
                      action: () => deleteStore(store.id),
                      message: `Delete "${store.name}"? All aisles and item locations will be removed.`,
                    })
                  }
                />
              </TouchableOpacity>
            </View>
          ))
        )}
      </ScrollView>

      <FAB
        icon="storefront-outline"
        label="Add Store"
        style={styles.fab}
        onPress={() => setStoreDialog(true)}
      />

      {/* Template picker modal */}
      <Modal
        visible={templateDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setTemplateDialog(false)}
      >
        <View style={styles.templateOverlay}>
          <Surface style={styles.templateSheet} elevation={4}>
            {pendingTemplateIdx === null ? (
              <>
                <Text variant="titleLarge" style={styles.templateTitle}>Choose a Template</Text>
                <Text variant="bodySmall" style={styles.templateSubtitle}>
                  Pre-fills your store with common aisles
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
                  {STORE_TEMPLATES.map((tmpl, i) => (
                    <TouchableOpacity
                      key={tmpl.label}
                      style={[styles.templateCard, { borderColor: colors.surface }]}
                      onPress={() => setPendingTemplateIdx(i)}
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name={tmpl.icon as any} size={32} color={colors.primary} />
                      <View style={styles.templateCardText}>
                        <Text variant="titleMedium" style={{ color: colors.text, fontWeight: "600" }}>{tmpl.label}</Text>
                        <Text variant="bodySmall" style={{ color: colors.textLight }}>{tmpl.description}</Text>
                        <View style={styles.templateChips}>
                          {tmpl.aisles.slice(0, 4).map((a) => (
                            <Chip key={a} compact style={styles.templateChip} textStyle={{ fontSize: 10 }}>{a}</Chip>
                          ))}
                          {tmpl.aisles.length > 4 && (
                            <Chip compact style={styles.templateChip} textStyle={{ fontSize: 10 }}>+{tmpl.aisles.length - 4} more</Chip>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Button mode="text" onPress={() => { setTemplateDialog(false); setStoreDialog(true); }} style={{ marginTop: spacing.sm }}>
                  Add Custom Store Instead
                </Button>
                <Button onPress={() => setTemplateDialog(false)}>Cancel</Button>
              </>
            ) : (
              <>
                <Text variant="titleLarge" style={styles.templateTitle}>
                  Name Your Store
                </Text>
                <Text variant="bodySmall" style={[styles.templateSubtitle, { marginBottom: spacing.md }]}>
                  {STORE_TEMPLATES[pendingTemplateIdx].label} template · {STORE_TEMPLATES[pendingTemplateIdx].aisles.length} aisles
                </Text>
                <TextInput
                  label="Store name (e.g. Walmart, Costco)"
                  value={templateStoreName}
                  onChangeText={setTemplateStoreName}
                  mode="outlined"
                  autoFocus
                  onSubmitEditing={handleApplyTemplate}
                />
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.md, gap: spacing.sm }}>
                  <Button onPress={() => { setPendingTemplateIdx(null); setTemplateStoreName(""); }}>Back</Button>
                  <Button mode="contained" onPress={handleApplyTemplate} disabled={!templateStoreName.trim()}>
                    Create Store
                  </Button>
                </View>
              </>
            )}
          </Surface>
        </View>
      </Modal>

      {/* User-created template picker modal */}
      <Modal
        visible={userTemplateDialog}
        transparent
        animationType="fade"
        onRequestClose={() => setUserTemplateDialog(false)}
      >
        <View style={styles.templateOverlay}>
          <Surface style={styles.templateSheet} elevation={4}>
            {pendingUserTemplateId === null ? (
              <>
                <Text variant="titleLarge" style={styles.templateTitle}>My Templates</Text>
                <Text variant="bodySmall" style={styles.templateSubtitle}>
                  Saved aisle layouts from your stores
                </Text>
                <ScrollView showsVerticalScrollIndicator={false} style={{ marginTop: spacing.md }}>
                  {userTemplates.map((tmpl) => (
                    <TouchableOpacity
                      key={tmpl.id}
                      style={[styles.templateCard, { borderColor: colors.surface }]}
                      onPress={() => setPendingUserTemplateId(tmpl.id)}
                      onLongPress={() =>
                        setConfirmDialog({
                          action: () => deleteTemplate(tmpl.id),
                          message: `Delete template "${tmpl.name}"?`,
                        })
                      }
                      activeOpacity={0.7}
                    >
                      <MaterialCommunityIcons name="bookmark-outline" size={32} color={colors.primary} />
                      <View style={styles.templateCardText}>
                        <Text variant="titleMedium" style={{ color: colors.text, fontWeight: "600" }}>{tmpl.name}</Text>
                        <Text variant="bodySmall" style={{ color: colors.textLight }}>{tmpl.aisles.length} aisle{tmpl.aisles.length !== 1 ? 's' : ''}</Text>
                        <View style={styles.templateChips}>
                          {tmpl.aisles.slice(0, 4).map((a) => (
                            <Chip key={a.name} compact style={styles.templateChip} textStyle={{ fontSize: 10 }}>{a.name}</Chip>
                          ))}
                          {tmpl.aisles.length > 4 && (
                            <Chip compact style={styles.templateChip} textStyle={{ fontSize: 10 }}>+{tmpl.aisles.length - 4} more</Chip>
                          )}
                        </View>
                      </View>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
                <Text variant="bodySmall" style={[styles.templateSubtitle, { marginTop: spacing.sm, fontStyle: 'italic' }]}>
                  Long-press a template to delete it
                </Text>
                <Button onPress={() => setUserTemplateDialog(false)} style={{ marginTop: spacing.sm }}>Cancel</Button>
              </>
            ) : (
              <>
                <Text variant="titleLarge" style={styles.templateTitle}>
                  Name Your Store
                </Text>
                <Text variant="bodySmall" style={[styles.templateSubtitle, { marginBottom: spacing.md }]}>
                  {(() => {
                    const t = userTemplates.find(t => t.id === pendingUserTemplateId);
                    return t ? `"${t.name}" template · ${t.aisles.length} aisle${t.aisles.length !== 1 ? 's' : ''}` : '';
                  })()}
                </Text>
                <TextInput
                  label="Store name (e.g. Walmart, Costco)"
                  value={userTemplateStoreName}
                  onChangeText={setUserTemplateStoreName}
                  mode="outlined"
                  autoFocus
                  onSubmitEditing={handleApplyUserTemplate}
                />
                <View style={{ flexDirection: "row", justifyContent: "flex-end", marginTop: spacing.md, gap: spacing.sm }}>
                  <Button onPress={() => { setPendingUserTemplateId(null); setUserTemplateStoreName(""); }}>Back</Button>
                  <Button mode="contained" onPress={handleApplyUserTemplate} disabled={!userTemplateStoreName.trim()}>
                    Create Store
                  </Button>
                </View>
              </>
            )}
          </Surface>
        </View>
      </Modal>

      <Portal>
        <Dialog visible={!!renameDialog} onDismiss={() => { setRenameDialog(null); setRenameName(""); }}>
          <Dialog.Title>Rename {renameDialog?.type === 'store' ? 'Store' : 'Aisle'}</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Name"
              value={renameName}
              onChangeText={setRenameName}
              mode="outlined"
              autoFocus
              onSubmitEditing={handleRename}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => { setRenameDialog(null); setRenameName(""); }}>Cancel</Button>
            <Button onPress={handleRename} disabled={!renameName.trim()}>Save</Button>
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
            <Button
              mode="text"
              icon="lightning-bolt"
              onPress={() => { setStoreDialog(false); setTemplateDialog(true); }}
              style={{ marginTop: spacing.sm }}
            >
              Use a template instead
            </Button>
            {userTemplates.length > 0 && (
              <Button
                mode="text"
                icon="bookmark-outline"
                onPress={() => { setStoreDialog(false); setUserTemplateDialog(true); }}
                style={{ marginTop: spacing.xs }}
              >
                From my templates
              </Button>
            )}
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
        size={22}
        iconColor={colors.textLight}
        onPress={() => onOpenDetail(loc.items.id)}
      />
      <IconButton
        icon="pencil-outline"
        size={22}
        iconColor={colors.textLight}
        onPress={() => onEditItem(loc.id, loc.position_tag ?? null)}
      />
      <IconButton
        icon="delete-outline"
        size={22}
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
  onRenameAisle,
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
  onRenameAisle: (id: string, name: string, side?: string | null) => void;
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

  const aisleAccentColor = AISLE_COLORS[aisleIdx % AISLE_COLORS.length];
  const headerBg = headerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.primary + "28"],
  });

  return (
    <View>
      <Animated.View
        style={[sectionStyles.header, { backgroundColor: headerBg, borderLeftColor: aisleAccentColor, borderLeftWidth: 4 }]}
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
          onLongPress={() => onRenameAisle(aisle.id, aisle.name, aisle.side)}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={isExpanded ? "chevron-up" : "chevron-down"}
            size={22}
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
          icon="pencil-outline"
          size={22}
          iconColor={colors.textLight}
          onPress={() => onRenameAisle(aisle.id, aisle.name)}
        />
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
  seasonDecor: {
    position: 'absolute' as const,
    right: -20,
    bottom: 60,
    opacity: 0.06,
    pointerEvents: 'none' as const,
  },
  headerSurface: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: colors.primaryDark,
    borderBottomLeftRadius: radius.md,
    borderBottomRightRadius: radius.md,
    paddingHorizontal: spacing.xs,
    paddingVertical: spacing.xs,
  },
  headerText: { flex: 1, paddingHorizontal: spacing.sm },
  headerTitle: { color: colors.surface, fontWeight: "700" },
  headerSubtitle: { color: colors.primaryLight, marginTop: 2 },
  listHeaderTitle: { color: colors.text, fontWeight: "700" },
  listHeaderSubtitle: { color: colors.textLight, marginTop: 2 },
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
    bottom: 92,
    right: spacing.md,
    backgroundColor: colors.primary,
  },
  itemDialogContent: { maxHeight: 480 },
  emptyAction: { marginTop: spacing.md, minWidth: 200 },
  outline: { borderColor: colors.surface },
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
    borderRadius: radius.md,
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
    borderRadius: radius.md,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  templateCardText: { flex: 1 },
  templateChips: { flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: spacing.xs },
  templateChip: { height: 22 },
}); }

function createStoreListStyles(colors: Colors) { return StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    marginHorizontal: spacing.sm,
    marginTop: spacing.sm,
    overflow: 'hidden',
    shadowColor: '#4A3728',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  awningBar: {
    height: 10,
    backgroundColor: colors.primary,
    borderTopLeftRadius: radius.md,
    borderTopRightRadius: radius.md,
  },
  storeAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  storeAvatarText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  name: { flex: 1, color: colors.text, fontWeight: '700' },
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
    borderBottomColor: colors.softShadow,
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
