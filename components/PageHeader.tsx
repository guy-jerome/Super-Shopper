import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import type { Colors } from '../constants/theme';
import { spacing } from '../constants/theme';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  colors: Colors;
  right?: React.ReactNode;
  left?: React.ReactNode;
}

export function PageHeader({ title, subtitle, colors, right, left }: PageHeaderProps) {
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top accent stripe */}
      <View style={[styles.accentStripe, { backgroundColor: colors.primary }]} />

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
