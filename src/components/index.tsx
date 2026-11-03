/** مكوّنات خاصة بالتطبيق (فوق مكوّنات الواجهة العامة) */
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { addToTrip, sharePlace, quickReview, toggleLike, toggleSave } from '../data/actions';
import { useCity, useCol, useMap, useMeId, useMyTrips, useToday, useTripMembers, useUser } from '../data/selectors';
import type { Category, Place, Post, Slot, Trip, TripItem } from '../data/types';
import { MONTHS_SHORT, daysBetween, fmtRange, fmtTime, inDays, num, sar, timeAgo, weekday } from '../lib/format';
import { SLOT_LABEL, countdown, km, fmtKm, levelFor, openState, priceLabel, slotsFor, spent, tripDays, tripStatus, worldPercent } from '../lib/logic';
import { useAppTheme } from '../theme/ThemeProvider';
import { fixed, radius } from '../theme/tokens';
import { Avatar, Btn, Card, Chip, Faces, Field, HScroll, Icon, IconBtn, Photo, Pill, Progress, Row, Sheet, Stamp, Toggle, Txt, type IconName } from '../ui';
import { useSheets } from './sheets';

export const CATEGORIES: { key: Category; label: string; icon: IconName }[] = [
  { key: 'food', label: 'مطاعم', icon: 'restaurant-outline' },
  { key: 'cafe', label: 'كافيهات', icon: 'cafe-outline' },
  { key: 'events', label: 'فعاليات', icon: 'ticket-outline' },
  { key: 'experiences', label: 'تجارب', icon: 'sparkles-outline' },
  { key: 'hotels', label: 'فنادق', icon: 'bed-outline' },
  { key: 'landmarks', label: 'معالم', icon: 'business-outline' },
  { key: 'nature', label: 'طبيعة', icon: 'leaf-outline' },
  { key: 'shopping', label: 'تسوّق', icon: 'bag-handle-outline' },
];
export const catLabel = (c: Category) => CATEGORIES.find((x) => x.key === c)?.label ?? '';
export const catIcon = (c: Category) => CATEGORIES.find((x) => x.key === c)?.icon ?? 'location-outline';

/* ---------- الأماكن ---------- */
export function PlaceCardSmall({ place, reason, onPress }: { place: Place; reason?: string; onPress: () => void }) {
  const saved = useCol('saved');
  const me = useMeId();
  const isSaved = saved.some((s) => s.userId === me && s.placeId === place.id);
  return (
    <Pressable onPress={onPress} style={{ width: 200, gap: 8 }} accessibilityRole="button" accessibilityLabel={place.name}>
      <Photo uri={place.photo} scene={place.scene} icon={catIcon(place.category)} style={{ height: 150, borderRadius: radius.card }}>
        <View style={{ position: 'absolute', top: 8, start: 8 }}>
          <IconBtn name={isSaved ? 'heart' : 'heart-outline'} color={isSaved ? '#ff6b81' : '#fff'} label={isSaved ? 'شيل من المحفوظات' : 'احفظ'} variant="glass" size={32} onPress={() => toggleSave(place.id)} />
        </View>
        {reason ? (
          <View style={{ position: 'absolute', bottom: 8, end: 8, backgroundColor: 'rgba(255,255,255,0.94)', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 2 }}>
            <Txt variant="badge" style={{ color: '#141a2b' }}>
              {reason}
            </Txt>
          </View>
        ) : null}
        {place.sponsored ? <Chip label="مُموَّل" tone="glass" style={{ position: 'absolute', top: 10, end: 10 }} /> : null}
      </Photo>
      <Txt variant="bodyStrong" numberOfLines={1}>
        {place.name}
      </Txt>
      <Row gap={6}>
        <Rating value={place.rating} />
        <Txt variant="caption" tone="muted" numberOfLines={1}>
          · {place.kind} · {'$'.repeat(place.priceLevel)}
        </Txt>
      </Row>
    </Pressable>
  );
}

