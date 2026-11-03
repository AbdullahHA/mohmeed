import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  StyleSheet,
  ScrollView,
  Switch,
} from 'react-native';
import Text from './Text';
import { Ionicons } from '@expo/vector-icons';
import { radius, spacing, type ThemeColors } from '../theme/colors';
import { useTheme } from '../context/ThemeContext';
import { supabase } from '../lib/supabase';
import PersonAvatar from './PersonAvatar';
import DayPicker, { tripDateRange, formatIsoDate } from './DayPicker';
import SlotPicker, { SLOT_LABELS } from './SlotPicker';
import type { Trip, ItinerarySlot } from '../types';

type MemberProfile = { id: string; name: string; avatarUrl: string | null };

type Props = {
  visible: boolean;
  placeName: string;
  isRestaurant: boolean;
  trips: Trip[];
  onClose: () => void;
  onAdd: (trip: Trip, day: string | null, slot: ItinerarySlot | null, notifyGroup: boolean) => void;
  onNewTrip: () => void;
};

function nearestUpcomingTripId(trips: Trip[]): string | null {
  const today = formatIsoDate(new Date());
  const withRealDates = trips.filter((t) => /^\d{4}-\d{2}-\d{2}$/.test(t.startDate) && t.startDate >= today);
  if (withRealDates.length > 0) {
    return withRealDates.sort((a, b) => a.startDate.localeCompare(b.startDate))[0].id;
  }
  return trips[0]?.id ?? null;
}

