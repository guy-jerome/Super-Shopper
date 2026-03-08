import { useMemo, useRef } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import { IconButton } from 'react-native-paper';
import { useColors, type Colors } from '../constants/theme';

type Props = {
  onDelete: () => void;
  children: React.ReactNode;
};

export function SwipeableRow({ onDelete, children }: Props) {
  const colors = useColors();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const swipeRef = useRef<Swipeable>(null);

  const renderRightAction = (_: Animated.AnimatedInterpolation<number>, dragX: Animated.AnimatedInterpolation<number>) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0], extrapolate: 'clamp' });
    return (
      <View style={styles.deleteAction}>
        <Animated.View style={{ transform: [{ scale }] }}>
          <IconButton
            icon="delete"
            iconColor="#fff"
            size={24}
            onPress={() => {
              swipeRef.current?.close();
              onDelete();
            }}
          />
        </Animated.View>
      </View>
    );
  };

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightAction} rightThreshold={40}>
      {children}
    </Swipeable>
  );
}

function createStyles(colors: Colors) { return StyleSheet.create({
  deleteAction: {
    backgroundColor: colors.error,
    justifyContent: 'center',
    alignItems: 'center',
    width: 72,
  },
}); }
