import React from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import { colors, radius, spacing } from '../theme/colors';
import { useAppState } from '../context/AppState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ProfileScreen() {
  const navigation = useNavigation<Nav>();
  const { currentUser, friends, trips } = useAppState();

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <View style={styles.profileCard}>
          <View style={[styles.avatar, { backgroundColor: currentUser.color }]}>
            <Text style={styles.avatarEmoji}>{currentUser.emoji}</Text>
          </View>
          <Text style={styles.name}>{currentUser.name}</Text>
          <Text style={styles.username}>@{currentUser.username}</Text>

          <View style={styles.statsRow}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{trips.length}</Text>
              <Text style={styles.statLabel}>رحلات</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{friends.length}</Text>
              <Text style={styles.statLabel}>أصدقاء</Text>
            </View>
          </View>
        </View>

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>رحلاتي</Text>
        </View>
        {trips.length === 0 ? (
          <Text style={styles.emptyMuted}>لا توجد رحلات بعد</Text>
        ) : (
          trips.map((trip) => (
            <TouchableOpacity
              key={trip.id}
              style={styles.tripRow}
              activeOpacity={0.8}
              onPress={() => navigation.navigate('TripDetail', { tripId: trip.id })}
            >
              <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
              <View style={styles.tripTextWrap}>
                <Text style={styles.tripTitle}>{trip.title}</Text>
                <Text style={styles.tripSubtitle}>{trip.startDate} → {trip.endDate}</Text>
              </View>
              <Ionicons name="airplane-outline" size={18} color={colors.primary} />
            </TouchableOpacity>
          ))
        )}

        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>أصدقائي</Text>
          <TouchableOpacity
            style={styles.addFriendButton}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('AddFriend')}
          >
            <Ionicons name="person-add-outline" size={14} color={colors.textOnPrimary} />
            <Text style={styles.addFriendText}>إضافة صديق</Text>
          </TouchableOpacity>
        </View>
        {friends.map((friend) => (
          <View key={friend.id} style={styles.friendRow}>
            <Text style={styles.friendUsername}>@{friend.username}</Text>
            <View style={styles.friendTextWrap}>
              <Text style={styles.friendName}>{friend.name}</Text>
            </View>
            <View style={[styles.friendAvatar, { backgroundColor: friend.color }]}>
              <Text style={styles.friendEmoji}>{friend.emoji}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: spacing.xxl, paddingHorizontal: spacing.lg },
  profileCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    paddingVertical: spacing.xl,
    marginBottom: spacing.xl,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  avatarEmoji: { fontSize: 30 },
  name: { color: colors.text, fontSize: 18, fontWeight: '800' },
  username: { color: colors.textMuted, fontSize: 12, marginTop: 2, marginBottom: spacing.lg },
  statsRow: { flexDirection: 'row-reverse', alignItems: 'center' },
  statItem: { alignItems: 'center', paddingHorizontal: spacing.xl },
  statValue: { color: colors.primary, fontSize: 18, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statDivider: { width: 1, height: 28, backgroundColor: colors.border },
  sectionHeaderRow: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  emptyMuted: { color: colors.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: spacing.md },
  addFriendButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  addFriendText: { color: colors.textOnPrimary, fontSize: 11, fontWeight: '700' },
  tripRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  tripTextWrap: { flex: 1 },
  tripTitle: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  tripSubtitle: { color: colors.textFaint, fontSize: 11, textAlign: 'right', marginTop: 2 },
  friendRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.sm,
    marginBottom: spacing.sm,
  },
  friendAvatar: { width: 38, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  friendEmoji: { fontSize: 16 },
  friendTextWrap: { flex: 1 },
  friendName: { color: colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  friendUsername: { color: colors.textFaint, fontSize: 11 },
});
