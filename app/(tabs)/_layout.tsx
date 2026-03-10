import { Tabs } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../../constants/theme';
import { useShoppingStore } from '../../stores/useShoppingStore';
import { useLowStockStore } from '../../stores/useLowStockStore';

export default function TabLayout() {
  const colors = useColors();
  const { shoppingList } = useShoppingStore();
  const uncheckedCount = shoppingList.filter((i) => !i.checked).length;
  const { lowStockIds } = useLowStockStore();
  const lowStockCount = lowStockIds.size;

  const badgeStyle = {
    backgroundColor: colors.primary,
    color: '#fff',
    fontSize: 10,
  };

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textLight,
        tabBarStyle: {
          backgroundColor: colors.background,
          borderTopColor: colors.softShadow,
          borderTopWidth: 1,
          paddingTop: 4,
        },
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home-storage"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-heart" color={color} size={size} />
          ),
          tabBarBadge: lowStockCount > 0 ? lowStockCount : undefined,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: 'Items',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="notebook-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: 'Stores',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="storefront-outline" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="note-text-outline" color={color} size={size} />
          ),
          tabBarBadge: uncheckedCount > 0 ? uncheckedCount : undefined,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
