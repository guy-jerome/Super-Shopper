import { Tabs } from 'expo-router';
import { View } from 'react-native';
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
        headerShown: false,
        headerStyle: { backgroundColor: colors.background },
        headerTintColor: colors.text,
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="home-storage"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="home-heart" color={color} size={size} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 2 }} />}
            </View>
          ),
          tabBarBadge: lowStockCount > 0 ? lowStockCount : undefined,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tabs.Screen
        name="items"
        options={{
          title: 'Items',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="notebook-outline" color={color} size={size} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 2 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="stores"
        options={{
          title: 'Stores',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="storefront-outline" color={color} size={size} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 2 }} />}
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="shop"
        options={{
          title: 'Shop',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="note-text-outline" color={color} size={size} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 2 }} />}
            </View>
          ),
          tabBarBadge: uncheckedCount > 0 ? uncheckedCount : undefined,
          tabBarBadgeStyle: badgeStyle,
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, size, focused }) => (
            <View style={{ alignItems: 'center' }}>
              <MaterialCommunityIcons name="cog-outline" color={color} size={size} />
              {focused && <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: colors.primary, marginTop: 2 }} />}
            </View>
          ),
        }}
      />
    </Tabs>
  );
}