export function Rating({ value, count }: { value: number; count?: number }) {
  const { colors } = useAppTheme();
  return (
    <Row gap={3}>
      <Ionicons name="star" size={13} color={colors.gold} />
      <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }}>
        {value.toFixed(1)}
      </Txt>
      {count != null ? (
        <Txt variant="caption" tone="muted">
          ({count >= 1000 ? `${(count / 1000).toFixed(1)}K` : count})
        </Txt>
      ) : null}
    </Row>
  );
}

export function PlaceRow({ place, onPress, right, sub }: { place: Place; onPress: () => void; right?: React.ReactNode; sub?: string }) {
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={place.name} style={{ flexDirection: 'row', gap: 12, alignItems: 'center', minHeight: 72 }}>
      <Photo uri={place.photo} scene={place.scene} icon={catIcon(place.category)} style={{ width: 72, height: 72, borderRadius: 14 }} />
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        <Txt variant="bodyStrong" numberOfLines={1}>
          {place.name}
        </Txt>
        <Txt variant="caption" tone="muted" numberOfLines={1}>
          {sub ?? `${catLabel(place.category)} · ${place.eventDates ?? place.kind}`}
        </Txt>
        <Rating value={place.rating} />
      </View>
      {right}
    </Pressable>
  );
}

/** بطاقة النتائج الكبيرة (6) */
export function ResultCard({ place, onPress, origin }: { place: Place; onPress: () => void; origin?: { lat: number; lng: number } }) {
  const { colors } = useAppTheme();
  const me = useMeId();
  const saved = useCol('saved').some((s) => s.userId === me && s.placeId === place.id);
  const follows = useCol('follows');
  const reviews = useCol('reviews');
  const checkins = useCol('checkins');
  const users = useMap('users');
  const [photo, setPhoto] = useState(0);
  const friends = useMemo(() => {
    const following = new Set(follows.filter((f) => f.followerId === me).map((f) => f.followingId));
    const ids = new Set([...reviews.filter((r) => r.placeId === place.id).map((r) => r.userId), ...checkins.filter((c) => c.placeId === place.id).map((c) => c.userId)]);
    return [...ids].filter((id) => following.has(id)).map((id) => users.get(id)!).filter(Boolean);
  }, [follows, reviews, checkins, users, me, place.id]);
  const st = openState(place);
  const scenes = [place.scene, 'food', 'city', 'night'] as const;
  return (
    <View style={{ gap: 8 }}>
      <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={place.name}>
        <Photo uri={photo === 0 ? place.photo : null} scene={scenes[photo] as never} icon={catIcon(place.category)} style={{ height: 196, borderRadius: 20 }}>
          <View style={{ position: 'absolute', top: 10, start: 10 }}>
            <IconBtn name={saved ? 'heart' : 'heart-outline'} color={saved ? colors.heart : '#141a2b'} label={saved ? 'شيل من المحفوظات' : 'احفظ'} variant="plain" size={36} onPress={() => toggleSave(place.id)} />
          </View>
          {place.trending || place.sponsored ? <Chip label={place.sponsored ? 'مُموَّل' : 'رائج هالأسبوع'} tone="glass" style={{ position: 'absolute', top: 14, end: 12, backgroundColor: 'rgba(0,0,0,0.45)' }} /> : null}
          <Row gap={4} style={{ position: 'absolute', bottom: 10, alignSelf: 'center' }}>
            {[0, 1, 2, 3].map((i) => (
              <Pressable key={i} onPress={() => setPhoto(i)} hitSlop={8} accessibilityLabel={`صورة ${i + 1}`}>
                <View style={{ width: i === photo ? 16 : 6, height: 6, borderRadius: 4, backgroundColor: i === photo ? '#fff' : 'rgba(255,255,255,0.55)' }} />
              </Pressable>
            ))}
          </Row>
        </Photo>
      </Pressable>
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
          {[place.cuisine ?? place.kind, '$'.repeat(place.priceLevel), origin ? fmtKm(km(origin, place)) : null].filter(Boolean).join(' · ')}
        </Txt>
        <Rating value={place.rating} count={place.ratingCount} />
      </Row>
      <Txt variant="heading" style={{ fontSize: 16 }}>
        {place.name}
      </Txt>
      {friends.length ? (
        <Row gap={6}>
          <Faces people={friends} size={20} />
          <Txt variant="caption" tone="muted" numberOfLines={1} style={{ flex: 1 }}>
            {friends.slice(0, 2).map((f) => f.name.split(' ')[0]).join(' و')} {friends.length > 1 ? 'زاروه' : 'زاره'}
          </Txt>
        </Row>
      ) : null}
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View>
          <Txt variant="bodyStrong">{priceLabel(place)}</Txt>
          <Txt variant="caption" tone="muted">
            {place.avgMin ? 'متوسط السعر للشخص' : place.eventDates ?? ' '}
          </Txt>
        </View>
        <Chip tone={st.open ? 'success' : 'muted'} label={st.open ? `مفتوح · يقفل ${fmtTime(place.close)}` : `مقفل · يفتح ${fmtTime(place.open)}`} />
      </Row>
    </View>
  );
}

