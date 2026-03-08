import { useRef, useState, useEffect } from 'react';
import { Animated, StyleSheet, PanResponder, Easing } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useColors } from '../constants/theme';

type DragHandleProps = {
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onActiveChange?: (active: boolean) => void;
  size?: 'sm' | 'md';
};

export function DragHandle({
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onActiveChange,
  size = 'md',
}: DragHandleProps) {
  const colors = useColors();
  const [active, setActive] = useState(false);
  const glowAnim = useRef(new Animated.Value(0)).current;
  const lastStep = useRef(0);
  const THRESHOLD = size === 'sm' ? 36 : 44;

  const propsRef = useRef({ canMoveUp, canMoveDown, onMoveUp, onMoveDown, onActiveChange });
  useEffect(() => {
    propsRef.current = { canMoveUp, canMoveDown, onMoveUp, onMoveDown, onActiveChange };
  });

  const activate = () => {
    setActive(true);
    propsRef.current.onActiveChange?.(true);
    Animated.timing(glowAnim, {
      toValue: 1,
      duration: 200,
      easing: Easing.out(Easing.quad),
      useNativeDriver: false,
    }).start();
  };

  const deactivate = () => {
    setActive(false);
    lastStep.current = 0;
    propsRef.current.onActiveChange?.(false);
    Animated.timing(glowAnim, {
      toValue: 0,
      duration: 350,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        lastStep.current = 0;
        activate();
      },
      onPanResponderMove: (_, gestureState) => {
        const { canMoveUp, canMoveDown, onMoveUp, onMoveDown } = propsRef.current;
        const step = Math.floor(gestureState.dy / THRESHOLD);
        if (step !== lastStep.current) {
          if (step > lastStep.current && canMoveDown) onMoveDown();
          else if (step < lastStep.current && canMoveUp) onMoveUp();
          lastStep.current = step;
        }
      },
      onPanResponderRelease: deactivate,
      onPanResponderTerminate: deactivate,
    })
  ).current;

  const borderColor = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.surface, colors.primary + 'aa'],
  });

  const s = size === 'sm' ? handleStyles.sm : handleStyles.md;
  const iconSize = size === 'sm' ? 14 : 16;
  const dragIconSize = size === 'sm' ? 16 : 20;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[s.container, { borderColor }]}
    >
      <MaterialCommunityIcons
        name="chevron-up"
        size={iconSize}
        color={canMoveUp ? (active ? colors.primary : colors.textLight) : colors.surface}
      />
      <MaterialCommunityIcons
        name="drag-horizontal-variant"
        size={dragIconSize}
        color={active ? colors.primary : colors.textLight}
      />
      <MaterialCommunityIcons
        name="chevron-down"
        size={iconSize}
        color={canMoveDown ? (active ? colors.primary : colors.textLight) : colors.surface}
      />
    </Animated.View>
  );
}

const handleStyles = {
  md: StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 36,
      paddingVertical: 4,
      borderRadius: 8,
      borderWidth: 1,
      marginRight: 6,
    },
  }),
  sm: StyleSheet.create({
    container: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 30,
      paddingVertical: 2,
      borderRadius: 6,
      borderWidth: 1,
      marginRight: 4,
    },
  }),
};
