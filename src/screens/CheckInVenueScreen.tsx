import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Text from '../components/Text';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useRequireAccount } from '../hooks/useRequireAccount';
import PersonAvatar from '../components/PersonAvatar';
import { VENUE_CATEGORY_ICON, VENUE_CATEGORY_LABEL } from '../utils/venueCategory';
import type { CheckInRecord } from '../types';
import type { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CheckInVenue'>;

export default function CheckInVenueScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { venue } = params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { loadVenueCheckIns, checkInToVenue } = useAppState();
  const { requireAccount } = useRequireAccount();
  const [peers, setPeers] = useState<CheckInRecord[]>([]);
  const [peersLoading, setPeersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let active = true;
    loadVenueCheckIns(venue.id).then((list) => {
      if (active) {
        setPeers(list);
        setPeersLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [venue.id]);

  const handleCheckIn = () => {
    requireAccount('checkIn', async () => {
      setSubmitting(true);
      const { error } = await checkInToVenue(venue);
      setSubmitting(false);
      if (error) {
        Alert.alert('تعذّر تسجيل الوصول', error);
        return;
      }
      Alert.alert('تم تسجيل الوصول', `سجّلت وصولك إلى ${venue.name}`, [
        { text: 'تمام', onPress: () => navigation.navigate('MyCheckIns') },
      ]);
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} activeOpacity={0.8}>
          <Ionicons name="chevron-forward" size={22} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>تسجيل الوصول</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.venueCard}>
          <View style={styles.venueIcon}>
            <Ionicons name={VENUE_CATEGORY_ICON[venue.category]} size={26} color={colors.primary} />
          </View>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueMeta}>{VENUE_CATEGORY_LABEL[venue.category]}</Text>
          {venue.address ? <Text style={styles.venueAddress}>{venue.address}</Text> : null}
        </View>

        <Text style={styles.sectionTitle}>من تشك هنا من أصدقائك</Text>
        {peersLoading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.lg }} />
        ) : peers.length === 0 ? (
          <Text style={styles.emptyPeers}>محد من أصدقائك تشك هنا لين الحين</Text>
        ) : (
          <View style={styles.peersList}>
            {peers.map((peer) => (
              <View key={peer.id} style={styles.peerRow}>
                <PersonAvatar avatarUrl={peer.user?.avatarUrl} size={36} />
                <Text style={styles.peerName}>{peer.user?.name ?? 'مستخدم'}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.checkInButton, submitting && styles.checkInButtonDisabled]}
          activeOpacity={0.85}
          disabled={submitting}
          onPress={handleCheckIn}
        >
          {submitting ? (
            <ActivityIndicator color={colors.textOnPrimary} />
          ) : (
            <Text style={styles.checkInButtonText}>تسجيل الوصول هنا</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
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
  body: { padding: spacing.lg },
  venueCard: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  venueIcon: {
    width: 56,
    height: 56,
    borderRadius: radius.pill,
    backgroundColor: colors.primarySoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  venueName: { color: colors.text, fontSize: 17, fontWeight: '700', textAlign: 'center' },
  venueMeta: { color: colors.primary, fontSize: 12, fontWeight: '600', marginTop: 4 },
  venueAddress: { color: colors.textMuted, fontSize: 12, textAlign: 'center', marginTop: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right', marginBottom: spacing.sm },
  emptyPeers: { color: colors.textFaint, fontSize: 12, textAlign: 'center', paddingVertical: spacing.lg },
  peersList: { gap: spacing.sm },
  peerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  peerName: { color: colors.text, fontSize: 13, fontWeight: '600' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  checkInButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  checkInButtonDisabled: { opacity: 0.6 },
  checkInButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: 14 },
});
