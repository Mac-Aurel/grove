import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Dimensions,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withRepeat,
  withSequence,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import BottomSheet, {
  BottomSheetView,
  BottomSheetTextInput,
  BottomSheetBackdrop,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import {
  Plus,
  Fire,
  ClipboardText,
  Globe,
  Lock,
  Check,
  MoonStars,
} from 'phosphor-react-native';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { useTasks } from '../../hooks/useTasks';
import { useStreak } from '../../hooks/useStreak';
import type { Task } from '../../types/database';

const { width: SW } = Dimensions.get('window');
const SWIPE_THRESHOLD = 100;

// ─── Helpers ─────────────────────────────────────────────────

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

function formatHeaderDate(date: Date): string {
  return `${DAYS[date.getDay()]}, ${MONTHS[date.getMonth()]} ${date.getDate()}`;
}

function toLocalDateString(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function addDays(date: Date, n: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

// ─── Skeleton card ────────────────────────────────────────────

function SkeletonCard(): React.JSX.Element {
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 750 }),
        withTiming(0.4, { duration: 750 }),
      ),
      -1,
      false,
    );
  }, []);

  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));

  return (
    <Animated.View style={[s.skeletonCard, style]}>
      <View style={s.skeletonLine} />
    </Animated.View>
  );
}

// ─── Empty state ──────────────────────────────────────────────

function EmptyState(): React.JSX.Element {
  return (
    <View style={s.empty}>
      <ClipboardText size={40} color={Colors.muted} weight="regular" />
      <Text style={s.emptyText}>No tasks yet — add your first one</Text>
    </View>
  );
}

// ─── Task card ────────────────────────────────────────────────

interface TaskCardProps {
  task: Task;
  onComplete: (id: string) => void;
}