/* ---------- الرحلات ---------- */
export function TripCard({ trip, onPress, unread }: { trip: Trip; onPress: () => void; unread?: number }) {
  const city = useCity(trip.cityId);
  const members = useTripMembers(trip.id);
  const today = useToday();
  const expenses = useCol('expenses').filter((e) => e.tripId === trip.id);
  const tasks = useCol('checklist').filter((c) => c.tripId === trip.id);
  const st = tripStatus(trip, today);
  const cd = countdown(trip, today);
  const badge = st === 'draft' ? 'بدون تاريخ' : st === 'ongoing' ? 'الحين' : st === 'past' ? 'انتهت' : inDays(cd ?? 0);
  const sp = spent(expenses);
  const done = tasks.filter((t) => t.done).length;
  const me = useMeId();
  return (
    <Card padded={false} onPress={onPress} label={trip.title}>
      <Photo scene={trip.scene} scrim style={{ height: 150 }}>
        <View style={{ position: 'absolute', top: 12, end: 12 }}>
          <Chip label={badge} tone={st === 'draft' ? 'gold' : 'muted'} style={{ backgroundColor: st === 'draft' ? undefined : '#ffffff' }} />
        </View>
        <View style={{ position: 'absolute', bottom: 12, start: 14, end: 14 }}>
          <Txt variant="heading" tone="white">
            {trip.title}
          </Txt>
          <Txt variant="caption" tone="white">
            {trip.startDate ? `${fmtRange(trip.startDate, trip.endDate)} · ${daysBetween(trip.startDate, trip.endDate!) + 1} أيام` : city?.name}
          </Txt>
        </View>
      </Photo>
      <View style={{ padding: 14, gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Row gap={6}>
            <Faces people={members.map((m) => m.user)} size={22} />
            <Txt variant="caption" tone="muted">
              {members.length === 1 ? 'أنت بس' : `أنت و${members.length - 1} معك`}
            </Txt>
          </Row>
          {unread ? <Chip label={`${unread} رسائل`} /> : null}
        </Row>
        {st === 'draft' ? (
          <Card tone="gold" style={{ paddingVertical: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="bodyStrong" tone="goldInk" style={{ fontSize: 13, flex: 1 }}>
                {trip.datesMode === 'vote' ? 'الشلة تصوّت على التواريخ' : 'حدد التواريخ عشان نقترح لك جدول'}
              </Txt>
              <Icon name="chevron-back" size={16} />
            </Row>
          </Card>
        ) : null}
        {st !== 'past' ? (
          <Row gap={12}>
            <View style={{ flex: 1, gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt variant="caption" tone="muted">
                  الميزانية
                </Txt>
                <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }}>
                  {num(sp)} / {num(trip.plannedBudget)}
                </Txt>
              </Row>
              <Progress value={trip.plannedBudget ? sp / trip.plannedBudget : 0} tone="auto" />
            </View>
            <View style={{ flex: 1, gap: 4 }}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt variant="caption" tone="muted">
                  التجهيز
                </Txt>
                <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }}>
                  {done} / {tasks.length}
                </Txt>
              </Row>
              <Progress value={tasks.length ? done / tasks.length : 0} tone="success" />
            </View>
          </Row>
        ) : null}
        {sp > trip.plannedBudget && trip.plannedBudget > 0 && st !== 'past' ? (
          <Row gap={6}>
            <Icon name="warning-outline" size={14} />
            <Txt variant="caption" tone="destructive">
              تجاوزت الميزانية بـ {sar(sp - trip.plannedBudget)}
            </Txt>
          </Row>
        ) : null}
      </View>
    </Card>
  );
}

export function ItineraryItem({ item, onPress, onMore }: { item: TripItem; onPress?: () => void; onMore?: () => void }) {
  const places = useMap('places');
  const users = useMap('users');
  const me = useMeId();
  const p = item.placeId ? places.get(item.placeId) : undefined;
  const by = users.get(item.addedBy);
  const who = item.via === 'poll' ? 'اختارته الشلة بالتصويت' : item.via === 'guide' ? 'اقترحه الدليل' : item.via === 'doc' ? 'من مستنداتي' : item.addedBy === me ? 'أضفته أنت' : `أضافه ${by?.name.split(' ')[0] ?? ''}`;
  const closed = p && item.time ? !openState(p, timeAsDate(item.time)).open : false;
  return (
    <Card padded={false} onPress={onPress} label={p?.name ?? item.title}>
      <Row gap={10} style={{ padding: 8 }}>
        {p ? <Photo uri={p.photo} scene={p.scene} icon={catIcon(p.category)} style={{ width: 56, height: 56, borderRadius: 12 }} /> : (
          <View style={{ width: 56, height: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="document-text-outline" size={22} />
          </View>
        )}
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt variant="bodyStrong" numberOfLines={1}>
            {p?.name ?? item.title}
          </Txt>
          <Txt variant="caption" tone={closed ? 'goldInk' : 'muted'} numberOfLines={1}>
            {[item.time ? fmtTime(item.time) : null, p ? catLabel(p.category) : null, closed ? 'مقفل وقتها' : p?.bestTime ? `أحلى وقت: ${p.bestTime}` : null].filter(Boolean).join(' · ')}
          </Txt>
          <Row gap={4}>
            {by ? <View style={{ width: 12, height: 12, borderRadius: 6, backgroundColor: by.color }} /> : null}
            <Txt variant="caption" tone="muted" style={{ fontSize: 12 }}>
              {who}
            </Txt>
          </Row>
        </View>
        {onMore ? <IconBtn name="ellipsis-vertical" variant="bare" label="خيارات" onPress={onMore} size={36} /> : null}
      </Row>
    </Card>
  );
}
function timeAsDate(t: string) {
  const d = new Date();
  const [h, m] = t.split(':').map(Number);
  d.setHours(h % 24, m, 0, 0);
  return d;
}

/* ---------- نافذة «أضف لرحلتي» (8) ---------- */
export function AddToTripSheet() {
  const nav = useNavigation();
  const st = useSheets((s) => s.addToTrip);
  const close = useSheets((s) => s.close);
  const places = useMap('places');
  const p = st ? places.get(st.placeId) : undefined;
  const trips = useMyTrips().filter((t) => t.status !== 'past');
  const today = useToday();
  const defaultTrip = useMemo(() => {
    if (!p) return undefined;
    if (st?.tripId) return st.tripId;
    return (trips.find((t) => t.trip.cityId === p.cityId && t.status !== 'draft') ?? trips.find((t) => t.status !== 'draft') ?? trips[0])?.trip.id;
  }, [p, trips, st]);
  const [tripId, setTripId] = useState<string | undefined>();
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<Slot | null>(null);
  const [notify, setNotify] = useState(true);
  useEffect(() => {
    setTripId(defaultTrip);
  }, [defaultTrip]);
  const trip = trips.find((t) => t.trip.id === tripId)?.trip;
  const days = trip ? tripDays(trip) : [];
  const members = useTripMembers(trip?.id);
  useEffect(() => {
    setDay(days.find((d) => d >= today) ?? days[0] ?? null);
    setSlot(p ? (p.category === 'food' ? 'dinner' : p.category === 'cafe' ? 'breakfast' : 'afternoon') : null);
  }, [tripId, p?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!st || !p) return null;
  const slotOk = (s: Slot) => {
    const t = { breakfast: '08:30', lunch: '13:30', dinner: '20:30', morning: '10:00', afternoon: '16:30', evening: '21:30' }[s];
    return openState(p, timeAsDate(t)).open;
  };
  return (
    <Sheet
      visible
      onClose={close}
      title={`أضف ${p.name} لرحلتك`}
      subtitle="عشان يطلع في جدولك ويذكّرك فيه"
      footer={
        <Btn
          size="lg"
          full
          disabled={!trip}
          title={trip ? (day && slot ? `أضف لـ${weekday(day)} · ${SLOT_LABEL[slot]}` : 'أضف للرحلة') : 'اختر رحلة'}
          onPress={() => {
            if (!trip) return;
            addToTrip(trip.id, p.id, day, slot, notify && members.length > 1);
            close();
          }}
        />
      }
    >
      <Txt variant="bodyStrong">أي رحلة؟</Txt>
      <View style={{ gap: 8 }}>
        {trips.map(({ trip: t }) => (
          <TripOption key={t.id} trip={t} selected={t.id === tripId} onPress={() => setTripId(t.id)} />
        ))}
        <Card
          onPress={() => {
            close();
            nav.navigate('CreateTrip', { cityId: p.cityId });
          }}
          style={{ borderStyle: 'dashed' }}
        >
          <Row>
            <View style={{ width: 44, height: 44, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="add" />
            </View>
            <Txt variant="bodyStrong" tone="primaryInk">
              رحلة جديدة
            </Txt>
          </Row>
        </Card>
      </View>
      {trip && days.length ? (
        <>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="bodyStrong">اليوم</Txt>
            <Pressable onPress={() => setDay(null)} hitSlop={10}>
              <Txt variant="caption" tone="primaryInk">
                بدون يوم محدد
              </Txt>
            </Pressable>
          </Row>
          <HScroll gap={8}>
            {days.map((d) => (
              <DayChip key={d} date={d} active={d === day} onPress={() => setDay(d)} />
            ))}
          </HScroll>
          <Txt variant="bodyStrong">الوقت</Txt>
          <Row gap={8}>
            {slotsFor(p).map((s) => {
              const ok = slotOk(s);
              return <SlotBox key={s} label={SLOT_LABEL[s]} sub={ok ? (s === 'dinner' ? `مفتوح لين ${fmtTime(p.close)}` : 'مفتوح') : 'مقفل وقتها'} active={slot === s} disabled={!ok} onPress={() => setSlot(s)} />;
            })}
          </Row>
        </>
      ) : trip ? (
        <Card tone="gold">
          <Txt tone="goldInk">الرحلة ما لها تواريخ للحين. بينضاف المكان لقائمة «بدون يوم» وتقدر ترتبه بعدين.</Txt>
        </Card>
      ) : null}
      {members.length > 1 ? (
        <Card>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row gap={8} style={{ flex: 1 }}>
              <Faces people={members.map((m) => m.user)} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">خبّر الشلة</Txt>
                <Txt variant="caption" tone="muted">
                  يوصلهم إشعار بالمكان والموعد
                </Txt>
              </View>
            </Row>
            <Toggle value={notify} onChange={setNotify} label="خبّر الشلة" />
          </Row>
        </Card>
      ) : null}
      {p.amenities.includes('reservation') ? (
        <Row gap={6}>
          <Icon name="time-outline" size={16} />
          <Txt variant="caption" tone="successInk" style={{ flex: 1 }}>
            هذا المكان يُفضّل تحجز عنده مسبقاً، بنذكّرك قبلها بيوم
          </Txt>
        </Row>
      ) : null}
    </Sheet>
  );
}

function TripOption({ trip, selected, onPress }: { trip: Trip; selected: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 8, borderRadius: 14, borderWidth: selected ? 2 : 1, borderColor: selected ? colors.primary : colors.border, backgroundColor: selected ? colors.primarySoft : colors.card }}
    >
      <Photo scene={trip.scene} style={{ width: 44, height: 44, borderRadius: 10 }} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{trip.title}</Txt>
        <Txt variant="caption" tone="muted">
          {fmtRange(trip.startDate, trip.endDate)}
        </Txt>
      </View>
      <View style={{ width: 22, height: 22, borderRadius: 11, borderWidth: selected ? 7 : 2, borderColor: selected ? colors.primary : colors.border, backgroundColor: colors.card }} />
    </Pressable>
  );
}

export function DayChip({ date, active, onPress, sub, disabled }: { date: string; active: boolean; onPress: () => void; sub?: string; disabled?: boolean }) {
  const { colors } = useAppTheme();
  const d = new Date(date + 'T12:00');
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      style={{ width: 60, paddingVertical: 8, borderRadius: 14, alignItems: 'center', borderWidth: 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primary : colors.card, opacity: disabled ? 0.4 : 1 }}
    >
      <Txt variant="caption" style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontSize: 12 }}>
        {weekday(date).replace('ال', '')}
      </Txt>
      <Txt variant="heading" style={{ color: active ? colors.primaryForeground : colors.foreground }}>
        {d.getDate()}
      </Txt>
      {sub ? (
        <Txt variant="caption" style={{ color: active ? colors.primaryForeground : colors.mutedForeground, fontSize: 11 }}>
          {sub}
        </Txt>
      ) : null}
    </Pressable>
  );
}

export function SlotBox({ label, sub, active, disabled, onPress }: { label: string; sub?: string; active: boolean; disabled?: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ selected: active, disabled }}
      style={{ flex: 1, minHeight: 56, borderRadius: 12, alignItems: 'center', justifyContent: 'center', padding: 6, borderWidth: active ? 2 : 1, borderColor: active ? colors.primary : colors.border, backgroundColor: active ? colors.primarySoft : colors.card, opacity: disabled ? 0.45 : 1 }}
    >
      <Txt variant="bodyStrong">{label}</Txt>
      {sub ? (
        <Txt variant="caption" tone={active ? 'primaryInk' : 'muted'} style={{ fontSize: 11 }} numberOfLines={1}>
          {sub}
        </Txt>
      ) : null}
    </Pressable>
  );
}

