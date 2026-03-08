import { useState, useMemo } from "react";
import {
  View,
  ScrollView,
  Image,
  StyleSheet,
  TouchableOpacity,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from "react-native";
import { Text, TextInput, Chip, ActivityIndicator } from "react-native-paper";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useOpenFoodFacts } from "../hooks/useOpenFoodFacts";
import { useFoodHistory } from "../hooks/useFoodHistory";
import type { FoodSuggestion } from "../hooks/useOpenFoodFacts";
import { BarcodeScannerModal } from "./BarcodeScannerModal";
import { useColors, spacing, type Colors } from "../constants/theme";

type LocalSuggestion = { id: string; name: string };

type FoodSearchProps = {
  value: string;
  onChangeText: (text: string) => void;
  onSelect: (name: string, suggestion?: FoodSuggestion) => void;
  localSuggestions?: LocalSuggestion[];
  autoFocus?: boolean;
};

export function FoodSearch({
  value,
  onChangeText,
  onSelect,
  localSuggestions = [],
  autoFocus,
}: FoodSearchProps) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [scannerOpen, setScannerOpen] = useState(false);
  const {
    suggestions,
    isLoading,
    isLoadingMore,
    hasMore,
    triggerSearch,
    loadMore,
  } = useOpenFoodFacts(value);
  const { history, addToHistory } = useFoodHistory();

  const handleSelect = (suggestion: FoodSuggestion) => {
    addToHistory(suggestion);
    onSelect(suggestion.name, suggestion);
  };

  const handleBarcodeResult = (suggestion: FoodSuggestion) => {
    addToHistory(suggestion);
    onSelect(suggestion.name, suggestion);
    setScannerOpen(false);
  };

  const showHistory = value.trim().length < 2 && history.length > 0;
  const showResults =
    value.trim().length >= 2 && (isLoading || suggestions.length > 0);

  const handleResultsScroll = (
    event: NativeSyntheticEvent<NativeScrollEvent>,
  ) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const threshold = 48;
    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >=
      contentSize.height - threshold;
    if (isNearBottom) {
      loadMore();
    }
  };

  return (
    <View>
      <TextInput
        label="Item name"
        value={value}
        onChangeText={onChangeText}
        mode="outlined"
        autoFocus={autoFocus}
        onSubmitEditing={triggerSearch}
        right={
          <TextInput.Icon
            icon="barcode-scan"
            color={colors.primary}
            onPress={() => setScannerOpen(true)}
          />
        }
      />

      {localSuggestions.length > 0 && (
        <View style={styles.chipRow}>
          {localSuggestions.map((item) => (
            <Chip
              key={item.id}
              onPress={() => onSelect(item.name)}
              style={styles.localChip}
              compact
            >
              {item.name}
            </Chip>
          ))}
        </View>
      )}

      {showHistory && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.sectionLabel}>
            Recent
          </Text>
          <ScrollView style={styles.resultScroll} nestedScrollEnabled>
            {history.map((h, i) => (
              <FoodResultRow
                key={i}
                suggestion={h}
                onPress={() => handleSelect(h)}
                colors={colors}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {showResults && (
        <View style={styles.section}>
          <Text variant="labelSmall" style={styles.sectionLabel}>
            Food database
          </Text>
          {isLoading ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={styles.loader}
            />
          ) : (
            <>
              <ScrollView
                style={styles.resultScroll}
                nestedScrollEnabled
                onScroll={handleResultsScroll}
                scrollEventThrottle={16}
              >
                {suggestions.map((s, i) => (
                  <FoodResultRow
                    key={i}
                    suggestion={s}
                    onPress={() => handleSelect(s)}
                    colors={colors}
                  />
                ))}
              </ScrollView>
              {isLoadingMore && (
                <ActivityIndicator
                  size="small"
                  color={colors.primary}
                  style={styles.loaderMore}
                />
              )}
              {!isLoadingMore && hasMore && (
                <TouchableOpacity
                  onPress={loadMore}
                  style={styles.loadMoreButton}
                  activeOpacity={0.7}
                >
                  <Text variant="bodyMedium" style={styles.loadMoreText}>
                    Load more results
                  </Text>
                </TouchableOpacity>
              )}
              <Text variant="bodySmall" style={styles.hint}>
                Not seeing the right product? Just tap Add to add by name.
              </Text>
            </>
          )}
        </View>
      )}

      <BarcodeScannerModal
        visible={scannerOpen}
        onDismiss={() => setScannerOpen(false)}
        onResult={handleBarcodeResult}
      />
    </View>
  );
}

function FoodResultRow({
  suggestion,
  onPress,
  colors,
}: {
  suggestion: FoodSuggestion;
  onPress: () => void;
  colors: Colors;
}) {
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [imgError, setImgError] = useState(false);

  return (
    <TouchableOpacity
      style={styles.resultRow}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.imgWrap}>
        {suggestion.imageUrl && !imgError ? (
          <Image
            source={{ uri: suggestion.imageUrl }}
            style={styles.img}
            onError={() => setImgError(true)}
          />
        ) : (
          <MaterialCommunityIcons
            name="food-outline"
            size={26}
            color={colors.textLight}
          />
        )}
      </View>
      <View style={styles.resultInfo}>
        <Text variant="bodyMedium" style={styles.resultName} numberOfLines={2}>
          {suggestion.name}
        </Text>
        {(suggestion.brand || suggestion.quantity) && (
          <Text variant="bodySmall" style={styles.resultMeta} numberOfLines={1}>
            {[suggestion.brand, suggestion.quantity]
              .filter(Boolean)
              .join(" · ")}
          </Text>
        )}
      </View>
      <MaterialCommunityIcons
        name="chevron-right"
        size={18}
        color={colors.textLight}
      />
    </TouchableOpacity>
  );
}

function createStyles(colors: Colors) { return StyleSheet.create({
  chipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  localChip: { backgroundColor: colors.surface },
  section: { marginTop: spacing.sm },
  sectionLabel: {
    color: colors.textLight,
    marginBottom: spacing.xs,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  loader: { marginTop: spacing.xs },
  loaderMore: { marginTop: spacing.xs },
  hint: { color: colors.textLight, marginTop: spacing.xs, fontStyle: "italic" },
  loadMoreButton: {
    alignSelf: "flex-start",
    marginTop: spacing.xs,
    paddingVertical: spacing.xs,
  },
  loadMoreText: {
    color: colors.primary,
    fontWeight: "600",
  },
  resultScroll: { maxHeight: 230 },
  resultRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  imgWrap: {
    width: 44,
    height: 44,
    borderRadius: 6,
    backgroundColor: colors.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  img: { width: 44, height: 44 },
  resultInfo: { flex: 1 },
  resultName: { color: colors.text },
  resultMeta: { color: colors.textLight, marginTop: 1 },
}); }
