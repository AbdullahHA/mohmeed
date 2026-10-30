import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors, radius, spacing } from '../theme/colors';
import { checkInPeersByDestination } from '../data/checkInPeers';
import { useAppState } from '../context/AppState';
import { useContent } from '../context/ContentContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'DestinationDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList>;

const MONTH_NAMES = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export default function DestinationDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { currentUser, visitedStamps, toggleVisited, myCheckIn, checkIn, checkOut, sendGuideMessage } = useAppState();
  const { destinations } = useContent();
  const { requireAccount } = useRequireAccount();
  const destination = destinations.find((d) => d.id === route.params.destinationId);

  if (!destination) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الوجهة</Text>
      </SafeAreaView>
    );
  }

  const isVisited = visitedStamps.some((s) => s.destinationId === destination.id);
  const isCheckedInHere = myCheckIn === destination.id;
  const nearbyPeers = checkInPeersByDestination[destination.id] ?? [];
  const bestMonthsLabel = destination.bestMonths.map((m) => MONTH_NAMES[m - 1]).join('، ');

  const askGuide = () => {
    sendGuideMessage(`وش أفضل وقت وأماكن أزورها في ${destination.name}؟`);
    navigation.navigate('GuideChat');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={destination.image} style={styles.image} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.stampButton, isVisited && styles.stampButtonActive]}
            onPress={() => requireAccount('visited', () => toggleVisited(destination.id))}
            activeOpacity={0.85}
          >
            <Ionicons
              name={isVisited ? 'checkmark-circle' : 'ribbon-outline'}
              size={16}
              color={isVisited ? colors.textOnPrimary : colors.text}
            />
            <Text style={[styles.stampButtonText, isVisited && styles.stampButtonTextActive]}>
              {isVisited ? 'زرتها' : 'أضفها لأماكن زرتها'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.body}>
          <Text style={styles.name}>{destination.name}</Text>
          <Text style={styles.tagline}>{destination.tagline}</Text>

          <View style={styles.monthsRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.primary} />
            <Text style={styles.monthsText}>أفضل وقت للزيارة: {bestMonthsLabel}</Text>
          </View>

          <Text style={styles.whyVisit}>{destination.whyVisit}</Text>

          <Text style={styles.sectionTitle}>فنادق مقترحة</Text>
          <View style={styles.listCard}>
            {destination.topHotels.map((hotel) => (
              <View key={hotel} style={styles.listRow}>
                <Ionicons name="bed-outline" size={16} color={colors.primary} />
                <Text style={styles.listText}>{hotel}</Text>
              </View>
            ))}
          </View>

          <Text style={styles.sectionTitle}>مطاعم مقترحة</Text>
          <View style={styles.listCard}>
            {destination.topRestaurants.map((restaurant) => (
              <View key={restaurant} style={styles.listRow}>
                <Ionicons name="restaurant-outline" size={16} color={colors.primary} />
                <Text style={styles.listText}>{restaurant}</Text>
              </View>
            ))}
          </View>

          <View style={styles.checkInCard}>
            <View style={styles.checkInHeader}>
              <Text style={styles.sectionTitle}>مسافرين هنا الحين</Text>
              <Text style={styles.checkInDemo}>تجربة محلية فقط</Text>
            </View>
            {nearbyPeers.length === 0 && !isCheckedInHere ? (
              <Text style={styles.checkInEmpty}>محد متشك إن هنا حاليًا</Text>
            ) : (
              <View style={styles.checkInPeersRow}>
                {isCheckedInHere ? (
                  <View style={styles.checkInPeer}>
                    <View style={[styles.checkInAvatar, { backgroundColor: currentUser.color }]}>
                      <Text style={styles.checkInEmoji}>{currentUser.emoji}</Text>
                    </View>
                    <Text style={styles.checkInName}>أنت</Text>
                  </View>
                ) : null}
                {nearbyPeers.map((peer) => (
                  <View key={peer.id} style={styles.checkInPeer}>
                    <View style={[styles.checkInAvatar, { backgroundColor: peer.color }]}>
                      <Text style={styles.checkInEmoji}>{peer.emoji}</Text>
                    </View>
                    <Text style={styles.checkInName}>{peer.name}</Text>
                  </View>
                ))}
              </View>
            )}
            <TouchableOpacity
              style={[styles.checkInButton, isCheckedInHere && styles.checkInButtonActive]}
              activeOpacity={0.85}
              onPress={() =>
                isCheckedInHere ? checkOut() : requireAccount('checkIn', () => checkIn(destination.id))
              }
            >
              <Ionicons
                name={isCheckedInHere ? 'close-circle-outline' : 'location-outline'}
                size={15}
                color={isCheckedInHere ? colors.primaryDark : colors.textOnPrimary}
              />
              <Text style={[styles.checkInButtonText, isCheckedInHere && styles.checkInButtonTextActive]}>
                {isCheckedInHere ? 'إلغاء التشك إن' : 'تشك إن هنا'}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPrimary]}
              activeOpacity={0.85}
              onPress={() =>
                requireAccount('trip', () => navigation.navigate('CreateTrip', { destinationId: destination.id }))
              }
            >
              <Ionicons name="add-circle-outline" size={16} color={colors.textOnPrimary} />
              <Text style={styles.actionPrimaryText}>خطط رحلة لهذي الوجهة</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionButton} activeOpacity={0.85} onPress={askGuide}>
              <Ionicons name="chatbubble-outline" size={16} color={colors.text} />
              <Text style={styles.actionText}>اسأل الدليل</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  notFound: { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xxl },
  imageWrap: { width: '100%', height: 240 },
  image: { width: '100%', height: '100%' },
  backButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    width: 38,
    height: 38,
    borderRadius: radius.pill,
    backgroundColor: colors.overlay,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stampButton: {
    position: 'absolute',
    top: spacing.xl,
    left: spacing.lg,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.overlay,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  stampButtonActive: {
    backgroundColor: colors.primary,
  },
  stampButtonText: { color: colors.textOnPrimary, fontSize: 11, fontWeight: '700' },
  stampButtonTextActive: { color: colors.textOnPrimary },
  body: { padding: spacing.xl },
  name: { color: colors.text, fontSize: 24, fontWeight: '800', textAlign: 'right' },
  tagline: { color: colors.textMuted, fontSize: 14, textAlign: 'right', marginTop: 4, marginBottom: spacing.md },
  monthsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    alignSelf: 'flex-end',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.pill,
    marginBottom: spacing.lg,
  },
  monthsText: { color: colors.primaryDark, fontSize: 12.5, fontWeight: '700' },
  whyVisit: { color: colors.text, fontSize: 14, lineHeight: 22, textAlign: 'right', marginBottom: spacing.xl },
  sectionTitle: { color: colors.text, fontSize: 15, fontWeight: '700', textAlign: 'right', marginBottom: spacing.sm },
  listCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  listRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  listText: { color: colors.text, fontSize: 13, textAlign: 'right', flex: 1 },
  actionsRow: { flexDirection: 'row-reverse', gap: spacing.md, marginTop: spacing.sm },
  actionButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  actionPrimary: { backgroundColor: colors.primary, borderColor: colors.primary, flex: 1, justifyContent: 'center' },
  actionPrimaryText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 13 },
  actionText: { color: colors.text, fontWeight: '600', fontSize: 13 },
  checkInCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.lg,
  },
  checkInHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  checkInDemo: { color: colors.textFaint, fontSize: 10, fontWeight: '600' },
  checkInEmpty: { color: colors.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: spacing.sm },
  checkInPeersRow: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing.md,
  },
  checkInPeer: { alignItems: 'center', width: 52 },
  checkInAvatar: {
    width: 40,
    height: 40,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 2,
  },
  checkInEmoji: { fontSize: 17 },
  checkInName: { color: colors.textMuted, fontSize: 10, fontWeight: '600', textAlign: 'center' },
  checkInButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
  },
  checkInButtonActive: {
    backgroundColor: colors.primarySoft,
    borderWidth: 1,
    borderColor: colors.primary,
  },
  checkInButtonText: { color: colors.textOnPrimary, fontSize: 12, fontWeight: '700' },
  checkInButtonTextActive: { color: colors.primaryDark },
});