/* ---------- مشاركة مكان في محادثة ---------- */
export function SharePlaceSheet() {
  const st = useSheets((s) => s.share);
  const close = useSheets((s) => s.close);
  const me = useMeId();
  const chats = useCol('chats').filter((c) => c.memberIds.includes(me) && c.type !== 'guide');
  const trips = useMap('trips');
  const users = useMap('users');
  const comms = useMap('communities');
  if (!st) return null;
  return (
    <Sheet visible onClose={close} title="شارك المكان" subtitle="يوصل كبطاقة فيها «أضف للجدول»">
      {chats.map((c) => {
        const title = c.type === 'trip' ? trips.get(c.tripId!)?.title : c.type === 'community' ? comms.get(c.communityId!)?.name : users.get(c.memberIds.find((m) => m !== me)!)?.name;
        return (
          <Card
            key={c.id}
            onPress={() => {
              sharePlace(c.id, st.placeId);
              close();
            }}
          >
            <Row>
              <Icon name={c.type === 'trip' ? 'briefcase-outline' : c.type === 'community' ? 'people-outline' : 'person-outline'} />
              <Txt variant="bodyStrong" style={{ flex: 1 }}>
                {title}
              </Txt>
              <Icon name="send" size={16} />
            </Row>
          </Card>
        );
      })}
    </Sheet>
  );
}

