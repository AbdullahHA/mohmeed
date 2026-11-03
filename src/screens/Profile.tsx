/** حسابي (3) + الملف العام (4) + الجواز (15.11) + تعديل الملف (15.10) + منشور جديد + المتابعين */
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PassportCard, PlaceRow, PostCard, StampsRow, TripCard, UserLine } from '../components';
import { addStamp, createPost, openDirect, toggleFollow, updateProfile } from '../data/actions';
import { useCol, useMap, useMe, useMeId, useMyTrips, useStats, useToday, useUser } from '../data/selectors';
import type { SceneName, User } from '../data/types';
import { toast } from '../data/ui';
import { MONTHS_SHORT, todayISO } from '../lib/format';
import { follows as isFollowing, levelFor, mutual, overlap, xpFor } from '../lib/logic';
import type { RootProps } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { Avatar, BACK, Btn, Card, Chip, Empty, Faces, Field, HScroll, Icon, IconBtn, Photo, Pill, Row, Screen, Section, Segmented, Sheet, Stamp, Txt } from '../ui';


export function ProfileTab() {
  const me = useMeId();
  return <ProfileView userId={me} />;
}
export function UserScreen({ route }: RootProps<'User'>) {
  return <ProfileView userId={route.params.id} />;
}

function ProfileView({ userId }: { userId: string }) {
  const nav = useNavigation();
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const meId = useMeId();
  const isOwner = userId === meId;
  const u = useUser(userId);
  const stats = useStats(userId);
  const follows = useCol('follows');
  const posts = useCol('posts').filter((p) => p.userId === userId).sort((a, b) => b.createdAt - a.createdAt);
  const trips = useCol('trips');
  const members = useCol('members');
  const saved = useCol('saved').filter((s) => s.userId === userId);
  const reviews = useCol('reviews').filter((r) => r.userId === userId);
  const places = useMap('places');
  const users = useMap('users');
  const today = useToday();
  const myTrips = useMyTrips();
  const [tab, setTab] = useState<'trips' | 'posts' | 'reviews' | 'saved'>(isOwner ? 'trips' : 'posts');
  const [more, setMore] = useState(false);
  const theirTrips = useMemo(() => {
    const ids = new Set(members.filter((m) => m.userId === userId).map((m) => m.tripId));
    return trips.filter((t) => ids.has(t.id) && (isOwner || (t.published && (t.visibility === 'public' || (t.visibility === 'followers' && isFollowing(follows, meId, userId))))));
  }, [members, trips, userId, isOwner, follows, meId]);
  const mutualFriends = useMemo(() => {
    if (isOwner) return [];
    const mine = new Set(follows.filter((f) => f.followerId === meId).map((f) => f.followingId));
    return follows.filter((f) => f.followingId === userId && mine.has(f.followerId)).map((f) => users.get(f.followerId)!).filter(Boolean);
  }, [follows, meId, userId, isOwner, users]);
  // «نلتقي؟»: بس بين ناس يتابعون بعض (القرار 2)
  const together = useMemo(() => {
    const out: { mine: (typeof trips)[number]; theirs: (typeof trips)[number]; other: User }[] = [];
    const friends = isOwner ? follows.filter((f) => f.followerId === meId && mutual(follows, meId, f.followingId)).map((f) => f.followingId) : mutual(follows, meId, userId) ? [userId] : [];
    for (const { trip } of myTrips.filter((t) => t.status === 'upcoming')) {
      for (const fid of friends) {
        const theirIds = new Set(members.filter((m) => m.userId === fid).map((m) => m.tripId));
        const t2 = trips.find((t) => theirIds.has(t.id) && t.id !== trip.id && t.visibility !== 'private' && overlap(trip, t));
        if (t2 && users.get(fid)) out.push({ mine: trip, theirs: t2, other: users.get(fid)! });
      }
    }
    return out;
  }, [isOwner, follows, meId, userId, myTrips, members, trips, users]);
  if (!u) return <Empty icon="person-outline" title="المستخدم غير موجود" />;
  const following = isFollowing(follows, meId, userId);
  const xp = xpFor(stats);
  const lv = levelFor(xp);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <Photo scene={u.coverScene} style={{ height: 150 }}>
          <Row style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, justifyContent: 'space-between' }}>
            {isOwner ? <IconBtn name="settings-outline" label="الإعدادات" variant="glass" onPress={() => nav.navigate('Settings')} /> : <IconBtn name={BACK} label="رجوع" variant="glass" onPress={() => nav.goBack()} />}
            {isOwner ? <IconBtn name="create-outline" label="تعديل الملف" variant="glass" onPress={() => nav.navigate('EditProfile')} /> : <IconBtn name="share-outline" label="شارك الملف" variant="glass" onPress={() => toast('انسخ رابط الملف')} />}
          </Row>
        </Photo>
        <View style={{ paddingHorizontal: 18, marginTop: -46, gap: 12 }}>
          <Row style={{ justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <Avatar name={u.name} color={u.color} size={86} ring={posts.length > 0} uri={u.avatarUrl} />
            {stats.trips >= 3 || !isOwner ? <Chip tone="gold" icon="ribbon-outline" label={lv.level.name} /> : null}
          </Row>
          <View>
            <Row gap={6}>
              <Txt variant="title">{u.name}</Txt>
              {u.verified ? <Icon name="checkmark-circle" color={colors.primaryInk} size={20} /> : null}
            </Row>
            <Txt tone="muted" style={{ writingDirection: 'ltr', textAlign: 'right' }}>
              @{u.handle}
            </Txt>
          </View>
          <Row wrap gap={6}>
            {u.localExpertCity ? <Chip tone="gold" icon="ribbon-outline" label={`خبير محلي · ${u.localExpertCity}`} /> : null}
            {u.interests.slice(0, 2).map((i) => (
              <Chip key={i} label={i} />
            ))}
          </Row>
          {u.bio ? <Txt>{u.bio}</Txt> : isOwner ? (
            <Card tone="primary" onPress={() => nav.navigate('EditProfile')}>
              <Txt tone="primaryInk">كمّل ملفك: أضف نبذة عنك عشان المسافرين يعرفونك</Txt>
            </Card>
          ) : null}
          <Row wrap gap={14}>
            <Meta icon="location-outline" text={u.city} />
            <Meta icon="language-outline" text={u.languages.join(' · ')} />
            <Meta icon="calendar-outline" text={`يسافر من ${u.travelSince}`} />
          </Row>
          {!isOwner && mutualFriends.length ? (
            <Row gap={8}>
              <Faces people={mutualFriends} size={22} />
              <Txt variant="caption" tone="muted" style={{ flex: 1 }}>
                يتابعه {mutualFriends.slice(0, 2).map((f) => f.name.split(' ')[0]).join(' و')}
                {mutualFriends.length > 2 ? ` و${mutualFriends.length - 2} غيرهم تعرفهم` : ''}
              </Txt>
            </Row>
          ) : null}
          <Card padded={false}>
            <Row gap={0}>
              <Stat n={stats.countries} l="دولة" onPress={() => nav.navigate('Passport', { userId })} />
              <Stat n={stats.trips} l="رحلة" onPress={() => setTab('trips')} />
              <Stat n={stats.followers} l="متابع" onPress={() => nav.navigate('People', { userId, tab: 'followers' })} />
              {isOwner ? <Stat n={stats.following} l="يتابع" onPress={() => nav.navigate('People', { userId, tab: 'following' })} /> : <Stat n={stats.posts} l="منشور" onPress={() => setTab('posts')} />}
            </Row>
          </Card>
          {isOwner ? (
            <Row gap={8}>
              <Btn title="تعديل الملف" icon="create-outline" style={{ flex: 1 }} onPress={() => nav.navigate('EditProfile')} />
              <Btn title="منشور" icon="add" variant="ghost" style={{ flex: 1 }} onPress={() => nav.navigate('NewPost')} />
              <IconBtn name="person-add-outline" label="إضافة صديق" size={44} onPress={() => nav.navigate('Search')} />
            </Row>
          ) : (
            <Row gap={8}>
              <Btn title={following ? 'تتابعه' : 'متابعة'} icon={following ? 'checkmark' : 'person-add-outline'} variant={following ? 'ghost' : 'primary'} style={{ flex: 1 }} onPress={() => toggleFollow(userId)} />
              <Btn title="مراسلة" icon="chatbubble-outline" variant="ghost" style={{ flex: 1 }} onPress={() => nav.navigate('Chat', { id: openDirect(userId) })} />
              <IconBtn name="ellipsis-horizontal" label="المزيد" size={44} onPress={() => setMore(true)} />
            </Row>
          )}
        </View>

        <View style={{ paddingHorizontal: 18, gap: 16, marginTop: 18 }}>
          {stats.stamps.length ? (
            <HScroll gap={14}>
              {isOwner ? (
                <Pressable onPress={() => nav.navigate('Checkin')} style={{ alignItems: 'center', gap: 5, width: 62 }} accessibilityRole="button" accessibilityLabel="جديد">
                  <View style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.mutedForeground, alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="add" />
                  </View>
                  <Txt variant="caption">جديد</Txt>
                </Pressable>
              ) : null}
              {stats.stamps.map((s) => (
                <CityBubble key={s.id} cityId={s.cityId} />
              ))}
            </HScroll>
          ) : null}
          <PassportCard countries={stats.countries} xp={xp} title={isOwner ? 'جواز رحلاتي' : `جواز ${u.name.split(' ')[0]}`} showXp={isOwner} onPress={() => nav.navigate('Passport', { userId })} />
          {stats.stamps.length ? (
            <Section title={isOwner ? 'أختامي' : 'أختامه'} action={{ label: `الكل (${stats.stamps.length})`, onPress: () => nav.navigate('Passport', { userId }) }}>
              <StampsRow stamps={stats.stamps} onAdd={isOwner ? () => nav.navigate('Passport', { userId }) : undefined} />
            </Section>
          ) : null}
          {together.map((x) => (
            <Card key={x.mine.id + x.theirs.id} tone="primary" style={{ gap: 10 }}>
              <Row gap={10}>
                <View style={{ width: 38, height: 38, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={isOwner ? 'airplane' : 'people'} color="#fff" />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{isOwner ? `${x.other.name.split(' ')[0]} رايح نفس وجهتك` : 'أنتم الاثنين رايحين نفس المكان'}</Txt>
                  <Txt variant="caption" tone="muted">
                    {isOwner ? `بنفس أيام «${x.mine.title}»` : `هو ${x.theirs.startDate} – ${x.theirs.endDate}، وأنت ${x.mine.startDate} – ${x.mine.endDate}`}
                  </Txt>
                </View>
              </Row>
              <Row gap={8}>
                <Btn title="نلتقي؟" style={{ flex: 1 }} onPress={() => nav.navigate('Chat', { id: openDirect(x.other.id) })} />
                {x.theirs.published ? <Btn variant="ghost" title="شوف خطته" style={{ flex: 1 }} onPress={() => nav.navigate('PublicTrip', { id: x.theirs.id })} /> : null}
              </Row>
            </Card>
          ))}
          <Segmented
            value={tab}
            onChange={setTab}
            options={
              isOwner
                ? [
                    { key: 'trips', label: 'رحلاتي' },
                    { key: 'posts', label: 'منشوراتي' },
                    { key: 'reviews', label: 'تقييماتي' },
                    { key: 'saved', label: 'محفوظاتي' },
                  ]
                : [
                    { key: 'posts', label: 'منشورات' },
                    { key: 'trips', label: 'رحلات' },
                    { key: 'reviews', label: 'تقييمات' },
                  ]
            }
          />
          {tab === 'trips' ? (
            theirTrips.length ? (
              theirTrips.map((t) => <TripCard key={t.id} trip={t} onPress={() => (isOwner ? nav.navigate('Trip', { id: t.id }) : nav.navigate('PublicTrip', { id: t.id }))} />)
            ) : (
              <Empty icon="airplane-outline" title={isOwner ? 'ما عندك رحلات للحين' : 'ما فيه رحلات منشورة'} action={isOwner ? { label: 'خطط رحلتك الأولى', onPress: () => nav.navigate('CreateTrip') } : undefined} />
            )
          ) : tab === 'posts' ? (
            posts.length ? (
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 2 }}>
                {posts.map((p) => (
                  <Pressable key={p.id} onPress={() => p.placeId && nav.navigate('Place', { id: p.placeId })} style={{ width: '32.8%', aspectRatio: 4 / 5 }} accessibilityLabel={p.body}>
                    <Photo uri={p.photoUris?.[0]} scene={p.photos[0] ?? 'desert'} style={{ flex: 1 }}>
                      <Chip tone="glass" label={p.type === 'review' ? 'تقييم' : p.type === 'recap' ? 'ملخص' : 'منشور'} style={{ position: 'absolute', bottom: 6, end: 6, backgroundColor: 'rgba(0,0,0,0.45)' }} />
                    </Photo>
                  </Pressable>
                ))}
              </View>
            ) : (
              <Empty icon="images-outline" title="ما فيه منشورات" action={isOwner ? { label: 'انشر أول منشور', onPress: () => nav.navigate('NewPost') } : undefined} />
            )
          ) : tab === 'reviews' ? (
            reviews.length ? (
              reviews.map((r) => {
                const p = places.get(r.placeId);
                return p ? <PlaceRow key={r.id} place={p} sub={`${'★'.repeat(r.rating)} ${r.text}`} onPress={() => nav.navigate('Place', { id: p.id })} /> : null;
              })
            ) : (
              <Empty icon="star-outline" title="ما فيه تقييمات للحين" />
            )
          ) : saved.length ? (
            saved.map((s) => {
              const p = places.get(s.placeId);
              return p ? <PlaceRow key={s.id} place={p} onPress={() => nav.navigate('Place', { id: p.id })} /> : null;
            })
          ) : (
            <Empty icon="heart-outline" title="ما حفظت أماكن للحين" text="اضغط القلب على أي مكان عشان ينحفظ هنا." />
          )}
          {isOwner && tab === 'posts' && posts.length ? (
            <View style={{ gap: 12 }}>
              {posts.slice(0, 2).map((p) => (
                <PostCard key={p.id} post={p} onUser={() => {}} onPlace={() => p.placeId && nav.navigate('Place', { id: p.placeId })} />
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
      <Sheet visible={more} onClose={() => setMore(false)} title={u.name}>
        <Btn variant="ghost" icon="copy-outline" title="انسخ رابط الملف" onPress={() => (toast('انسخ الرابط'), setMore(false))} />
        <Btn variant="danger" icon="flag-outline" title="إبلاغ" onPress={() => (toast('وصلنا البلاغ'), setMore(false))} />
        <Btn variant="danger" icon="ban-outline" title="حظر" onPress={() => (toast(`حظرت ${u.name}`), setMore(false))} />
      </Sheet>
    </View>
  );
}

function Meta({ icon, text }: { icon: React.ComponentProps<typeof Icon>['name']; text: string }) {
  const { colors } = useAppTheme();
  return (
    <Row gap={4}>
      <Icon name={icon} size={14} color={colors.mutedForeground} />
      <Txt variant="caption" tone="muted">
        {text}
      </Txt>
    </Row>
  );
}
function Stat({ n, l, onPress }: { n: number; l: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel={`${n} ${l}`} style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderStartWidth: 0, borderColor: colors.border }}>
      <Txt variant="stat">{n >= 1000 ? `${(n / 1000).toFixed(1)}K` : n}</Txt>
      <Txt variant="caption" tone="muted">
        {l}
      </Txt>
    </Pressable>
  );
}
function CityBubble({ cityId }: { cityId: string }) {
  const nav = useNavigation();
  const c = useMap('cities').get(cityId);
  if (!c) return null;
  return (
    <Pressable onPress={() => nav.navigate('City', { id: c.id })} style={{ alignItems: 'center', gap: 5, width: 62 }} accessibilityRole="button" accessibilityLabel={c.name}>
      <Photo scene={c.scene} style={{ width: 60, height: 60, borderRadius: 30, borderWidth: 2, borderColor: '#fff' }} />
      <Txt variant="caption" numberOfLines={1}>
        {c.name}
      </Txt>
    </Pressable>
  );
}

/* ---------- المتابعين ---------- */
export function PeopleScreen({ route, navigation }: RootProps<'People'>) {
  const { userId, tab: t0 } = route.params;
  const [tab, setTab] = useState(t0);
  const follows = useCol('follows');
  const me = useMeId();
  const ids = tab === 'followers' ? follows.filter((f) => f.followingId === userId).map((f) => f.followerId) : follows.filter((f) => f.followerId === userId).map((f) => f.followingId);
  return (
    <Screen header={<Row gap={10} style={{ paddingHorizontal: 18, paddingVertical: 8 }}><IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} /><Txt variant="heading">الأصدقاء</Txt></Row>}>
      <Segmented value={tab} onChange={setTab} options={[{ key: 'followers', label: 'المتابعين' }, { key: 'following', label: 'يتابع' }]} />
      {ids.map((id) => (
        <UserLine
          key={id}
          id={id}
          onPress={() => navigation.push('User', { id })}
          right={id !== me ? <Btn size="sm" variant={isFollowing(follows, me, id) ? 'ghost' : 'primary'} title={isFollowing(follows, me, id) ? 'تتابعه' : 'تابع'} onPress={() => toggleFollow(id)} /> : null}
        />
      ))}
      {!ids.length ? <Empty icon="people-outline" title="تابع مسافرين عشان تشوف تجاربهم" action={{ label: 'ابحث عن أصدقاء', onPress: () => navigation.navigate('Search') }} /> : null}
    </Screen>
  );
}

/* ---------- الجواز ---------- */
export function PassportScreen({ route, navigation }: RootProps<'Passport'>) {
  const meId = useMeId();
  const userId = route.params?.userId ?? meId;
  const isOwner = userId === meId;
  const u = useUser(userId);
  const stats = useStats(userId);
  const cities = useCol('cities');
  const cityMap = useMap('cities');
  const [add, setAdd] = useState(false);
  const [pick, setPick] = useState<string | null>(null);
  const xp = xpFor(stats);
  const lv = levelFor(xp);
  const continents = new Set(stats.stamps.map((s) => ({ saudi: 'آسيا', gulf: 'آسيا', asia: 'آسيا', europe: 'أوروبا' })[cityMap.get(s.cityId)?.group ?? 'saudi']));
  const BADGES = [
    { label: 'أول رحلة', ok: stats.trips >= 1, icon: 'flag' as const, color: '#e07b24' },
    { label: '5 دول', ok: stats.countries >= 5, icon: 'globe' as const, color: '#2a55d8' },
    { label: 'ابن الصحراء', ok: stats.stamps.some((s) => cityMap.get(s.cityId)?.scene === 'desert'), icon: 'sunny' as const, color: '#ab5637' },
    { label: 'ناقد', ok: stats.reviews >= 3, icon: 'star' as const, color: '#1f9d63' },
    { label: '10 دول', ok: stats.countries >= 10, icon: 'earth' as const, color: '#6a5cf0' },
    { label: 'صديق الكل', ok: stats.followers >= 50, icon: 'people' as const, color: '#b2449a' },
  ];
  return (
    <Screen header={<Row gap={10} style={{ paddingHorizontal: 18, paddingVertical: 8 }}><IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} /><Txt variant="heading" style={{ flex: 1 }}>{isOwner ? 'جوازي' : `جواز ${u?.name.split(' ')[0]}`}</Txt>{isOwner ? <Btn size="sm" icon="add" title="أضف ختم" onPress={() => setAdd(true)} /> : null}</Row>}>
      <PassportCard countries={stats.countries} xp={xp} title={isOwner ? `${lv.level.name}` : u?.name ?? ''} showXp={isOwner} />
      <Row gap={8}>
        {[
          [stats.countries, 'دول'],
          [stats.cities, 'مدن'],
          [continents.size, 'قارات'],
        ].map(([n, l]) => (
          <Card key={l as string} style={{ flex: 1, alignItems: 'center' }}>
            <Txt variant="stat">{n}</Txt>
            <Txt variant="caption" tone="muted">
              {l}
            </Txt>
          </Card>
        ))}
      </Row>
      <Section title="الأختام">
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 18 }}>
          {stats.stamps.map((s, i) => {
            const d = new Date(s.date + 'T12:00');
            return (
              <Pressable key={s.id} onPress={() => navigation.navigate('City', { id: s.cityId })} style={{ width: '31%', alignItems: 'center' }}>
                <Stamp city={cityMap.get(s.cityId)?.name ?? ''} date={`${MONTHS_SHORT[d.getMonth()]} ${String(d.getFullYear()).slice(2)}`} index={i} square={i % 2 === 1} size={92} />
              </Pressable>
            );
          })}
        </View>
      </Section>
      {isOwner ? (
        <Section title="الشارات">
          <HScroll>
            {BADGES.map((b) => (
              <View key={b.label} style={{ width: 76, alignItems: 'center', gap: 6, opacity: b.ok ? 1 : 0.4 }} accessibilityLabel={`${b.label}${b.ok ? '' : '، مقفلة'}`}>
                <View style={{ width: 56, height: 56, borderRadius: 18, backgroundColor: b.ok ? b.color : '#9aa1b2', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={b.ok ? b.icon : 'lock-closed'} color="#fff" />
                </View>
                <Txt variant="caption" center>
                  {b.label}
                </Txt>
              </View>
            ))}
          </HScroll>
        </Section>
      ) : null}
      <Sheet visible={add} onClose={() => setAdd(false)} title="أضف ختم" subtitle="لمدينة زرتها قبل" footer={<Btn size="lg" full title="أضف" disabled={!pick} onPress={() => (addStamp(pick!, todayISO()), setAdd(false), setPick(null))} />}>
        <Row wrap gap={8}>
          {cities.map((c) => (
            <Pill key={c.id} label={c.name} active={pick === c.id} onPress={() => setPick(c.id)} />
          ))}
        </Row>
      </Sheet>
    </Screen>
  );
}

/* ---------- تعديل الملف ---------- */
const INTERESTS = ['طبيعة', 'أكل', 'تاريخ', 'مغامرات', 'تسوّق', 'فعاليات', 'بحر', 'تصوير', 'فخامة', 'اقتصادي'];
const CUISINES = ['سعودي', 'إيطالي', 'هندي', 'ياباني', 'لبناني', 'تركي', 'مأكولات بحرية'];
const DIETARY = ['حلال', 'نباتي', 'بدون جلوتين', 'حساسية مكسرات'];
export function EditProfileScreen({ navigation }: RootProps<'EditProfile'>) {
  const me = useMe();
  const [f, setF] = useState<Partial<User>>({ name: me.name, handle: me.handle, bio: me.bio, city: me.city, languages: me.languages, travelSince: me.travelSince, interests: me.interests, cuisines: me.cuisines, dietary: me.dietary, budget: me.budget, pace: me.pace, travelerType: me.travelerType, coverScene: me.coverScene, avatarUrl: me.avatarUrl });
  const users = useCol('users');
  const handleTaken = users.some((u) => u.id !== me.id && u.handle === f.handle);
  const dirty = JSON.stringify(f) !== JSON.stringify({ name: me.name, handle: me.handle, bio: me.bio, city: me.city, languages: me.languages, travelSince: me.travelSince, interests: me.interests, cuisines: me.cuisines, dietary: me.dietary, budget: me.budget, pace: me.pace, travelerType: me.travelerType, coverScene: me.coverScene, avatarUrl: me.avatarUrl });
  const toggle = (k: 'interests' | 'cuisines' | 'dietary' | 'languages', v: string) => setF({ ...f, [k]: (f[k] as string[]).includes(v) ? (f[k] as string[]).filter((x) => x !== v) : [...(f[k] as string[]), v] });
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [1, 1], quality: 0.7 });
    if (!r.canceled && r.assets[0]) setF({ ...f, avatarUrl: r.assets[0].uri });
  };
  const scenes: SceneName[] = ['desert', 'sea', 'city', 'green', 'night', 'old', 'mountain'];
  return (
    <Screen
      header={<Row gap={10} style={{ paddingHorizontal: 18, paddingVertical: 8 }}><IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} /><Txt variant="heading" style={{ flex: 1 }}>تعديل الملف</Txt></Row>}
      footer={<View style={{ padding: 18, paddingBottom: 28 }}><Btn size="lg" full title="احفظ" disabled={!dirty || handleTaken || !f.name?.trim()} onPress={() => (updateProfile(f), navigation.goBack())} /></View>}
    >
      <Row gap={14}>
        <Pressable onPress={pick} accessibilityRole="button" accessibilityLabel="غيّر الصورة">
          <Avatar name={f.name ?? ''} color={me.color} size={76} uri={f.avatarUrl} />
          <View style={{ position: 'absolute', bottom: 0, end: 0, width: 26, height: 26, borderRadius: 13, backgroundColor: '#0151e3', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="camera" size={14} color="#fff" />
          </View>
        </Pressable>
        <View style={{ flex: 1, gap: 6 }}>
          <Txt variant="bodyStrong">الغلاف</Txt>
          <HScroll gap={6}>
            {scenes.map((s) => (
              <Pressable key={s} onPress={() => setF({ ...f, coverScene: s })} accessibilityLabel={s}>
                <Photo scene={s} style={{ width: 54, height: 36, borderRadius: 8, borderWidth: f.coverScene === s ? 3 : 0, borderColor: '#0151e3' }} />
              </Pressable>
            ))}
          </HScroll>
        </View>
      </Row>
      <Field label="الاسم" value={f.name} onChangeText={(v) => setF({ ...f, name: v })} />
      <Field label="اسم المستخدم" value={f.handle} autoCapitalize="none" onChangeText={(v) => setF({ ...f, handle: v.replace(/[^a-z0-9._]/gi, '').toLowerCase() })} hint={handleTaken ? '⚠ الاسم مأخوذ، جرّب غيره' : 'حروف إنجليزية وأرقام ونقطة'} style={{ textAlign: 'left', writingDirection: 'ltr' }} />
      <Field label={`نبذة (${(f.bio ?? '').length}/150)`} value={f.bio} maxLength={150} multiline onChangeText={(v) => setF({ ...f, bio: v })} />
      <Field label="المدينة" value={f.city} onChangeText={(v) => setF({ ...f, city: v })} />
      <Field label="أسافر من سنة" keyboardType="number-pad" value={String(f.travelSince ?? '')} onChangeText={(v) => setF({ ...f, travelSince: Number(v) || 0 })} />
      <Section title="اللغات">
        <Row wrap gap={8}>{['عربي', 'English', 'Français', 'Türkçe'].map((l) => <Pill key={l} label={l} active={f.languages!.includes(l)} onPress={() => toggle('languages', l)} />)}</Row>
      </Section>
      <Section title="اهتماماتك">
        <Row wrap gap={8}>{INTERESTS.map((i) => <Pill key={i} label={i} active={f.interests!.includes(i)} onPress={() => toggle('interests', i)} />)}</Row>
      </Section>
      <Section title="مع مين تسافر عادة؟">
        <Row wrap gap={8}>{([['solo', 'لحالي'], ['couple', 'مع شريكي'], ['family', 'العائلة'], ['group', 'الشلة']] as const).map(([k, l]) => <Pill key={k} label={l} active={f.travelerType === k} onPress={() => setF({ ...f, travelerType: k })} />)}</Row>
      </Section>
      <Section title="الميزانية والإيقاع">
        <Row wrap gap={8}>{([['low', 'اقتصادي'], ['mid', 'متوسط'], ['high', 'فاخر']] as const).map(([k, l]) => <Pill key={k} label={l} active={f.budget === k} onPress={() => setF({ ...f, budget: k })} />)}</Row>
        <Row wrap gap={8}>{([['relaxed', 'هادي'], ['balanced', 'متوازن'], ['packed', 'مكثّف']] as const).map(([k, l]) => <Pill key={k} label={l} active={f.pace === k} onPress={() => setF({ ...f, pace: k })} />)}</Row>
      </Section>
      <Section title="الأكل">
        <Row wrap gap={8}>{CUISINES.map((c) => <Pill key={c} label={c} active={f.cuisines!.includes(c)} onPress={() => toggle('cuisines', c)} />)}</Row>
        <Row wrap gap={8}>{DIETARY.map((c) => <Pill key={c} label={c} active={f.dietary!.includes(c)} onPress={() => toggle('dietary', c)} />)}</Row>
      </Section>
    </Screen>
  );
}

