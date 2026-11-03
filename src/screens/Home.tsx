/** الرئيسية حسب الحالة (9، 22.6) + وضع اليوم (22.4) + ملخص الرحلة (22.13) */
import { useNavigation } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';

import { CATEGORIES, PostCard, catIcon } from '../components';
import { useSheets } from '../components/sheets';
import { checkin } from '../data/actions';
import { useCity, useCol, useMap, useMe, useMeId, useMyTrips, useNow, useToday } from '../data/selectors';
import type { Trip } from '../data/types';
import { toast } from '../data/ui';
import { daysBetween, fmtClock, fmtDayFull, fmtRange, fmtTime, greeting, hijri, inDays } from '../lib/format';
import { SLOT_TIME, driveMinutes, fmtMinutes, sortItems, tripDays } from '../lib/logic';
import { nextPrayer, qibla, sunset } from '../lib/prayer';
import { useStore } from '../data/store';
import { useAppTheme } from '../theme/ThemeProvider';
import { Avatar, Btn, Card, Chip, HScroll, Icon, IconBtn, Photo, Row, Screen, Section, Txt } from '../ui';

export function HomeScreen() {
  const nav = useNavigation();
  const me = useMe();
  const trips = useMyTrips();
  const today = useToday();
  const notifs = useCol('notifications').filter((n) => n.userId === me.id && !n.read);
  const ongoing = trips.find((t) => t.status === 'ongoing')?.trip;
  const upcoming = trips.find((t) => t.status === 'upcoming')?.trip;
  const recent = trips.filter((t) => t.status === 'past' && t.trip.endDate && daysBetween(t.trip.endDate, today) <= 7).map((t) => t.trip)[0];

  const header = (
    <Row style={{ justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 6 }}>
      <Pressable onPress={() => nav.navigate('Tabs', { screen: 'Profile' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityRole="button" accessibilityLabel="حسابي">
        <Avatar name={me.name} color={me.color} size={42} />
        <View>
          <Txt variant="caption" tone="muted">
            {greeting()}
          </Txt>
          <Txt variant="heading">{me.name.split(' ')[0]}</Txt>
        </View>
      </Pressable>
      <IconBtn name="notifications-outline" label={`الإشعارات${notifs.length ? `، ${notifs.length} جديدة` : ''}`} badge={notifs.length > 0} onPress={() => nav.navigate('Notifications')} />
    </Row>
  );

  if (ongoing) return <TodayMode trip={ongoing} header={header} />;

  return (
    <Screen header={header}>
      {recent ? <RecapCard trip={recent} /> : null}
      {upcoming ? <NextTripCard trip={upcoming} /> : <Hero />}
      <GuideCard />
      {upcoming ? <QuickActions /> : null}
      <SeasonStories />
      <BestDestinations />
      {upcoming ? <FromCommunity /> : null}
    </Screen>
  );
}

function Hero() {
  const nav = useNavigation();
  return (
    <Photo scene="old" scrim style={{ height: 220, borderRadius: 22 }}>
      <View style={{ position: 'absolute', bottom: 16, start: 16, end: 16, gap: 8 }}>
        <Txt variant="title" tone="white">
          رفيقك في كل رحلة
        </Txt>
        <Txt tone="white">اكتشف، خطط، وشارك رحلتك مع أصدقائك</Txt>
        <Btn title="خطط رحلتك الأولى" icon="add" onPress={() => nav.navigate('CreateTrip')} style={{ alignSelf: 'flex-start' }} />
      </View>
    </Photo>
  );
}

function NextTripCard({ trip }: { trip: Trip }) {
  const nav = useNavigation();
  const city = useCity(trip.cityId);
  const today = useToday();
  const tasks = useCol('checklist').filter((c) => c.tripId === trip.id);
  const done = tasks.filter((t) => t.done).length;
  const n = daysBetween(today, trip.startDate!);
  return (
    <Pressable onPress={() => nav.navigate('Trip', { id: trip.id })} accessibilityRole="button" accessibilityLabel={`رحلتك الجاية ${trip.title} ${inDays(n)}`}>
      <Photo scene={trip.scene} scrim style={{ height: 210, borderRadius: 22 }}>
        <View style={{ position: 'absolute', top: 14, start: 14, backgroundColor: '#fff', borderRadius: 16, paddingHorizontal: 14, paddingVertical: 6, alignItems: 'center' }}>
          <Txt variant="title" style={{ color: '#141a2b', lineHeight: 30 }}>
            {n}
          </Txt>
          <Txt variant="caption" style={{ color: '#5b6378' }}>
            {n === 1 ? 'يوم' : 'أيام'}
          </Txt>
        </View>
        <View style={{ position: 'absolute', bottom: 14, start: 16, end: 16, gap: 8 }}>
          <Txt variant="badge" tone="white">
            رحلتك الجاية
          </Txt>
          <Txt variant="heading" tone="white" style={{ fontSize: 19 }}>
            {trip.title}
          </Txt>
          <Row wrap gap={6}>
            <Chip tone="glass" icon="calendar-outline" label={fmtRange(trip.startDate, trip.endDate)} />
            {city ? <Chip tone="glass" icon="partly-sunny-outline" label={`${city.tempNow}° مشمس`} /> : null}
            <Chip tone="glass" icon="checkbox-outline" label={`التجهيز ${done} من ${tasks.length}`} />
          </Row>
        </View>
      </Photo>
    </Pressable>
  );
}

function GuideCard() {
  const nav = useNavigation();
  const { colors } = useAppTheme();
  const sugg = ['ويكند قريب من الرياض', 'رحلة بـ 3,000 ﷼', 'مع العائلة في ديسمبر'];
  return (
    <Card tone="primary" style={{ gap: 10, borderWidth: 1.5 }}>
      <Row gap={10}>
        <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="compass" color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">دليل السفر</Txt>
          <Txt variant="caption" tone="muted">
            اسأله عن أي وجهة، يخطط لك في ثواني
          </Txt>
        </View>
      </Row>
      <Pressable
        onPress={() => nav.navigate('Guide')}
        accessibilityRole="button"
        accessibilityLabel="اسأل الدليل"
        style={{ flexDirection: 'row', alignItems: 'center', height: 46, borderRadius: 14, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, paddingHorizontal: 12, gap: 8 }}
      >
        <Txt tone="muted" style={{ flex: 1 }} numberOfLines={1}>
          وين تحب تسافر؟ أو أي شهر يناسبك؟
        </Txt>
        <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="send" size={16} color="#fff" />
        </View>
      </Pressable>
      <HScroll gap={6}>
        {sugg.map((s) => (
          <Pressable key={s} onPress={() => nav.navigate('Guide', { q: s })} style={{ borderRadius: 999, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 12, paddingVertical: 6 }} accessibilityRole="button">
            <Txt variant="caption">{s}</Txt>
          </Pressable>
        ))}
      </HScroll>
    </Card>
  );
}

function QuickActions() {
  const nav = useNavigation();
  const { colors } = useAppTheme();
  const items = [
    { icon: 'add' as const, label: 'خطط رحلة', go: () => nav.navigate('CreateTrip') },
    { icon: 'search' as const, label: 'اكتشف', go: () => nav.navigate('Tabs', { screen: 'Explore' }) },
    { icon: 'key-outline' as const, label: 'رمز دعوة', go: () => nav.navigate('Join') },
    { icon: 'location-outline' as const, label: 'سجّل وصول', go: () => nav.navigate('Checkin') },
  ];
  return (
    <Row style={{ justifyContent: 'space-between' }}>
      {items.map((i) => (
        <Pressable key={i.label} onPress={i.go} accessibilityRole="button" style={{ alignItems: 'center', gap: 6, flex: 1 }}>
          <View style={{ width: 54, height: 54, borderRadius: 16, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={i.icon} color={colors.primaryInk} size={23} />
          </View>
          <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }}>
            {i.label}
          </Txt>
        </Pressable>
      ))}
    </Row>
  );
}

function SeasonStories() {
  const nav = useNavigation();
  const stories = useCol('stories');
  const [seen] = useState<Set<string>>(new Set());
  const rings = ['#2a55d8', '#e07b24', '#1f9d63', '#b2449a'];
  return (
    <Section title="لفتات الموسم">
      <HScroll gap={14}>
        {stories.map((s, i) => (
          <Pressable key={s.id} onPress={() => nav.navigate('Story', { id: s.id })} style={{ width: 72, alignItems: 'center', gap: 6 }} accessibilityRole="button" accessibilityLabel={s.title}>
            <View style={{ padding: 2.5, borderRadius: 40, backgroundColor: seen.has(s.id) ? '#c8ccd6' : rings[i % rings.length] }}>
              <Photo scene={s.scene} style={{ width: 62, height: 62, borderRadius: 31, borderWidth: 2.5, borderColor: 'white' }} />
            </View>
            <Txt variant="caption" center numberOfLines={2} style={{ fontSize: 12, lineHeight: 16 }}>
              {s.title}
            </Txt>
          </Pressable>
        ))}
      </HScroll>
    </Section>
  );
}

function BestDestinations() {
  const nav = useNavigation();
  const cities = useCol('cities');
  const m = new Date().getMonth();
  const MONTH = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'][m];
  const best = cities.filter((c) => c.bestMonths[m] === 2).sort((a, b) => b.ourRating - a.ourRating);
  return (
    <Section title={`أفضل الوجهات في ${MONTH}`} action={{ label: 'اسأل الدليل', onPress: () => nav.navigate('Guide', { q: `وين أروح في ${MONTH}؟` }) }}>
      <HScroll>
        {best.map((c) => (
          <Pressable key={c.id} onPress={() => nav.navigate('City', { id: c.id })} accessibilityRole="button" accessibilityLabel={c.name}>
            <Photo scene={c.scene} scrim style={{ width: 230, height: 150, borderRadius: 18 }}>
              <Chip tone="glass" icon="partly-sunny-outline" label={`${c.tempNow}°`} style={{ position: 'absolute', top: 10, end: 10 }} />
              <View style={{ position: 'absolute', bottom: 10, start: 12, end: 12 }}>
                <Txt variant="heading" tone="white">
                  {c.name}
                </Txt>
                <Txt variant="caption" tone="white" numberOfLines={1}>
                  {c.blurb}
                </Txt>
              </View>
            </Photo>
          </Pressable>
        ))}
      </HScroll>
    </Section>
  );
}

function FromCommunity() {
  const nav = useNavigation();
  const meId = useMeId();
  const posts = useCol('posts');
  const follows = useCol('follows');
  const feed = useMemo(() => {
    const f = new Set(follows.filter((x) => x.followerId === meId).map((x) => x.followingId));
    return posts.filter((p) => f.has(p.userId)).sort((a, b) => b.createdAt - a.createdAt).slice(0, 3);
  }, [posts, follows, meId]);
  if (!feed.length) return null;
  return (
    <Section title="من مجتمعك">
      {feed.map((p) => (
        <PostCard key={p.id} post={p} onUser={() => nav.navigate('User', { id: p.userId })} onPlace={() => p.placeId && nav.navigate('Place', { id: p.placeId })} />
      ))}
    </Section>
  );
}

/* ---------- كيف كانت الرحلة؟ (22.13) ---------- */
function RecapCard({ trip }: { trip: Trip }) {
  const nav = useNavigation();
  const city = useCity(trip.cityId);
  const items = useCol('items').filter((i) => i.tripId === trip.id && i.placeId);
  const places = useMap('places');
  const openReview = useSheets((s) => s.openReview);
  const kms = useMemo(() => {
    let total = 0;
    const ps = sortItems(items).map((i) => places.get(i.placeId!)).filter(Boolean);
    for (let i = 1; i < ps.length; i++) total += Math.round(driveMinutes(ps[i - 1]!, ps[i]!) * 0.66);
    return total;
  }, [items, places]);
  const days = tripDays(trip).length;
  return (
    <Card style={{ gap: 12 }}>
      <Txt variant="heading">كيف كانت {city?.name}؟</Txt>
      <Row style={{ justifyContent: 'space-between' }}>
        {[
          [String(days), 'أيام'],
          [String(items.length), 'أماكن'],
          [`${kms}`, 'كم'],
          ['1', 'ختم جديد'],
        ].map(([v, l]) => (
          <View key={l} style={{ alignItems: 'center', flex: 1 }}>
            <Txt variant="stat">{v}</Txt>
            <Txt variant="caption" tone="muted">
              {l}
            </Txt>
          </View>
        ))}
      </Row>
      <Row gap={8}>
        <Btn title="انشر ملخصها" icon="images-outline" style={{ flex: 1 }} onPress={() => nav.navigate('NewPost', { tripId: trip.id, recap: true })} />
        {items[0]?.placeId ? <Btn title="قيّم الأماكن" variant="ghost" style={{ flex: 1 }} onPress={() => openReview(items[0].placeId!)} /> : null}
      </Row>
    </Card>
  );
}

/* ---------- وضع اليوم (22.4) ---------- */
function TodayMode({ trip, header }: { trip: Trip; header: React.ReactNode }) {
  const nav = useNavigation();
  const { colors } = useAppTheme();
  const city = useCity(trip.cityId);
  const today = useToday();
  const now = useNow();
  const places = useMap('places');
  const hijriOn = useStore((s) => s.settings.hijri);
  const docs = useCol('docs').filter((d) => d.tripId === trip.id);
  const items = sortItems(useCol('items').filter((i) => i.tripId === trip.id && i.day === today));
  const days = tripDays(trip);
  const nowT = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  const next = items.find((i) => (i.time ?? SLOT_TIME[i.slot ?? 'morning']) >= nowT) ?? null;
  const np = next?.placeId ? places.get(next.placeId) : undefined;
  const lat = city?.lat ?? 24.7, lng = city?.lng ?? 46.7;
  const pr = nextPrayer(lat, lng, now, city?.countryCode === 'SA');
  const q = qibla(lat, lng);
  const travel = np && city ? driveMinutes(city, np) : 20;
  const startT = next?.time ?? (next?.slot ? SLOT_TIME[next.slot] : null);
  let leaveIn: number | null = null;
  let why = '';
  if (startT) {
    const [h, m] = startT.split(':').map(Number);
    let target = h * 60 + m;
    if (np?.bestTime === 'الغروب') {
      const ss = sunset(lat, lng, now);
      target = Math.min(target, ss.getHours() * 60 + ss.getMinutes() - 30);
      why = ` عشان تلحق الغروب (${fmtClock(ss)})`;
    }
    leaveIn = target - travel - 5 - (now.getHours() * 60 + now.getMinutes());
  }
  return (
    <Screen header={header}>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Txt variant="caption" tone="muted">
            اليوم {days.indexOf(today) + 1} من {days.length} · {city?.name}
          </Txt>
          <Txt variant="title">{fmtDayFull(today)}</Txt>
          {hijriOn && hijri(today) ? (
            <Txt variant="caption" tone="muted">
              {hijri(today)}
            </Txt>
          ) : null}
        </View>
        <Chip tone="success" icon="cloud-done-outline" label="محفوظ بدون نت" />
      </Row>

      {next ? (
        <Card padded={false} style={{ borderWidth: 2, borderColor: colors.primary }}>
          <Row gap={12} style={{ padding: 12 }}>
            <Photo uri={np?.photo} scene={np?.scene ?? 'desert'} icon={np ? catIcon(np.category) : 'flag'} style={{ width: 80, height: 80, borderRadius: 14 }} />
            <View style={{ flex: 1 }}>
              <Txt variant="badge" tone="primaryInk">
                التالي · {fmtTime(startT)}
              </Txt>
              <Txt variant="heading">{np?.name ?? next.title}</Txt>
              <Txt variant="caption" tone="muted">
                {np ? `${CATEGORIES.find((c) => c.key === np.category)?.label} · ${fmtMinutes(travel)} بالسيارة` : ''}
              </Txt>
            </View>
          </Row>
          {leaveIn != null ? (
            <Row gap={8} style={{ backgroundColor: colors.primarySoft, paddingHorizontal: 12, paddingVertical: 10 }}>
              <Icon name="time-outline" size={18} color={colors.primaryInk} />
              <Txt variant="bodyStrong" tone="primaryInk" style={{ flex: 1, fontSize: 13 }}>
                {leaveIn <= 0 ? `اطلع الحين${why}` : `اطلع خلال ${fmtMinutes(leaveIn)}${why}`}
              </Txt>
            </Row>
          ) : null}
          <Row gap={8} style={{ padding: 12 }}>
            <Btn
              title="الاتجاهات"
              icon="navigate"
              style={{ flex: 1.4 }}
              onPress={() => np && Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${np.lat},${np.lng}`)}
            />
            <Btn
              title="وصلت"
              variant="ghost"
              style={{ flex: 1 }}
              onPress={() => {
                if (!np) return;
                const r = checkin(np.id);
                toast(r.newStamp ? `ختم جديد في جوازك: ${city?.name} 🎉` : `سجّلت وصولك لـ${np.name}`);
              }}
            />
            <Btn title="الجدول" variant="ghost" style={{ flex: 1 }} onPress={() => nav.navigate('Trip', { id: trip.id })} />
          </Row>
        </Card>
      ) : (
        <Card tone="success">
          <Txt tone="successInk">خلصت جدول اليوم 👏 استمتع بباقي يومك، أو اكتشف شي قريب.</Txt>
        </Card>
      )}

      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        <Tile icon="moon-outline" label="الصلاة القادمة" value={`${pr.name} ${fmtClock(pr.at)}`} sub={`القبلة: ${q.text} (${q.deg}°)`} onPress={() => Linking.openURL(`https://www.google.com/maps/search/مسجد/@${lat},${lng},15z`)} />
        <Tile icon="partly-sunny-outline" label="الطقس" value={`${city?.tempNow ?? 24}° ← ${city?.tempNight ?? 14}° بالليل`} sub={(city?.tempNight ?? 20) < 16 ? 'خذ جاكيت للمساء' : 'جو لطيف'} />
        <Tile icon="document-text-outline" label="مستنداتي" value={`${docs.length} مستندات`} sub="تفتح بدون نت" onPress={() => nav.navigate('Docs', { id: trip.id })} />
        <Tile icon="warning-outline" label="طوارئ" value={city?.countryCode === 'SA' ? '911' : '112'} sub="أقرب مستشفى" danger onPress={() => Linking.openURL(`tel:${city?.countryCode === 'SA' ? '911' : '112'}`)} />
      </View>

      <Section title="باقي اليوم" action={{ label: 'الخريطة', onPress: () => nav.navigate('TripMap', { id: trip.id, day: today }) }}>
        <Card padded={false}>
          {items.map((i, idx) => {
            const p = i.placeId ? places.get(i.placeId) : undefined;
            const t = i.time ?? (i.slot ? SLOT_TIME[i.slot] : '');
            return (
              <Pressable key={i.id} onPress={() => p && nav.navigate('Place', { id: p.id })} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderTopWidth: idx ? 1 : 0, borderColor: colors.border, opacity: t < nowT ? 0.5 : 1 }}>
                <Txt variant="bodyStrong" tone="muted" style={{ width: 62 }}>
                  {fmtTime(t)}
                </Txt>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{p?.name ?? i.title}</Txt>
                  <Txt variant="caption" tone="muted">
                    {i.via === 'poll' ? 'اختارته الشلة' : p?.kind}
                  </Txt>
                </View>
                {p?.amenities.includes('reservation') ? <Chip tone="gold" icon="alert-circle-outline" label="احجز" /> : null}
              </Pressable>
            );
          })}
        </Card>
      </Section>
      <Btn title="شارك موقعي مع شخص موثوق" icon="share-social-outline" variant="ghost" onPress={() => nav.navigate('Privacy')} />
    </Screen>
  );
}

function Tile({ icon, label, value, sub, onPress, danger }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; value: string; sub?: string; onPress?: () => void; danger?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Card onPress={onPress} style={{ width: '48.5%', gap: 4 }} label={`${label}: ${value}`}>
      <Row gap={6}>
        <Icon name={icon} size={16} color={danger ? colors.destructive : colors.mutedForeground} />
        <Txt variant="caption" tone={danger ? 'destructive' : 'muted'}>
          {label}
        </Txt>
      </Row>
      <Txt variant="bodyStrong">{value}</Txt>
      {sub ? (
        <Txt variant="caption" tone="muted" numberOfLines={1}>
          {sub}
        </Txt>
      ) : null}
    </Card>
  );
}
