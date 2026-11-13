import React, { useEffect, useMemo, useState } from 'react';
import {
  SafeAreaView,
  View,
  Image,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Text from '../components/Text';
import { Alert } from '../lib/alert';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import { fontSize, radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { useAppState } from '../context/AppState';
import { useAuth } from '../context/AuthContext';
import { useRequireAccount } from '../hooks/useRequireAccount';
import PersonAvatar from '../components/PersonAvatar';
import RtlScrollRow from '../components/RtlScrollRow';
import { VENUE_CATEGORY_ICON, VENUE_CATEGORY_LABEL } from '../utils/venueCategory';
import { pickAndUploadCheckInPhoto } from '../lib/checkInPhoto';
import type { CheckInRecord } from '../types';
import type { RootStackParamList } from '../navigation/types';

const NOTE_MAX = 160;

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Route = RouteProp<RootStackParamList, 'CheckInVenue'>;

export default function CheckInVenueScreen() {
  const navigation = useNavigation<Nav>();
  const { params } = useRoute<Route>();
  const { venue } = params;
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { loadVenueCheckIns, checkInToVenue, friends } = useAppState();
  const { profile } = useAuth();
  const { requireAccount } = useRequireAccount();
  const [peers, setPeers] = useState<CheckInRecord[]>([]);
  const [peersLoading, setPeersLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isPrivate, setIsPrivate] = useState(false);
  const [note, setNote] = useState('');
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [taggedIds, setTaggedIds] = useState<string[]>([]);

  const mayor = useMemo(() => {
    if (peers.length === 0) return null;
    const counts = new Map<string, { user: CheckInRecord['user']; count: number; lastVisit: number }>();
    for (const p of peers) {
      if (!p.user) continue;
      const entry = counts.get(p.user.id);
      if (entry) {
        entry.count += 1;
        entry.lastVisit = Math.max(entry.lastVisit, p.createdAt);
      } else {
        counts.set(p.user.id, { user: p.user, count: 1, lastVisit: p.createdAt });
      }
    }
    const ranked = [...counts.values()].sort((a, b) => b.count - a.count || b.lastVisit - a.lastVisit);
    return ranked[0] && ranked[0].count > 1 ? ranked[0] : null;
  }, [peers]);

  const myVisitCount = useMemo(
    () => (profile ? peers.filter((p) => p.user?.id === profile.id).length : 0),
    [peers, profile]
  );

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

  const handlePickPhoto = async () => {
    if (!profile || uploadingPhoto) return;
    setUploadingPhoto(true);
    try {
      const url = await pickAndUploadCheckInPhoto(profile.id);
      if (url) setPhotoUrl(url);
    } catch {
      Alert.alert('تعذّر رفع الصورة', 'حاول مرة ثانية.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const toggleTag = (friendId: string) => {
    setTaggedIds((prev) => (prev.includes(friendId) ? prev.filter((id) => id !== friendId) : [...prev, friendId]));
  };

  const handleCheckIn = () => {
    requireAccount('checkIn', async () => {
      setSubmitting(true);
      const { error } = await checkInToVenue(venue, isPrivate, { note: note.trim(), photoUrl, taggedIds });
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

      <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.venueCard}>
          <View style={styles.venueIcon}>
            <Ionicons name={VENUE_CATEGORY_ICON[venue.category]} size={26} color={colors.primary} />
          </View>
          <Text style={styles.venueName}>{venue.name}</Text>
          <Text style={styles.venueMeta}>{VENUE_CATEGORY_LABEL[venue.category]}</Text>
          {venue.address ? <Text style={styles.venueAddress}>{venue.address}</Text> : null}
          {mayor ? (
            <View style={styles.mayorBadge}>
              <Ionicons name="trophy" size={14} color={colors.accentDark} />
              <Text style={styles.mayorBadgeText}>
                عمدة المكان: {mayor.user?.name ?? 'مستخدم'} ({mayor.count} تسجيلات)
              </Text>
            </View>
          ) : null}
          {myVisitCount > 0 ? (
            <Text style={styles.myVisitsText}>زرت هذا المكان {myVisitCount} {myVisitCount === 1 ? 'مرة' : 'مرات'}</Text>
          ) : null}
        </View>

        <TextInput
          style={styles.noteInput}
          placeholder="شو أخبارك؟"
          placeholderTextColor={colors.textFaint}
          value={note}
          onChangeText={(t) => setNote(t.slice(0, NOTE_MAX))}
          multiline
          textAlign="right"
        />
        <Text style={styles.noteCounter}>{note.length}/{NOTE_MAX}</Text>

        {photoUrl ? (
          <View style={styles.photoPreviewWrap}>
            <Image source={{ uri: photoUrl }} style={styles.photoPreview} resizeMode="cover" />
            <TouchableOpacity style={styles.photoRemoveButton} onPress={() => setPhotoUrl(null)} hitSlop={8}>
              <Ionicons name="close-circle" size={22} color={colors.text} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.addPhotoButton} activeOpacity={0.8} onPress={handlePickPhoto} disabled={uploadingPhoto}>
            {uploadingPhoto ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="add" size={16} color={colors.text} />
                <Text style={styles.addPhotoText}>أضف صورة</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {friends.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>تحقّق مع</Text>
            <RtlScrollRow contentContainerStyle={styles.friendsRow}>
              {friends.map((f) => {
                const tagged = taggedIds.includes(f.id);
                return (
                  <TouchableOpacity
                    key={f.id}
                    style={styles.friendChip}
                    activeOpacity={0.8}
                    onPress={() => toggleTag(f.id)}
                  >
                    <View style={[styles.friendAvatarWrap, tagged && styles.friendAvatarWrapActive]}>
                      <PersonAvatar avatarUrl={f.avatarUrl} size={48} />
                      {tagged ? (
                        <View style={styles.friendCheckBadge}>
                          <Ionicons name="checkmark" size={12} color={colors.textOnPrimary} />
                        </View>
                      ) : null}
                    </View>
                    <Text style={styles.friendChipName} numberOfLines={1}>{f.name}</Text>
                  </TouchableOpacity>
                );
              })}
            </RtlScrollRow>
          </>
        ) : null}

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
                <View style={styles.peerTextWrap}>
                  <Text style={styles.peerName}>{peer.user?.name ?? 'مستخدم'}</Text>
                  {peer.note ? <Text style={styles.peerNote} numberOfLines={1}>{peer.note}</Text> : null}
                </View>
                {peer.photoUrl ? (
                  <Image source={{ uri: peer.photoUrl }} style={styles.peerPhoto} resizeMode="cover" />
                ) : null}
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.privateRow}>
          <Switch
            value={isPrivate}
            onValueChange={setIsPrivate}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
          <View style={styles.privateTextWrap}>
            <Text style={styles.privateLabel}>تسجيل وصول خاص</Text>
            <Text style={styles.privateHint}>ما يشوفه أصدقاؤك، بس يبقى بسجلك إنت</Text>
          </View>
        </View>
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
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerTitle: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700' },
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
  venueName: { color: colors.text, fontSize: fontSize.subtitle, fontWeight: '700', textAlign: 'center' },
  venueMeta: { color: colors.primary, fontSize: fontSize.base, fontWeight: '600', marginTop: 4 },
  venueAddress: { color: colors.textMuted, fontSize: fontSize.base, textAlign: 'center', marginTop: spacing.xs },
  mayorBadge: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.accentSoft,
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    marginTop: spacing.sm,
  },
  mayorBadgeText: { color: colors.accentDark, fontSize: fontSize.base, fontWeight: '700' },
  myVisitsText: { color: colors.textMuted, fontSize: fontSize.base, marginTop: spacing.xs },
  sectionTitle: { color: colors.text, fontSize: fontSize.bodyLg, fontWeight: '700', textAlign: 'right', marginBottom: spacing.sm },
  emptyPeers: { color: colors.textFaint, fontSize: fontSize.base, textAlign: 'center', paddingVertical: spacing.lg },
  peersList: { gap: spacing.sm },
  peerRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: spacing.sm },
  peerTextWrap: { flex: 1 },
  peerName: { color: colors.text, fontSize: fontSize.body, fontWeight: '600' },
  peerNote: { color: colors.textMuted, fontSize: fontSize.base, marginTop: 2, textAlign: 'right' },
  peerPhoto: { width: 40, height: 40, borderRadius: radius.sm, backgroundColor: colors.surfaceAlt },
  noteInput: {
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    color: colors.text,
    fontSize: fontSize.bodyLg,
    textAlign: 'right',
    minHeight: 72,
    marginBottom: 2,
  },
  noteCounter: { color: colors.textFaint, fontSize: fontSize.small, textAlign: 'left', marginBottom: spacing.md },
  addPhotoButton: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.pill,
    paddingVertical: spacing.sm,
    marginBottom: spacing.lg,
  },
  addPhotoText: { color: colors.text, fontSize: fontSize.body, fontWeight: '600' },
  photoPreviewWrap: { marginBottom: spacing.lg },
  photoPreview: { width: '100%', height: 160, borderRadius: radius.md, backgroundColor: colors.surfaceAlt },
  photoRemoveButton: {
    position: 'absolute',
    top: spacing.xs,
    left: spacing.xs,
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
  },
  friendsRow: { flexDirection: 'row-reverse', gap: spacing.md, paddingBottom: spacing.lg },
  friendChip: { alignItems: 'center', width: 60 },
  friendAvatarWrap: { borderRadius: radius.pill, padding: 2 },
  friendAvatarWrapActive: { backgroundColor: colors.primarySoft, borderWidth: 2, borderColor: colors.primary },
  friendCheckBadge: {
    position: 'absolute',
    bottom: -2,
    left: -2,
    width: 18,
    height: 18,
    borderRadius: radius.pill,
    backgroundColor: colors.primary,
    borderWidth: 2,
    borderColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  friendChipName: { color: colors.text, fontSize: fontSize.small, fontWeight: '600', marginTop: 4, textAlign: 'center' },
  footer: {
    padding: spacing.lg,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  privateRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  privateTextWrap: { flex: 1 },
  privateLabel: { color: colors.text, fontSize: fontSize.body, fontWeight: '700', textAlign: 'right' },
  privateHint: { color: colors.textFaint, fontSize: fontSize.small, textAlign: 'right', marginTop: 2 },
  checkInButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  checkInButtonDisabled: { opacity: 0.6 },
  checkInButtonText: { color: colors.textOnPrimary, fontWeight: '700', fontSize: fontSize.bodyLg },
});