/* ---------- التقييم السريع (22.14) ---------- */
const QUICK_TAGS = ['يستاهل', 'زحمة', 'غالي', 'للعوائل', 'هادي', 'خدمة ممتازة'];
export function QuickReviewSheet() {
  const st = useSheets((s) => s.review);
  const close = useSheets((s) => s.close);
  const places = useMap('places');
  const { colors } = useAppTheme();
  const [rating, setRating] = useState(0);
  const [tags, setTags] = useState<string[]>([]);
  const [text, setText] = useState('');
  const p = st ? places.get(st.placeId) : undefined;
  if (!st || !p) return null;
  return (
    <Sheet
      visible
      onClose={close}
      title={`كيف كان ${p.name}؟`}
      subtitle="يخلص بأقل من 5 ثواني"
      footer={
        <Btn
          size="lg"
          full
          disabled={!rating}
          title="أرسل التقييم"
          onPress={() => {
            quickReview(p.id, rating, tags, text);
            setRating(0);
            setTags([]);
            setText('');
            close();
          }}
        />
      }
    >
      <Row gap={10} style={{ justifyContent: 'center' }}>
        {[1, 2, 3, 4, 5].map((n) => (
          <Pressable key={n} onPress={() => setRating(n)} hitSlop={6} accessibilityLabel={`${n} نجوم`} accessibilityRole="button">
            <Ionicons name={n <= rating ? 'star' : 'star-outline'} size={38} color={colors.gold} />
          </Pressable>
        ))}
      </Row>
      <Row wrap gap={8}>
        {QUICK_TAGS.map((t) => (
          <Pill key={t} label={t} active={tags.includes(t)} onPress={() => setTags(tags.includes(t) ? tags.filter((x) => x !== t) : [...tags, t])} />
        ))}
      </Row>
      <Field placeholder="كلمة عن تجربتك (اختياري)" value={text} onChangeText={setText} />
    </Sheet>
  );
}

