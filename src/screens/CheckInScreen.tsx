import React, { useState } from 'react';
import { SafeAreaView, View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import TopBar from '../components/TopBar';
import AvatarStack from '../components/AvatarStack';
import { colors, radius, spacing } from '../theme/colors';
import { placesByCity, type Place } from '../data/places';

const NEARBY_PLACES: Place[] = placesByCity('riyadh');

const WHOS_HERE = [
  { id: '1', name: 'ريم', initial: 'ر' },
  { id: '2', name: 'فهد', initial: 'ف' },
  { id: '3', name: 'لينا', initial: 'ل' },
];

export default function CheckInScreen() {
  const [selected, setSelected] = useState<Place | null>(null);
  const [checkedInAt, setCheckedInAt] = useState<string | null>(null);

  const selectPlace = (place: Place) => {
    setSelected(place);
    setCheckedInAt(null);
  };

  const confirmCheckIn = () => {
    const now = new Date();
    setCheckedInAt(
      now.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' }),
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <TopBar title="وصلت" subtitle="سجّل وصولك وخلّي أصدقاءك يعرفون وينك" />

      {selected ? (
        <View style={styles.selectedCard}>
          <TouchableOpacity style={styles.backRow} onPress={() => setSelected(null)} activeOpacity={0.7}>
            <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            <Text style={styles.backText}>رجوع للأماكن القريبة</Text>
          </TouchableOpacity>

          <Text style={styles.placeName}>{selected.name}</Text>

          <View style={styles.whosHereRow}>
            <AvatarStack friends={WHOS_HERE} />
            <Text style={styles.whosHereText}>{WHOS_HERE.length} من أصدقائك هنا الآن</Text>
          </View>

          {checkedInAt ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle" size={22} color={colors.success} />
              <Text style={styles.successText}>وصلت إلى {selected.name} الساعة {checkedInAt}</Text>
              <TouchableOpacity style={styles.shareButton} activeOpacity={0.85}>
                <Ionicons name="share-social-outline" size={16} color={colors.primary} />
                <Text style={styles.shareText}>مشاركة مع أصدقائي</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity style={styles.checkInButton} activeOpacity={0.85} onPress={confirmCheckIn}>
              <Ionicons name="navigate" size={18} color={colors.onPrimary} />
              <Text style={styles.checkInText}>تسجيل الوصول هنا</Text>
            </TouchableOpacity>
          )}
        </View>
      ) : (
        <FlatList
          data={NEARBY_PLACES}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={<Text style={styles.listHeader}>قريب منك الآن</Text>}
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.nearbyRow} activeOpacity={0.85} onPress={() => selectPlace(item)}>
              <View style={styles.nearbyIcon}>
                <Ionicons name="location" size={16} color={colors.primary} />
              </View>
              <View style={styles.nearbyTextWrap}>
                <Text style={styles.nearbyName}>{item.name}</Text>
                <Text style={styles.nearbyMeta}>⭐ {item.rating.toFixed(1)}</Text>
              </View>
              <Ionicons name="chevron-back" size={18} color={colors.textMuted} />
            </TouchableOpacity>
          )}
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
  list: {
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  listHeader: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  nearbyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  nearbyIcon: {
    width: 36,
    height: 36,
    borderRadius: radius.pill,
    backgroundColor: colors.surfaceAlt,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nearbyTextWrap: {
    flex: 1,
  },
  nearbyName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  nearbyMeta: {
    color: colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    marginTop: 2,
  },
  selectedCard: {
    marginHorizontal: spacing.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.xl,
  },
  backRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginBottom: spacing.lg,
  },
  backText: {
    color: colors.textMuted,
    fontSize: 13,
  },
  placeName: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
    textAlign: 'right',
    marginBottom: spacing.lg,
  },
  whosHereRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.xl,
  },
  whosHereText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  checkInButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
  },
  checkInText: {
    color: colors.onPrimary,
    fontSize: 15,
    fontWeight: '700',
  },
  successBox: {
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  successText: {
    color: colors.text,
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'center',
  },
  shareButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
  },
  shareText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
