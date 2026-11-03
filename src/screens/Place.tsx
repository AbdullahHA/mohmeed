/** صفحة المكان (7) وصفحة المدينة (15.2) */
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { PlaceRow, Rating, catIcon, catLabel } from '../components';
import { PlacesMap } from '../components/PlacesMap';
import { useSheets } from '../components/sheets';
import { toggleSave, toggleWish } from '../data/actions';
import { useCity, useCol, useFlag, useMap, useMeId, usePlace } from '../data/selectors';
import { fmtTime, num } from '../lib/format';
import { fmtKm, km, openState, priceLabel } from '../lib/logic';
import type { RootProps } from '../navigation/types';
import { useAppTheme } from '../theme/ThemeProvider';
import { BACK, Avatar, Btn, Card, Chip, Empty, Faces, Icon, IconBtn, Photo, Pill, Row, Section, StickyBar, Txt, type IconName } from '../ui';

const AMENITY: Record<string, { icon: IconName; label: string }> = {
  parking: { icon: 'car-outline', label: 'موقف سيارات' },
  wifi: { icon: 'wifi-outline', label: 'إنترنت مجاني' },
  family: { icon: 'people-outline', label: 'مناسب للعوائل' },
  kids: { icon: 'happy-outline', label: 'فيه أنشطة للأطفال' },
  wheelchair: { icon: 'accessibility-outline', label: 'مدخل للكراسي المتحركة' },
  reservation: { icon: 'calendar-outline', label: 'يُفضّل تحجز عندهم مسبقاً، خصوصاً الويكند' },
  halal: { icon: 'checkmark-circle-outline', label: 'حلال' },
  prayer: { icon: 'moon-outline', label: 'فيه مصلى' },
};

