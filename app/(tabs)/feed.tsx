import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Image,
  Modal,
  Dimensions,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { MagnifyingGlass, UsersThree, X, BellRinging } from 'phosphor-react-native';
import { Colors, Radius, Shadow } from '../../constants/theme';
import { useFeed } from '../../hooks/useFeed';
import { useFriends } from '../../hooks/useFriends';
import type { FeedItem, Profile } from '../../types/database';

const { width: SW, height: SH } = Dimensions.get('window');

// ─── Helpers ─────────────────────────────────────────────────

function timeAgo(iso: string): string {
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const PHOTO_HEIGHTS = [180, 220, 200, 240];

function photoHeight(index: number): number {
  return PHOTO_HEIGHTS[index % PHOTO_HEIGHTS.length];
}

function buildColumns(items: FeedItem[]): [FeedItem[], FeedItem[]] {
  const left: FeedItem[] = [];
  const right: FeedItem[] = [];
  items.forEach((item, i) => {
    if (i % 2 === 0) left.push(item);
    else right.push(item);
  });
  return [left, right];
}

// ─── Skeleton ────────────────────────────────────────────────

function SkeletonCell({ height }: { height: number }): React.JSX.Element {
  const opacity = useSharedValue(0.4);

  React.useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(1, { duration: 700 }), withTiming(0.4, { duration: 700 })),
      -1,
      false,
    );
  }, []);

  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[s.skeletonCell, { height, marginBottom: 8 }, aStyle]} />;
}

function FeedSkeleton(): React.JSX.Element {
  return (
    <View style={s.grid}>
      <View style={s.col}>
        <SkeletonCell height={180} />
        <SkeletonCell height={220} />
        <SkeletonCell height={200} />
      </View>
      <View style={s.col}>
        <SkeletonCell height={220} />
        <SkeletonCell height={180} />
        <SkeletonCell height={240} />
      </View>
    </View>
  );
}

// ─── Feed card ────────────────────────────────────────────────

interface FeedCardProps {
  item: FeedItem;
  index: number;
  onPress: (item: FeedItem) => void;
}

function FeedCard({ item, index, onPress }: FeedCardProps): React.JSX.Element {
  const height = photoHeight(index);
  return (
    <TouchableOpacity
      style={[s.card, { height, marginBottom: 8 }]}
      activeOpacity={0.9}
      onPress={() => onPress(item)}
    >
      <Image source={{ uri: item.photo_proof_url }} style={s.cardPhoto} resizeMode="cover" />
      <View style={s.cardOverlay}>
        <Text style={s.cardUser} numberOfLines={1}>{item.display_name}</Text>
        <Text style={s.cardTask} numberOfLines={1}>{item.title}</Text>
        <Text style={s.cardTime}>{timeAgo(item.completed_at)}</Text>
      </View>
    </TouchableOpacity>
  );
}

// ─── Feed tab ────────────────────────────────────────────────

function FeedTab(): React.JSX.Element {
  const { feed, loading } = useFeed();
  const [expanded, setExpanded] = useState<FeedItem | null>(null);
  const expandScale = useSharedValue(0.85);
  const expandOpacity = useSharedValue(0);

  const openExpanded = (item: FeedItem): void => {
    setExpanded(item);
    expandScale.value = withSpring(1, { damping: 18, stiffness: 180 });
    expandOpacity.value = withTiming(1, { duration: 200 });
  };

  const closeExpanded = (): void => {
    expandOpacity.value = withTiming(0, { duration: 150 });
    setTimeout(() => {
      setExpanded(null);
      expandScale.value = 0.85;
    }, 160);
  };

  const expandedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: expandScale.value }],
    opacity: expandOpacity.value,
  }));

  if (loading) {
    return (
      <ScrollView contentContainerStyle={s.gridContainer}>
        <FeedSkeleton />
      </ScrollView>
    );
  }

  if (feed.length === 0) {
    return (
      <View style={s.emptyState}>
        <UsersThree size={48} color={Colors.muted} weight="regular" />
        <Text style={s.emptyTitle}>Add friends to see their accomplishments</Text>
      </View>
    );
  }

  const [leftItems, rightItems] = buildColumns(feed);

  return (
    <>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.gridContainer}>
        <View style={s.grid}>
          <View style={s.col}>
            {leftItems.map((item, i) => (
              <FeedCard key={item.task_id} item={item} index={i * 2} onPress={openExpanded} />
            ))}
          </View>
          <View style={s.col}>
            {rightItems.map((item, i) => (
              <FeedCard key={item.task_id} item={item} index={i * 2 + 1} onPress={openExpanded} />
            ))}
          </View>
        </View>
      </ScrollView>

      <Modal visible={expanded !== null} transparent animationType="none" onRequestClose={closeExpanded}>
        <View style={s.expandedBg}>
          {expanded && (
            <Animated.View style={[s.expandedSheet, expandedStyle]}>
              <Image
                source={{ uri: expanded.photo_proof_url }}
                style={s.expandedPhoto}
                resizeMode="contain"
              />
              <View style={s.expandedInfo}>
                <Text style={s.expandedUser}>{expanded.display_name}</Text>
                <Text style={s.expandedTask}>{expanded.title}</Text>
                <Text style={s.expandedTime}>{timeAgo(expanded.completed_at)}</Text>
              </View>
              <TouchableOpacity style={s.closeBtn} onPress={closeExpanded} activeOpacity={0.8}>
                <X size={22} color={Colors.text} weight="regular" />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </Modal>
    </>
  );
}

