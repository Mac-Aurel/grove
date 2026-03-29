import React, { useEffect } from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withSequence,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { Colors, Radius } from '../constants/theme';
import { PlantSVG } from './PlantSVG';

const { width: SW, height: SH } = Dimensions.get('window');
const RADIAL_MAX = Math.sqrt(SW * SW + SH * SH);

function getPlantLabel(plantType: string): string {
  const labels: Record<string, string> = {
    sprout: 'Sprout',
    seedling: 'Seedling',
    herb: 'Herb',
    bush: 'Bush',
    small_tree: 'Small Tree',
    tree: 'Tree',
    blooming_tree: 'Blooming Tree',
    ancient_tree: 'Ancient Tree',
  };
  return labels[plantType] ?? plantType;
}

interface CelebrationOverlayProps {
  plantType: string;
  visible: boolean;
  onDismiss: () => void;
}

export function CelebrationOverlay({
  plantType,
  visible,
  onDismiss,
}: CelebrationOverlayProps): React.JSX.Element {
  const radialScale = useSharedValue(0);
  const radialOpacity = useSharedValue(1);
  const plantScale = useSharedValue(0);
  const plantOpacity = useSharedValue(0);
  const textOpacity = useSharedValue(0);

  const triggerHaptic = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy).catch(() => {});
  };

  useEffect(() => {
    if (!visible) return;

    runOnJS(triggerHaptic)();

    // Phase 1: radial circle expands (0 → full)
    radialScale.value = withTiming(1, { duration: 400 });

    // Phase 2: radial fades out, plant + text appear
    radialOpacity.value = withDelay(350, withTiming(0, { duration: 300 }));
    plantScale.value = withDelay(300, withSpring(1, { damping: 14, stiffness: 160 }));
    plantOpacity.value = withDelay(300, withTiming(1, { duration: 250 }));
    textOpacity.value = withDelay(500, withTiming(1, { duration: 300 }));
  }, [visible]);

  const resetValues = (): void => {
    radialScale.value = 0;
    radialOpacity.value = 1;
    plantScale.value = 0;
    plantOpacity.value = 0;
    textOpacity.value = 0;
  };

  const handleDismiss = (): void => {
    resetValues();
    onDismiss();
  };

  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(handleDismiss, 3000);
    return () => clearTimeout(timer);
  }, [visible]);

  const radialStyle = useAnimatedStyle(() => ({
    transform: [{ scale: radialScale.value }],
    opacity: radialOpacity.value,
  }));

  const plantStyle = useAnimatedStyle(() => ({
    transform: [{ scale: plantScale.value }],
    opacity: plantOpacity.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
  }));

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleDismiss}>
      <TouchableOpacity style={s.container} activeOpacity={1} onPress={handleDismiss}>
        {/* Radial sage circle */}
        <Animated.View style={[s.radial, radialStyle]} />

        {/* Plant + text */}
        <View style={s.center} pointerEvents="none">
          <Animated.View style={plantStyle}>
            <PlantSVG plantType={plantType} size={100} />
          </Animated.View>
          <Animated.View style={[s.textBlock, textStyle]}>
            <Text style={s.title}>You earned a new plant</Text>
            <Text style={s.subtitle}>{getPlantLabel(plantType)}</Text>
          </Animated.View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radial: {
    position: 'absolute',
    width: RADIAL_MAX,
    height: RADIAL_MAX,
    borderRadius: RADIAL_MAX / 2,
    backgroundColor: `${Colors.accent}14`,
    transform: [{ scale: 0 }],
  },
  center: {
    alignItems: 'center',
    gap: 24,
  },
  textBlock: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 24,
    color: Colors.text,
    textAlign: 'center',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.accent,
    textAlign: 'center',
  },
});