export function PlaceScreen({ route, navigation }: RootProps<'Place'>) {
  const p = usePlace(route.params.id);
  const city = useCity(p?.cityId);
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const me = useMeId();
  const saved = useCol('saved').some((s) => s.userId === me && s.placeId === p?.id);
  const reviews = useCol('reviews').filter((r) => r.placeId === p?.id);
  const follows = useCol('follows');
  const users = useMap('users');
  const affiliate = useFlag('affiliate_booking');
  const openAdd = useSheets((s) => s.openAddToTrip);
  const openShare = useSheets((s) => s.openShare);
  const openReview = useSheets((s) => s.openReview);
  const [photo, setPhoto] = useState(0);
  const sortedReviews = useMemo(() => {
    const f = new Set(follows.filter((x) => x.followerId === me).map((x) => x.followingId));
    return [...reviews].sort((a, b) => Number(f.has(b.userId)) - Number(f.has(a.userId)) || b.createdAt - a.createdAt).map((r) => ({ ...r, friend: f.has(r.userId) }));
  }, [reviews, follows, me]);
  if (!p) return <Empty icon="alert-circle-outline" title="المكان غير موجود" />;
  const st = openState(p);
  const ours = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : null;
  const scenes = [p.scene, 'food', 'city'] as const;
  const quick: { icon: IconName; label: string; go?: () => void }[] = [
    { icon: 'navigate-outline' as IconName, label: 'الاتجاهات', go: () => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`) },
    ...(p.phone ? [{ icon: 'call-outline' as IconName, label: 'اتصال', go: () => Linking.openURL(`tel:${p.phone}`) }] : []),
    ...(p.website ? [{ icon: 'globe-outline' as IconName, label: 'الموقع', go: () => Linking.openURL(p.website!) }] : []),
    ...(p.menuUrl ? [{ icon: 'restaurant-outline' as IconName, label: 'المنيو', go: () => Linking.openURL(p.menuUrl!) }] : []),
    { icon: 'share-social-outline' as IconName, label: 'شارك', go: () => openShare(p.id) },
  ].slice(0, 4);
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <Photo uri={photo === 0 ? p.photo : null} scene={scenes[photo] as never} icon={catIcon(p.category)} style={{ height: 330 }} label={`صورة ${p.name}`}>
          <Row style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, justifyContent: 'space-between' }}>
            <IconBtn name={BACK} label="رجوع" variant="glass" onPress={() => navigation.goBack()} />
            <Row gap={8}>
              <IconBtn name={saved ? 'heart' : 'heart-outline'} color={saved ? '#ff6b81' : '#fff'} label={saved ? 'شيل من المحفوظات' : 'احفظ'} variant="glass" onPress={() => toggleSave(p.id)} />
              <IconBtn name="share-outline" label="شارك" variant="glass" onPress={() => openShare(p.id)} />
            </Row>
          </Row>
          <Pressable onPress={() => setPhoto((photo + 1) % 3)} style={{ position: 'absolute', bottom: 36, start: 16 }} accessibilityRole="button" accessibilityLabel="الصورة التالية">
            <Chip tone="glass" label={`${photo + 1} / 3`} style={{ backgroundColor: 'rgba(0,0,0,0.45)' }} />
          </Pressable>
        </Photo>
        <View style={{ marginTop: -22, borderTopLeftRadius: 26, borderTopRightRadius: 26, backgroundColor: colors.background, padding: 18, gap: 14 }}>
          <Row wrap gap={6}>
            <Chip tone="gold" label={catLabel(p.category)} />
            {p.cuisine ? <Chip label={p.cuisine} /> : null}
            {p.tags.slice(0, 3).map((t) => (
              <Chip key={t} label={t} />
            ))}
          </Row>
          <Txt variant="title" accessibilityRole="header">
            {p.name}
          </Txt>
          <Row wrap gap={8}>
            <Rating value={p.rating} count={p.ratingCount} />
            <Txt tone="muted">·</Txt>
            <Txt variant="bodyStrong" tone={st.open ? 'successInk' : 'destructive'}>
              {st.open ? 'مفتوح الآن' : 'مقفل'}
            </Txt>
            <Txt variant="caption" tone="muted">
              {st.open ? `يقفل ${fmtTime(p.close)}` : `يفتح ${fmtTime(p.open)}`}
            </Txt>
          </Row>
          <Row gap={8}>
            {quick.map((q) => (
              <Pressable key={q.label} onPress={q.go} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', gap: 4, paddingVertical: 10, borderRadius: 14, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card }}>
                <Icon name={q.icon} color={colors.primaryInk} />
                <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }}>
                  {q.label}
                </Txt>
              </Pressable>
            ))}
          </Row>
          <Row gap={8}>
            <Fact icon={catIcon(p.category)} title={p.cuisine ? 'المطبخ' : 'النوع'} value={p.cuisine ?? p.kind} />
            <Fact icon="sparkles-outline" title="الصنف" value={p.kind} />
            <Fact icon="cash-outline" title={p.avgMin ? 'للشخص' : 'السعر'} value={priceLabel(p)} />
          </Row>
          <Txt>{p.description}</Txt>

          <Section title="الموقع">
            <Card padded={false} onPress={() => Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${p.lat},${p.lng}`)}>
              <PlacesMap places={[p]} center={p} height={130} />
              <Row style={{ padding: 12 }}>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{p.address}</Txt>
                  <Txt variant="caption" tone="muted">
                    {city?.name}
                    {city ? ` · ${fmtKm(km(city, p))} من وسط المدينة` : ''}
                  </Txt>
                </View>
                <Icon name="chevron-back" size={16} />
              </Row>
            </Card>
          </Section>

          {p.amenities.length ? (
            <Section title="أشياء لازم تعرفها">
              <Card padded={false}>
                {p.amenities.map((a, i) => (
                  <Row key={a} gap={12} style={{ padding: 12, borderTopWidth: i ? 1 : 0, borderColor: colors.border }}>
                    <Icon name={AMENITY[a].icon} color={colors.mutedForeground} />
                    <Txt style={{ flex: 1 }}>{AMENITY[a].label}</Txt>
                  </Row>
                ))}
              </Card>
            </Section>
          ) : null}

          <Section title="تقييمات المسافرين" action={{ label: 'قيّمه', onPress: () => openReview(p.id) }}>
            <Row gap={12}>
              <Txt variant="display">{(ours ?? p.rating).toFixed(1)}</Txt>
              <View>
                <Row gap={1}>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <Ionicons key={n} name={n <= Math.round(ours ?? p.rating) ? 'star' : 'star-outline'} size={14} color={colors.gold} />
                  ))}
                </Row>
                <Txt variant="caption" tone="muted">
                  من {num(p.ratingCount)} تقييم · {reviews.length} من مسافرين يلا نسافر
                </Txt>
              </View>
            </Row>
            {sortedReviews.map((r) => {
              const u = users.get(r.userId);
              return (
                <Card key={r.id} style={{ gap: 8 }}>
                  <Pressable onPress={() => navigation.navigate('User', { id: r.userId })} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                    <Avatar name={u?.name ?? ''} color={u?.color} size={32} />
                    <View style={{ flex: 1 }}>
                      <Row gap={6}>
                        <Txt variant="bodyStrong">{u?.name}</Txt>
                        {r.friend ? <Chip label="تتابعه" /> : null}
                      </Row>
                      <Txt variant="caption" tone="muted">
                        {'★'.repeat(r.rating)} {r.tags.join(' · ')}
                      </Txt>
                    </View>
                  </Pressable>
                  {r.text ? <Txt>{r.text}</Txt> : null}
                </Card>
              );
            })}
          </Section>
          {affiliate && p.affiliateUrl ? <Btn variant="ghost" icon="open-outline" title="احجز عبر Booking" onPress={() => Linking.openURL(p.affiliateUrl!)} /> : null}
        </View>
      </ScrollView>
      <StickyBar>
        <Btn variant="ghost" icon="navigate-outline" title="الاتجاهات" style={{ flex: 1 }} size="lg" onPress={() => Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`)} />
        <Btn icon="add" title="أضف لرحلتي" style={{ flex: 1.4 }} size="lg" onPress={() => openAdd(p.id)} />
      </StickyBar>
    </View>
  );
}

function Fact({ icon, title, value }: { icon: IconName; title: string; value: string }) {
  const { colors } = useAppTheme();
  return (
    <Card style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 12 }}>
      <Icon name={icon} color={colors.mutedForeground} />
      <Txt variant="bodyStrong" style={{ fontSize: 13 }}>
        {title}
      </Txt>
      <Txt variant="caption" tone="muted" center numberOfLines={2}>
        {value}
      </Txt>
    </Card>
  );
}

/* ---------- صفحة المدينة ---------- */
const MONTH_LBL = ['ينا', 'فبر', 'مار', 'أبر', 'ماي', 'يون', 'يول', 'أغس', 'سبت', 'أكت', 'نوف', 'ديس'];
const MONTH_FULL = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function CityScreen({ route, navigation }: RootProps<'City'>) {
  const c = useCity(route.params.id);
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const me = useMeId();
  const places = useCol('places').filter((p) => p.cityId === c?.id);
  const posts = useCol('posts');
  const users = useMap('users');
  const follows = useCol('follows');
  const checkins = useCol('checkins');
  const wished = useCol('wishes').some((w) => w.userId === me && w.cityId === c?.id);
  const [tab, setTab] = useState<'places' | 'events' | 'posts'>('places');
  const openAdd = useSheets((s) => s.openAddToTrip);
  const here = useMemo(() => {
    const f = new Set(follows.filter((x) => x.followerId === me).map((x) => x.followingId));
    const recent = checkins.filter((x) => x.cityId === c?.id && Date.now() - x.createdAt < 864e5 * 30);
    const ids = [...new Set(recent.map((x) => x.userId))];
    return { count: ids.length, friends: ids.filter((i) => f.has(i) && users.get(i)?.showHere).map((i) => users.get(i)!) };
  }, [follows, checkins, users, me, c?.id]);
  if (!c) return <Empty icon="alert-circle-outline" title="المدينة غير موجودة" />;
  const m = new Date().getMonth();
  const verdict = c.bestMonths[m] === 2 ? `${MONTH_FULL[m]} ممتاز` : c.bestMonths[m] === 1 ? `${MONTH_FULL[m]} مقبول` : `${MONTH_FULL[m]} مو الأفضل`;
  const list = tab === 'events' ? places.filter((p) => p.category === 'events' || p.category === 'experiences') : places;
  const cityPosts = posts.filter((p) => places.some((x) => x.id === p.placeId));
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 130 }}>
        <Photo scene={c.scene} scrim style={{ height: 260 }}>
          <Row style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, justifyContent: 'space-between' }}>
            <IconBtn name={BACK} label="رجوع" variant="glass" onPress={() => navigation.goBack()} />
            <IconBtn name={wished ? 'heart' : 'heart-outline'} color={wished ? '#ff6b81' : '#fff'} label="أمنياتي" variant="glass" onPress={() => toggleWish(c.id)} />
          </Row>
          <View style={{ position: 'absolute', bottom: 18, start: 18, end: 18, gap: 6 }}>
            <Chip tone="glass" label={`${c.country} · ${c.region}`} />
            <Txt variant="display" tone="white">
              {c.name}
            </Txt>
            <Txt tone="white">{c.blurb}</Txt>
          </View>
        </Photo>
        <View style={{ padding: 18, gap: 16 }}>
          <Row gap={8}>
            <Fact icon="partly-sunny-outline" title="الطقس الحين" value={`${c.tempNow}°`} />
            <Fact icon="airplane-outline" title="من الرياض" value={c.flightFromRUH ? `${Math.floor(c.flightFromRUH / 60)}:${String(c.flightFromRUH % 60).padStart(2, '0')} ساعة` : 'بالسيارة'} />
            <Fact icon="wallet-outline" title="الميزانية/يوم" value={`~${c.budgetPerDay} ﷼`} />
          </Row>
          <Card style={{ gap: 8 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="bodyStrong">أفضل وقت للزيارة</Txt>
              <Txt variant="bodyStrong" tone={c.bestMonths[m] === 2 ? 'successInk' : 'goldInk'}>
                {verdict}
              </Txt>
            </Row>
            <Row gap={3} style={{ alignItems: 'flex-end', height: 46 }}>
              {c.bestMonths.map((v, i) => (
                <View
                  key={i}
                  accessibilityLabel={`${MONTH_FULL[i]}: ${v === 2 ? 'ممتاز' : v === 1 ? 'مقبول' : 'غير مناسب'}`}
                  style={{ flex: 1, height: `${30 + v * 35}%`, borderRadius: 4, backgroundColor: v === 2 ? colors.success : v === 1 ? colors.gold : colors.border, borderWidth: i === m ? 2 : 0, borderColor: colors.primary }}
                />
              ))}
            </Row>
            <Row gap={3}>
              {MONTH_LBL.map((l) => (
                <Txt key={l} variant="caption" tone="muted" center style={{ flex: 1, fontSize: 10 }}>
                  {l}
                </Txt>
              ))}
            </Row>
          </Card>
          <Row gap={8}>
            <Card style={{ flex: 1 }}>
              <Txt variant="caption" tone="muted">
                تقييم مسافرينا
              </Txt>
              <Rating value={c.ourRating} />
              <Txt variant="caption" tone="muted">
                من {c.ourCount} مسافر
              </Txt>
            </Card>
            <Card style={{ flex: 1 }}>
              <Txt variant="caption" tone="muted">
                تقييم Google
              </Txt>
              <Rating value={c.googleRating} />
              <Txt variant="caption" tone="muted">
                من {num(c.googleCount)} تقييم
              </Txt>
            </Card>
          </Row>
          {here.count ? (<Card>
            <Row>
              <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: colors.success }} />
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{here.count === 1 ? 'مسافر واحد' : `${here.count} مسافرين`} في {c.name} هالشهر</Txt>
                {here.friends.length ? (
                  <Txt variant="caption" tone="muted">
                    منهم {here.friends.map((f) => f.name.split(' ')[0]).join(' و')} اللي تتابعهم
                  </Txt>
                ) : null}
              </View>
              {here.friends.length ? <Faces people={here.friends} /> : null}
            </Row>
          </Card>) : null}
          <Row gap={8}>
            <Pill label="الأماكن" active={tab === 'places'} onPress={() => setTab('places')} />
            <Pill label="الفعاليات" active={tab === 'events'} onPress={() => setTab('events')} />
            <Pill label="المنشورات" active={tab === 'posts'} onPress={() => setTab('posts')} />
          </Row>
          {tab === 'posts' ? (
            cityPosts.length ? (
              cityPosts.map((po) => (
                <Card key={po.id} onPress={() => navigation.navigate('User', { id: po.userId })}>
                  <Txt numberOfLines={3}>{po.body}</Txt>
                </Card>
              ))
            ) : (
              <Empty icon="images-outline" title="ما فيه منشورات للحين" />
            )
          ) : (
            list.map((p) => <PlaceRow key={p.id} place={p} onPress={() => navigation.navigate('Place', { id: p.id })} right={<IconBtn name="add" label={`أضف ${p.name} لرحلتي`} onPress={() => openAdd(p.id)} />} />)
          )}
        </View>
      </ScrollView>
      <StickyBar>
        <Btn variant="ghost" icon={wished ? 'heart' : 'heart-outline'} title="أمنياتي" style={{ flex: 1 }} size="lg" onPress={() => toggleWish(c.id)} />
        <Btn icon="add" title={`خطط رحلة لـ${c.name}`} style={{ flex: 1.6 }} size="lg" onPress={() => navigation.navigate('CreateTrip', { cityId: c.id })} />
      </StickyBar>
    </View>
  );
}
