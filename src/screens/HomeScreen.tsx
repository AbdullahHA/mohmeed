import React, { useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import TopBar from '../components/TopBar';
import SectionHeader from '../components/SectionHeader';
import DestinationCard from '../components/DestinationCard';
import { colors, radius, spacing } from '../theme/colors';
import { destinations, heroDestination } from '../data/destinations';
import { useAppState } from '../context/AppState';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export default function HomeScreen() {
  const navigation = useNavigation<Nav>();
  const { trips, sendGuideMessage } = useAppState();
  const [query, setQuery] = useState('');

  const currentMonth = new Date().getMonth() + 1;
  const monthlyDestinations = useMemo(() => {
    const matches = destinations.filter((d) => d.bestMonths.includes(currentMonth));
    return matches.length > 0 ? matches : destinations;
  }, [currentMonth]);

  const nextTrip = trips[0];

  const askGuide = () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    sendGuideMessage(trimmed);
    setQuery('');
    navigation.navigate('MainTabs', { screen: 'Chat' });
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        <ImageBackground
          source={{ uri: heroDestination.image }}
          style={styles.hero}
          imageStyle={styles.heroImage}
        >
          <View style={styles.heroOverlay} />
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>رفيقك في كل رحلة</Text>
            <Text style={styles.heroSubtitle}>اكتشف، خطط، وشارك رحلتك مع أصدقائك</Text>
          </View>
        </ImageBackground>

        <View style={styles.quickActions}>
          <TouchableOpacity
            style={[styles.quickAction, styles.quickActionActive]}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CreateTrip')}
          >
            <Ionicons name="add-circle-outline" size={18} color={colors.textOnPrimary} />
            <Text style={[styles.quickActionText, styles.quickActionTextActive]}>خطط رحلة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Discover' })}
          >
            <Ionicons name="search" size={18} color={colors.text} />
            <Text style={styles.quickActionText}>استكشف</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
          >
            <Ionicons name="chatbubble-outline" size={18} color={colors.text} />
            <Text style={styles.quickActionText}>تحدث معنا</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.aiSearchBar}>
          <TouchableOpacity onPress={askGuide} activeOpacity={0.8}>
            <Ionicons name="paper-plane-outline" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TextInput
            style={styles.aiInput}
            placeholder="وين تحب تسافر؟ أو أي شهر يناسبك؟"
            placeholderTextColor={colors.textFaint}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={askGuide}
            textAlign="right"
          />
        </View>

        <SectionHeader
          title={`أفضل الوجهات في ${MONTH_NAMES[currentMonth - 1]}`}
          actionLabel="اسأل الدليل"
          onActionPress={() => navigation.navigate('MainTabs', { screen: 'Chat' })}
        />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destinationsRow}
        >
          {monthlyDestinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              onPress={() => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
            />
          ))}
        </ScrollView>

        <SectionHeader
          title="رحلاتك القادمة"
          actionLabel="عرض الكل"
          onActionPress={() => navigation.navigate('MainTabs', { screen: 'Trips' })}
        />
        {nextTrip ? (
          <TouchableOpacity
            style={styles.tripPreview}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('TripDetail', { tripId: nextTrip.id })}
          >
            <ImageBackground
              source={{ uri: nextTrip.coverImage }}
              style={styles.tripPreviewImage}
              imageStyle={styles.heroImage}
            >
              <View style={styles.heroOverlay} />
              <View style={styles.tripPreviewTextWrap}>
                <Text style={styles.tripPreviewTitle}>{nextTrip.title}</Text>
                <Text style={styles.tripPreviewSubtitle}>
                  {nextTrip.startDate} · {nextTrip.memberIds.length} أشخاص
                </Text>
              </View>
            </ImageBackground>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.emptyTripCard}
            activeOpacity={0.85}
            onPress={() => navigation.navigate('CreateTrip')}
          >
            <Ionicons name="airplane-outline" size={22} color={colors.primary} />
            <Text style={styles.emptyTripText}>ما عندك رحلات بعد، ابدأ رحلتك الأولى</Text>
          </TouchableOpacity>
        )}

        <SectionHeader title="كل الوجهات" />
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.destinationsRow}
        >
          {destinations.map((destination) => (
            <DestinationCard
              key={destination.id}
              destination={destination}
              onPress={() => navigation.navigate('DestinationDetail', { destinationId: destination.id })}
            />
          ))}
        </ScrollView>

        <TouchableOpacity
          style={styles.banner}
          activeOpacity={0.85}
          onPress={() => navigation.navigate('CreateTrip')}
        >
          <View style={styles.bannerIcon}>
            <Ionicons name="people-outline" size={18} color={colors.primary} />
          </View>
          <View style={styles.bannerTextWrap}>
            <Text style={styles.bannerTitle}>خطط رحلتك مع أصدقائك</Text>
            <Text style={styles.bannerSubtitle}>ميزانية، جدول، ومحادثة جماعية بمكان واحد</Text>
          </View>
          <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    paddingBottom: spacing.xxl,
  },
  hero: {
    height: 220,
    marginHorizontal: spacing.lg,
    borderRadius: radius.lg,
    overflow: 'hidden',
    marginBottom: spacing.lg,
    justifyContent: 'flex-end',
  },
  heroImage: {
    borderRadius: radius.lg,
  },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  heroTextWrap: {
    padding: spacing.lg,
  },
  heroTitle: {
    color: colors.textOnPrimary,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'right',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
  },
  quickActions: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  quickAction: {
    flex: 1,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingVertical: spacing.md,
  },
  quickActionActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  quickActionText: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '700',
  },
  quickActionTextActive: {
    color: colors.textOnPrimary,
  },
  aiSearchBar: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.primary,
    borderRadius: radius.pill,
    marginHorizontal: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  aiInput: {
    flex: 1,
    color: colors.text,
    fontSize: 13,
  },
  destinationsRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.xl,
  },
  tripPreview: {
    height: 130,
    marginHorizontal: spacing.lg,
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.xl,
  },
  tripPreviewImage: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  tripPreviewTextWrap: {
    padding: spacing.md,
  },
  tripPreviewTitle: {
    color: colors.textOnPrimary,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'right',
  },
  tripPreviewSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  emptyTripCard: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    padding: spacing.lg,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary,
    borderStyle: 'dashed',
  },
  emptyTripText: {
    color: colors.primaryDark,
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  banner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginHorizontal: spacing.lg,
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
  },
  bannerIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.sm,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerTextWrap: {
    flex: 1,
  },
  bannerTitle: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  bannerSubtitle: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
});
