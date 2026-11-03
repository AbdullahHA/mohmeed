/** رحلاتي (10) + رحلة جديدة (22.1) + الانضمام (15.9) + متى نسافر؟ (22.7) */
import * as Clipboard from 'expo-clipboard';
import { useMemo, useRef, useState } from 'react';
import { Pressable, Share, TextInput, View } from 'react-native';

import { TripCard } from '../components';
import { createTrip, finalizeDates, joinByCode, toggleDateVote } from '../data/actions';
import { useCity, useCol, useMap, useMe, useMeId, useMyRole, useMyTrips, useToday, useTrip, useTripMembers } from '../data/selectors';
import type { Need, TravelerType } from '../data/types';
import { toast } from '../data/ui';
import { DAYS_SHORT, MONTHS, addDays, fmtRange, fromISO, toISO } from '../lib/format';
import { localPlan } from '../lib/guide';
import { bestDates } from '../lib/logic';
import type { RootProps, TabProps } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { Avatar, BACK, Btn, Card, Chip, Empty, Field, Header, Icon, IconBtn, Photo, Pill, Row, Screen, Section, Segmented, Txt } from '../ui';

export function TripsScreen({ navigation }: TabProps<'Trips'>) {
  const trips = useMyTrips();
  const [tab, setTab] = useState<'upcoming' | 'past' | 'draft'>('upcoming');
  const chats = useCol('chats');
  const messages = useCol('messages');
  const reads = useCol('reads');
  const me = useMeId();
  const groups = {
    upcoming: trips.filter((t) => t.status === 'upcoming' || t.status === 'ongoing'),
    past: trips.filter((t) => t.status === 'past').reverse(),
    draft: trips.filter((t) => t.status === 'draft'),
  };
  const unread = (tripId: string) => {
    const c = chats.find((x) => x.tripId === tripId);
    if (!c) return 0;
    const last = reads.find((r) => r.chatId === c.id && r.userId === me)?.lastReadAt ?? 0;
    return messages.filter((m) => m.chatId === c.id && m.senderId !== me && m.createdAt > last).length;
  };
  const list = groups[tab];
  return (
    <Screen
      header={
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 }}>
          <Txt variant="title" accessibilityRole="header">
            رحلاتي
          </Txt>
          <Row gap={8}>
            <IconBtn name="key-outline" label="عندي رمز دعوة" onPress={() => navigation.navigate('Join')} />
            <Btn title="رحلة جديدة" icon="add" onPress={() => navigation.navigate('CreateTrip')} />
          </Row>
        </Row>
      }
    >
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'upcoming', label: 'القادمة', count: groups.upcoming.length },
          { key: 'past', label: 'السابقة', count: groups.past.length },
          { key: 'draft', label: 'مسودات', count: groups.draft.length },
        ]}
      />
      {list.length ? (
        list.map(({ trip }) => <TripCard key={trip.id} trip={trip} unread={unread(trip.id)} onPress={() => navigation.navigate('Trip', { id: trip.id })} />)
      ) : (
        <Empty
          icon="airplane-outline"
          title={tab === 'past' ? 'ما عندك رحلات سابقة' : 'ما عندك رحلات للحين'}
          text="خطط رحلتك بأقل من 30 ثانية، أو انسخ خطة جاهزة من مسافر ثاني."
          action={{ label: 'خطط رحلة', onPress: () => navigation.navigate('CreateTrip') }}
        />
      )}
      <Card onPress={() => navigation.navigate('Tabs', { screen: 'Explore' })}>
        <Row>
          <View style={{ width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="book-outline" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">رحلات جاهزة من مسافرين ثانين</Txt>
            <Txt variant="caption" tone="muted">
              افتح أي رحلة منشورة وانسخ خطتها
            </Txt>
          </View>
          <Icon name="chevron-back" size={16} />
        </Row>
      </Card>
    </Screen>
  );
}

