import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  Switch,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Fire, SignOut, Bell, PencilSimple, Plant } from 'phosphor-react-native';
import { useRouter } from 'expo-router';
import { supabase } from '../../lib/supabase';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { useProfile } from '../../hooks/useProfile';
import { useCompletionHistory } from '../../hooks/useCompletionHistory';
import { usePhotoUpload } from '../../hooks/usePhotoUpload';
import type { CompletionDay } from '../../types/database';

// ─── Helpers ─────────────────────────────────────────────────

function getInitials(name: string): string {
  return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase();
}

function heatmapColor(rate: number): string {
  if (rate === 0) return Colors.border;
  if (rate < 0.5) return Colors.heatmap1;
  if (rate < 1) return Colors.heatmap2;
  return Colors.accent;
}

// ─── Stat cell ────────────────────────────────────────────────

function StatCell({ value, label, icon }: { value: number; label: string; icon?: React.ReactNode }): React.JSX.Element {
  return (
    <View style={s.statCell}>
      {icon}
      <Text style={s.statValue}>{value}</Text>
      <Text style={s.statLabel}>{label}</Text>
    </View>
  );
}

// ─── Heatmap ─────────────────────────────────────────────────

function Heatmap({ history }: { history: CompletionDay[] }): React.JSX.Element {
  const rows = 6;
  const cols = 10;
  const days = history.slice(0, 60);

  return (
    <View style={s.heatmap}>
      {Array.from({ length: rows }).map((_, rowIdx) => (
        <View key={rowIdx} style={s.heatmapRow}>
          {Array.from({ length: cols }).map((_, colIdx) => {
            const day = days[rowIdx * cols + colIdx];
            return (
              <View
                key={colIdx}
                style={[s.heatmapCell, { backgroundColor: day ? heatmapColor(day.rate) : Colors.border }]}
              />
            );
          })}
        </View>
      ))}
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function ProfileScreen(): React.JSX.Element {
  const router = useRouter();
  const { profile, stats, recentPlants, updateDisplayName, updateBio, updateAvatarUrl } = useProfile();
  const { history } = useCompletionHistory();
  const { uploading, uploadAvatar } = usePhotoUpload();

  const [editingName, setEditingName] = useState<boolean>(false);
  const [nameValue, setNameValue] = useState<string>('');
  const [editingBio, setEditingBio] = useState<boolean>(false);
  const [bioValue, setBioValue] = useState<string>('');
  const [notifEnabled, setNotifEnabled] = useState<boolean>(false);

  const nameInputRef = useRef<TextInput>(null);
  const bioInputRef = useRef<TextInput>(null);

  const handleAvatarPress = async (): Promise<void> => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1,
    });

    if (!result.canceled && result.assets[0]) {
      const url = await uploadAvatar(result.assets[0].uri);
      if (url) await updateAvatarUrl(url);
    }
  };

  const startEditName = (): void => {
    setNameValue(profile?.display_name ?? '');
    setEditingName(true);
    setTimeout(() => nameInputRef.current?.focus(), 50);
  };

  const saveName = async (): Promise<void> => {
    setEditingName(false);
    await updateDisplayName(nameValue);
  };

  const startEditBio = (): void => {
    setBioValue(profile?.bio ?? '');
    setEditingBio(true);
    setTimeout(() => bioInputRef.current?.focus(), 50);
  };

  const saveBio = async (): Promise<void> => {
    setEditingBio(false);
    await updateBio(bioValue);
  };

  const handleSignOut = (): void => {
    Alert.alert('Sign out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Sign out', style: 'destructive', onPress: () => { supabase.auth.signOut(); } },
    ]);
  };

  return (
    <SafeAreaView style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* Avatar + name */}
        <View style={s.topSection}>
          <TouchableOpacity onPress={handleAvatarPress} activeOpacity={0.8} disabled={uploading}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={s.avatar} />
            ) : (
              <View style={s.avatarFallback}>
                <Text style={s.avatarInitials}>
                  {getInitials(profile?.display_name ?? profile?.username ?? '?')}
                </Text>
              </View>
            )}
            <View style={s.avatarEditBadge}>
              <PencilSimple size={12} color="#FFFFFF" weight="regular" />
            </View>
          </TouchableOpacity>

          <View style={s.nameBlock}>
            {editingName ? (
              <TextInput
                ref={nameInputRef}
                style={s.nameInput}
                value={nameValue}
                onChangeText={setNameValue}
                onBlur={saveName}
                returnKeyType="done"
                onSubmitEditing={saveName}
              />
            ) : (
              <TouchableOpacity onPress={startEditName} activeOpacity={0.7}>
                <Text style={s.displayName}>{profile?.display_name ?? ''}</Text>
              </TouchableOpacity>
            )}
            <Text style={s.username}>@{profile?.username ?? ''}</Text>
          </View>
        </View>

        {/* Bio */}
        <TouchableOpacity style={s.bioWrap} onPress={startEditBio} activeOpacity={0.8}>
          {editingBio ? (
            <View>
              <TextInput
                ref={bioInputRef}
                style={s.bioInput}
                value={bioValue}
                onChangeText={(t) => setBioValue(t.slice(0, 120))}
                onBlur={saveBio}
                multiline
                maxLength={120}
              />
              <Text style={s.bioCount}>{bioValue.length}/120</Text>
            </View>
          ) : (
            <Text style={profile?.bio ? s.bioText : s.bioPlaceholder}>
              {profile?.bio ?? 'Add a bio...'}
            </Text>
          )}
        </TouchableOpacity>

        {/* Stats */}
        <View style={s.statsRow}>
          <StatCell
            value={stats.current_streak}
            label="streak"
            icon={<Fire size={18} color={Colors.accent} weight="regular" />}
          />
          <StatCell value={stats.total_completed} label="completed" />
          <StatCell value={stats.friends_count} label="friends" />
          <StatCell
            value={stats.plants_count}
            label="plants"
            icon={<Plant size={18} color={Colors.accent} weight="regular" />}
          />
        </View>

        {/* Heatmap */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Last 60 days</Text>
          <Heatmap history={history} />
          <View style={s.heatmapLegend}>
            {([Colors.border, Colors.heatmap1, Colors.heatmap2, Colors.accent] as string[]).map((color, i) => (
              <View key={i} style={[s.legendCell, { backgroundColor: color }]} />
            ))}
            <Text style={s.legendText}>Less → More</Text>
          </View>
        </View>

        {/* Recent garden plants */}
        {recentPlants.length > 0 && (
          <View style={s.card}>
            <View style={s.sectionRow}>
              <Text style={s.sectionTitle}>Garden</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/garden')} activeOpacity={0.7}>
                <Text style={s.seeAll}>See all</Text>
              </TouchableOpacity>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.plantsScroll}>
              {recentPlants.map((plant) => (
                <View key={plant.id} style={s.plantCard}>
                  <Plant size={22} color={Colors.accent} weight="regular" />
                  <Text style={s.plantName} numberOfLines={1}>{plant.name}</Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Settings */}
        <View style={s.card}>
          <Text style={s.sectionTitle}>Settings</Text>
          <View style={s.settingRow}>
            <Bell size={20} color={Colors.text} weight="regular" />
            <Text style={s.settingLabel}>Daily reminder</Text>
            <Switch
              value={notifEnabled}
              onValueChange={setNotifEnabled}
              trackColor={{ false: Colors.border, true: Colors.accent }}
              thumbColor="#FFFFFF"
            />
          </View>
          <View style={s.divider} />
          <TouchableOpacity style={s.signOutRow} onPress={handleSignOut} activeOpacity={0.7}>
            <SignOut size={20} color={Colors.danger} weight="regular" />
            <Text style={s.signOutText}>Sign out</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const AVATAR_SIZE = 80;

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scroll: { padding: 24, paddingBottom: 100, gap: 16 },

  topSection: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  avatar: { width: AVATAR_SIZE, height: AVATAR_SIZE, borderRadius: AVATAR_SIZE / 2 },
  avatarFallback: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: `${Colors.accent}28`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: { fontFamily: 'Inter', fontSize: 28, fontWeight: '600', color: Colors.accent },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  nameBlock: { flex: 1, gap: 4 },
  displayName: { fontFamily: 'Playfair Display', fontSize: 22, color: Colors.text, lineHeight: 28 },
  nameInput: {
    fontFamily: 'Playfair Display',
    fontSize: 22,
    color: Colors.text,
    borderBottomWidth: 1,
    borderBottomColor: Colors.accent,
    paddingBottom: 2,
  },
  username: { fontFamily: 'Inter', fontSize: 13, color: Colors.muted },

  bioWrap: { backgroundColor: '#FFFFFF', borderRadius: Radius.md, padding: 14, ...Shadow.card },
  bioText: { fontFamily: 'Inter', fontSize: 14, color: Colors.text, lineHeight: 20 },
  bioPlaceholder: { fontFamily: 'Inter', fontSize: 14, color: Colors.muted },
  bioInput: { fontFamily: 'Inter', fontSize: 14, color: Colors.text, lineHeight: 20 },
  bioCount: { fontFamily: 'Inter', fontSize: 11, color: Colors.muted, textAlign: 'right', marginTop: 4 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingVertical: 16,
    ...Shadow.card,
  },
  statCell: { flex: 1, alignItems: 'center', gap: 4 },
  statValue: { fontFamily: 'Inter', fontSize: 20, fontWeight: '500', color: Colors.text },
  statLabel: { fontFamily: 'Inter', fontSize: 11, color: Colors.muted },

  card: { backgroundColor: '#FFFFFF', borderRadius: Radius.lg, padding: 16, gap: 12, ...Shadow.card },
  sectionRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 13,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  seeAll: { fontFamily: 'Inter', fontSize: 13, color: Colors.accent },

  heatmap: { gap: 3 },
  heatmapRow: { flexDirection: 'row', gap: 3 },
  heatmapCell: { width: 10, height: 10, borderRadius: 2 },
  heatmapLegend: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  legendCell: { width: 10, height: 10, borderRadius: 2 },
  legendText: { fontFamily: 'Inter', fontSize: 10, color: Colors.muted, marginLeft: 4 },

  plantsScroll: { marginHorizontal: -4 },
  plantCard: {
    width: 60,
    height: 60,
    backgroundColor: Colors.background,
    borderRadius: Radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  plantName: { fontFamily: 'Inter', fontSize: 9, color: Colors.muted, textAlign: 'center' },

  settingRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  settingLabel: { fontFamily: 'Inter', fontSize: 15, color: Colors.text, flex: 1 },
  divider: { height: 1, backgroundColor: Colors.border },
  signOutRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  signOutText: { fontFamily: 'Inter', fontSize: 15, color: Colors.danger },
});
