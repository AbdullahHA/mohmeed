/** الإعدادات (15.8) + الإشعارات (15.7) + محفظتي + الخصوصية ومشاركة الموقع (22.16) + سجّل وصولك (15.3) + القصص + الرحلة المنشورة (15.12) */
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Location from 'expo-location';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ItineraryItem, PlaceRow, UserLine, catIcon } from '../components';
import { PlacesMap } from '../components/PlacesMap';
import { checkin, copyTrip, joinByCode, markAllNotifsRead, signOut, startShare, stopShares, toggleFollow } from '../data/actions';
import { useStore } from '../data/store';
import { useCol, useMap, useMe, useMeId, useStats, useTrip } from '../data/selectors';
import type { NotifKind, Place } from '../data/types';
import { toast } from '../data/ui';
import { MONTHS_SHORT, fmtDayFull, fmtRange, timeAgo } from '../lib/format';
import { byCategory, fmtKm, km, sortItems, spent, tripDays } from '../lib/logic';
import { isCloud } from '../lib/supabase';
import type { RootProps } from '../navigation/types';
import { useAppTheme, type ThemeChoice } from '../theme/ThemeProvider';
import { palette } from '../theme/tokens';
import { Avatar, BACK, Btn, Card, Chip, Divider, Empty, Field, Header, Icon, IconBtn, ListRow, Photo, Pill, PillRow, Row, Screen, Section, Sheet, Stamp, Toggle, Txt, type IconName } from '../ui';