/* ---------- رحلة جديدة ---------- */
const WHO: { key: TravelerType; label: string; sub: string; icon: React.ComponentProps<typeof Icon>['name'] }[] = [
  { key: 'solo', label: 'لحالي', sub: 'أماكن آمنة ومجتمعات تناسبك', icon: 'person' },
  { key: 'couple', label: 'مع شريكي', sub: 'أجواء هادية ورومانسية', icon: 'heart' },
  { key: 'family', label: 'مع العائلة', sub: 'أماكن تناسب الأطفال وكبار السن', icon: 'people' },
  { key: 'group', label: 'مع الشلة', sub: 'تصويت وتقسيم مصاريف', icon: 'people-circle' },
];

export function CreateTripScreen({ route, navigation }: RootProps<'CreateTrip'>) {
  const { colors } = useAppTheme();
  const cities = useCol('cities');
  const places = useCol('places');
  const me = useMe();
  const [cityId, setCityId] = useState<string | undefined>(route.params?.cityId);
  const [q, setQ] = useState('');
  const [mode, setMode] = useState<'fixed' | 'flexible' | 'vote'>('fixed');
  const [start, setStart] = useState<string | null>(null);
  const [len, setLen] = useState(3);
  const [flexMonth, setFlexMonth] = useState(new Date().getMonth());
  const [who, setWho] = useState<TravelerType | undefined>(me.travelerType);
  const [needs, setNeeds] = useState<Need[]>([]);
  const [auto, setAuto] = useState(true);
  const [title, setTitle] = useState('');
  const city = cities.find((c) => c.id === cityId);
  const whenDone = mode === 'fixed' ? !!start : true;
  const step = !city ? 0 : !whenDone ? 1 : !who ? 2 : 3;
  const upcomingDays = useMemo(() => Array.from({ length: 60 }, (_, i) => toISO(addDays(new Date(), i + 1))), []);
  const matches = cities.filter((c) => !q || c.name.includes(q) || c.country.includes(q));
  const m = new Date().getMonth();

  const submit = () => {
    if (!city || !who) return;
    const end = mode === 'fixed' && start ? toISO(addDays(fromISO(start), len - 1)) : null;
    const plan = auto && mode === 'fixed' ? localPlan(`${city.name} ${len} أيام`, cities, places, { ...me, travelerType: who }) : null;
    const id = createTrip({
      title,
      cityId: city.id,
      startDate: mode === 'fixed' ? start : null,
      endDate: end,
      flexMonth: mode === 'flexible' ? flexMonth : null,
      flexDays: len,
      datesMode: mode,
      travelerType: who,
      needs,
      autoPlan: plan,
    });
    navigation.replace('Trip', { id });
    if (mode === 'vote') setTimeout(() => navigation.navigate('Dates', { id }), 300);
  };

  return (
    <Screen
      header={
        <>
          <Header title="رحلة جديدة" onBack={() => navigation.goBack()} />
          <Row gap={6} style={{ paddingHorizontal: 18, paddingBottom: 8 }}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ flex: 1, height: 4, borderRadius: 4, backgroundColor: i < step ? colors.primary : colors.border }} />
            ))}
          </Row>
        </>
      }
      footer={
        <View style={{ padding: 18, paddingBottom: 26, gap: 10, borderTopWidth: 1, borderColor: colors.border, backgroundColor: colors.background }}>
          {mode === 'fixed' ? (
            <Pressable onPress={() => setAuto(!auto)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }} accessibilityRole="checkbox" accessibilityState={{ checked: auto }}>
              <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: auto ? colors.primary : colors.card, borderWidth: auto ? 0 : 2, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
                {auto ? <Icon name="checkmark" size={15} color="#fff" /> : null}
              </View>
              <Txt style={{ flex: 1 }}>خل الدليل يقترح جدول مبدئي (تقدر تعدّله)</Txt>
            </Pressable>
          ) : null}
          <Btn size="lg" full title="سوّ الرحلة" disabled={step < 3} onPress={submit} />
        </View>
      }
    >
      {/* وين؟ */}
      {city ? (
        <Done label="وين؟" value={city.name} onChange={() => setCityId(undefined)} />
      ) : (
        <View style={{ gap: 10 }}>
          <Txt variant="heading">وين؟</Txt>
          <Field placeholder="ابحث عن مدينة أو دولة" value={q} onChangeText={setQ} autoFocus />
          <Row wrap gap={8}>
            {matches.map((c) => (
              <Pill key={c.id} label={c.name} icon={c.bestMonths[m] === 2 ? 'sunny-outline' : undefined} onPress={() => setCityId(c.id)} />
            ))}
          </Row>
          <Btn variant="soft" icon="compass-outline" title="مو متأكد، ساعدني" onPress={() => navigation.navigate('Guide', { q: 'وين أسافر؟' })} />
        </View>
      )}

      {/* متى؟ */}
      {city ? (
        whenDone && step > 1 ? (
          <Done label="متى؟" value={mode === 'fixed' ? `${fmtRange(start, toISO(addDays(fromISO(start!), len - 1)))} · ${len} أيام` : mode === 'flexible' ? `${MONTHS[flexMonth]} · ${len} أيام (مرن)` : `الشلة تصوّت · ${len} أيام`} onChange={() => setStart(null)} />
        ) : (
          <View style={{ gap: 10 }}>
            <Txt variant="heading">متى؟</Txt>
            <Segmented
              value={mode}
              onChange={setMode}
              options={[
                { key: 'fixed', label: 'تواريخ محددة' },
                { key: 'flexible', label: 'مرن' },
                { key: 'vote', label: 'الشلة تصوّت' },
              ]}
            />
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="bodyStrong">كم يوم؟</Txt>
              <Row gap={14}>
                <IconBtn name="remove" label="أقل" onPress={() => setLen(Math.max(1, len - 1))} />
                <Txt variant="heading">{len}</Txt>
                <IconBtn name="add" label="أكثر" onPress={() => setLen(Math.min(21, len + 1))} />
              </Row>
            </Row>
            {mode === 'fixed' ? (
              <MonthGrid days={upcomingDays} selected={start} len={len} onPick={setStart} />
            ) : mode === 'flexible' ? (
              <Row wrap gap={8}>
                {Array.from({ length: 6 }, (_, i) => (m + i) % 12).map((mm) => (
                  <Pill key={mm} label={MONTHS[mm]} active={flexMonth === mm} icon={city.bestMonths[mm] === 2 ? 'sunny-outline' : undefined} onPress={() => setFlexMonth(mm)} />
                ))}
              </Row>
            ) : (
              <Card tone="primary">
                <Txt tone="primaryInk">بعد ما تسوي الرحلة، ادعُ الشلة وكل واحد يحدد الأيام اللي تناسبه، وأنا أطلع لكم أفضل موعد.</Txt>
              </Card>
            )}
          </View>
        )
      ) : null}

      {/* مين؟ */}
      {city && whenDone ? (
        <View style={{ gap: 10 }}>
          <Txt variant="heading">مين معك؟</Txt>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
            {WHO.map((w) => {
              const on = who === w.key;
              return (
                <Pressable
                  key={w.key}
                  onPress={() => setWho(w.key)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: on }}
                  style={{ width: '48.5%', padding: 12, gap: 6, borderRadius: 16, borderWidth: on ? 2 : 1, borderColor: on ? colors.primary : colors.border, backgroundColor: on ? colors.primarySoft : colors.card }}
                >
                  <Icon name={w.icon} color={colors.primaryInk} size={22} />
                  <Txt variant="bodyStrong">{w.label}</Txt>
                  <Txt variant="caption" tone="muted">
                    {w.sub}
                  </Txt>
                </Pressable>
              );
            })}
          </View>
          {who === 'family' ? (
            <Row wrap gap={8}>
              {(
                [
                  ['kids_under_5', 'أطفال تحت 5'],
                  ['elderly', 'كبار سن'],
                  ['wheelchair', 'كرسي متحرك'],
                ] as [Need, string][]
              ).map(([k, l]) => (
                <Pill key={k} label={l} active={needs.includes(k)} onPress={() => setNeeds(needs.includes(k) ? needs.filter((x) => x !== k) : [...needs, k])} />
              ))}
            </Row>
          ) : null}
          {who === 'group' ? (
            <Card tone="primary">
              <Txt tone="primaryInk">بعد ما تسوي الرحلة يطلع لك رابط ورمز دعوة ترسله للشلة.</Txt>
            </Card>
          ) : null}
          <Field label="اسم الرحلة (اختياري)" placeholder={`رحلة ${city?.name ?? ''}`} value={title} onChangeText={setTitle} />
        </View>
      ) : null}
    </Screen>
  );
}

