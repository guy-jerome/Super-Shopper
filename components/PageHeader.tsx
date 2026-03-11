import { View, StyleSheet, Platform } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Colors } from '../constants/theme';
import { spacing } from '../constants/theme';
import { useSettingsStore, type Season } from '../stores/useSettingsStore';

const SEASON_ICONS: Record<Season, string> = {
  spring: 'flower-tulip-outline',
  summer: 'white-balance-sunny',
  autumn: 'leaf-maple',
  winter: 'snowflake',
};

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  colors: Colors;
  right?: React.ReactNode;
  left?: React.ReactNode;
}

export function PageHeader({ title, subtitle, colors, right, left }: PageHeaderProps) {
  const season = useSettingsStore((s) => s.season);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Double accent stripe */}
      <View style={[styles.accentStripe, { backgroundColor: colors.primary }]} />
      <View style={[styles.accentStripeSecondary, { backgroundColor: colors.accent }]} />

      {/* Seasonal watermark icon (web-only) */}
      {Platform.OS === 'web' && (
        <View style={styles.watermark} pointerEvents="none">
          <MaterialCommunityIcons
            name={SEASON_ICONS[season] as any}
            size={90}
            color={colors.primary}
          />
        </View>
      )}

      {/* Header content */}
      <View style={styles.content}>
        {left && <View style={styles.leftSlot}>{left}</View>}
        <View style={styles.titleArea}>
          <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
          {subtitle && (
            <Text style={[styles.subtitle, { color: colors.textLight }]}>{subtitle}</Text>
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
    overflow: 'hidden',
  },
  accentStripe: {
    height: 3,
  },
  accentStripeSecondary: {
    height: 2,
    opacity: 0.55,
  },
  watermark: {
    position: 'absolute',
    right: 14,
    bottom: 14,
    opacity: 0.07,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
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
    fontWeight: '800',
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
