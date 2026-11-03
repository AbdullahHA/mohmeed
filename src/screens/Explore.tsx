/** اكتشف (5) + النتائج (6) + البحث الموحّد */
import { useNavigation } from '@react-navigation/native';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, TextInput, View } from 'react-native';

import { CATEGORIES, CategoryGrid, PlaceCardSmall, PlaceRow, ResultCard, catLabel } from '../components';
import { PlacesMap } from '../components/PlacesMap';
import { useCol, useFlag, useMap, useMe, useMyTrips } from '../data/selectors';
import type { Category, Place } from '../data/types';
import { recommend, openState } from '../lib/logic';
import type { RootProps } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { BACK, Btn, Card, Empty, Header, Icon, IconBtn, Photo, Pill, PillRow, Row, Screen, Section, Segmented, Sheet, Txt, HScroll } from '../ui';

export function ExploreScreen() {
  const nav = useNavigation();
  const { colors } = useAppTheme();
  const me = useMe();
  const cities = useCol('cities');
  const places = useCol('places');
  const trips = useMyTrips();
  const sponsoredOn = useFlag('sponsored_places');
  const [cityId, setCityId] = useState('c_riyadh');
  const [cityPick, setCityPick] = useState(false);
  const [when, setWhen] = useState('all');
  const [group, setGroup] = useState<'saudi' | 'gulf' | 'europe' | 'asia'>('saudi');
  const city = cities.find((c) => c.id === cityId)!;
  const upcoming = trips.find((t) => t.status === 'upcoming' || t.status === 'ongoing')?.trip;
  const picks = useMemo(() => {
    const pool = places.filter((p) => (p.cityId === cityId || p.cityId === upcoming?.cityId) && p.category !== 'hotels' && (sponsoredOn || !p.sponsored));
    return recommend(pool, me, cities, upcoming?.cityId).slice(0, 8);
  }, [places, cityId, me, cities, upcoming, sponsoredOn]);
  const weekend = places.filter((p) => p.cityId === cityId && (p.category === 'events' || p.category === 'experiences'));
  const whenOpts = [
    { k: 'all', l: 'الكل' },
    { k: 'open', l: 'مفتوح الآن', icon: 'time-outline' as const },
    { k: 'today', l: 'اليوم' },
    { k: 'weekend', l: 'الويكند' },
    { k: 'week', l: 'هالأسبوع' },
  ];
  const header = (
    <View style={{ paddingHorizontal: 18, gap: 12, paddingTop: 4 }}>
      <Row style={{ justifyContent: 'space-between' }}>
        <Pressable onPress={() => setCityPick(true)} accessibilityRole="button" accessibilityLabel={`المدينة: ${city.name}، غيّر`}>
          <Txt variant="caption" tone="muted">
            أنت في
          </Txt>
          <Row gap={4}>
            <Txt variant="title" style={{ fontSize: 20 }}>
              {city.name}
            </Txt>
            <Icon name="chevron-down" size={18} color={colors.primaryInk} />
          </Row>
        </Pressable>
        <Row gap={8}>
          <IconBtn name="map-outline" label="الخريطة" onPress={() => nav.navigate('Results', { cityId })} />
          <IconBtn name="heart-outline" label="المحفوظات" onPress={() => nav.navigate('Tabs', { screen: 'Profile' })} />
        </Row>
      </Row>
      <Pressable
        onPress={() => nav.navigate('Search')}
        accessibilityRole="search"
        accessibilityLabel="ابحث"
        style={{ height: 48, borderRadius: 16, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, gap: 10 }}
      >
        <Icon name="search" size={18} color={colors.mutedForeground} />
        <Txt tone="muted" style={{ flex: 1 }}>
          مطعم، فعالية، مدينة، مسافر…
        </Txt>
        <View style={{ width: 32, height: 32, borderRadius: 10, backgroundColor: colors.primarySoft, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="options-outline" size={16} color={colors.primaryInk} />
        </View>
      </Pressable>
    </View>
  );
  return (
    <Screen header={header} contentStyle={{ paddingTop: 12 }}>
      <PillRow>
        {whenOpts.map((w) => (
          <Pill key={w.k} label={w.l} icon={w.icon} active={when === w.k} onPress={() => (w.k === 'all' ? setWhen('all') : nav.navigate('Results', { cityId, when: w.k }))} />
        ))}
      </PillRow>
      <CategoryGrid onPick={(c) => nav.navigate('Results', { category: c, cityId })} />
      <Section title={`مختارة لك يا ${me.name.split(' ')[0]}`} action={{ label: 'الكل', onPress: () => nav.navigate('Results', { cityId }) }}>
        <HScroll>
          {picks.map(({ place, reason }) => (
            <PlaceCardSmall key={place.id} place={place} reason={reason} onPress={() => nav.navigate('Place', { id: place.id })} />
          ))}
        </HScroll>
      </Section>
      {weekend.length ? (
        <Section title="يصير هالويكند" action={{ label: `الكل (${weekend.length})`, onPress: () => nav.navigate('Results', { cityId, category: 'events' }) }}>
          <View style={{ gap: 12 }}>
            {weekend.slice(0, 3).map((p) => (
              <PlaceRow
                key={p.id}
                place={p}
                onPress={() => nav.navigate('Place', { id: p.id })}
                right={
                  p.ticketFrom ? (
                    <View style={{ alignItems: 'flex-end' }}>
                      <Txt variant="bodyStrong" tone="primaryInk">
                        {p.ticketFrom} ﷼
                      </Txt>
                      <Txt variant="caption" tone="muted" style={{ fontSize: 11 }}>
                        يبدأ من
                      </Txt>
                    </View>
                  ) : undefined
                }
              />
            ))}
          </View>
        </Section>
      ) : null}
      <Section title="الوجهات">
        <Segmented
          value={group}
          onChange={setGroup}
          options={[
            { key: 'saudi', label: 'السعودية' },
            { key: 'gulf', label: 'الخليج' },
            { key: 'europe', label: 'أوروبا' },
            { key: 'asia', label: 'آسيا' },
          ]}
        />
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {cities
            .filter((c) => c.group === group)
            .map((c) => (
              <Pressable key={c.id} onPress={() => nav.navigate('City', { id: c.id })} style={{ width: '31.8%' }} accessibilityRole="button" accessibilityLabel={c.name}>
                <Photo scene={c.scene} scrim style={{ aspectRatio: 3 / 4, borderRadius: 14 }}>
                  <Txt variant="bodyStrong" tone="white" style={{ position: 'absolute', bottom: 8, start: 8 }}>
                    {c.name}
                  </Txt>
                </Photo>
              </Pressable>
            ))}
        </View>
      </Section>
      <Sheet visible={cityPick} onClose={() => setCityPick(false)} title="وين أنت؟">
        {cities.map((c) => (
          <Card
            key={c.id}
            onPress={() => {
              setCityId(c.id);
              setCityPick(false);
            }}
            tone={c.id === cityId ? 'primary' : undefined}
          >
            <Row>
              <Photo scene={c.scene} style={{ width: 40, height: 40, borderRadius: 10 }} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{c.name}</Txt>
                <Txt variant="caption" tone="muted">
                  {c.country}
                </Txt>
              </View>
            </Row>
          </Card>
        ))}
      </Sheet>
    </Screen>
  );
}

type Sort = 'rating' | 'near' | 'price';
export function ResultsScreen({ route, navigation }: RootProps<'Results'>) {
  const { category, cityId = 'c_riyadh', when, query } = route.params ?? {};
  const cities = useMap('cities');
  const places = useCol('places');
  const sponsoredOn = useFlag('sponsored_places');
  const city = cities.get(cityId);
  const [cat, setCat] = useState<Category | undefined>(category);
  const [openNow, setOpenNow] = useState(when === 'open');
  const [family, setFamily] = useState(false);
  const [halal, setHalal] = useState(false);
  const [wheel, setWheel] = useState(false);
  const [price, setPrice] = useState<number | null>(null);
  const [sort, setSort] = useState<Sort>('rating');
  const [view, setView] = useState<'list' | 'map'>('list');
  const [filters, setFilters] = useState(false);
  const list = useMemo(() => {
    let l = places.filter((p) => p.cityId === cityId && (sponsoredOn || !p.sponsored));
    if (cat) l = l.filter((p) => p.category === cat);
    if (when === 'weekend' || when === 'week' || when === 'today') l = l.filter((p) => p.category === 'events' || p.category === 'experiences' || p.eventDates);
    if (query) l = l.filter((p) => p.name.includes(query) || p.kind.includes(query) || p.tags.some((t) => t.includes(query)));
    if (openNow) l = l.filter((p) => openState(p).open);
    if (family) l = l.filter((p) => p.amenities.includes('family') || p.amenities.includes('kids'));
    if (halal) l = l.filter((p) => p.amenities.includes('halal') || city?.countryCode === 'SA');
    if (wheel) l = l.filter((p) => p.amenities.includes('wheelchair'));
    if (price) l = l.filter((p) => p.priceLevel <= price);
    return l.sort((a, b) => (sort === 'price' ? a.priceLevel - b.priceLevel : sort === 'near' && city ? Math.hypot(a.lat - city.lat, a.lng - city.lng) - Math.hypot(b.lat - city.lat, b.lng - city.lng) : b.rating - a.rating));
  }, [places, cityId, cat, when, query, openNow, family, halal, wheel, price, sort, city, sponsoredOn]);
  const activeCount = [family, halal, wheel, !!price].filter(Boolean).length;
  const title = cat ? `${catLabel(cat)} ${city?.name ?? ''}` : query ? `«${query}»` : `${city?.name ?? ''}`;
  return (
    <Screen
      padded={false}
      scroll={false}
      header={
        <>
          <Header title={title} subtitle={`${list.length} مكان`} onBack={() => navigation.goBack()} right={<IconBtn name="search" label="بحث" onPress={() => navigation.navigate('Search')} />} />
          <PillRowPadded>
            <Pill label="فلتر" icon="options-outline" count={activeCount || undefined} onPress={() => setFilters(true)} />
            <Pill label={{ rating: 'الأعلى تقييماً', near: 'الأقرب', price: 'الأرخص' }[sort]} icon="swap-vertical" onPress={() => setSort(sort === 'rating' ? 'near' : sort === 'near' ? 'price' : 'rating')} />
            <Pill label="مفتوح الآن" active={openNow} onPress={() => setOpenNow(!openNow)} />
            <Pill label="عائلي" active={family} onPress={() => setFamily(!family)} />
            {city?.countryCode !== 'SA' ? <Pill label="حلال" active={halal} onPress={() => setHalal(!halal)} /> : null}
            {CATEGORIES.slice(0, 4).map((c) => (
              <Pill key={c.key} label={c.label} active={cat === c.key} onPress={() => setCat(cat === c.key ? undefined : c.key)} />
            ))}
          </PillRowPadded>
        </>
      }
    >
      {view === 'map' ? (
        <PlacesMap places={list} center={city} onPress={(p: Place) => navigation.navigate('Place', { id: p.id })} />
      ) : (
        <ScrollList>
          {list.length ? (
            list.map((p) => <ResultCard key={p.id} place={p} origin={city} onPress={() => navigation.navigate('Place', { id: p.id })} />)
          ) : (
            <Empty
              icon="search-outline"
              title="ما لقينا شي بهالفلاتر"
              text="جرّب تشيل بعض الفلاتر أو تغيّر المدينة."
              action={{ label: 'امسح الفلاتر', onPress: () => (setFamily(false), setHalal(false), setWheel(false), setPrice(null), setOpenNow(false), setCat(undefined)) }}
            />
          )}
        </ScrollList>
      )}
      <FloatSwitch view={view} onToggle={() => setView(view === 'list' ? 'map' : 'list')} />
      <Sheet visible={filters} onClose={() => setFilters(false)} title="الفلاتر" footer={<Btn size="lg" full title={`اعرض ${list.length} مكان`} onPress={() => setFilters(false)} />}>
        <Txt variant="bodyStrong">السعر</Txt>
        <Row gap={8}>
          {[1, 2, 3, 4].map((n) => (
            <Pill key={n} label={'$'.repeat(n)} active={price === n} onPress={() => setPrice(price === n ? null : n)} />
          ))}
        </Row>
        <Txt variant="bodyStrong">يناسب</Txt>
        <Row wrap gap={8}>
          <Pill label="العوائل والأطفال" active={family} onPress={() => setFamily(!family)} />
          <Pill label="كرسي متحرك" active={wheel} onPress={() => setWheel(!wheel)} />
          <Pill label="حلال" active={halal} onPress={() => setHalal(!halal)} />
        </Row>
      </Sheet>
    </Screen>
  );
}

function PillRowPadded({ children }: { children: React.ReactNode }) {
  const { colors } = useAppTheme();
  return (
    <View style={{ paddingHorizontal: 18, paddingBottom: 12, borderBottomWidth: 1, borderColor: colors.border }}>
      <PillRow>{children}</PillRow>
    </View>
  );
}
function ScrollList({ children }: { children: React.ReactNode }) {
  return <ScrollView contentContainerStyle={{ padding: 18, gap: 26, paddingBottom: 140 }}>{children}</ScrollView>;
}
function FloatSwitch({ view, onToggle }: { view: 'list' | 'map'; onToggle: () => void }) {
  const { colors, shadow } = useAppTheme();
  return (
    <Pressable
      onPress={onToggle}
      accessibilityRole="button"
      style={[{ position: 'absolute', bottom: 34, alignSelf: 'center', backgroundColor: colors.foreground, borderRadius: 999, paddingHorizontal: 20, height: 46, flexDirection: 'row', alignItems: 'center', gap: 8 }, shadow.float]}
    >
      <Icon name={view === 'list' ? 'map-outline' : 'list-outline'} size={18} color={colors.background} />
      <Txt variant="bodyStrong" style={{ color: colors.background }}>
        {view === 'list' ? 'الخريطة' : 'القائمة'}
      </Txt>
    </Pressable>
  );
}

/** البحث الموحّد: أماكن، مدن، مسافرين، منشورات */
export function SearchScreen({ navigation }: RootProps<'Search'>) {
  const { colors } = useAppTheme();
  const [q, setQ] = useState('');
  const places = useCol('places');
  const cities = useCol('cities');
  const users = useCol('users');
  const posts = useCol('posts');
  const r = useMemo(() => {
    const s = q.trim();
    if (!s) return null;
    return {
      cities: cities.filter((c) => c.name.includes(s) || c.country.includes(s)),
      places: places.filter((p) => p.name.includes(s) || p.kind.includes(s) || (p.cuisine ?? '').includes(s) || p.tags.some((t) => t.includes(s))).slice(0, 8),
      users: users.filter((u) => u.name.includes(s) || u.handle.includes(s.toLowerCase())).slice(0, 5),
      posts: posts.filter((p) => p.body.includes(s)).slice(0, 5),
    };
  }, [q, places, cities, users, posts]);
  return (
    <Screen
      header={
        <Row gap={8} style={{ paddingHorizontal: 18, paddingVertical: 8 }}>
          <IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} />
          <View style={{ flex: 1, height: 46, borderRadius: 14, borderWidth: 1, borderColor: colors.primary, backgroundColor: colors.card, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, gap: 8 }}>
            <Icon name="search" size={18} color={colors.mutedForeground} />
            <TextInput
              autoFocus
              value={q}
              onChangeText={setQ}
              placeholder="مطعم، فعالية، مدينة، مسافر…"
              placeholderTextColor={colors.mutedForeground}
              returnKeyType="search"
              accessibilityLabel="بحث"
              style={{ flex: 1, color: colors.foreground, fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 15, textAlign: 'right' }}
              onSubmitEditing={() => q.trim() && navigation.navigate('Results', { query: q.trim(), cityId: places.find((p) => p.name.includes(q.trim()))?.cityId })}
            />
          </View>
        </Row>
      }
    >
      {!r ? (
        <Section title="جرّب">
          <Row wrap gap={8}>
            {['قهوة مختصة', 'العلا', 'عائلي', 'غروب', 'سارة'].map((s) => (
              <Pill key={s} label={s} onPress={() => setQ(s)} />
            ))}
          </Row>
        </Section>
      ) : (
        <>
          {r.cities.length ? (
            <Section title="مدن">
              {r.cities.map((c) => (
                <Card key={c.id} onPress={() => navigation.navigate('City', { id: c.id })}>
                  <Row>
                    <Photo scene={c.scene} style={{ width: 44, height: 44, borderRadius: 12 }} />
                    <Txt variant="bodyStrong" style={{ flex: 1 }}>
                      {c.name} · {c.country}
                    </Txt>
                  </Row>
                </Card>
              ))}
            </Section>
          ) : null}
          {r.places.length ? (
            <Section title="أماكن">
              {r.places.map((p) => (
                <PlaceRow key={p.id} place={p} onPress={() => navigation.navigate('Place', { id: p.id })} />
              ))}
            </Section>
          ) : null}
          {r.users.length ? (
            <Section title="مسافرين">
              {r.users.map((u) => (
                <Card key={u.id} onPress={() => navigation.navigate('User', { id: u.id })}>
                  <Row>
                    <View style={{ width: 40, height: 40, borderRadius: 20, backgroundColor: u.color }} />
                    <View style={{ flex: 1 }}>
                      <Txt variant="bodyStrong">{u.name}</Txt>
                      <Txt variant="caption" tone="muted">
                        @{u.handle}
                      </Txt>
                    </View>
                  </Row>
                </Card>
              ))}
            </Section>
          ) : null}
          {r.posts.length ? (
            <Section title="منشورات">
              {r.posts.map((p) => (
                <Card key={p.id} onPress={() => navigation.navigate('User', { id: p.userId })}>
                  <Txt numberOfLines={2}>{p.body}</Txt>
                </Card>
              ))}
            </Section>
          ) : null}
          {!r.cities.length && !r.places.length && !r.users.length && !r.posts.length ? <Empty icon="search-outline" title="ما لقينا نتائج" text="جرّب كلمة ثانية أو اسأل الدليل." action={{ label: 'اسأل الدليل', onPress: () => navigation.navigate('Guide', { q }) }} /> : null}
        </>
      )}
    </Screen>
  );
}