function Done({ label, value, onChange }: { label: string; value: string; onChange: () => void }) {
  return (
    <Card>
      <Row style={{ justifyContent: 'space-between' }}>
        <View>
          <Txt variant="caption" tone="muted">
            {label}
          </Txt>
          <Txt variant="bodyStrong">{value}</Txt>
        </View>
        <Pressable onPress={onChange} hitSlop={10} accessibilityRole="button">
          <Txt variant="bodyStrong" tone="primaryInk">
            تغيير
          </Txt>
        </Pressable>
      </Row>
    </Card>
  );
}

function MonthGrid({ days, selected, len, onPick, counts, total, mine }: { days: string[]; selected?: string | null; len?: number; onPick: (d: string) => void; counts?: Record<string, number>; total?: number; mine?: Set<string> }) {
  const { colors } = useAppTheme();
  const [offset, setOffset] = useState(0);
  const months = useMemo(() => [...new Set(days.map((d) => d.slice(0, 7)))], [days]);
  const ym = months[Math.min(offset, months.length - 1)];
  const [y, mo] = ym.split('-').map(Number);
  const first = new Date(y, mo - 1, 1);
  const n = new Date(y, mo, 0).getDate();
  const cells: (string | null)[] = [...Array(first.getDay()).fill(null), ...Array.from({ length: n }, (_, i) => toISO(new Date(y, mo - 1, i + 1)))];
  const sel = new Set<string>();
  if (selected && len) for (let i = 0; i < len; i++) sel.add(toISO(addDays(fromISO(selected), i)));
  const allowed = new Set(days);
  return (
    <Card style={{ gap: 8 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <IconBtn name={BACK} label="الشهر السابق" variant="bare" onPress={() => setOffset(Math.max(0, offset - 1))} />
        <Txt variant="bodyStrong">
          {MONTHS[mo - 1]} {y}
        </Txt>
        <IconBtn name="chevron-back" label="الشهر التالي" variant="bare" onPress={() => setOffset(Math.min(months.length - 1, offset + 1))} />
      </Row>
      <View style={{ flexDirection: 'row' }}>
        {DAYS_SHORT.map((d) => (
          <Txt key={d} variant="caption" tone="muted" center style={{ flex: 1, fontSize: 11 }}>
            {d}
          </Txt>
        ))}
      </View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
        {cells.map((d, i) => {
          if (!d) return <View key={'e' + i} style={{ width: `${100 / 7}%`, height: 44 }} />;
          const c = counts?.[d] ?? 0;
          const on = sel.has(d) || mine?.has(d);
          const heat = counts && total ? c / total : 0;
          const bg = counts ? (heat >= 1 ? colors.success : heat > 0 ? `rgba(31,157,99,${0.12 + heat * 0.35})` : 'transparent') : on ? colors.primary : 'transparent';
          const fg = counts ? (heat >= 1 ? '#fff' : colors.foreground) : on ? '#fff' : allowed.has(d) ? colors.foreground : colors.mutedForeground;
          return (
            <Pressable
              key={d}
              disabled={!allowed.has(d)}
              onPress={() => onPick(d)}
              accessibilityRole="button"
              accessibilityState={{ selected: !!on }}
              accessibilityLabel={`${Number(d.slice(8))} ${MONTHS[mo - 1]}${counts ? `، ${c} متاحين` : ''}`}
              style={{ width: `${100 / 7}%`, height: 44, padding: 2 }}
            >
              <View style={{ flex: 1, borderRadius: 10, alignItems: 'center', justifyContent: 'center', backgroundColor: bg, borderWidth: counts && mine?.has(d) ? 2 : 0, borderColor: colors.primary }}>
                <Txt style={{ color: fg, fontSize: 14, opacity: allowed.has(d) ? 1 : 0.4 }}>{Number(d.slice(8))}</Txt>
                {counts && c ? (
                  <Txt style={{ color: fg, fontSize: 9, lineHeight: 10 }} variant="badge">
                    {c}
                  </Txt>
                ) : null}
              </View>
            </Pressable>
          );
        })}
      </View>
    </Card>
  );
}

/* ---------- متى نسافر؟ ---------- */
export function DatesScreen({ route, navigation }: RootProps<'Dates'>) {
  const trip = useTrip(route.params.id);
  const members = useTripMembers(trip?.id);
  const votes = useCol('dateVotes').filter((v) => v.tripId === trip?.id);
  const me = useMeId();
  const role = useMyRole(trip?.id);
  const days = useMemo(() => Array.from({ length: 75 }, (_, i) => toISO(addDays(new Date(), i + 1))), []);
  if (!trip) return null;
  const counts: Record<string, number> = {};
  votes.forEach((v) => (counts[v.date] = (counts[v.date] ?? 0) + 1));
  const mine = new Set(votes.filter((v) => v.userId === me).map((v) => v.date));
  const best = bestDates(votes, trip.flexDays ?? 2);
  const voted = new Set(votes.map((v) => v.userId));
  return (
    <Screen header={<Header title="متى نسافر؟" subtitle={`${voted.size} من ${members.length} حددوا أيامهم`} onBack={() => navigation.goBack()} />}>
      <Txt tone="muted">اضغط على الأيام اللي تناسبك. اللون يغمق كل ما زاد عدد المتاحين.</Txt>
      <MonthGrid days={days} counts={counts} total={members.length} mine={mine} onPick={(d) => toggleDateVote(trip.id, d)} />
      {best ? (
        <Card tone="success" style={{ gap: 8, borderWidth: 2 }}>
          <Row gap={6}>
            <Icon name="checkmark-circle" size={16} />
            <Txt variant="bodyStrong" tone="successInk">
              أفضل موعد
            </Txt>
          </Row>
          <Txt variant="heading">
            {fmtRange(best.start, best.end)} · {best.len} أيام
          </Txt>
          <Txt variant="caption" tone="muted">
            {best.min === members.length ? 'كل الأعضاء متاحين.' : `${best.min} من ${members.length} متاحين كل الأيام.`}
          </Txt>
          {role === 'organizer' ? <Btn title="اعتمد التواريخ" onPress={() => (finalizeDates(trip.id), navigation.goBack())} /> : <Txt variant="caption" tone="muted">المنظّم يعتمد الموعد.</Txt>}
        </Card>
      ) : null}
      <Card padded={false}>
        {members.map((m, i) => {
          const n = votes.filter((v) => v.userId === m.userId).length;
          return (
            <Row key={m.id} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderColor: '#0000' }}>
              <Avatar name={m.user.name} color={m.user.color} size={30} />
              <Txt style={{ flex: 1 }}>{m.userId === me ? 'أنت' : m.user.name}</Txt>
              {n ? (
                <Txt variant="caption" tone="successInk">
                  حدد {n} أيام
                </Txt>
              ) : (
                <Btn size="sm" variant="ghost" title="ذكّره" onPress={() => toast(`انرسل تذكير لـ${m.user.name}`)} />
              )}
            </Row>
          );
        })}
      </Card>
    </Screen>
  );
}

