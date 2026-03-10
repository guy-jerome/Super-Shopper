import { View, Animated, StyleSheet } from "react-native";
import { useEffect, useRef } from "react";
import { useColors } from "../constants/theme";

interface Props {
  width?: string | number;
  height?: number;
  borderRadius?: number;
  style?: object;
}

export function SkeletonBox({ width = "100%", height = 20, borderRadius = 6, style }: Props) {
  const opacity = useRef(new Animated.Value(0.3)).current;
  const colors = useColors();

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.3, duration: 800, useNativeDriver: true }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return (
    <Animated.View
      style={[{ width, height, borderRadius, backgroundColor: colors.surface, opacity }, style]}
    />
  );
}

export function SkeletonRow() {
  return (
    <View style={styles.row}>
      <SkeletonBox width={24} height={24} borderRadius={12} />
      <View style={styles.content}>
        <SkeletonBox width="60%" height={16} />
        <SkeletonBox width="40%" height={12} style={{ marginTop: 6 }} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  content: { flex: 1, gap: 4 },
});