/* ---------- الإعدادات ---------- */
export function SettingsScreen({ navigation }: RootProps<'Settings'>) {
  const me = useMe();
  const { choice, setChoice } = useAppTheme();
  const settings = useStore((s) => s.settings);
  const setSettings = useStore((s) => s.setSettings);
  const resetDemo = useStore((s) => s.resetDemo);
  const fields = [me.bio, me.city, me.interests.length, me.cuisines.length, me.travelerType, me.budget, me.pace, me.avatarUrl];
  const complete = Math.round((fields.filter(Boolean).length / fields.length) * 100);
  return (
    <Screen header={<Header title="الإعدادات" onBack={() => navigation.goBack()} />}>
      <Card onPress={() => navigation.navigate('EditProfile')}>
        <Row gap={12}>
          <Avatar name={me.name} color={me.color} size={52} uri={me.avatarUrl} />
          <View style={{ flex: 1 }}>
            <Txt variant="heading">{me.name}</Txt>
            <Txt variant="caption" tone="muted">
              @{me.handle} · تعديل الملف
            </Txt>
          </View>
          <Icon name="chevron-back" size={16} />
        </Row>
      </Card>
      <Section title="المظهر">
        <Row gap={8}>
          {(
            [
              ['light', 'فاتح'],
              ['dark', 'داكن'],
              ['system', 'تلقائي'],
            ] as [ThemeChoice, string][]
          ).map(([k, l]) => (
            <ThemeCard key={k} k={k} label={l} active={choice === k} onPress={() => setChoice(k)} />
          ))}
        </Row>
      </Section>
      <Section title="الحساب">
        <Card padded={false}>
          <ListRow icon="wallet" iconBg="#d9932b" title="محفظتي" subtitle="برامج الولاء وأرقام العضوية" onPress={() => navigation.navigate('Wallet')} />
          <Divider />
          <ListRow icon="heart" iconBg="#2a55d8" title="تفضيلات السفر" subtitle="اهتماماتك، ميزانيتك، الأكل" value={`${complete}%`} onPress={() => navigation.navigate('EditProfile')} />
          <Divider />
          <ListRow icon="eye" iconBg="#1f9d63" title="الخصوصية" subtitle="مين يشوف رحلاتك وموقعك" value={{ private: 'أنا بس', followers: 'المتابعين', public: 'الكل' }[me.privacyTrips]} onPress={() => navigation.navigate('Privacy')} />
        </Card>
      </Section>
      <Section title="الإشعارات">
        <Card padded={false}>
          {(
            [
              ['invite', 'دعوات الرحلات'],
              ['poll', 'التصويت'],
              ['message', 'الرسائل'],
              ['reminder', 'تذكيرات الرحلة'],
              ['leave', '«اطلع الحين» أثناء الرحلة'],
              ['social', 'الإعجابات والمتابعين'],
              ['prayer', 'تذكير قبل الصلاة بـ 10 دقائق'],
            ] as [keyof typeof settings.notif, string][]
          ).map(([k, l], i) => (
            <View key={k}>
              {i ? <Divider /> : null}
              <ListRow title={l} right={<Toggle label={l} value={settings.notif[k]} onChange={(v) => setSettings({ notif: { ...settings.notif, [k]: v } })} />} />
            </View>
          ))}
        </Card>
      </Section>
      <Section title="التطبيق">
        <Card padded={false}>
          <ListRow icon="calendar" iconBg="#6a5cf0" title="التاريخ الهجري" subtitle="يطلع جنب الميلادي" right={<Toggle label="التاريخ الهجري" value={settings.hijri} onChange={(v) => setSettings({ hijri: v })} />} />
          <Divider />
          <ListRow icon="moon" iconBg="#16245c" title="فراغ وقت الصلاة" subtitle="لو اليوم مزحوم" right={<Toggle label="فراغ وقت الصلاة" value={settings.prayerGaps} onChange={(v) => setSettings({ prayerGaps: v })} />} />
          <Divider />
          <ListRow icon="language" iconBg="#2a9bb0" title="اللغة" value="العربية" />
          <Divider />
          <ListRow icon="help" iconBg="#5b6378" title="المساعدة والتواصل" onPress={() => toast('راسلنا على hello@yallansafer.app')} />
        </Card>
      </Section>
      {!isCloud ? (
        <Section title="وضع العرض">
          <Card padded={false}>
            <ListRow icon="flash" iconBg="#e07b24" title="معاينة «وضع اليوم»" subtitle="يعتبر اليوم هو اليوم الثاني من رحلة العلا" right={<Toggle label="معاينة وضع اليوم" value={settings.demoToday} onChange={(v) => setSettings({ demoToday: v })} />} />
            <Divider />
            <ListRow icon="refresh" iconBg="#5b6378" title="رجّع بيانات العرض" onPress={() => (resetDemo(), toast('رجعت البيانات'))} />
          </Card>
        </Section>
      ) : null}
      {me.isAdmin ? (
        <Card onPress={() => toast('لوحة التحكم على الويب: admin/ (شوف README)')}>
          <ListRow icon="shield-checkmark" iconBg="#16245c" title="لوحة التحكم" subtitle="المختارات، المواسم، المجتمعات، البلاغات" />
        </Card>
      ) : null}
      <Card padded={false}>
        <ListRow icon="log-out-outline" title="تسجيل الخروج" danger onPress={signOut} />
      </Card>
      <Txt variant="caption" tone="muted" center>
        يلا نسافر · الإصدار 1.0.0
      </Txt>
    </Screen>
  );
}

