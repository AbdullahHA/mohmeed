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
import { destinations } from '../data/destinations';
import { useAppState } from '../context/AppState';
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
  const { sendGuideMessage } = useAppState();
  const destination = destinations.find((d) => d.id === route.params.destinationId);

  if (!destination) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.notFound}>لم يتم العثور على الوجهة</Text>
      </SafeAreaView>
    );
  }

  const bestMonthsLabel = destination.bestMonths.map((m) => MONTH_NAMES[m - 1]).join('، ');

  const askGuide = () => {
    sendGuideMessage(`وش أفضل وقت وأماكن أزورها في ${destination.name}؟`);
    navigation.navigate('GuideChat');
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.imageWrap}>
          <Image source={{ uri: destination.image }} style={styles.image} />
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
            activeOpacity={0.85}
          >
            <Ionicons name="arrow-forward" size={20} color={colors.textOnPrimary} />
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

          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[styles.actionButton, styles.actionPrimary]}
              activeOpacity={0.85}
              onPress={() => navigation.navigate('CreateTrip', { destinationId: destination.id })}
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
});