// ─── Avatar ───────────────────────────────────────────────────

function Avatar({ profile, size = 40 }: { profile: Profile; size?: number }): React.JSX.Element {
  if (profile.avatar_url) {
    return (
      <Image source={{ uri: profile.avatar_url }} style={{ width: size, height: size, borderRadius: size / 2 }} />
    );
  }
  return (
    <View style={[s.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
      <Text style={[s.avatarInitials, { fontSize: size * 0.35 }]}>
        {getInitials(profile.display_name || profile.username)}
      </Text>
    </View>
  );
}

// ─── Friends tab ─────────────────────────────────────────────

function FriendsTab(): React.JSX.Element {
  const {
    friends, pendingReceived, pendingSentIds, searchResults,
    searching, addFriend, acceptFriend, declineFriend,
    nudgeFriend, searchUsers, clearSearch,
  } = useFriends();

  const [query, setQuery] = useState<string>('');
  const [nudging, setNudging] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleQueryChange = (text: string): void => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (text.length < 2) { clearSearch(); return; }
    debounceRef.current = setTimeout(() => searchUsers(text), 350);
  };

  useEffect(() => () => { if (debounceRef.current) clearTimeout(debounceRef.current); }, []);

  const handleNudge = async (userId: string): Promise<void> => {
    setNudging(userId);
    await nudgeFriend(userId);
    setNudging(null);
  };

  const showSearch = query.length >= 2;

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.friendsContainer} keyboardShouldPersistTaps="handled">
        <View style={s.searchBar}>
          <MagnifyingGlass size={18} color={Colors.muted} weight="regular" />
          <TextInput
            style={s.searchInput}
            placeholder="Search by username..."
            placeholderTextColor={Colors.muted}
            value={query}
            onChangeText={handleQueryChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searching && <ActivityIndicator size="small" color={Colors.muted} />}
        </View>

        {showSearch && (
          <View style={s.section}>
            {searchResults.length === 0 && !searching && (
              <Text style={s.sectionEmpty}>No users found</Text>
            )}
            {searchResults.map((profile) => (
              <View key={profile.id} style={s.userRow}>
                <Avatar profile={profile} size={40} />
                <View style={s.userInfo}>
                  <Text style={s.userName}>{profile.display_name}</Text>
                  <Text style={s.userHandle}>@{profile.username}</Text>
                </View>
                {pendingSentIds.has(profile.id) ? (
                  <View style={s.pendingBadge}><Text style={s.pendingText}>Pending</Text></View>
                ) : (
                  <TouchableOpacity style={s.outlineBtn} onPress={() => addFriend(profile.id)} activeOpacity={0.8}>
                    <Text style={s.outlineBtnText}>Add</Text>
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}

        {!showSearch && pendingReceived.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionTitle}>Requests</Text>
            {pendingReceived.map((entry) => (
              <View key={entry.friendship_id} style={s.userRow}>
                <Avatar profile={entry.profile} size={40} />
                <View style={s.userInfo}>
                  <Text style={s.userName}>{entry.profile.display_name}</Text>
                  <Text style={s.userHandle}>@{entry.profile.username}</Text>
                </View>
                <View style={s.requestActions}>
                  <TouchableOpacity style={s.acceptBtn} onPress={() => acceptFriend(entry.friendship_id)} activeOpacity={0.8}>
                    <Text style={s.acceptBtnText}>Accept</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.declineBtn} onPress={() => declineFriend(entry.friendship_id)} activeOpacity={0.8}>
                    <Text style={s.declineBtnText}>Decline</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        )}

        {!showSearch && (
          <View style={s.section}>
            {friends.length > 0 && <Text style={s.sectionTitle}>Friends</Text>}
            {friends.length === 0 ? (
              <Text style={s.sectionEmpty}>No friends yet — search for people to add</Text>
            ) : (
              friends.map((entry) => (
                <View key={entry.friendship_id} style={s.userRow}>
                  <Avatar profile={entry.profile} size={40} />
                  <View style={s.userInfo}>
                    <Text style={s.userName}>{entry.profile.display_name}</Text>
                    <Text style={s.userHandle}>@{entry.profile.username}</Text>
                  </View>
                  {nudging === entry.profile.id ? (
                    <ActivityIndicator size="small" color={Colors.accent} />
                  ) : (
                    <TouchableOpacity style={s.nudgeBtn} onPress={() => handleNudge(entry.profile.id)} activeOpacity={0.8}>
                      <BellRinging size={16} color={Colors.accent} weight="regular" />
                      <Text style={s.nudgeBtnText}>Nudge</Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))
            )}
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ─── Screen ───────────────────────────────────────────────────

export default function FeedScreen(): React.JSX.Element {
  const [activeTab, setActiveTab] = useState<'feed' | 'friends'>('feed');

  return (
    <SafeAreaView style={s.container}>
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tab, activeTab === 'feed' && s.tabActive]} onPress={() => setActiveTab('feed')} activeOpacity={0.8}>
          <Text style={[s.tabText, activeTab === 'feed' && s.tabTextActive]}>Feed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, activeTab === 'friends' && s.tabActive]} onPress={() => setActiveTab('friends')} activeOpacity={0.8}>
          <Text style={[s.tabText, activeTab === 'friends' && s.tabTextActive]}>Friends</Text>
        </TouchableOpacity>
      </View>
      {activeTab === 'feed' ? <FeedTab /> : <FriendsTab />}
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 4,
  },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.sm },
  tabActive: { backgroundColor: `${Colors.accent}18` },
  tabText: { fontFamily: 'Inter', fontSize: 15, fontWeight: '500', color: Colors.muted },
  tabTextActive: { color: Colors.accent },
  gridContainer: { padding: 16, paddingBottom: 100 },
  grid: { flexDirection: 'row', gap: 8 },
  col: { flex: 1 },
  skeletonCell: { backgroundColor: Colors.border, borderRadius: Radius.md },
  card: { borderRadius: Radius.md, overflow: 'hidden', ...Shadow.card },
  cardPhoto: { width: '100%', height: '100%' },
  cardOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.28)',
    borderRadius: Radius.md,
  },
  cardUser: { fontFamily: 'Inter', fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
  cardTask: { fontFamily: 'Inter', fontSize: 12, color: '#FFFFFF', marginTop: 1 },
  cardTime: { fontFamily: 'Inter', fontSize: 11, color: 'rgba(255,255,255,0.6)', marginTop: 2 },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
  emptyTitle: { fontFamily: 'Inter', fontSize: 15, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
  expandedBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'center', alignItems: 'center' },
  expandedSheet: { width: SW - 32, maxHeight: SH * 0.85, backgroundColor: '#FFFFFF', borderRadius: Radius.xl, overflow: 'hidden' },
  expandedPhoto: { width: '100%', height: SW - 32 },
  expandedInfo: { padding: 16, gap: 3 },
  expandedUser: { fontFamily: 'Inter', fontSize: 15, fontWeight: '600', color: Colors.text },
  expandedTask: { fontFamily: 'Inter', fontSize: 14, color: Colors.text },
  expandedTime: { fontFamily: 'Inter', fontSize: 12, color: Colors.muted },
  closeBtn: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarFallback: { backgroundColor: `${Colors.accent}28`, alignItems: 'center', justifyContent: 'center' },
  avatarInitials: { fontFamily: 'Inter', fontWeight: '600', color: Colors.accent },
  friendsContainer: { padding: 16, paddingBottom: 100, gap: 8 },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: 8,
  },
  searchInput: { flex: 1, fontFamily: 'Inter', fontSize: 15, color: Colors.text },
  section: { gap: 4 },
  sectionTitle: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: Colors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  sectionEmpty: { fontFamily: 'Inter', fontSize: 14, color: Colors.muted, paddingVertical: 8 },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    padding: 12,
    marginBottom: 6,
    ...Shadow.card,
  },
  userInfo: { flex: 1, gap: 2 },
  userName: { fontFamily: 'Inter', fontSize: 14, fontWeight: '500', color: Colors.text },
  userHandle: { fontFamily: 'Inter', fontSize: 12, color: Colors.muted },
  outlineBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.accent },
  outlineBtnText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '500', color: Colors.accent },
  pendingBadge: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.border },
  pendingText: { fontFamily: 'Inter', fontSize: 13, color: Colors.muted },
  requestActions: { flexDirection: 'row', gap: 6 },
  acceptBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, backgroundColor: Colors.accent },
  acceptBtnText: { fontFamily: 'Inter', fontSize: 13, fontWeight: '500', color: '#FFFFFF' },
  declineBtn: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.border },
  declineBtnText: { fontFamily: 'Inter', fontSize: 13, color: Colors.muted },
  nudgeBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 8, borderRadius: Radius.sm, borderWidth: 1, borderColor: Colors.accent },
  nudgeBtnText: { fontFamily: 'Inter', fontSize: 13, color: Colors.accent },
});