function ThemeCard({ k, label, active, onPress }: { k: ThemeChoice; label: string; active: boolean; onPress: () => void }) {
  const { colors } = useAppTheme();
  const L = palette.light, D = palette.dark;
  const bg = k === 'light' ? L.background : k === 'dark' ? D.background : undefined;
  return (
    <Pressable onPress={onPress} accessibilityRole="radio" accessibilityState={{ selected: active }} accessibilityLabel={label} style={{ flex: 1, padding: 8, gap: 6, borderRadius: 14, borderWidth: active ? 2 : 1, borderColor: active ? colors.primary : colors.border, alignItems: 'center' }}>
      <View style={{ width: '100%', height: 58, borderRadius: 9, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', flexDirection: 'row' }}>
        {k === 'system' ? (
          <>
            <View style={{ flex: 1, backgroundColor: L.background }} />
            <View style={{ flex: 1, backgroundColor: D.background }} />
          </>
        ) : (
          <View style={{ flex: 1, backgroundColor: bg, padding: 6, gap: 4 }}>
            <View style={{ height: 6, width: '60%', borderRadius: 3, backgroundColor: k === 'dark' ? D.primary : L.primary }} />
            <View style={{ height: 6, borderRadius: 3, backgroundColor: k === 'dark' ? D.border : L.border }} />
            <View style={{ height: 6, width: '70%', borderRadius: 3, backgroundColor: k === 'dark' ? D.border : L.border }} />
          </View>
        )}
      </View>
      <Txt variant={active ? 'bodyStrong' : 'body'} tone={active ? 'primaryInk' : 'foreground'}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ---------- محفظتي (برامج الولاء، خاصة) ---------- */
type Loyalty = { id: string; name: string; number: string };
export function WalletScreen({ navigation }: RootProps<'Wallet'>) {
  const [list, setList] = useState<Loyalty[]>([]);
  const [add, setAdd] = useState(false);
  const [name, setName] = useState('');
  const [num, setNum] = useState('');
  useEffect(() => {
    AsyncStorage.getItem('yalla-wallet').then((v) => v && setList(JSON.parse(v))).catch(() => {});
  }, []);
  const save = (l: Loyalty[]) => {
    setList(l);
    void AsyncStorage.setItem('yalla-wallet', JSON.stringify(l));
  };
  return (
    <Screen header={<Header title="محفظتي" subtitle="خاصة فيك، ما يشوفها أحد" onBack={() => navigation.goBack()} right={<Btn size="sm" icon="add" title="أضف" onPress={() => setAdd(true)} />} />}>
      {list.length ? (
        list.map((l) => (
          <Card key={l.id}>
            <Row>
              <Icon name="star" />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{l.name}</Txt>
                <Txt tone="muted" style={{ writingDirection: 'ltr', textAlign: 'right' }}>
                  {l.number}
                </Txt>
              </View>
              <IconBtn name="trash-outline" label="احذف" variant="bare" onPress={() => save(list.filter((x) => x.id !== l.id))} />
            </Row>
          </Card>
        ))
      ) : (
        <Empty icon="wallet-outline" title="ما أضفت برامج ولاء" text="مثل الفرسان، قطاف، Marriott Bonvoy. ترجع لها بسرعة وقت الحجز." action={{ label: 'أضف برنامج', onPress: () => setAdd(true) }} />
      )}
      <Sheet visible={add} onClose={() => setAdd(false)} title="برنامج ولاء" footer={<Btn size="lg" full title="احفظ" disabled={!name || !num} onPress={() => (save([...list, { id: String(Date.now()), name, number: num }]), setName(''), setNum(''), setAdd(false))} />}>
        <PillRow>
          {['الفرسان', 'قطاف', 'Marriott Bonvoy', 'Hilton Honors', 'Emirates Skywards'].map((n) => (
            <Pill key={n} label={n} active={name === n} onPress={() => setName(n)} />
          ))}
        </PillRow>
        <Field label="اسم البرنامج" value={name} onChangeText={setName} />
        <Field label="رقم العضوية" value={num} onChangeText={setNum} style={{ textAlign: 'left', writingDirection: 'ltr' }} />
      </Sheet>
    </Screen>
  );
}

/* ---------- الخصوصية + مشاركة الموقع ---------- */
export function PrivacyScreen({ navigation }: RootProps<'Privacy'>) {
  const me = useMe();
  const meId = useMeId();
  const patch = useStore((s) => s.patch);
  const follows = useCol('follows');
  const shares = useCol('shares').filter((s) => s.userId === meId && s.active && s.expiresAt > Date.now());
  const users = useMap('users');
  const [shareOpen, setShareOpen] = useState(false);
  const [who, setWho] = useState<string | null>(null);
  const [hours, setHours] = useState(24);
  const [del, setDel] = useState(false);
  const friends = follows.filter((f) => f.followerId === meId).map((f) => f.followingId);
  const exportData = async () => {
    const db = useStore.getState().db;
    const mine = { profile: db.users.find((u) => u.id === meId), trips: db.trips.filter((t) => t.ownerId === meId), posts: db.posts.filter((p) => p.userId === meId) };
    const text = JSON.stringify(mine, null, 2);
    if (Platform.OS === 'web') return toast('انسخت بياناتك');
    await Share.share({ message: text });
  };
  return (
    <Screen header={<Header title="الخصوصية" onBack={() => navigation.goBack()} />}>
      <Section title="مين يشوف رحلاتي المنشورة؟">
        <Row gap={8}>
          {(
            [
              ['private', 'أنا بس'],
              ['followers', 'المتابعين'],
              ['public', 'الكل'],
            ] as const
          ).map(([k, l]) => (
            <Pill key={k} label={l} active={me.privacyTrips === k} onPress={() => patch('users', meId, { privacyTrips: k })} />
          ))}
        </Row>
        <Txt variant="caption" tone="muted">
          الرحلات الجديدة خاصة دايماً لين تختار تنشرها.
        </Txt>
      </Section>
      <Card padded={false}>
        <ListRow
          title="أظهر في «مسافرين هنا الحين»"
          subtitle="للي يتابعونك بس. الغرباء يشوفون عدد فقط."
          right={<Toggle label="أظهر في مسافرين هنا" value={me.showHere} onChange={(v) => patch('users', meId, { showHere: v })} />}
        />
      </Card>
      <Section title="مشاركة موقعي مع شخص موثوق">
        {shares.length ? (
          <Card tone="success" style={{ gap: 8 }}>
            {shares.map((s) => (
              <Txt key={s.id} tone="successInk">
                موقعك ظاهر لـ{users.get(s.withUserId)?.name} لين {new Date(s.expiresAt).getHours()}:{String(new Date(s.expiresAt).getMinutes()).padStart(2, '0')}
              </Txt>
            ))}
            <Btn variant="danger" title="وقّف المشاركة" onPress={stopShares} />
          </Card>
        ) : (
          <Btn variant="ghost" icon="location-outline" title="شارك موقعي" onPress={() => setShareOpen(true)} />
        )}
        <Txt variant="caption" tone="muted">
          ما نحفظ سجل لمواقعك بعد ما تنتهي المشاركة.
        </Txt>
      </Section>
      <Section title="بياناتي">
        <Card padded={false}>
          <ListRow icon="download-outline" title="صدّر بياناتي" onPress={exportData} />
          <Divider />
          <ListRow icon="trash-outline" title="احذف حسابي" danger onPress={() => setDel(true)} />
        </Card>
      </Section>
      <Sheet visible={shareOpen} onClose={() => setShareOpen(false)} title="شارك موقعي مع…" footer={<Btn size="lg" full title="ابدأ المشاركة" disabled={!who} onPress={() => (startShare(who!, hours), setShareOpen(false))} />}>
        {friends.map((id) => (
          <Pressable key={id} onPress={() => setWho(id)}>
            <UserLine id={id} right={who === id ? <Icon name="checkmark-circle" /> : null} />
          </Pressable>
        ))}
        <Row gap={8}>
          {[
            [1, 'ساعة'],
            [12, 'اليوم'],
            [24 * 7, 'الرحلة كاملة'],
          ].map(([h, l]) => (
            <Pill key={l} label={l as string} active={hours === h} onPress={() => setHours(h as number)} />
          ))}
        </Row>
      </Sheet>
      <Sheet visible={del} onClose={() => setDel(false)} title="حذف الحساب" subtitle="ينحذف ملفك ورحلاتك ومنشوراتك نهائياً بعد 30 يوم">
        <Btn variant="danger" size="lg" full title="أكّد الحذف" onPress={() => (setDel(false), signOut(), toast('انطلب حذف الحساب. تقدر تتراجع خلال 30 يوم بتسجيل الدخول'))} />
        <Btn variant="ghost" title="تراجع" onPress={() => setDel(false)} />
      </Sheet>
    </Screen>
  );
}

/* ---------- الإشعارات ---------- */
const NK: Record<NotifKind, { icon: IconName; color: string }> = {
  invite: { icon: 'briefcase', color: '#0151e3' },
  poll: { icon: 'stats-chart', color: '#6a5cf0' },
  reminder: { icon: 'time', color: '#1f9d63' },
  like: { icon: 'heart', color: '#e4405e' },
  follow: { icon: 'person-add', color: '#0151e3' },
  task: { icon: 'checkbox', color: '#e07b24' },
  overlap: { icon: 'airplane', color: '#2a9bb0' },
  message: { icon: 'chatbubble', color: '#0151e3' },
  community: { icon: 'people', color: '#d97a2b' },
};
export function NotificationsScreen({ navigation }: RootProps<'Notifications'>) {
  const meId = useMeId();
  const all = useCol('notifications').filter((n) => n.userId === meId).sort((a, b) => b.createdAt - a.createdAt);
  const users = useMap('users');
  const trips = useMap('trips');
  const follows = useCol('follows');
  const { colors } = useAppTheme();
  const [f, setF] = useState<'all' | 'trips' | 'social'>('all');
  const list = all.filter((n) => f === 'all' || (f === 'trips' ? ['invite', 'poll', 'reminder', 'task', 'overlap'].includes(n.kind) : ['like', 'follow', 'community', 'message'].includes(n.kind)));
  const today = list.filter((n) => Date.now() - n.createdAt < 864e5);
  const week = list.filter((n) => Date.now() - n.createdAt >= 864e5);
  const open = (n: (typeof all)[number]) => {
    if (n.kind === 'invite' || n.kind === 'reminder' || n.kind === 'overlap') n.refId && trips.get(n.refId) && navigation.navigate('Trip', { id: n.refId });
    else if (n.kind === 'poll') n.refId && navigation.navigate('Chat', { id: n.refId });
    else if (n.kind === 'follow') n.refId && navigation.navigate('User', { id: n.refId });
  };
  const Item = ({ n }: { n: (typeof all)[number] }) => {
    const a = n.actorId ? users.get(n.actorId) : undefined;
    const k = NK[n.kind];
    return (
      <Pressable onPress={() => open(n)} style={{ flexDirection: 'row', gap: 12, paddingVertical: 12 }} accessibilityRole="button">
        <View>
          {a ? <Avatar name={a.name} color={a.color} size={44} /> : <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primarySoft }} />}
          <View style={{ position: 'absolute', bottom: -2, start: -2, width: 20, height: 20, borderRadius: 10, backgroundColor: k.color, borderWidth: 2, borderColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={k.icon} size={10} color="#fff" />
          </View>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <Txt>
            {a ? <Txt variant="bodyStrong">{a.name} </Txt> : null}
            {n.text}
          </Txt>
          <Txt variant="caption" tone="muted">
            {timeAgo(n.createdAt)}
          </Txt>
          {n.kind === 'invite' && n.refId ? (
            <Row gap={8}>
              <Btn size="sm" title="انضم" onPress={() => { const t = trips.get(n.refId!); if (t) { joinByCode(t.inviteCode); navigation.navigate('Trip', { id: t.id }); } }} />
              <Btn size="sm" variant="ghost" title="لاحقاً" />
            </Row>
          ) : n.kind === 'poll' ? (
            <Btn size="sm" variant="ghost" title="صوّت" onPress={() => open(n)} style={{ alignSelf: 'flex-start' }} />
          ) : n.kind === 'follow' && n.actorId && !follows.some((x) => x.followerId === meId && x.followingId === n.actorId) ? (
            <Btn size="sm" variant="ghost" title="تابعه" onPress={() => toggleFollow(n.actorId!)} style={{ alignSelf: 'flex-start' }} />
          ) : null}
        </View>
        {!n.read ? <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: colors.primary, marginTop: 18 }} /> : null}
      </Pressable>
    );
  };
  return (
    <Screen header={<Header title="الإشعارات" onBack={() => navigation.goBack()} right={<Btn size="sm" variant="plain" title="قراءة الكل" onPress={markAllNotifsRead} />} />}>
      <Row gap={8}>
        <Pill label="الكل" active={f === 'all'} onPress={() => setF('all')} />
        <Pill label="رحلاتي" active={f === 'trips'} onPress={() => setF('trips')} />
        <Pill label="المجتمع" active={f === 'social'} onPress={() => setF('social')} />
      </Row>
      {today.length ? (
        <View>
          <Txt variant="bodyStrong" tone="muted">
            اليوم
          </Txt>
          {today.map((n) => (
            <Item key={n.id} n={n} />
          ))}
        </View>
      ) : null}
      {week.length ? (
        <View>
          <Txt variant="bodyStrong" tone="muted">
            هالأسبوع وأقدم
          </Txt>
          {week.map((n) => (
            <Item key={n.id} n={n} />
          ))}
        </View>
      ) : null}
      {!list.length ? <Empty icon="notifications-outline" title="ما فيه إشعارات" /> : null}
    </Screen>
  );
}

/* ---------- سجّل وصولك ---------- */
export function CheckinScreen({ navigation }: RootProps<'Checkin'>) {
  const places = useCol('places');
  const cities = useMap('cities');
  const meId = useMeId();
  const stats = useStats(meId);
  const checkins = useCol('checkins');
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [pos, setPos] = useState<{ lat: number; lng: number } | null>(null);
  const [denied, setDenied] = useState(false);
  const [q, setQ] = useState('');
  useEffect(() => {
    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') return setDenied(true);
        const l = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setPos({ lat: l.coords.latitude, lng: l.coords.longitude });
      } catch {
        setDenied(true);
      }
    })();
  }, []);
  const origin = pos ?? { lat: 26.6245, lng: 37.9155 };
  const near = useMemo(
    () => [...places].filter((p) => !q || p.name.includes(q)).sort((a, b) => km(origin, a) - km(origin, b)).slice(0, 6),
    [places, origin.lat, origin.lng, q], // eslint-disable-line react-hooks/exhaustive-deps
  );
  const here = (p: Place) => new Set(checkins.filter((c) => c.placeId === p.id && Date.now() - c.createdAt < 864e5 * 30).map((c) => c.userId)).size;
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ height: 280 }}>
        {denied && !pos ? (
          <View style={{ flex: 1, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center', padding: 24, gap: 10 }}>
            <Icon name="location-outline" size={32} color={colors.primaryInk} />
            <Txt center>فعّل الموقع عشان نعرف وين أنت، أو ابحث عن المكان تحت.</Txt>
            <Btn size="sm" title="فعّل الموقع" onPress={() => Location.requestForegroundPermissionsAsync()} />
          </View>
        ) : (
          <PlacesMap places={near} center={origin} onPress={(p) => navigation.navigate('Place', { id: p.id })} />
        )}
        <Row style={{ position: 'absolute', top: insets.top + 8, start: 16 }}>
          <IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} />
        </Row>
      </View>
      <ScrollView style={{ marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.background }} contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 60 }}>
        <Txt variant="title">وين أنت الحين؟</Txt>
        <Field placeholder="ابحث عن المكان اللي أنت فيه" value={q} onChangeText={setQ} />
        {near.map((p, i) => (
          <Card key={p.id} tone={i === 0 && !q ? 'primary' : undefined}>
            <Row gap={10}>
              <Photo scene={p.scene} icon={catIcon(p.category)} style={{ width: 48, height: 48, borderRadius: 12 }} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{p.name}</Txt>
                <Txt variant="caption" tone="muted">
                  {fmtKm(km(origin, p))} منك{here(p) ? ` · ${here(p)} مسافرين هالشهر` : ''}
                </Txt>
              </View>
              <Btn
                size="sm"
                variant={i === 0 && !q ? 'primary' : 'ghost'}
                title="وصلت"
                onPress={() => {
                  const r = checkin(p.id);
                  toast(r.newStamp ? `🎉 ختم جديد في جوازك: ${cities.get(p.cityId)?.name}` : `سجّلت وصولك لـ${p.name}`);
                }}
              />
            </Row>
          </Card>
        ))}
        <Section title="وصولاتي السابقة" action={{ label: 'جوازي', onPress: () => navigation.navigate('Passport') }}>
          <Row style={{ justifyContent: 'space-between' }}>
            {stats.stamps.slice(0, 4).map((s, i) => {
              const d = new Date(s.date + 'T12:00');
              return <Stamp key={s.id} city={cities.get(s.cityId)?.name ?? ''} date={`${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`} index={i} square={i % 2 === 1} size={76} />;
            })}
          </Row>
        </Section>
      </ScrollView>
    </View>
  );
}

