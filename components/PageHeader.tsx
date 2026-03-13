import { View, StyleSheet, Platform } from "react-native";
import { Text } from "react-native-paper";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { Colors } from "../constants/theme";
import { spacing } from "../constants/theme";

// Fixed per-tab watermark icon (not season-dependent so alignment is consistent)
const TAB_ICONS: Record<string, string> = {
  "home-storage": "home-variant-outline",
  items:          "tag-multiple-outline",
  stores:         "store-outline",
  shop:           "cart-outline",
  settings:       "cog-outline",
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  colors: Colors;
  right?: React.ReactNode;
  left?: React.ReactNode;
  tab?: string; // e.g. 'home-storage', 'shop', etc.
  titleFont?: "display" | "handwritten"; // 'handwritten' uses Caveat_700Bold
}

export function PageHeader({
  title,
  subtitle,
  colors,
  right,
  left,
  tab,
  titleFont,
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();

  const watermarkIcon = tab ? (TAB_ICONS[tab] ?? "information-outline") : "information-outline";

  const titleStyle =
    titleFont === "handwritten"
      ? [
          styles.title,
          { color: colors.text, fontFamily: "Caveat_700Bold", fontSize: 30 },
        ]
      : [styles.title, { color: colors.text }];

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background, paddingTop: insets.top },
      ]}
    >
      {/* Double accent stripe */}
      <View
        style={[styles.accentStripe, { backgroundColor: colors.primary }]}
      />
      <View
        style={[
          styles.accentStripeSecondary,
          { backgroundColor: colors.accent },
        ]}
      />

      {/* Seasonal watermark icon (web-only) */}
      {Platform.OS === "web" && (
        <View style={styles.watermark} pointerEvents="none">
          <MaterialCommunityIcons
            name={watermarkIcon as any}
            size={64}
            color={colors.primary}
          />
        </View>
      )}

      {/* Header content */}
      <View style={styles.content}>
        {left && <View style={styles.leftSlot}>{left}</View>}
        <View style={styles.titleArea}>
          <Text style={titleStyle}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textLight }]}>
              {subtitle}
            </Text>
          )}
        </View>
        {right && <View style={styles.rightSlot}>{right}</View>}
      </View>

      {/* Curved shelf edge */}
      <View style={[styles.shelfEdge, { backgroundColor: colors.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
  },
  accentStripe: {
    height: 3,
  },
  accentStripeSecondary: {
    height: 2,
    opacity: 0.55,
  },
  watermark: {
    position: "absolute",
    right: 14,
    top: 8,
    opacity: 0.07,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm + 8,
    gap: spacing.sm,
  },
  leftSlot: {},
  titleArea: { flex: 1 },
  rightSlot: {},
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    marginTop: 2,
  },
  shelfEdge: {
    height: 16,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
});
