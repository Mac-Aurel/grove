import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { Fire, Plant } from 'phosphor-react-native';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { useGarden } from '../../hooks/useGarden';
import { useStreak } from '../../hooks/useStreak';
import { PlantSVG } from '../../components/PlantSVG';
import type { GardenPlant } from '../../types/database';

// ─── Helpers ─────────────────────────────────────────────────

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

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

// ─── Streak card ─────────────────────────────────────────────

interface StreakCardProps {
  current: number;
  longest: number;
}

function StreakCard({ current, longest }: StreakCardProps): React.JSX.Element {
  return (
    <View style={s.streakCard}>
      <Fire size={28} color={Colors.accent} weight="regular" />
      <View style={s.streakNumbers}>
        <Text style={s.streakValue}>{current}</Text>
        <Text style={s.streakLabel}>day streak</Text>
        <Text style={s.streakBest}>best: {longest} days</Text>
      </View>
    </View>
  );
}

// ─── Plant card ──────────────────────────────────────────────

function PlantCard({ plant }: { plant: GardenPlant }): React.JSX.Element {
  return (
    <View style={s.plantCard}>
      <PlantSVG plantType={plant.plant_type} size={48} />
      <Text style={s.plantType} numberOfLines={1}>{getPlantLabel(plant.plant_type)}</Text>
      <Text style={s.plantDate}>{formatDate(plant.created_at)}</Text>
    </View>
  );
}

// ─── Empty state ──────────────────────────────────────────────

function EmptyState(): React.JSX.Element {
  return (
    <View style={s.empty}>
      <Plant size={32} color={Colors.muted} weight="regular" />
      <Text style={s.emptyText}>Complete your first day to plant your first seed</Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function GardenScreen(): React.JSX.Element {
  const { plants, loading: plantsLoading } = useGarden();
  const { streak } = useStreak();

  if (plantsLoading) {
    return (
      <SafeAreaView style={s.container}>
        <View style={s.loader}>
          <ActivityIndicator size="small" color={Colors.accent} />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.container}>
      <FlatList
        data={plants}
        keyExtractor={(item) => item.id}
        numColumns={3}
        contentContainerStyle={s.list}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <View style={s.header}>
            <Text style={s.heading}>My Garden</Text>
            <StreakCard
              current={streak?.current_streak ?? 0}
              longest={streak?.longest_streak ?? 0}
            />
          </View>
        }
        ListEmptyComponent={<EmptyState />}
        columnWrapperStyle={s.row}
        renderItem={({ item }) => <PlantCard plant={item} />}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const CARD_SIZE = (340 - 32 - 24) / 3;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  loader: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, paddingBottom: 100, gap: 12 },
  header: { gap: 16, marginBottom: 8 },
  heading: {
    fontFamily: 'Playfair Display',
    fontSize: 28,
    color: Colors.text,
    lineHeight: 34,
  },

  streakCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: 20,
    ...Shadow.card,
  },
  streakNumbers: { gap: 2 },
  streakValue: {
    fontFamily: 'Inter',
    fontSize: 48,
    fontWeight: '500',
    color: Colors.text,
    lineHeight: 56,
  },
  streakLabel: { fontFamily: 'Inter', fontSize: 13, color: Colors.muted },
  streakBest: { fontFamily: 'Inter', fontSize: 12, color: Colors.muted, marginTop: 2 },

  row: { gap: 12 },
  plantCard: {
    width: CARD_SIZE,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 10,
    alignItems: 'center',
    gap: 6,
    ...Shadow.card,
  },
  plantType: {
    fontFamily: 'Inter',
    fontSize: 11,
    color: Colors.muted,
    textAlign: 'center',
  },
  plantDate: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: Colors.border,
    textAlign: 'center',
  },

  empty: {
    paddingTop: 60,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 32,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
});