/* ---------- لفتات الموسم ---------- */
export function StoryScreen({ route, navigation }: RootProps<'Story'>) {
  const stories = useCol('stories');
  const s = stories.find((x) => x.id === route.params.id);
  const [i, setI] = useState(0);
  const insets = useSafeAreaInsets();
  if (!s) return null;
  const slide = s.slides[i];
  const next = () => (i + 1 < s.slides.length ? setI(i + 1) : navigation.goBack());
  return (
    <Pressable style={{ flex: 1 }} onPress={next} accessibilityRole="button" accessibilityLabel="التالي">
      <Photo scene={s.scene} scrim style={{ flex: 1 }}>
        <View style={{ position: 'absolute', top: insets.top + 8, start: 12, end: 12, gap: 10 }}>
          <Row gap={4}>
            {s.slides.map((_, k) => (
              <View key={k} style={{ flex: 1, height: 3, borderRadius: 2, backgroundColor: k <= i ? '#fff' : 'rgba(255,255,255,0.4)' }} />
            ))}
          </Row>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt variant="bodyStrong" tone="white">
              {s.title}
            </Txt>
            <IconBtn name="close" label="إغلاق" variant="glass" onPress={() => navigation.goBack()} />
          </Row>
        </View>
        <View style={{ position: 'absolute', bottom: insets.bottom + 40, start: 22, end: 22, gap: 10 }}>
          <Txt variant="display" tone="white">
            {slide.title}
          </Txt>
          <Txt tone="white" style={{ fontSize: 17, lineHeight: 28 }}>
            {slide.text}
          </Txt>
          {s.cityId ? <Btn title="اكتشف المدينة" onPress={() => navigation.replace('City', { id: s.cityId! })} style={{ alignSelf: 'flex-start' }} /> : null}
        </View>
      </Photo>
    </Pressable>
  );
}

