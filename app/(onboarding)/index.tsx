import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { CheckCircle, Camera } from 'phosphor-react-native';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { useOnboarding } from '../../hooks/useOnboarding';

const { width: SW } = Dimensions.get('window');

// ─── Visuals ─────────────────────────────────────────────────

function PlanVisual(): React.JSX.Element {
  const tasks = ['Write morning pages', 'Review project docs', 'Evening walk'];
  return (
    <View style={v.taskList}>
      {tasks.map((label) => (
        <View key={label} style={v.taskCard}>
          <View style={v.taskCircle} />
          <Text style={v.taskLabel}>{label}</Text>
        </View>
      ))}
    </View>
  );
}

function CompleteVisual(): React.JSX.Element {
  return (
    <View style={v.card}>
      <View style={v.completeRow}>
        <CheckCircle size={22} color={Colors.accent} weight="fill" />
        <Text style={v.cardTitle}>Morning run</Text>
      </View>
      <View style={v.photo}>
        <Camera size={26} color={Colors.muted} weight="regular" />
        <Text style={v.photoText}>Photo proof attached</Text>
      </View>
    </View>
  );
}

const PLANT_HEIGHTS: number[] = [14, 22, 32, 42, 52, 62];

function GrowVisual(): React.JSX.Element {
  return (
    <View style={v.gardenGrid}>
      {[0, 1, 2].map((row) => (
        <View key={row} style={v.gardenRow}>
          {[0, 1].map((col) => {
            const idx = row * 2 + col;
            return (
              <View key={col} style={v.plantCard}>
                <View style={[v.plant, { height: PLANT_HEIGHTS[idx] }]} />
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Slide data ───────────────────────────────────────────────

const SLIDES: Array<{
  key: string;
  title: string;
  subtitle: string;
  Visual: () => React.JSX.Element;
}> = [
  {
    key: 'plan',
    title: 'Plan your tomorrow',
    subtitle: 'Every evening, write the tasks you want to accomplish the next day.',
    Visual: PlanVisual,
  },
  {
    key: 'complete',
    title: 'Show your work',
    subtitle: 'Mark tasks done and attach a photo. Share your wins with the people around you.',
    Visual: CompleteVisual,
  },
  {
    key: 'grow',
    title: 'Grow your garden',
    subtitle: 'Every day you complete all your tasks, you earn a plant. Build your garden over time.',
    Visual: GrowVisual,
  },
];

// ─── Screen ───────────────────────────────────────────────────

export default function OnboardingScreen(): React.JSX.Element {
  const { completeOnboarding } = useOnboarding();
  const [idx, setIdx] = useState<number>(0);
  const finishing = useRef<boolean>(false);
  const offset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const goTo = (next: number): void => {
    setIdx(next);
    offset.value = withSpring(-next * SW, {
      damping: 20,
      stiffness: 200,
      mass: 0.5,
    });
  };

  const finish = async (): Promise<void> => {
    if (finishing.current) return;
    finishing.current = true;
    await completeOnboarding();
    // Navigation guard in _layout.tsx handles redirect to /(auth)/welcome
  };

  const handleContinue = async (): Promise<void> => {
    if (idx < SLIDES.length - 1) {
      goTo(idx + 1);
    } else {
      await finish();
    }
  };

  return (
    <SafeAreaView style={s.container}>
      <TouchableOpacity style={s.skip} onPress={finish} activeOpacity={0.7}>
        <Text style={s.skipText}>Skip</Text>
      </TouchableOpacity>

      <View style={s.slidesContainer}>
        <Animated.View style={[s.slidesRow, animatedStyle]}>
          {SLIDES.map(({ key, title, subtitle, Visual }) => (
            <View key={key} style={s.slide}>
              <View style={s.visualWrap}>
                <Visual />
              </View>
              <Text style={s.title}>{title}</Text>
              <Text style={s.subtitle}>{subtitle}</Text>
            </View>
          ))}
        </Animated.View>
      </View>

      <View style={s.bottom}>
        <View style={s.dots}>
          {SLIDES.map((slide, i) => (
            <View key={slide.key} style={[s.dot, i === idx && s.dotActive]} />
          ))}
        </View>

        <TouchableOpacity style={s.btn} onPress={handleContinue} activeOpacity={0.85}>
          <Text style={s.btnText}>
            {idx === SLIDES.length - 1 ? 'Get started' : 'Continue'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Main styles ──────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skip: {
    position: 'absolute',
    top: 16,
    right: 24,
    zIndex: 10,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  skipText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.muted,
  },
  slidesContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  slidesRow: {
    flexDirection: 'row',
    width: SW * 3,
    height: '100%',
  },
  slide: {
    width: SW,
    height: '100%',
    paddingHorizontal: 32,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 24,
  },
  visualWrap: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 48,
  },
  title: {
    fontFamily: 'Playfair Display',
    fontSize: 32,
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 40,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  bottom: {
    paddingHorizontal: 32,
    paddingBottom: 32,
    gap: 24,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.border,
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.accent,
    borderRadius: 4,
  },
  btn: {
    height: 52,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

// ─── Visual styles ────────────────────────────────────────────

const v = StyleSheet.create({
  taskList: {
    width: '100%',
    gap: 10,
  },
  taskCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    ...Shadow.card,
  },
  taskCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1.5,
    borderColor: Colors.border,
  },
  taskLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.text,
  },
  card: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    gap: 12,
    ...Shadow.card,
  },
  completeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  photo: {
    height: 88,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  photoText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: Colors.muted,
  },
  gardenGrid: {
    width: '100%',
    gap: 10,
  },
  gardenRow: {
    flexDirection: 'row',
    gap: 10,
  },
  plantCard: {
    flex: 1,
    height: 84,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: 14,
    ...Shadow.card,
  },
  plant: {
    width: 20,
    borderRadius: 10,
    backgroundColor: Colors.accent,
  },
});