/* ---------- الانضمام ---------- */
export function JoinScreen({ route, navigation }: RootProps<'Join'>) {
  const { colors } = useAppTheme();
  const [code, setCode] = useState((route.params?.code ?? '').toUpperCase());
  const inputs = useRef<(TextInput | null)[]>([]);
  const trips = useCol('trips');
  const trip = trips.find((t) => t.inviteCode === code);
  const members = useTripMembers(trip?.id);
  const items = useCol('items').filter((i) => i.tripId === trip?.id);
  const owner = useMap('users').get(trip?.ownerId ?? '');
  const city = useCity(trip?.cityId);
  const setAt = (i: number, ch: string) => {
    if (ch.length > 1) {
      setCode(ch.toUpperCase().slice(0, 6));
      return;
    }
    const arr = code.padEnd(6, ' ').split('');
    arr[i] = ch.toUpperCase() || ' ';
    setCode(arr.join('').trimEnd());
    if (ch && i < 5) inputs.current[i + 1]?.focus();
  };
  return (
    <Screen header={<Header title="الانضمام لرحلة" onBack={() => navigation.goBack()} />}>
      {trip ? (
        <>
          <Txt center tone="muted">
            <Txt variant="bodyStrong">{owner?.name}</Txt> دعاك تنضم لرحلته
          </Txt>
          <Card padded={false}>
            <Photo scene={trip.scene} style={{ height: 150 }} />
            <View style={{ padding: 14, gap: 8 }}>
              <Txt variant="heading">{trip.title}</Txt>
              <Row wrap gap={12}>
                <Chip icon="calendar-outline" label={fmtRange(trip.startDate, trip.endDate)} />
                <Chip icon="people-outline" label={`${members.length} أعضاء`} />
                <Chip icon="location-outline" label={`${items.length} مكان بالجدول`} />
                {city ? <Chip icon="map-outline" label={city.name} /> : null}
              </Row>
            </View>
          </Card>
        </>
      ) : code.length === 6 ? (
        <Card tone="gold">
          <Txt tone="goldInk">الدعوة غير صالحة أو انتهت. اطلب رابط جديد من صاحب الرحلة.</Txt>
        </Card>
      ) : null}
      <Txt variant="bodyStrong" center>
        {trip ? 'رمز الدعوة' : 'اكتب رمز الدعوة'}
      </Txt>
      <Row gap={8} style={{ justifyContent: 'center', direction: 'ltr' } as never}>
        {Array.from({ length: 6 }, (_, i) => (
          <TextInput
            key={i}
            ref={(r) => {
              inputs.current[i] = r;
            }}
            value={code[i]?.trim() ?? ''}
            onChangeText={(t) => setAt(i, t)}
            maxLength={i === 0 ? 6 : 1}
            autoCapitalize="characters"
            accessibilityLabel={`خانة ${i + 1}`}
            style={{ width: 46, height: 54, borderRadius: 12, borderWidth: 1.5, borderColor: code[i] ? colors.primary : colors.border, backgroundColor: colors.card, textAlign: 'center', fontSize: 20, fontFamily: 'IBMPlexSansArabic_700Bold', color: colors.foreground }}
          />
        ))}
      </Row>
      <Btn
        size="lg"
        full
        title="انضم للرحلة"
        disabled={!trip}
        onPress={() => {
          const id = joinByCode(code);
          if (id) navigation.replace('Trip', { id });
        }}
      />
      <Txt variant="caption" tone="muted" center>
        تقدر تطلع من الرحلة بأي وقت
      </Txt>
    </Screen>
  );
}

export async function shareInvite(code: string, title: string) {
  const url = `https://yallansafer.app/join/${code}`;
  try {
    await Share.share({ message: `تعال معنا في «${title}» على يلا نسافر 👇\n${url}\nأو اكتب الرمز: ${code}` });
  } catch {
    await Clipboard.setStringAsync(url);
    toast('انسخ رابط الدعوة');
  }
}

export function useTripTitle(id?: string) {
  const t = useTrip(id);
  return t?.title ?? '';
}

