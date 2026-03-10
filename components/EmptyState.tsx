import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { Colors } from '../constants/theme';

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
  colors: Colors;
  children?: React.ReactNode; // optional action buttons
}

export function EmptyState({ icon, title, subtitle, colors, children }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      {/* Soft blob behind the icon */}
      <View style={[styles.iconBlob, { backgroundColor: colors.primaryLight + '55' }]}>
        <MaterialCommunityIcons name={icon as any} size={52} color={colors.primary} />
      </View>
      <Text variant="titleMedium" style={[styles.title, { color: colors.text }]}>{title}</Text>
      {subtitle && (
        <Text variant="bodySmall" style={[styles.subtitle, { color: colors.textLight }]}>{subtitle}</Text>
      )}
      {children && <View style={styles.actions}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
    paddingVertical: 32,
    gap: 12,
  },
  iconBlob: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    letterSpacing: 0.2,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 20,
    opacity: 0.8,
  },
  actions: {
    marginTop: 8,
    gap: 8,
    width: '100%',
  },
});