/* ---------- الرحلة المنشورة (قراءة فقط) ---------- */
export function PublicTripScreen({ route, navigation }: RootProps<'PublicTrip'>) {
  const trip = useTrip(route.params.id);
  const items = useCol('items').filter((i) => i.tripId === trip?.id);
  const expenses = useCol('expenses').filter((e) => e.tripId === trip?.id);
  const owner = useMap('users').get(trip?.ownerId ?? '');
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  if (!trip) return <Empty icon="lock-closed-outline" title="هذا الجدول غير متاح" text="ممكن صاحبه خلاه خاص." />;
  const days = tripDays(trip);
  const cats = byCategory(expenses);
  const total = spent(expenses);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <Photo scene={trip.scene} scrim style={{ height: 200 }}>
          <Row style={{ position: 'absolute', top: insets.top + 8, start: 16 }}>
            <IconBtn name={BACK} label="رجوع" variant="glass" onPress={() => navigation.goBack()} />
          </Row>
          <View style={{ position: 'absolute', bottom: 16, start: 16, end: 16 }}>
            <Txt variant="title" tone="white">
              {trip.title}
            </Txt>
            <Txt variant="caption" tone="white">
              {owner?.name} · {fmtRange(trip.startDate, trip.endDate)}
            </Txt>
          </View>
        </Photo>
        <View style={{ padding: 18, gap: 14 }}>
          {days.map((d, k) => (
            <View key={d} style={{ gap: 8 }}>
              <Txt variant="heading">
                اليوم {k + 1} · {fmtDayFull(d)}
              </Txt>
              {sortItems(items.filter((i) => i.day === d)).map((it) => (
                <ItineraryItem key={it.id} item={it} onPress={() => it.placeId && navigation.navigate('Place', { id: it.placeId })} />
              ))}
            </View>
          ))}
          {total ? (
            <Card style={{ gap: 6 }}>
              <Txt variant="bodyStrong">توزيع الميزانية</Txt>
              {Object.entries(cats).map(([k, v]) => (
                <Row key={k} style={{ justifyContent: 'space-between' }}>
                  <Txt>{{ stay: 'السكن', food: 'الأكل', activities: 'الأنشطة', transport: 'المواصلات', other: 'أخرى' }[k]}</Txt>
                  <Txt variant="bodyStrong">{Math.round((v / total) * 100)}%</Txt>
                </Row>
              ))}
            </Card>
          ) : null}
        </View>
      </ScrollView>
      <View style={{ position: 'absolute', bottom: 24, start: 16, end: 16 }}>
        <Btn size="lg" icon="copy-outline" title="انسخ الخطة لرحلتي" onPress={() => { const id = copyTrip(trip.id); if (id) navigation.replace('Trip', { id }); }} />
      </View>
    </View>
  );
}