export default function AddToTripSheet({ visible, placeName, isRestaurant, trips, onClose, onAdd, onNewTrip }: Props) {
  const { colors } = useTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const [selectedTripId, setSelectedTripId] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<ItinerarySlot | null>(null);
  const [notifyGroup, setNotifyGroup] = useState(true);
  const [members, setMembers] = useState<MemberProfile[]>([]);

  useEffect(() => {
    if (visible) {
      const defaultId = nearestUpcomingTripId(trips);
      setSelectedTripId(defaultId);
      setSelectedDay(null);
      setSelectedSlot(null);
      setNotifyGroup(true);
    }
  }, [visible]);

  const selectedTrip = trips.find((t) => t.id === selectedTripId) ?? null;
  const tripDays = selectedTrip ? tripDateRange(selectedTrip.startDate, selectedTrip.endDate) : [];

  useEffect(() => {
    if (!selectedTrip || selectedTrip.memberIds.length === 0) {
      setMembers([]);
      return;
    }
    let cancelled = false;
    supabase
      .from('profiles')
      .select('id,name,avatar_url')
      .in('id', selectedTrip.memberIds)
      .then(({ data }) => {
        if (cancelled) return;
        setMembers((data ?? []).map((r: any) => ({ id: r.id, name: r.name, avatarUrl: r.avatar_url ?? null })));
      });
    return () => {
      cancelled = true;
    };
  }, [selectedTrip?.id, selectedTrip?.memberIds.join(',')]);

  const dayLabel = useMemo(() => {
    if (!selectedDay) return null;
    const date = new Date(selectedDay + 'T00:00:00');
    const WEEKDAY = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return WEEKDAY[date.getDay()];
  }, [selectedDay]);

  const slotLabel = selectedSlot ? SLOT_LABELS[selectedSlot] : null;
  const buttonLabel = [dayLabel, slotLabel].filter(Boolean).join(' · ');

  const handleSubmit = () => {
    if (!selectedTrip) return;
    onAdd(selectedTrip, selectedDay, selectedSlot, notifyGroup && members.length > 1);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.headerRow}>
            <Pressable onPress={onClose} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textMuted} />
            </Pressable>
            <View style={styles.headerTextWrap}>
              <Text style={styles.title}>أضف "{placeName}" لرحلتك</Text>
              <Text style={styles.subtitle}>عشان يطلع في جدولك ويذكّرك فيه</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} style={styles.scroll}>
            <Text style={styles.sectionLabel}>أي رحلة؟</Text>
            <View style={styles.tripList}>
              {trips.map((trip) => {
                const active = trip.id === selectedTripId;
                return (
                  <Pressable
                    key={trip.id}
                    style={[styles.tripRow, active && styles.tripRowActive]}
                    onPress={() => {
                      setSelectedTripId(trip.id);
                      setSelectedDay(null);
                      setSelectedSlot(null);
                    }}
                  >
                    <Ionicons
                      name={active ? 'radio-button-on' : 'radio-button-off'}
                      size={18}
                      color={active ? colors.primary : colors.textFaint}
                    />
                    <View style={styles.tripRowTextWrap}>
                      <Text style={styles.tripRowTitle}>{trip.title}</Text>
                      <Text style={styles.tripRowMeta}>
                        {trip.destination} · {trip.startDate} → {trip.endDate}
                      </Text>
                    </View>
                  </Pressable>
                );
              })}
              <Pressable style={styles.newTripRow} onPress={onNewTrip}>
                <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
                <Text style={styles.newTripText}>رحلة جديدة</Text>
              </Pressable>
            </View>

            {selectedTrip ? (
              <>
                <Text style={styles.sectionLabel}>اليوم</Text>
                {tripDays.length > 0 ? (
                  <DayPicker days={tripDays} selected={selectedDay} onSelect={setSelectedDay} />
                ) : (
                  <Text style={styles.noDaysHint}>هذي الرحلة بدون تواريخ محددة — بينضاف بدون يوم</Text>
                )}

                <Text style={styles.sectionLabel}>الوقت</Text>
                <SlotPicker value={selectedSlot} onChange={setSelectedSlot} variant={isRestaurant ? 'meal' : 'time'} />

                {members.length > 1 ? (
                  <View style={styles.notifyRow}>
                    <Switch value={notifyGroup} onValueChange={setNotifyGroup} />
                    <View style={styles.notifyTextWrap}>
                      <Text style={styles.notifyTitle}>خبّر الشلة</Text>
                      <View style={styles.memberFaces}>
                        {members.slice(0, 5).map((m) => (
                          <PersonAvatar key={m.id} avatarUrl={m.avatarUrl} size={22} />
                        ))}
                      </View>
                    </View>
                  </View>
                ) : null}
              </>
            ) : null}
          </ScrollView>

          <Pressable
            style={[styles.submitButton, !selectedTrip && styles.submitDisabled]}
            disabled={!selectedTrip}
            onPress={handleSubmit}
          >
            <Text style={styles.submitText}>{buttonLabel ? `أضف لـ${buttonLabel}` : 'أضف للرحلة'}</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const createStyles = (colors: ThemeColors) => StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: colors.overlay, justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: radius.sheet,
    borderTopRightRadius: radius.sheet,
    padding: spacing.lg,
    maxHeight: '85%',
  },
  headerRow: { flexDirection: 'row-reverse', alignItems: 'flex-start', gap: spacing.sm, marginBottom: spacing.md },
  headerTextWrap: { flex: 1 },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  subtitle: { color: colors.textMuted, fontSize: 12, textAlign: 'right', marginTop: 2 },
  scroll: { marginBottom: spacing.sm },
  sectionLabel: { color: colors.textMuted, fontSize: 12, fontWeight: '700', textAlign: 'right', marginTop: spacing.md, marginBottom: spacing.sm },
  tripList: { gap: spacing.sm },
  tripRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  tripRowActive: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
  tripRowTextWrap: { flex: 1 },
  tripRowTitle: { color: colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right' },
  tripRowMeta: { color: colors.textMuted, fontSize: 11, textAlign: 'right', marginTop: 2 },
  newTripRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: spacing.md,
  },
  newTripText: { color: colors.primary, fontSize: 13, fontWeight: '700' },
  noDaysHint: { color: colors.textMuted, fontSize: 12, textAlign: 'right' },
  notifyRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.surfaceAlt,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.md,
  },
  notifyTextWrap: { flex: 1, flexDirection: 'row-reverse', alignItems: 'center', justifyContent: 'space-between' },
  notifyTitle: { color: colors.text, fontSize: 13, fontWeight: '700' },
  memberFaces: { flexDirection: 'row-reverse', gap: -8 },
  submitButton: {
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  submitDisabled: { opacity: 0.5 },
  submitText: { color: colors.textOnPrimary, fontSize: 14, fontWeight: '700' },
});
