import React, { useEffect, useMemo, useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, ScrollView, TouchableOpacity, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { useContent } from '../context/ContentContext';
import { supabase } from '../lib/supabase';
import { tripDateRange } from '../components/DayPicker';
import { haversineDistanceKm } from '../lib/geo';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'TripSummary'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TripSummaryScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { trips, publishTrip } = useAppState();
  const { profile } = useAuth();
  const { places, destinations } = useContent();

  const trip = trips.find((t) => t.id === route.params.tripId);
  const [newStamps, setNewStamps] = useState<number | null>(null);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    if (!trip || !profile) return;
    const hasRealDates = /^\d{4}-\d{2}-\d{2}$/.test(trip.startDate) && /^\d{4}-\d{2}-\d{2}$/.test(trip.endDate);
    if (!hasRealDates) {
      setNewStamps(null);
      return;
    }
    supabase
      .from('visited_stamps')
      .select('destination_id', { count: 'exact' })
      .eq('profile_id', profile.id)
      .gte('visited_at', `${trip.startDate}T00:00:00`)
      .lte('visited_at', `${trip.endDate}T23:59:59`)
      .then(({ count }) => setNewStamps(count ?? 0));
  }, [trip?.id, profile?.id]);

  if (!trip) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الرحلة</Text>
      </SafeAreaView>
    );
  }

  const days = tripDateRange(trip.startDate, trip.endDate);
  const placeItems = trip.itinerary.filter((i) => i.kind === 'place' && i.placeId);
  const placeCount = new Set(placeItems.map((i) => i.placeId)).size;
  const spent = trip.budgetItems.reduce((sum, b) => sum + b.amount, 0);

  const totalKm = useMemo(() => {
    const byDay = new Map<string, typeof placeItems>();
    for (const item of placeItems) {
      const key = item.itemDate ?? 'undated';
      if (!byDay.has(key)) byDay.set(key, []);
      byDay.get(key)!.push(item);
    }
    let km = 0;
    for (const items of byDay.values()) {
      for (let i = 1; i < items.length; i++) {
        const prevPlace = places.find((p) => p.id === items[i - 1].placeId);
        const curPlace = places.find((p) => p.id === items[i].placeId);
        if (prevPlace && curPlace) km += haversineDistanceKm(prevPlace.coordinate, curPlace.coordinate);
      }
    }
    return km;
  }, [placeItems, places]);

  const destination = destinations.find((d) => d.name === trip.destination);

  const summaryLine = `رحلتي إلى ${trip.destination}: ${days.length > 0 ? `${days.length} أيام` : ''} · ${placeCount} مكان${newStamps ? ` · ${newStamps} ختم جديد` : ''}`;

  const handleShare = () => {
    Share.share({ message: summaryLine });
  };

  const isOwner = profile?.id === trip.ownerId;

  const handleTogglePublish = async () => {
    if (!isOwner || publishing) return;
    setPublishing(true);
    await publishTrip(trip.id, !trip.isPublished);
    setPublishing(false);
  };

  const handleWriteBlog = () => {
    navigation.navigate('AddTravelPost', {
      destinationId: destination?.id,
      caption: `كيف كانت رحلتي إلى ${trip.destination} 🧳`,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="close" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>ملخص الرحلة</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={styles.heroTitle}>كيف كانت {trip.destination}؟</Text>
        <Text style={styles.heroSubtitle}>{trip.title}</Text>

        <View style={styles.statsGrid}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{days.length > 0 ? days.length : '—'}</Text>
            <Text style={styles.statLabel}>أيام</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{placeCount}</Text>
            <Text style={styles.statLabel}>مكان بالجدول</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{totalKm > 0 ? totalKm.toFixed(0) : '—'}</Text>
            <Text style={styles.statLabel}>كم بين الأماكن</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{newStamps !== null ? newStamps : '—'}</Text>
            <Text style={styles.statLabel}>ختم جديد</Text>
          </View>
        </View>

        {spent > 0 ? (
          <View style={styles.budgetCard}>
            <Ionicons name="wallet-outline" size={16} color={colors.textMuted} />
            <Text style={styles.budgetText}>صرفت {spent.toLocaleString()} ر.س على الرحلة</Text>
          </View>
        ) : null}

        <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85} onPress={handleWriteBlog}>
          <Ionicons name="create-outline" size={16} color={colors.textOnPrimary} />
          <Text style={styles.primaryButtonText}>اكتب مدونة عن الرحلة</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleShare}>
          <Ionicons name="share-social-outline" size={16} color={colors.text} />
          <Text style={styles.secondaryButtonText}>شارك الملخص</Text>
        </TouchableOpacity>

        {isOwner ? (
          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleTogglePublish} disabled={publishing}>
            <Ionicons
              name={trip.isPublished ? 'checkmark-circle' : 'megaphone-outline'}
              size={16}
              color={trip.isPublished ? colors.success : colors.text}
            />
            <Text style={[styles.secondaryButtonText, trip.isPublished && { color: colors.success }]}>
              {trip.isPublished ? 'الجدول منشور — غيّر إلى خاص' : 'انشر الجدول عشان الناس تنسخ خطتك'}
            </Text>
          </TouchableOpacity>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: 16, fontWeight: '700' },
  body: { padding: spacing.xl, paddingBottom: spacing.xxl },
  heroTitle: { color: colors.text, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  heroSubtitle: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginTop: spacing.xs, marginBottom: spacing.xl },
  statsGrid: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: spacing.sm },
  statCard: {
    width: '47%',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  statValue: { color: colors.primary, fontSize: 24, fontWeight: '800' },
  statLabel: { color: colors.textMuted, fontSize: 12, marginTop: 4 },
  budgetCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.lg,
  },
  budgetText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  primaryButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.xl,
  },
  primaryButtonText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
  secondaryButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
  },
  secondaryButtonText: { color: colors.text, fontSize: 14, fontWeight: '700' },
});