/* ---------- المنشورات ---------- */
export function PostCard({ post, onUser, onPlace }: { post: Post; onUser: () => void; onPlace?: () => void }) {
  const user = useUser(post.userId);
  const me = useMeId();
  const places = useMap('places');
  const p = post.placeId ? places.get(post.placeId) : undefined;
  const liked = post.likes.includes(me);
  const { colors } = useAppTheme();
  return (
    <Card style={{ gap: 10 }}>
      <Pressable onPress={onUser} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }} accessibilityRole="button">
        <Avatar name={user?.name ?? ''} color={user?.color} size={34} />
        <View>
          <Txt variant="bodyStrong">{user?.name}</Txt>
          <Txt variant="caption" tone="muted">
            {post.type === 'review' ? 'قيّم مكان' : post.type === 'recap' ? 'ملخص رحلة' : 'نشر'} · {timeAgo(post.createdAt)}
          </Txt>
        </View>
      </Pressable>
      <HScroll gap={6}>
        {post.photos.map((s, i) => (
          <Photo key={i} uri={post.photoUris?.[i]} scene={s} style={{ width: post.photos.length === 1 ? 300 : 220, height: 160, borderRadius: 14 }} />
        ))}
      </HScroll>
      <Txt>{post.body}</Txt>
      {p ? (
        <Pressable onPress={onPlace} accessibilityRole="link">
          <Chip icon="location" label={p.name} />
        </Pressable>
      ) : null}
      <Row gap={18}>
        <Pressable onPress={() => toggleLike(post.id)} hitSlop={10} accessibilityRole="button" accessibilityLabel={liked ? 'إلغاء الإعجاب' : 'إعجاب'}>
          <Row gap={4}>
            <Ionicons name={liked ? 'heart' : 'heart-outline'} size={18} color={liked ? colors.heart : colors.mutedForeground} />
            <Txt variant="caption" tone="muted">
              {post.likes.length}
            </Txt>
          </Row>
        </Pressable>
        <Row gap={4}>
          <Ionicons name="chatbubble-outline" size={17} color={colors.mutedForeground} />
          <Txt variant="caption" tone="muted">
            {post.comments}
          </Txt>
        </Row>
      </Row>
    </Card>
  );
}