/* ---------- منشور جديد / ملخص رحلة (22.13) ---------- */
export function NewPostScreen({ route, navigation }: RootProps<'NewPost'>) {
  const trip = useCol('trips').find((t) => t.id === route.params?.tripId);
  const items = useCol('items').filter((i) => i.tripId === trip?.id);
  const places = useMap('places');
  const city = useMap('cities').get(trip?.cityId ?? '');
  const recap = route.params?.recap;
  const [body, setBody] = useState(recap && trip ? `${trip.title} ✨ ${items.length} أماكن في ${city?.name}. أحلى شي كان ${places.get(items[0]?.placeId ?? '')?.name ?? ''}` : '');
  const [uris, setUris] = useState<string[]>([]);
  const [placeId, setPlaceId] = useState<string | null>(route.params?.placeId ?? items[0]?.placeId ?? null);
  const scenes = (items.map((i) => places.get(i.placeId ?? '')?.scene).filter(Boolean) as SceneName[]).slice(0, 4);
  const pick = async () => {
    const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsMultipleSelection: true, selectionLimit: 10, quality: 0.7 });
    if (!r.canceled) setUris(r.assets.map((a) => a.uri).slice(0, 10));
  };
  return (
    <Screen
      header={<Row gap={10} style={{ paddingHorizontal: 18, paddingVertical: 8 }}><IconBtn name="close" label="إغلاق" onPress={() => navigation.goBack()} /><Txt variant="heading" style={{ flex: 1 }}>{recap ? 'ملخص الرحلة' : 'منشور جديد'}</Txt></Row>}
      footer={<View style={{ padding: 18, paddingBottom: 28 }}><Btn size="lg" full title="انشر" disabled={!body.trim()} onPress={() => (createPost({ body, photos: uris.length ? uris.map(() => 'desert') : scenes.length ? scenes : ['desert'], photoUris: uris, placeId, tripId: trip?.id, type: recap ? 'recap' : 'post' }), navigation.goBack())} /></View>}
    >
      <HScroll gap={8}>
        <Pressable onPress={pick} style={{ width: 110, height: 140, borderRadius: 14, borderWidth: 1.5, borderStyle: 'dashed', borderColor: '#8a93a8', alignItems: 'center', justifyContent: 'center', gap: 6 }} accessibilityRole="button" accessibilityLabel="أضف صور">
          <Icon name="images-outline" size={26} />
          <Txt variant="caption">أضف صور (حتى 10)</Txt>
        </Pressable>
        {(uris.length ? uris : scenes).map((s, i) => (
          <Photo key={i} uri={uris.length ? s : null} scene={(uris.length ? 'desert' : s) as SceneName} style={{ width: 110, height: 140, borderRadius: 14 }} />
        ))}
      </HScroll>
      <Field label={`النص (${body.length}/500)`} value={body} onChangeText={setBody} maxLength={500} multiline placeholder="وش أحلى شي صار؟" />
      {items.length ? (
        <Section title="المكان">
          <Row wrap gap={8}>{items.filter((i) => i.placeId).map((i) => <Pill key={i.id} label={places.get(i.placeId!)?.name ?? ''} active={placeId === i.placeId} onPress={() => setPlaceId(i.placeId!)} />)}</Row>
        </Section>
      ) : null}
      {recap && trip ? (
        <Card tone="primary">
          <Txt tone="primaryInk">بعد النشر تقدر تنشر جدول الرحلة بعد عشان متابعينك ينسخون خطتك (من خيارات الرحلة).</Txt>
        </Card>
      ) : null}
    </Screen>
  );
}

