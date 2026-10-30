import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import SectionHeader from '../components/SectionHeader';
import { colors, radius, spacing } from '../theme/colors';
import { useAppState } from '../context/AppState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function ChatScreen() {
  const navigation = useNavigation<Nav>();
  const { guideMessages, trips, friends, currentUser, communities } = useAppState();

  const lastGuideMessage = guideMessages[guideMessages.length - 1];
  const joinedCommunities = communities.filter((c) => c.joined);
  const discoverCommunities = communities.filter((c) => !c.joined);

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <TouchableOpacity
          style={styles.guideCard}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('GuideChat')}
        >
          <View style={styles.guideIcon}>
            <Ionicons name="compass" size={20} color={colors.textOnPrimary} />
          </View>
          <View style={styles.guideTextWrap}>
            <Text style={styles.guideTitle}>دليل السفر</Text>
            <Text style={styles.guideSubtitle} numberOfLines={1}>
              {lastGuideMessage ? lastGuideMessage.text : 'اسألني عن أي وجهة أو شهر'}
            </Text>
          </View>
          <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <SectionHeader title="محادثات رحلاتك" />
        {trips.length === 0 ? (
          <Text style={styles.emptyText}>ابدأ رحلة مع أصدقائك عشان تظهر محادثتها هنا</Text>
        ) : (
          trips.map((trip) => {
            const lastMessage = trip.messages[trip.messages.length - 1];
            const memberNames = trip.memberIds
              .filter((id) => id !== 'me')
              .map((id) => friends.find((f) => f.id === id)?.name ?? currentUser.name)
              .join('، ');
            return (
              <TouchableOpacity
                key={trip.id}
                style={styles.rowCard}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('GroupChat', { tripId: trip.id })}
              >
                <View style={styles.rowIcon}>
                  <Ionicons name="people" size={18} color={colors.primary} />
                </View>
                <View style={styles.rowTextWrap}>
                  <Text style={styles.rowTitle}>{trip.title}</Text>
                  <Text style={styles.rowSubtitle} numberOfLines={1}>
                    {lastMessage ? lastMessage.text : `مع ${memberNames || 'لا أحد بعد'}`}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })
        )}

        {joinedCommunities.length > 0 ? (
          <>
            <SectionHeader title="مجتمعاتي" />
            {joinedCommunities.map((community) => {
              const lastMessage = community.messages[community.messages.length - 1];
              return (
                <TouchableOpacity
                  key={community.id}
                  style={styles.rowCard}
                  activeOpacity={0.85}
                  onPress={() => navigation.navigate('CommunityChat', { communityId: community.id })}
                >
                  <View style={[styles.rowIcon, { backgroundColor: community.color }]}>
                    <Text style={styles.rowEmoji}>{community.emoji}</Text>
                  </View>
                  <View style={styles.rowTextWrap}>
                    <Text style={styles.rowTitle}>{community.name}</Text>
                    <Text style={styles.rowSubtitle} numberOfLines={1}>
                      {lastMessage ? `${lastMessage.fromName}: ${lastMessage.text}` : community.tagline}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </>
        ) : null}

        <SectionHeader title="استكشف مجتمعات سفر" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.discoverRow}
        >
          {discoverCommunities.map((community) => (
            <TouchableOpacity
              key={community.id}
              style={styles.discoverItem}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CommunityChat', { communityId: community.id })}
            >
              <View style={[styles.discoverAvatar, { borderColor: community.color }]}>
                <Text style={styles.discoverEmoji}>{community.emoji}</Text>
              </View>
              <Text style={styles.discoverLabel} numberOfLines={2}>
                {community.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { paddingBottom: 120 },
  guideCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  guideIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  guideTextWrap: { flex: 1 },
  guideTitle: { color: colors.text, fontSize: 15, fontWeight: '800', textAlign: 'right' },
  guideSubtitle: { color: colors.primaryDark, fontSize: 12, textAlign: 'right', marginTop: 2 },
  emptyText: {
    color: colors.textMuted,
    textAlign: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  rowCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  rowIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowEmoji: { fontSize: 18 },
  rowTextWrap: { flex: 1 },
  rowTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right' },
  rowSubtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  discoverRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  discoverItem: { alignItems: 'center', width: 76 },
  discoverAvatar: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  discoverEmoji: { fontSize: 26 },
  discoverLabel: { color: colors.text, fontSize: 11, fontWeight: '600', textAlign: 'center' },
});