function TaskCard({ task, onComplete }: TaskCardProps): React.JSX.Element {
  const translateX = useSharedValue(0);
  const cardOpacity = useSharedValue(1);
  const cardScale = useSharedValue(1);

  const triggerHaptic = (): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const startComplete = (): void => {
    triggerHaptic();
    translateX.value = withSpring(
      SW,
      { damping: 20, stiffness: 200, mass: 0.6 },
      () => {
        cardOpacity.value = withTiming(0, { duration: 200 });
        cardScale.value = withTiming(0.85, { duration: 200 }, () => {
          runOnJS(onComplete)(task.id);
        });
      },
    );
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX(10)
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      if (e.translationX > 0) {
        translateX.value = Math.min(e.translationX, SW);
      }
    })
    .onEnd((e) => {
      if (e.translationX > SWIPE_THRESHOLD) {
        runOnJS(startComplete)();
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }, { scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  const checkStyle = useAnimatedStyle(() => ({
    opacity: Math.min(translateX.value / SWIPE_THRESHOLD, 1),
  }));

  return (
    <View style={s.taskWrapper}>
      <Animated.View style={[s.swipeBg, checkStyle]}>
        <Check size={22} color="#FFFFFF" weight="bold" />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View
          style={[
            s.taskCard,
            cardStyle,
            { borderLeftColor: task.is_public ? Colors.accent : 'transparent' },
          ]}
        >
          <Text style={s.taskTitle} numberOfLines={2}>
            {task.title}
          </Text>
          {task.is_public ? (
            <Globe size={16} color={Colors.muted} weight="regular" />
          ) : (
            <Lock size={16} color={Colors.muted} weight="regular" />
          )}
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

// ─── Planning banner ──────────────────────────────────────────

interface PlanningBannerProps {
  isPlanningTomorrow: boolean;
  onToggle: () => void;
}

function PlanningBanner({ isPlanningTomorrow, onToggle }: PlanningBannerProps): React.JSX.Element {
  return (
    <TouchableOpacity style={s.banner} onPress={onToggle} activeOpacity={0.8}>
      <MoonStars size={15} color={Colors.accent} weight="regular" />
      <Text style={s.bannerText}>
        {isPlanningTomorrow
          ? 'Planning for tomorrow — tap to switch to today'
          : 'Planning for tomorrow'}
      </Text>
    </TouchableOpacity>
  );
}

// ─── Main screen ──────────────────────────────────────────────

export default function TodayScreen(): React.JSX.Element {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => toLocalDateString(today), [today]);
  const tomorrowStr = useMemo(() => toLocalDateString(addDays(today, 1)), [today]);
  const isEvening = today.getHours() >= 18;

  const [scheduledDate, setScheduledDate] = useState<string>(todayStr);
  const isPlanningTomorrow = scheduledDate === tomorrowStr;

  const { tasks, loading, addTask, completeTask } = useTasks(scheduledDate);
  const { streak } = useStreak();

  const sheetRef = useRef<BottomSheet>(null);
  const inputRef = useRef<{ focus: () => void }>(null);
  const snapPoints = useMemo(() => ['50%'], []);

  const [taskTitle, setTaskTitle] = useState<string>('');
  const [isPublic, setIsPublic] = useState<boolean>(false);

  const handleOpenSheet = (): void => {
    sheetRef.current?.expand();
  };

  const handleCloseSheet = (): void => {
    sheetRef.current?.close();
    setTaskTitle('');
    setIsPublic(false);
  };

  const handleAddTask = async (): Promise<void> => {
    if (!taskTitle.trim()) return;
    handleCloseSheet();
    await addTask(taskTitle.trim(), isPublic, scheduledDate);
  };

  const handleComplete = useCallback((id: string): void => {
    completeTask(id);
  }, [completeTask]);

  const handleTogglePlanningDay = (): void => {
    setScheduledDate((prev) => (prev === tomorrowStr ? todayStr : tomorrowStr));
  };

  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} />
    ),
    [],
  );

  const displayDate = formatHeaderDate(
    scheduledDate === tomorrowStr ? addDays(today, 1) : today,
  );
  const displayTitle = isPlanningTomorrow ? 'Tomorrow' : 'Today';

  return (
    <SafeAreaView style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <View>
          <Text style={s.headerDate}>{displayDate}</Text>
          <Text style={s.headerTitle}>{displayTitle}</Text>
        </View>
        <View style={s.headerRight}>
          <View style={s.streakBadge}>
            <Fire size={16} color={Colors.accent} weight="regular" />
            <Text style={s.streakText}>{streak?.current_streak ?? 0}</Text>
          </View>
          <TouchableOpacity style={s.addButton} onPress={handleOpenSheet} activeOpacity={0.7}>
            <Plus size={22} color={Colors.text} weight="regular" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Planning banner */}
      {isEvening && (
        <PlanningBanner
          isPlanningTomorrow={isPlanningTomorrow}
          onToggle={handleTogglePlanningDay}
        />
      )}

      {/* Task list */}
      {loading ? (
        <View style={s.list}>
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </View>
      ) : (
        <FlatList
          data={tasks}
          keyExtractor={(item) => item.id}
          contentContainerStyle={s.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={<EmptyState />}
          renderItem={({ item }) => (
            <TaskCard task={item} onComplete={handleComplete} />
          )}
        />
      )}

      {/* Add task bottom sheet */}
      <BottomSheet
        ref={sheetRef}
        index={-1}
        snapPoints={snapPoints}
        enablePanDownToClose
        backdropComponent={renderBackdrop}
        backgroundStyle={s.sheetBg}
        handleIndicatorStyle={s.sheetHandle}
        onChange={(index) => {
          if (index === 0) {
            setTimeout(() => inputRef.current?.focus(), 150);
          }
        }}
        onClose={handleCloseSheet}
      >
        <BottomSheetView style={s.sheetContent}>
          <Text style={s.sheetLabel}>New task</Text>

          <BottomSheetTextInput
            ref={inputRef}
            style={s.sheetInput}
            placeholder="What do you want to accomplish?"
            placeholderTextColor={Colors.muted}
            value={taskTitle}
            onChangeText={setTaskTitle}
            returnKeyType="done"
            onSubmitEditing={handleAddTask}
            multiline={false}
          />

          <View style={s.toggleRow}>
            <TouchableOpacity
              style={[s.pill, !isPublic && s.pillActive]}
              onPress={() => setIsPublic(false)}
              activeOpacity={0.8}
            >
              <Lock size={14} color={!isPublic ? '#FFFFFF' : Colors.muted} weight="regular" />
              <Text style={[s.pillText, !isPublic && s.pillTextActive]}>Private</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[s.pill, isPublic && s.pillActive]}
              onPress={() => setIsPublic(true)}
              activeOpacity={0.8}
            >
              <Globe size={14} color={isPublic ? '#FFFFFF' : Colors.muted} weight="regular" />
              <Text style={[s.pillText, isPublic && s.pillTextActive]}>Public</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[s.addBtn, !taskTitle.trim() && s.addBtnDisabled]}
            onPress={handleAddTask}
            disabled={!taskTitle.trim()}
            activeOpacity={0.85}
          >
            <Text style={s.addBtnText}>Add</Text>
          </TouchableOpacity>
        </BottomSheetView>
      </BottomSheet>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerDate: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.muted,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: 'Playfair Display',
    fontSize: 28,
    color: Colors.text,
    lineHeight: 34,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 2,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F2F7F1',
    borderRadius: Radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  streakText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: Colors.accent,
  },
  addButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Radius.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },

  // Planning banner
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 24,
    marginBottom: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: `${Colors.accent}1A`,
    borderRadius: Radius.sm,
  },
  bannerText: {
    fontFamily: 'Inter',
    fontSize: 13,
    color: Colors.accent,
    flex: 1,
  },

  // Task list
  list: {
    paddingHorizontal: 24,
    paddingTop: 4,
    paddingBottom: 100,
    gap: 10,
    flexGrow: 1,
  },

  // Skeleton
  skeletonCard: {
    height: 56,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 16,
    justifyContent: 'center',
    ...Shadow.card,
  },
  skeletonLine: {
    height: 14,
    width: '60%',
    backgroundColor: Colors.border,
    borderRadius: 4,
  },

  // Empty state
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: 12,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
  },

  // Task card
  taskWrapper: {
    position: 'relative',
  },
  swipeBg: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    alignItems: 'flex-start',
    justifyContent: 'center',
    paddingLeft: 20,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderLeftWidth: 2,
    ...Shadow.card,
  },
  taskTitle: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },

  // Bottom sheet
  sheetBg: {
    backgroundColor: '#FFFFFF',
  },
  sheetHandle: {
    backgroundColor: Colors.border,
    width: 36,
  },
  sheetContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 8,
    gap: 16,
  },
  sheetLabel: {
    fontFamily: 'Playfair Display',
    fontSize: 20,
    color: Colors.text,
  },
  sheetInput: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: Colors.text,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: Radius.lg,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 14 : 10,
    backgroundColor: Colors.background,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: '#FFFFFF',
  },
  pillActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  pillText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: Colors.muted,
  },
  pillTextActive: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  addBtn: {
    height: 52,
    backgroundColor: Colors.accent,
    borderRadius: Radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnDisabled: {
    opacity: 0.4,
  },
  addBtnText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
