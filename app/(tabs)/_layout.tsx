import { Tabs } from "expo-router";
import {
  View,
  TouchableOpacity,
  Text,
  StyleSheet,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useColors } from "../../constants/theme";
import { useShoppingStore } from "../../stores/useShoppingStore";
import { useLowStockStore } from "../../stores/useLowStockStore";
import { useSettingsStore } from "../../stores/useSettingsStore";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

// ─── Tab icon definitions ─────────────────────────────────────────────────────

type IconName =
  | "home-heart"
  | "notebook-outline"
  | "storefront-outline"
  | "note-text-outline"
  | "cog-outline";

const TAB_ICONS: Record<
  string,
  { active: IconName; inactive: IconName; label: string }
> = {
  "home-storage": {
    active: "home-heart",
    inactive: "home-heart",
    label: "Home",
  },
  items: {
    active: "notebook-outline",
    inactive: "notebook-outline",
    label: "Items",
  },
  stores: {
    active: "storefront-outline",
    inactive: "storefront-outline",
    label: "Stores",
  },
  shop: {
    active: "note-text-outline",
    inactive: "note-text-outline",
    label: "Shop",
  },
  settings: {
    active: "cog-outline",
    inactive: "cog-outline",
    label: "Settings",
  },
};

// ─── Floating Frosted Tab Bar ─────────────────────────────────────────────────

function FloatingTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const season = useSettingsStore((s) => s.season);
  const { shoppingList } = useShoppingStore();
  const uncheckedCount = shoppingList.filter((i) => !i.checked).length;
  const { lowStockIds } = useLowStockStore();
  const lowStockCount = lowStockIds.size;

  // Season-aware frosted glass background
  const isDark = season === "winter";
  const frostedBg = isDark ? "rgba(30,42,60,0.92)" : "rgba(255,255,255,0.88)";
  const borderColor = colors.divider + "4D"; // ~30% opacity divider border

  // Web frosted glass via inline style (backdropFilter not in RN StyleSheet types)
  const webFrostedStyle =
    Platform.OS === "web"
      ? ({
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
        } as object)
      : {};

  // Build the container style — on web we merge backdropFilter inline
  const containerStyle =
    Platform.OS === "web"
      ? [
          styles.container,
          {
            backgroundColor: frostedBg,
            borderColor,
            shadowColor: isDark ? "#000" : "#333",
            bottom: 16 + insets.bottom,
          },
          webFrostedStyle,
        ]
      : [
          styles.container,
          {
            backgroundColor: frostedBg,
            borderColor,
            shadowColor: isDark ? "#000" : "#333",
            bottom: 16 + insets.bottom,
          },
        ];

  return (
    // @ts-ignore — style array with web-only backdropFilter props is intentional
    <View style={containerStyle}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const tabConfig = TAB_ICONS[route.name];
        if (!tabConfig) return null;

        const iconName = focused ? tabConfig.active : tabConfig.inactive;
        const iconColor = focused ? colors.accent : colors.textLight;
        const labelColor = focused ? colors.accent : colors.textLight;

        // Badge count for specific tabs
        let badge = 0;
        if (route.name === "shop") badge = uncheckedCount;
        if (route.name === "home-storage") badge = lowStockCount;

        const { options } = descriptors[route.key];
        const label = options.title ?? tabConfig.label;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const onLongPress = () => {
          navigation.emit({ type: "tabLongPress", target: route.key });
        };

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={focused ? { selected: true } : {}}
            accessibilityLabel={options.tabBarAccessibilityLabel}
            onPress={onPress}
            onLongPress={onLongPress}
            style={styles.tabItem}
            activeOpacity={0.7}
          >
            {/* Active pill background */}
            {focused && (
              <View
                style={[
                  styles.activePill,
                  { backgroundColor: colors.accent + "33" },
                ]}
              />
            )}

            {/* Icon + optional badge */}
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color={iconColor}
              />
              {badge > 0 && (
                <View
                  style={[styles.badge, { backgroundColor: colors.accent }]}
                >
                  <Text style={styles.badgeText}>
                    {badge > 99 ? "99+" : badge}
                  </Text>
                </View>
              )}
            </View>

            {/* Label */}
            <Text style={[styles.label, { color: labelColor }]}>{label}</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 16, // overridden dynamically with safe-area insets
    left: 20,
    right: 20,
    flexDirection: "row",
    borderRadius: 32,
    overflow: "hidden",
    borderWidth: 1,
    // Shadow (iOS)
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
    // Shadow (Android)
    elevation: 12,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    position: "relative",
    minHeight: 60,
  },
  activePill: {
    position: "absolute",
    top: 4,
    bottom: 4,
    left: 4,
    right: 4,
    borderRadius: 20,
  },
  iconWrapper: {
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: "#fff",
    fontSize: 9,
    fontWeight: "700",
    lineHeight: 12,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    marginTop: 2,
    letterSpacing: 0.2,
  },
});

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} />}
      screenOptions={{
        headerShown: false,
        headerShadowVisible: false,
        // Hide the default tab bar completely — FloatingTabBar handles rendering
        tabBarStyle: { display: "none" },
      }}
    >
      <Tabs.Screen name="home-storage" options={{ title: "Home" }} />
      <Tabs.Screen name="stores" options={{ title: "Stores" }} />
      <Tabs.Screen name="shop" options={{ title: "Shop" }} />
      <Tabs.Screen name="items" options={{ title: "Items" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
