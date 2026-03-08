import { useState, useEffect, useMemo } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Button, ActivityIndicator, IconButton } from 'react-native-paper';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { lookupBarcode } from '../hooks/useOpenFoodFacts';
import type { FoodSuggestion } from '../hooks/useOpenFoodFacts';
import { useColors, spacing, type Colors } from '../constants/theme';

type Props = {
  visible: boolean;
  onDismiss: () => void;
  onResult: (item: FoodSuggestion) => void;
};

export function BarcodeScannerModal({ visible, onDismiss, onResult }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [permission, requestPermission] = useCameraPermissions();
  const [scanning, setScanning] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (visible) {
      setScanning(true);
      setLoading(false);
      setError('');
    }
  }, [visible]);

  const handleScan = async ({ data }: { data: string }) => {
    if (!scanning || loading) return;
    setScanning(false);
    setLoading(true);
    const result = await lookupBarcode(data);
    setLoading(false);
    if (result) {
      onResult(result);
    } else {
      setError('Product not found. Try searching by name.');
      setTimeout(() => setScanning(true), 100);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onDismiss}>
      <View style={styles.container}>
        <View style={styles.header}>
          <IconButton icon="close" onPress={onDismiss} iconColor={colors.text} />
          <Text variant="titleMedium" style={styles.title}>Scan Barcode</Text>
          <View style={{ width: 40 }} />
        </View>

        {!permission ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.primary} />
          </View>
        ) : !permission.granted ? (
          <View style={styles.centered}>
            <Text style={styles.permText}>
              Camera access is needed to scan barcodes.
            </Text>
            <Button mode="contained" onPress={requestPermission} style={styles.permBtn}>
              Allow Camera
            </Button>
          </View>
        ) : (
          <View style={styles.cameraWrap}>
            <CameraView
              style={StyleSheet.absoluteFill}
              onBarcodeScanned={scanning ? handleScan : undefined}
              barcodeScannerSettings={{
                barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e', 'code128'],
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.scanFrame} />
              <Text style={styles.hint}>Point camera at a barcode</Text>
            </View>

            {loading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#fff" />
                <Text style={styles.loadingText}>Looking up product...</Text>
              </View>
            )}

            {!!error && (
              <View style={styles.errorBanner}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}
          </View>
        )}
      </View>
    </Modal>
  );
}

function createStyles(colors: Colors) { return StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.background,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.xs,
    paddingBottom: spacing.sm,
  },
  title: { color: colors.text },
  centered: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  permText: { color: colors.text, textAlign: 'center', marginBottom: spacing.lg },
  permBtn: { backgroundColor: colors.primary },
  cameraWrap: { flex: 1, position: 'relative' },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
  },
  scanFrame: {
    width: 260,
    height: 170,
    borderRadius: 12,
    borderWidth: 2.5,
    borderColor: colors.primary,
  },
  hint: {
    color: '#fff',
    fontSize: 14,
    textShadowColor: '#000',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
  },
  loadingText: { color: '#fff', fontSize: 16 },
  errorBanner: {
    position: 'absolute',
    bottom: spacing.xl * 2,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(0,0,0,0.75)',
    borderRadius: 8,
    padding: spacing.md,
  },
  errorText: { color: '#fff', textAlign: 'center' },
}); }
