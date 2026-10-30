import React from 'react';
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import TopBar from '../components/TopBar';
import EmptyState from '../components/EmptyState';
import { colors, radius, spacing } from '../theme/colors';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TripsScreen() {
  const navigation = useNavigation<Nav>();
  const { trips } = useAppState();
  const { requireAccount } = useRequireAccount();

  return (
    <SafeAreaView style={styles.container}>
      <TopBar />

      <View style={styles.headerRow}>
        <Text style={styles.headerTitle}>رحلاتي</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.joinButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('trip', () => navigation.navigate('JoinTrip'))}
          >
            <Ionicons name="key-outline" size={16} color={colors.primary} />
            <Text style={styles.joinButtonText}>لدي رمز دعوة</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.newButton}
            activeOpacity={0.85}
            onPress={() => requireAccount('trip', () => navigation.navigate('CreateTrip'))}
          >
            <Ionicons name="add" size={16} color={colors.textOnPrimary} />
            <Text style={styles.newButtonText}>رحلة جديدة</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity
        style={styles.templatesBanner}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('TripTemplates')}
      >
        <Ionicons name="chevron-back" size={14} color={colors.primary} />
        <Text style={styles.templatesBannerText}>تصفح قوالب رحلات جاهزة من مسافرين ثانين</Text>
        <Ionicons name="document-text-outline" size={16} color={colors.primary} />
      </TouchableOpacity>

      {trips.length === 0 ? (
        <EmptyState
          icon="airplane-outline"
          title="لا توجد رحلات مخططة بعد"
          subtitle="ابدأ بتخطيط رحلتك القادمة مع أصدقائك وستظهر هنا مع الميزانية والجدول."
        />
      ) : (
        <FlatList
          data={trips}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const spent = item.budgetItems.reduce((sum, b) => sum + b.amount, 0);
            return (
              <TouchableOpacity
                style={styles.card}
                activeOpacity={0.85}
                onPress={() => navigation.navigate('TripDetail', { tripId: item.id })}
              >
                <ImageBackground
                  source={item.coverImage}
                  style={styles.cardImage}
                  imageStyle={styles.cardImageRadius}
                >
                  <View style={styles.cardOverlay} />
                  <View style={styles.cardTextWrap}>
                    <Text style={styles.cardTitle}>{item.title}</Text>
                    <Text style={styles.cardSubtitle}>
                      {item.startDate} → {item.endDate}
                    </Text>
                  </View>
                </ImageBackground>
                <View style={styles.cardFooter}>
                  <Text style={styles.cardFooterText}>
                    {item.memberIds.length} أشخاص · {spent.toLocaleString()} / {item.budgetTotal.toLocaleString()} ر.س
                  </Text>
                  <Ionicons name="chevron-back" size={16} color={colors.textMuted} />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  headerRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  headerActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
  },
  templatesBanner: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.primarySoft,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  templatesBannerText: { color: colors.primaryDark, fontSize: 12, fontWeight: '600', flex: 1, textAlign: 'right' },
  joinButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: colors.primarySoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  joinButtonText: {
    color: colors.primaryDark,
    fontSize: 12,
    fontWeight: '700',
  },
  newButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  newButtonText: {
    color: colors.textOnPrimary,
    fontSize: 12,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: 120,
  },
  card: {
    borderRadius: radius.md,
    overflow: 'hidden',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  cardImage: {
    height: 140,
    justifyContent: 'flex-end',
  },
  cardImageRadius: {},
  cardOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: colors.overlay,
  },
  cardTextWrap: {
    padding: spacing.md,
  },
  cardTitle: {
    color: colors.textOnPrimary,
    fontSize: 17,
    fontWeight: '700',
    textAlign: 'right',
  },
  cardSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  cardFooterText: {
    color: colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
});