/* ---------- الجواز والأختام ---------- */
export function PassportCard({ countries, xp, title, onPress, showXp = true }: { countries: number; xp: number; title: string; onPress?: () => void; showXp?: boolean }) {
  const { colors } = useAppTheme();
  const lv = levelFor(xp);
  const pct = worldPercent(countries);
  return (
    <Card tone="navy" onPress={onPress} label={title}>
      <Row gap={14}>
        <View style={{ width: 72, height: 72, borderRadius: 36, borderWidth: 6, borderColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' }}>
          <View style={{ position: 'absolute', top: -6, left: -6, right: -6, bottom: -6, borderRadius: 36, borderWidth: 6, borderColor: 'transparent', borderTopColor: colors.gold, borderRightColor: pct > 25 ? colors.gold : 'transparent', transform: [{ rotate: '-45deg' }] }} />
          <Txt variant="heading" style={{ color: '#fff' }}>
            {pct}%
          </Txt>
          <Txt variant="badge" style={{ color: colors.navyForeground }}>
            من العالم
          </Txt>
        </View>
        <View style={{ flex: 1, gap: 6 }}>
          <Txt variant="badge" style={{ color: colors.navyForeground, letterSpacing: 1.5 }}>
            YALLA NSAFER · PASSPORT
          </Txt>
          <Txt variant="heading" style={{ color: '#fff' }}>
            {title}
          </Txt>
          {showXp ? (
            <>
              <Progress value={lv.progress} tone="gold" />
              <Txt variant="caption" style={{ color: colors.navyForeground }}>
                {lv.level.name}
                {lv.next ? ` · باقي ${lv.next.xp - xp} نقطة وتوصل «${lv.next.name}»` : ''}
              </Txt>
            </>
          ) : (
            <Txt variant="caption" style={{ color: colors.navyForeground }}>
              {countries} دول
            </Txt>
          )}
        </View>
        {onPress ? <Ionicons name="chevron-back" size={18} color="#fff" /> : null}
      </Row>
    </Card>
  );
}

export function StampsRow({ stamps, onAdd }: { stamps: { cityId: string; date: string }[]; onAdd?: () => void }) {
  const cities = useMap('cities');
  const { colors } = useAppTheme();
  return (
    <Row gap={10} style={{ justifyContent: 'space-between' }}>
      {stamps.slice(0, onAdd ? 3 : 4).map((s, i) => (
        <Stamp key={s.cityId + i} city={cities.get(s.cityId)?.name ?? ''} date={shortMonth(s.date)} index={i} square={i % 2 === 1} size={76} />
      ))}
      {onAdd ? (
        <Pressable onPress={onAdd} accessibilityRole="button" accessibilityLabel="أضف ختم" style={{ width: 76, height: 76, borderRadius: 38, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="add" />
          <Txt variant="caption" tone="muted">
            ختم
          </Txt>
        </Pressable>
      ) : null}
    </Row>
  );
}
function shortMonth(iso: string) {
  const d = new Date(iso + 'T12:00');
  return `${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`;
}

export function CategoryGrid({ onPick }: { onPick: (c: Category) => void }) {
  const { colors } = useAppTheme();
  const tints = fixed.category;
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', rowGap: 14 }}>
      {CATEGORIES.map((c) => (
        <Pressable key={c.key} onPress={() => onPick(c.key)} accessibilityRole="button" accessibilityLabel={c.label} style={{ width: '25%', alignItems: 'center', gap: 6 }}>
          <View style={{ width: 54, height: 54, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name={c.icon} size={23} color={tints[c.key]} />
          </View>
          <Txt variant="caption">{c.label}</Txt>
        </Pressable>
      ))}
    </View>
  );
}

export function UserLine({ id, sub, right, onPress }: { id: string; sub?: string; right?: React.ReactNode; onPress?: () => void }) {
  const u = useUser(id);
  if (!u) return null;
  return (
    <Pressable onPress={onPress} disabled={!onPress} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52 }}>
      <Avatar name={u.name} color={u.color} size={40} />
      <View style={{ flex: 1 }}>
        <Txt variant="bodyStrong">{u.name}</Txt>
        <Txt variant="caption" tone="muted">
          {sub ?? '@' + u.handle}
        </Txt>
      </View>
      {right}
    </Pressable>
  );
}

export function money(n: number) {
  return sar(n);
}
