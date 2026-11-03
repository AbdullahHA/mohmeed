/** صفحة الرحلة (11): الجدول، الميزانية (15.4، 22.10)، التجهيز (15.5)، الخريطة (22.5)، المستندات (22.3)، معلومات الدخول (22.11) */
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import * as Linking from 'expo-linking';
import { useNavigation } from '@react-navigation/native';
import { useState } from 'react';
import { Platform, Pressable, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DayChip, ItineraryItem, UserLine, catLabel } from '../components';
import { PlacesMap } from '../components/PlacesMap';
import {
  addDoc,
  addExpense,
  addNote,
  addTask,
  assignTask,
  deleteTrip,
  leaveTrip,
  moveItem,
  publishTrip,
  remindSettle,
  removeDoc,
  removeExpense,
  removeItem,
  removeTask,
  saveOffline,
  setRole,
  toggleTask,
  updateTrip,
} from '../data/actions';
import { FX } from '../data/seed';
import { useCity, useCol, useMap, useMeId, useMyRole, useToday, useTrip, useTripMembers } from '../data/selectors';
import type { ChecklistItem, ExpenseCategory, ID, Slot, TripDoc, TripItem } from '../data/types';
import { toast } from '../data/ui';
import { fmtDayFull, fmtRange, fmtTime, inDays, num, sar, weekday } from '../lib/format';
import { suggestPacking } from '../lib/guide';
import {
  SLOT_LABEL,
  SLOT_ORDER,
  SLOT_TIME,
  byCategory,
  countdown,
  dayConflicts,
  driveMinutes,
  fmtMinutes,
  myShare,
  settle,
  sortItems,
  spent,
  tripDays,
  tripStatus,
} from '../lib/logic';
import type { RootProps } from '../navigation/types';
import { shareInvite } from './Trips';
import { useAppTheme } from '../theme/ThemeProvider';
import { BACK, Btn, Card, Chip, Empty, FAB, Faces, Field, Icon, IconBtn, Photo, Pill, Progress, Row, Section, Sheet, Txt } from '../ui';

type Tab = 'schedule' | 'budget' | 'checklist';

export function TripScreen({ route, navigation }: RootProps<'Trip'>) {
  const trip = useTrip(route.params.id);
  const city = useCity(trip?.cityId);
  const members = useTripMembers(trip?.id);
  const role = useMyRole(trip?.id);
  const today = useToday();
  const chats = useCol('chats');
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const [tab, setTab] = useState<Tab>(route.params.tab ?? 'schedule');
  const [menu, setMenu] = useState(false);
  const [add, setAdd] = useState(false);
  if (!trip) return <Empty icon="alert-circle-outline" title="الرحلة غير موجودة" />;
  const st = tripStatus(trip, today);
  const cd = countdown(trip, today);
  const chat = chats.find((c) => c.tripId === trip.id);
  const canEdit = role === 'organizer' || role === 'member';
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView stickyHeaderIndices={[1]} contentContainerStyle={{ paddingBottom: 140 }}>
        <Photo scene={trip.scene} scrim style={{ height: 200 }}>
          <Row style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, justifyContent: 'space-between' }}>
            <IconBtn name={BACK} label="رجوع" variant="glass" onPress={() => navigation.goBack()} />
            <Row gap={8}>
              <IconBtn name="person-add-outline" label="ادعُ أحد" variant="glass" onPress={() => shareInvite(trip.inviteCode, trip.title)} />
              <IconBtn name="ellipsis-horizontal" label="خيارات الرحلة" variant="glass" onPress={() => setMenu(true)} />
            </Row>
          </Row>
          <Row style={{ position: 'absolute', bottom: 16, start: 16, end: 16, justifyContent: 'space-between', alignItems: 'flex-end' }}>
            <View style={{ flex: 1 }}>
              <Txt variant="title" tone="white">
                {trip.title}
              </Txt>
              <Txt variant="caption" tone="white">
                {trip.startDate ? `${fmtRange(trip.startDate, trip.endDate)} · ${st === 'ongoing' ? 'الحين' : st === 'past' ? 'انتهت' : inDays(cd ?? 0)}` : 'بدون تاريخ'}
              </Txt>
            </View>
            <Faces people={members.map((m) => m.user)} size={28} />
          </Row>
        </Photo>
        <View style={{ backgroundColor: colors.background, borderBottomWidth: 1, borderColor: colors.border, flexDirection: 'row' }} accessibilityRole="tablist">
          {(
            [
              ['schedule', 'الجدول', 'calendar-outline'],
              ['budget', 'الميزانية', 'wallet-outline'],
              ['checklist', 'التجهيز', 'checkbox-outline'],
              ['chat', 'الشلة', 'chatbubbles-outline'],
            ] as const
          ).map(([k, l, ic]) => {
            const on = tab === k;
            return (
              <Pressable
                key={k}
                accessibilityRole="tab"
                accessibilityState={{ selected: on }}
                onPress={() => (k === 'chat' ? chat && navigation.navigate('Chat', { id: chat.id }) : setTab(k))}
                style={{ flex: 1, alignItems: 'center', paddingVertical: 10, gap: 2, borderBottomWidth: 2, borderColor: on ? colors.primary : 'transparent' }}
              >
                <Icon name={ic} size={18} color={on ? colors.primaryInk : colors.mutedForeground} />
                <Txt variant="caption" tone={on ? 'primaryInk' : 'muted'} style={{ fontFamily: on ? 'IBMPlexSansArabic_700Bold' : undefined }}>
                  {l}
                </Txt>
              </Pressable>
            );
          })}
        </View>
        <View style={{ padding: 18, gap: 16 }}>
          {tab === 'schedule' ? <Schedule tripId={trip.id} canEdit={canEdit} /> : tab === 'budget' ? <Budget tripId={trip.id} /> : <Checklist tripId={trip.id} canEdit={canEdit} />}
        </View>
      </ScrollView>
      {canEdit && tab !== 'checklist' ? <FAB label={tab === 'budget' ? 'أضف مصروف' : 'أضف للجدول'} onPress={() => setAdd(true)} /> : null}
      {tab === 'budget' ? <ExpenseSheet tripId={trip.id} visible={add} onClose={() => setAdd(false)} /> : <AddItemSheet tripId={trip.id} visible={add} onClose={() => setAdd(false)} />}
      <Sheet visible={menu} onClose={() => setMenu(false)} title={trip.title}>
        <Card padded={false}>
          <MenuRow icon="cloud-download-outline" label={trip.offlineSavedAt ? 'محفوظة بدون نت ✓ (حدّث)' : 'احفظ بدون نت'} onPress={() => (saveOffline(trip.id), setMenu(false))} />
          <MenuRow icon="document-text-outline" label="مستنداتي" onPress={() => (setMenu(false), navigation.navigate('Docs', { id: trip.id }))} />
          <MenuRow icon="map-outline" label="خريطة الأيام" onPress={() => (setMenu(false), navigation.navigate('TripMap', { id: trip.id }))} />
          {trip.datesMode === 'vote' || !trip.startDate ? <MenuRow icon="calendar-number-outline" label="متى نسافر؟" onPress={() => (setMenu(false), navigation.navigate('Dates', { id: trip.id }))} /> : null}
          <MenuRow icon="share-outline" label={`ادعُ أحد (الرمز ${trip.inviteCode})`} onPress={() => shareInvite(trip.inviteCode, trip.title)} />
          {role === 'organizer' ? <MenuRow icon={trip.published ? 'eye-off-outline' : 'megaphone-outline'} label={trip.published ? 'خلّ الجدول خاص' : 'انشر الجدول للمتابعين'} onPress={() => publishTrip(trip.id, !trip.published)} /> : null}
        </Card>
        <Section title="الأعضاء">
          {members.map((m) => (
            <UserLine
              key={m.id}
              id={m.userId}
              sub={{ organizer: 'منظّم', member: 'عضو', viewer: 'مشاهد' }[m.role]}
              right={
                role === 'organizer' && m.role !== 'organizer' ? (
                  <Btn size="sm" variant="ghost" title={m.role === 'member' ? 'خلّه مشاهد' : 'خلّه عضو'} onPress={() => setRole(m.id, m.role === 'member' ? 'viewer' : 'member')} />
                ) : null
              }
            />
          ))}
        </Section>
        {city && city.countryCode !== 'SA' ? <EntryInfo countryCode={city.countryCode} /> : null}
        <Card padded={false}>
          {role === 'organizer' ? (
            <MenuRow icon="trash-outline" label="احذف الرحلة" danger onPress={() => (setMenu(false), deleteTrip(trip.id), navigation.goBack())} />
          ) : (
            <MenuRow icon="exit-outline" label="اطلع من الرحلة" danger onPress={() => (setMenu(false), leaveTrip(trip.id), navigation.goBack())} />
          )}
        </Card>
      </Sheet>
    </View>
  );
}

function MenuRow({ icon, label, onPress, danger }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; onPress: () => void; danger?: boolean }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, minHeight: 52 }}>
      <Icon name={icon} color={danger ? colors.destructive : colors.foreground} />
      <Txt tone={danger ? 'destructive' : 'foreground'} style={{ flex: 1 }}>
        {label}
      </Txt>
    </Pressable>
  );
}

/* ---------- الجدول ---------- */
function Schedule({ tripId, canEdit }: { tripId: ID; canEdit: boolean }) {
  const trip = useTrip(tripId)!;
  const city = useCity(trip.cityId);
  const items = useCol('items').filter((i) => i.tripId === tripId);
  const places = useMap('places');
  const expenses = useCol('expenses').filter((e) => e.tripId === tripId);
  const members = useTripMembers(tripId);
  const me = useMeId();
  const today = useToday();
  const { colors } = useAppTheme();
  const nav = useNavigation();
  const days = tripDays(trip);
  const [day, setDay] = useState<string | 'all' | 'none'>(days.includes(today) ? today : days[0] ?? 'none');
  const [opts, setOpts] = useState<TripItem | null>(null);
  const unscheduled = items.filter((i) => !i.day);
  const dayItems = day === 'none' ? unscheduled : day === 'all' ? [] : sortItems(items.filter((i) => i.day === day));
  const conflicts = day !== 'all' && day !== 'none' ? dayConflicts(dayItems, places, trip.needs) : [];
  const sp = spent(expenses);
  const share = myShare(expenses, me, members.map((m) => m.userId));
  const bySlot = (s: Slot) => dayItems.filter((i) => (i.slot ?? slotOfTime(i.time)) === s);
  return (
    <>
      {!trip.startDate ? (
        <Card tone="gold" onPress={() => nav.navigate('Dates', { id: tripId })}>
          <Row>
            <Icon name="calendar-outline" />
            <Txt tone="goldInk" style={{ flex: 1 }}>
              {trip.datesMode === 'vote' ? 'الشلة تصوّت على التواريخ. شوف وش يناسب الكل' : 'حدد التواريخ عشان نرتب الجدول يوم بيوم'}
            </Txt>
            <Icon name="chevron-back" size={16} />
          </Row>
        </Card>
      ) : null}
      {days.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          <Pill label="الكل" active={day === 'all'} onPress={() => setDay('all')} />
          {days.map((d) => (
            <DayChip key={d} date={d} active={day === d} onPress={() => setDay(d)} />
          ))}
          {unscheduled.length ? <Pill label={`بدون يوم (${unscheduled.length})`} active={day === 'none'} onPress={() => setDay('none')} /> : null}
        </ScrollView>
      ) : null}
      {day === 'all' ? (
        days.map((d, i) => {
          const its = sortItems(items.filter((x) => x.day === d));
          return (
            <Card key={d} onPress={() => setDay(d)}>
              <Row style={{ justifyContent: 'space-between' }}>
                <Txt variant="bodyStrong">
                  اليوم {i + 1} · {fmtDayFull(d)}
                </Txt>
                <Chip label={`${its.length} أماكن`} tone="muted" />
              </Row>
              <Txt variant="caption" tone="muted" numberOfLines={2}>
                {its.map((x) => (x.placeId ? places.get(x.placeId)?.name : x.title)).join(' ← ') || 'فاضي'}
              </Txt>
            </Card>
          );
        })
      ) : (
        <>
          {day !== 'none' ? (
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="heading">
                {days.indexOf(day) >= 0 ? `اليوم ${days.indexOf(day) + 1} · ` : ''}
                {weekday(day)}
              </Txt>
              <Row gap={8}>
                {city ? <Chip icon="partly-sunny-outline" label={`${city.tempNow}°`} tone="muted" /> : null}
                <Btn size="sm" variant="soft" icon="map-outline" title="الخريطة" onPress={() => nav.navigate('TripMap', { id: tripId, day })} />
              </Row>
            </Row>
          ) : null}
          {conflicts.map((c, i) => (
            <Card key={i} tone="gold">
              <Row gap={8}>
                <Icon name="alert-circle-outline" color={colors.goldInk} />
                <Txt tone="goldInk" style={{ flex: 1 }}>
                  {c.text}
                </Txt>
              </Row>
              {c.itemId && c.kind === 'closed' ? (
                <Btn
                  size="sm"
                  variant="plain"
                  title={c.fix}
                  onPress={() => {
                    const it = items.find((x) => x.id === c.itemId)!;
                    const p = places.get(it.placeId!)!;
                    const s: Slot = p.open < '12:00' ? 'morning' : 'afternoon';
                    moveItem(it.id, it.day ?? null, s, p.open < '12:00' ? SLOT_TIME.morning : SLOT_TIME.afternoon);
                    toast('اتعدّل الموعد');
                  }}
                  style={{ alignSelf: 'flex-start' }}
                />
              ) : null}
            </Card>
          ))}
          {day === 'none' ? (
            unscheduled.map((it) => <ItineraryItem key={it.id} item={it} onPress={() => it.placeId && nav.navigate('Place', { id: it.placeId })} onMore={canEdit ? () => setOpts(it) : undefined} />)
          ) : (
            SLOT_ORDER.map((s) => {
              const list = bySlot(s);
              if (!list.length && !['breakfast', 'lunch', 'dinner'].includes(s)) return null;
              return (
                <View key={s} style={{ gap: 8 }}>
                  <Txt variant="badge" tone="muted">
                    {SLOT_LABEL[s]}
                  </Txt>
                  {list.length ? (
                    list.map((it, i) => {
                      const prev = i ? list[i - 1] : null;
                      const a = prev?.placeId ? places.get(prev.placeId) : undefined, b = it.placeId ? places.get(it.placeId) : undefined;
                      return (
                        <View key={it.id} style={{ gap: 6 }}>
                          {a && b ? <Hop minutes={driveMinutes(a, b)} /> : null}
                          <ItineraryItem item={it} onPress={() => it.placeId && nav.navigate('Place', { id: it.placeId })} onMore={canEdit ? () => setOpts(it) : undefined} />
                        </View>
                      );
                    })
                  ) : (
                    <Pressable
                      onPress={() => nav.navigate('Results', { cityId: trip.cityId, category: s === 'breakfast' ? 'cafe' : 'food' })}
                      style={{ borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 16, padding: 12, alignItems: 'center', gap: 8 }}
                      accessibilityRole="button"
                    >
                      <Txt tone="muted">ما فيه شي لـ{SLOT_LABEL[s]}</Txt>
                      <Chip icon="search" label="اقتراحات قريبة" />
                    </Pressable>
                  )}
                </View>
              );
            })
          )}
        </>
      )}
      <Card style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="caption" tone="muted">
            الميزانية · نصيبك {sar(share)}
          </Txt>
          <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }}>
            {num(sp)} / {num(trip.plannedBudget)} ﷼
          </Txt>
        </Row>
        <Progress value={trip.plannedBudget ? sp / trip.plannedBudget : 0} tone="auto" />
      </Card>
      <Sheet visible={!!opts} onClose={() => setOpts(null)} title={opts?.placeId ? places.get(opts.placeId)?.name ?? '' : opts?.title ?? ''}>
        {opts ? (
          <>
            <Txt variant="bodyStrong">انقله ليوم</Txt>
            <ScrollView horizontal contentContainerStyle={{ gap: 8 }}>
              {days.map((d) => (
                <DayChip key={d} date={d} active={opts.day === d} onPress={() => (moveItem(opts.id, d), setOpts(null), toast('انتقل'))} />
              ))}
            </ScrollView>
            <Txt variant="bodyStrong">الوقت</Txt>
            <Row wrap gap={8}>
              {SLOT_ORDER.map((s) => (
                <Pill key={s} label={SLOT_LABEL[s]} active={opts.slot === s} onPress={() => (moveItem(opts.id, opts.day ?? null, s, SLOT_TIME[s]), setOpts(null))} />
              ))}
            </Row>
            {opts.placeId ? <Btn variant="ghost" icon="navigate-outline" title="الاتجاهات" onPress={() => { const p = places.get(opts.placeId!); if (p) Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`); }} /> : null}
            <Btn variant="danger" icon="trash-outline" title="احذف من الجدول" onPress={() => (removeItem(opts.id), setOpts(null))} />
          </>
        ) : null}
      </Sheet>
    </>
  );
}
function slotOfTime(t?: string | null): Slot {
  if (!t) return 'morning';
  if (t < '10:00') return 'breakfast';
  if (t < '12:30') return 'morning';
  if (t < '15:30') return 'lunch';
  if (t < '19:30') return 'afternoon';
  if (t < '21:30') return 'dinner';
  return 'evening';
}
function Hop({ minutes }: { minutes: number }) {
  const { colors } = useAppTheme();
  return (
    <Row gap={6} style={{ marginStart: 26, paddingStart: 14, borderStartWidth: 2, borderStyle: 'dashed', borderColor: colors.border, paddingVertical: 2 }}>
      <Icon name="car-outline" size={14} color={colors.mutedForeground} />
      <Txt variant="caption" tone="muted">
        {fmtMinutes(minutes)} بالسيارة
      </Txt>
    </Row>
  );
}

function AddItemSheet({ tripId, visible, onClose }: { tripId: ID; visible: boolean; onClose: () => void }) {
  const trip = useTrip(tripId)!;
  const nav = useNavigation();
  const [note, setNote] = useState('');
  return (
    <Sheet visible={visible} onClose={onClose} title="أضف للجدول">
      <Card onPress={() => (onClose(), nav.navigate('Results', { cityId: trip.cityId }))}>
        <Row>
          <Icon name="search" />
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            مكان من اكتشف
          </Txt>
        </Row>
      </Card>
      <Card onPress={() => (onClose(), nav.navigate('Docs', { id: tripId }))}>
        <Row>
          <Icon name="airplane-outline" />
          <Txt variant="bodyStrong" style={{ flex: 1 }}>
            رحلة طيران أو سكن (من مستنداتي)
          </Txt>
        </Row>
      </Card>
      <Field label="ملاحظة" placeholder="مثلاً: استراحة في الفندق" value={note} onChangeText={setNote} />
      <Btn title="أضف الملاحظة" disabled={!note.trim()} onPress={() => (addNote(tripId, note, trip.startDate ?? null, 'afternoon'), setNote(''), onClose())} />
    </Sheet>
  );
}

/* ---------- الميزانية ---------- */
const CAT: Record<ExpenseCategory, { label: string; color: string; icon: React.ComponentProps<typeof Icon>['name'] }> = {
  stay: { label: 'السكن', color: '#2a55d8', icon: 'bed-outline' },
  food: { label: 'الأكل', color: '#e07b24', icon: 'restaurant-outline' },
  activities: { label: 'الأنشطة', color: '#1f9d63', icon: 'ticket-outline' },
  transport: { label: 'المواصلات', color: '#6a5cf0', icon: 'car-outline' },
  other: { label: 'أخرى', color: '#8a93a8', icon: 'ellipsis-horizontal' },
};
function Budget({ tripId }: { tripId: ID }) {
  const trip = useTrip(tripId)!;
  const expenses = useCol('expenses').filter((e) => e.tripId === tripId).sort((a, b) => b.createdAt - a.createdAt);
  const members = useTripMembers(tripId);
  const users = useMap('users');
  const me = useMeId();
  const { colors } = useAppTheme();
  const [edit, setEdit] = useState(false);
  const [planned, setPlanned] = useState(String(trip.plannedBudget));
  const ids = members.map((m) => m.userId);
  const sp = spent(expenses);
  const cats = byCategory(expenses);
  const transfers = settle(expenses, ids);
  const share = ids.length ? sp / ids.length : 0;
  const over = sp > trip.plannedBudget;
  return (
    <>
      <Card style={{ gap: 12 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <View>
            <Txt variant="caption" tone="muted">
              المصروف
            </Txt>
            <Txt variant="title">{sar(sp)}</Txt>
            <Txt variant="caption" tone={over ? 'destructive' : 'muted'}>
              {over ? `⚠ تجاوزت الميزانية بـ ${sar(sp - trip.plannedBudget)}` : `من ${sar(trip.plannedBudget)} · باقي ${sar(trip.plannedBudget - sp)}`}
            </Txt>
          </View>
          <IconBtn name="create-outline" label="عدّل الميزانية" onPress={() => setEdit(true)} />
        </Row>
        <Row style={{ height: 14, borderRadius: 8, overflow: 'hidden', backgroundColor: colors.border }} gap={0}>
          {(Object.keys(CAT) as ExpenseCategory[]).map((k) => (cats[k] ? <View key={k} style={{ width: `${(cats[k] / Math.max(sp, trip.plannedBudget)) * 100}%`, height: '100%', backgroundColor: CAT[k].color }} /> : null))}
        </Row>
        <View style={{ gap: 6 }}>
          {(Object.keys(CAT) as ExpenseCategory[])
            .filter((k) => cats[k])
            .map((k) => (
              <Row key={k} style={{ justifyContent: 'space-between' }}>
                <Row gap={8}>
                  <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: CAT[k].color }} />
                  <Txt>{CAT[k].label}</Txt>
                </Row>
                <Txt variant="bodyStrong">{sar(cats[k])}</Txt>
              </Row>
            ))}
        </View>
      </Card>
      <Card style={{ gap: 10 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="bodyStrong">التسوية</Txt>
          <Txt variant="caption" tone="muted">
            نصيب كل واحد {sar(share)}
          </Txt>
        </Row>
        {transfers.length ? (
          transfers.map((t, i) => {
            const from = users.get(t.from), to = users.get(t.to);
            const text = t.to === me ? `${from?.name} عليه لك` : t.from === me ? `عليك لـ${to?.name}` : `${from?.name} عليه لـ${to?.name}`;
            return (
              <Row key={i} style={{ justifyContent: 'space-between' }}>
                <Txt style={{ flex: 1 }}>{text}</Txt>
                <Txt variant="bodyStrong" tone="goldInk">
                  {sar(t.amount)}
                </Txt>
              </Row>
            );
          })
        ) : (
          <Txt tone="successInk">كل الحسابات متساوية ✓</Txt>
        )}
        {transfers.some((t) => t.to === me) ? (
          <Btn
            variant="ghost"
            size="sm"
            title="ذكّرهم في محادثة الشلة"
            onPress={() => remindSettle(tripId, transfers.filter((t) => t.to === me).map((t) => `${users.get(t.from)?.name}: ${sar(t.amount)}`).join('\n') + '\nتذكير لطيف بالتسوية 🙏')}
          />
        ) : null}
        <Txt variant="caption" tone="muted">
          التطبيق يسجّل الحسابات بس، والتحويل يكون بينكم.
        </Txt>
      </Card>
      <Section title={`المصاريف (${expenses.length})`}>
        {expenses.length ? (
          <Card padded={false}>
            {expenses.map((e, i) => (
              <Pressable
                key={e.id}
                onLongPress={() => removeExpense(e.id)}
                accessibilityHint="اضغط مطوّل للحذف"
                style={{ flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderTopWidth: i ? 1 : 0, borderColor: colors.border }}
              >
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: CAT[e.category].color + '22', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={CAT[e.category].icon} color={CAT[e.category].color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong" numberOfLines={1}>
                    {e.note || CAT[e.category].label}
                  </Txt>
                  <Txt variant="caption" tone="muted">
                    دفعه {e.paidBy === me ? 'أنت' : users.get(e.paidBy)?.name} · مقسوم على {e.splitBetween.length}
                    {e.fromChat ? ' · من المحادثة' : ''}
                  </Txt>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Txt variant="bodyStrong">
                    {num(e.amount)} {e.currency === 'SAR' ? '﷼' : e.currency}
                  </Txt>
                  {e.currency !== 'SAR' ? (
                    <Txt variant="caption" tone="muted">
                      ≈ {sar(e.amountSar)}
                    </Txt>
                  ) : null}
                </View>
              </Pressable>
            ))}
          </Card>
        ) : (
          <Empty icon="wallet-outline" title="ما فيه مصاريف للحين" text="سجّل أي مصروف وأنا أحسب نصيب كل واحد." />
        )}
      </Section>
      <Sheet visible={edit} onClose={() => setEdit(false)} title="الميزانية المخططة" footer={<Btn size="lg" full title="احفظ" onPress={() => (updateTrip(tripId, { plannedBudget: Number(planned) || 0 }), setEdit(false))} />}>
        <Field label="المبلغ بالريال" keyboardType="number-pad" value={planned} onChangeText={setPlanned} />
      </Sheet>
    </>
  );
}

export function ExpenseSheet({ tripId, visible, onClose, fromChat }: { tripId: ID; visible: boolean; onClose: () => void; fromChat?: boolean }) {
  const members = useTripMembers(tripId);
  const city = useCity(useTrip(tripId)?.cityId);
  const country = useCol('countries').find((c) => c.code === city?.countryCode);
  const me = useMeId();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [cat, setCat] = useState<ExpenseCategory>('food');
  const [cur, setCur] = useState(country?.currency ?? 'SAR');
  const [paidBy, setPaidBy] = useState(me);
  const [split, setSplit] = useState<string[]>([]);
  const value = Number(amount.replace(/,/g, '')) || 0;
  const currencies = [...new Set(['SAR', country?.currency ?? 'SAR', 'USD', 'EUR'])];
  const reset = () => (setAmount(''), setNote(''), setSplit([]));
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="مصروف جديد"
      footer={
        <Btn
          size="lg"
          full
          title={value ? `سجّل ${num(value)} ${cur === 'SAR' ? '﷼' : cur}` : 'سجّل'}
          disabled={!value}
          onPress={() => {
            addExpense({ tripId, amount: value, currency: cur, category: cat, note, paidBy, splitBetween: split, fromChat });
            reset();
            onClose();
          }}
        />
      }
    >
      <Field label="المبلغ" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} placeholder="0" style={{ fontSize: 26, textAlign: 'center' }} />
      <Row wrap gap={8}>
        {currencies.map((c) => (
          <Pill key={c} label={c === 'SAR' ? 'ريال' : c} active={cur === c} onPress={() => setCur(c)} />
        ))}
      </Row>
      {cur !== 'SAR' && value ? (
        <Txt variant="caption" tone="muted">
          ≈ {sar(value * (FX[cur] ?? 1))} بسعر اليوم
        </Txt>
      ) : null}
      <Row wrap gap={8}>
        {(Object.keys(CAT) as ExpenseCategory[]).map((k) => (
          <Pill key={k} label={CAT[k].label} icon={CAT[k].icon} active={cat === k} onPress={() => setCat(k)} />
        ))}
      </Row>
      <Field label="الوصف" placeholder="مثلاً: عشاء أول ليلة" value={note} onChangeText={setNote} />
      <Txt variant="bodyStrong">مين دفع؟</Txt>
      <Row wrap gap={8}>
        {members.map((m) => (
          <Pill key={m.userId} label={m.userId === me ? 'أنا' : m.user.name} active={paidBy === m.userId} onPress={() => setPaidBy(m.userId)} />
        ))}
      </Row>
      <Txt variant="bodyStrong">مقسوم على</Txt>
      <Row wrap gap={8}>
        <Pill label="الكل" active={!split.length} onPress={() => setSplit([])} />
        {members.map((m) => (
          <Pill key={m.userId} label={m.userId === me ? 'أنا' : m.user.name} active={split.includes(m.userId)} onPress={() => setSplit(split.includes(m.userId) ? split.filter((x) => x !== m.userId) : [...split, m.userId])} />
        ))}
      </Row>
    </Sheet>
  );
}

/* ---------- التجهيز ---------- */
const GROUPS: { key: ChecklistItem['group']; label: string }[] = [
  { key: 'bookings', label: 'الحجوزات' },
  { key: 'bag', label: 'الشنطة' },
  { key: 'docs', label: 'الأوراق' },
  { key: 'other', label: 'أخرى' },
];
function Checklist({ tripId, canEdit }: { tripId: ID; canEdit: boolean }) {
  const trip = useTrip(tripId)!;
  const city = useCity(trip.cityId);
  const tasks = useCol('checklist').filter((c) => c.tripId === tripId);
  const users = useMap('users');
  const members = useTripMembers(tripId);
  const today = useToday();
  const { colors } = useAppTheme();
  const [adding, setAdding] = useState<ChecklistItem['group'] | null>(null);
  const [text, setText] = useState('');
  const [suggest, setSuggest] = useState(false);
  const [assign, setAssign] = useState<ChecklistItem | null>(null);
  const done = tasks.filter((t) => t.done).length;
  const cd = countdown(trip, today);
  const month = trip.startDate ? new Date(trip.startDate).getMonth() : new Date().getMonth();
  const ideas = city ? suggestPacking(city, month).filter((s) => !tasks.some((t) => t.title === s)) : [];
  return (
    <>
      <View style={{ gap: 6 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="bodyStrong">
            {done} من {tasks.length}
          </Txt>
          {cd != null && cd > 0 ? (
            <Txt variant="caption" tone="muted">
              باقي {cd} أيام
            </Txt>
          ) : null}
        </Row>
        <Progress value={tasks.length ? done / tasks.length : 0} tone="success" height={8} />
      </View>
      {ideas.length && canEdit ? (
        <Card tone="primary" onPress={() => setSuggest(true)}>
          <Row>
            <View style={{ width: 36, height: 36, borderRadius: 12, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="sparkles" color="#fff" size={18} />
            </View>
            <View style={{ flex: 1 }}>
              <Txt variant="bodyStrong">اقترح لي قائمة لـ{city?.name}</Txt>
              <Txt variant="caption" tone="muted" numberOfLines={1}>
                {ideas.slice(0, 3).join('، ')}…
              </Txt>
            </View>
          </Row>
        </Card>
      ) : null}
      {GROUPS.map((g) => {
        const list = tasks.filter((t) => t.group === g.key).sort((a, b) => Number(a.done) - Number(b.done));
        if (!list.length && g.key === 'other') return null;
        return (
          <View key={g.key} style={{ gap: 6 }}>
            <Row style={{ justifyContent: 'space-between' }}>
              <Txt variant="bodyStrong" tone="muted">
                {g.label}
              </Txt>
              <Txt variant="caption" tone="muted">
                {list.filter((t) => t.done).length}/{list.length}
              </Txt>
            </Row>
            <Card padded={false}>
              {list.map((t, i) => {
                const a = t.assigneeId ? users.get(t.assigneeId) : undefined;
                return (
                  <Row key={t.id} gap={10} style={{ padding: 12, minHeight: 52, borderTopWidth: i ? 1 : 0, borderColor: colors.border }}>
                    <Pressable
                      onPress={() => canEdit && toggleTask(t.id)}
                      onLongPress={() => canEdit && removeTask(t.id)}
                      hitSlop={10}
                      accessibilityRole="checkbox"
                      accessibilityState={{ checked: t.done }}
                      accessibilityLabel={t.title}
                      style={{ width: 24, height: 24, borderRadius: 7, borderWidth: 2, borderColor: t.done ? colors.success : colors.border, backgroundColor: t.done ? colors.success : 'transparent', alignItems: 'center', justifyContent: 'center' }}
                    >
                      {t.done ? <Icon name="checkmark" size={16} color="#fff" /> : null}
                    </Pressable>
                    <View style={{ flex: 1 }}>
                      <Txt tone={t.done ? 'muted' : 'foreground'} style={{ textDecorationLine: t.done ? 'line-through' : 'none' }}>
                        {t.title}
                      </Txt>
                      {!a ? (
                        <Txt variant="caption" tone="muted">
                          غير مسندة
                        </Txt>
                      ) : null}
                    </View>
                    <Pressable onPress={() => canEdit && setAssign(t)} hitSlop={10} accessibilityLabel={a ? `مسندة لـ${a.name}` : 'أسندها لأحد'} accessibilityRole="button">
                      {a ? (
                        <View style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: a.color, alignItems: 'center', justifyContent: 'center' }}>
                          <Txt variant="badge" style={{ color: '#fff' }}>
                            {a.name.charAt(0)}
                          </Txt>
                        </View>
                      ) : (
                        <Icon name="person-add-outline" size={20} color={colors.mutedForeground} />
                      )}
                    </Pressable>
                  </Row>
                );
              })}
              {canEdit ? (
                adding === g.key ? (
                  <Row style={{ padding: 8 }}>
                    <View style={{ flex: 1 }}>
                      <Field autoFocus placeholder="اكتب المهمة" value={text} onChangeText={setText} onSubmitEditing={() => (addTask(tripId, g.key, text), setText(''))} />
                    </View>
                    <Btn title="أضف" onPress={() => (addTask(tripId, g.key, text), setText(''), setAdding(null))} />
                  </Row>
                ) : (
                  <Pressable onPress={() => setAdding(g.key)} style={{ flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderTopWidth: list.length ? 1 : 0, borderColor: colors.border }} accessibilityRole="button">
                    <Icon name="add" size={18} color={colors.primaryInk} />
                    <Txt variant="bodyStrong" tone="primaryInk">
                      أضف لـ{g.label}
                    </Txt>
                  </Pressable>
                )
              ) : null}
            </Card>
          </View>
        );
      })}
      <Sheet visible={suggest} onClose={() => setSuggest(false)} title={`قائمة مقترحة لـ${city?.name}`} subtitle="اختر اللي تبيه وينضاف للشنطة">
        {ideas.map((s) => (
          <Card key={s} onPress={() => (addTask(tripId, 'bag', s), toast(`انضاف: ${s}`))}>
            <Row>
              <Icon name="add-circle-outline" />
              <Txt style={{ flex: 1 }}>{s}</Txt>
            </Row>
          </Card>
        ))}
      </Sheet>
      <Sheet visible={!!assign} onClose={() => setAssign(null)} title="مين مسؤول عنها؟">
        {members.map((m) => (
          <Card key={m.userId} onPress={() => (assignTask(assign!.id, m.userId), setAssign(null))}>
            <UserLine id={m.userId} />
          </Card>
        ))}
        <Btn variant="ghost" title="بدون مسؤول" onPress={() => (assignTask(assign!.id, null), setAssign(null))} />
      </Sheet>
    </>
  );
}

/* ---------- معلومات الدخول (22.11) ---------- */
function EntryInfo({ countryCode }: { countryCode: string }) {
  const c = useCol('countries').find((x) => x.code === countryCode);
  if (!c) return null;
  const rows: [string, string][] = [
    ['التأشيرة للجواز السعودي', c.visaSA],
    ['صلاحية الجواز', c.passportMonths ? `${c.passportMonths} شهور على الأقل` : 'سارية'],
    ['العملة', c.currency],
    ['القابس الكهربائي', c.plugs],
    ['شريحة الاتصال', c.sim],
    ['رقم الطوارئ', c.emergency],
    ['السفارة السعودية', c.embassy],
  ];
  return (
    <Section title={`الدخول إلى ${c.name}`}>
      <Card style={{ gap: 8 }}>
        {rows.map(([k, v]) => (
          <Row key={k} style={{ justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <Txt variant="caption" tone="muted" style={{ width: 120 }}>
              {k}
            </Txt>
            <Txt style={{ flex: 1 }}>{v}</Txt>
          </Row>
        ))}
        <Txt variant="caption" tone="muted">
          تأكد من المصدر الرسمي قبل السفر.
        </Txt>
      </Card>
    </Section>
  );
}

/* ---------- خريطة اليوم (22.5) ---------- */
export function TripMapScreen({ route, navigation }: RootProps<'TripMap'>) {
  const trip = useTrip(route.params.id);
  const items = useCol('items').filter((i) => i.tripId === trip?.id);
  const places = useMap('places');
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const days = trip ? tripDays(trip) : [];
  const [day, setDay] = useState(route.params.day ?? days[0]);
  const dayItems = sortItems(items.filter((i) => i.day === day && i.placeId));
  const ps = dayItems.map((i) => places.get(i.placeId!)!).filter(Boolean);
  const conflicts = trip ? dayConflicts(dayItems, places, trip.needs) : [];
  const warnIds = conflicts.filter((c) => c.kind === 'closed').map((c) => items.find((i) => i.id === c.itemId)?.placeId ?? '');
  const totalKm = ps.reduce((s, p, i) => (i ? s + Math.round(driveMinutes(ps[i - 1], p) * 0.6) : 0), 0);
  const totalMin = ps.reduce((s, p, i) => (i ? s + driveMinutes(ps[i - 1], p) : 0), 0);
  if (!trip) return null;
  const url = ps.length ? `https://www.google.com/maps/dir/${ps.map((p) => `${p.lat},${p.lng}`).join('/')}` : '';
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{ height: '52%' }}>
        <PlacesMap places={ps} numbered warnIds={warnIds} onPress={(p) => navigation.navigate('Place', { id: p.id })} />
        <Row style={{ position: 'absolute', top: insets.top + 8, start: 16, end: 16, justifyContent: 'space-between' }}>
          <IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} />
        </Row>
      </View>
      <ScrollView style={{ flex: 1, marginTop: -20, borderTopLeftRadius: 24, borderTopRightRadius: 24, backgroundColor: colors.background }} contentContainerStyle={{ padding: 18, gap: 12, paddingBottom: 40 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {days.map((d) => (
            <DayChip key={d} date={d} active={d === day} onPress={() => setDay(d)} />
          ))}
        </ScrollView>
        <Row style={{ justifyContent: 'space-between' }}>
          <Txt variant="heading">
            {weekday(day)} · {ps.length} أماكن
          </Txt>
          <Txt variant="caption" tone="muted">
            {totalKm} كم · {fmtMinutes(totalMin)} بالسيارة
          </Txt>
        </Row>
        {conflicts.map((c, i) => (
          <Card key={i} tone="gold">
            <Row gap={8}>
              <Icon name="alert-circle-outline" color={colors.goldInk} />
              <Txt tone="goldInk" style={{ flex: 1 }}>
                {c.text}. <Txt variant="bodyStrong" tone="primaryInk">{c.fix}</Txt>
              </Txt>
            </Row>
          </Card>
        ))}
        {dayItems.map((it, i) => {
          const p = places.get(it.placeId!)!;
          const warn = warnIds.includes(p.id);
          return (
            <Card key={it.id} onPress={() => navigation.navigate('Place', { id: p.id })}>
              <Row>
                <View style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: warn ? colors.gold : colors.primary, alignItems: 'center', justifyContent: 'center' }}>
                  <Txt variant="badge" style={{ color: '#fff', fontSize: 13 }}>
                    {i + 1}
                  </Txt>
                </View>
                <View style={{ flex: 1 }}>
                  <Txt variant="bodyStrong">{p.name}</Txt>
                  <Txt variant="caption" tone={warn ? 'goldInk' : 'muted'}>
                    {fmtTime(it.time)} · {catLabel(p.category)}
                    {warn ? ' · مقفل وقتها' : ''}
                  </Txt>
                </View>
              </Row>
            </Card>
          );
        })}
        {ps.length ? <Btn size="lg" icon="git-network-outline" title="افتح المسار كامل في الخرائط" onPress={() => Linking.openURL(url)} /> : <Empty icon="map-outline" title="ما فيه أماكن في هذا اليوم" />}
      </ScrollView>
    </View>
  );
}

/* ---------- مستنداتي (22.3) ---------- */
export function DocsScreen({ route, navigation }: RootProps<'Docs'>) {
  const trip = useTrip(route.params.id);
  const me = useMeId();
  const docs = useCol('docs').filter((d) => d.tripId === trip?.id && (d.visibility === 'shared' || d.ownerId === me));
  const { colors } = useAppTheme();
  const [unlocked, setUnlocked] = useState(false);
  const [adding, setAdding] = useState(false);
  const [qr, setQr] = useState<TripDoc | null>(null);
  if (!trip) return null;
  const unlock = async () => {
    if (Platform.OS === 'web') return setUnlocked(true);
    const has = await LocalAuthentication.hasHardwareAsync();
    if (!has) return setUnlocked(true);
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'افتح مستنداتك الخاصة' });
    if (r.success) setUnlocked(true);
  };
  const shared = docs.filter((d) => d.visibility === 'shared').sort((a, b) => (a.startsAt ?? '').localeCompare(b.startsAt ?? ''));
  const priv = docs.filter((d) => d.visibility === 'private');
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <ScrollView contentContainerStyle={{ padding: 18, gap: 14, paddingTop: 60, paddingBottom: 60 }}>
        <Row style={{ justifyContent: 'space-between' }}>
          <IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} />
          <View style={{ flex: 1, paddingHorizontal: 12 }}>
            <Txt variant="heading">مستنداتي</Txt>
            <Txt variant="caption" tone="muted">
              {trip.title}
            </Txt>
          </View>
          <IconBtn name="add" label="أضف مستند" onPress={() => setAdding(true)} />
        </Row>
        <Card tone="success">
          <Row>
            <Icon name="cloud-done-outline" color={colors.successInk} />
            <Txt tone="successInk" style={{ flex: 1 }}>
              محفوظة على جوالك وتفتح بدون إنترنت
            </Txt>
          </Row>
        </Card>
        {shared.map((d) => (
          <DocCard key={d.id} d={d} onQr={() => setQr(d)} />
        ))}
        <Card padded={false}>
          <Row style={{ padding: 12, justifyContent: 'space-between', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.border }}>
            <Row gap={6}>
              <Icon name="finger-print-outline" size={18} color={colors.primaryInk} />
              <Txt variant="bodyStrong">خاص فيك</Txt>
            </Row>
            <Txt variant="caption" tone="muted">
              ما يشوفه أحد من الشلة
            </Txt>
          </Row>
          {unlocked ? (
            priv.map((d) => (
              <View key={d.id} style={{ padding: 12, gap: 4 }}>
                <Txt variant="bodyStrong">{d.title}</Txt>
                {Object.entries(d.data).map(([k, v]) => (
                  <Txt key={k} variant="caption" tone="muted">
                    {v}
                  </Txt>
                ))}
              </View>
            ))
          ) : (
            <Pressable onPress={unlock} style={{ padding: 16, flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityRole="button">
              <Txt style={{ flex: 1 }}>الجواز · التأمين · الهوية</Txt>
              <Icon name="lock-closed-outline" />
            </Pressable>
          )}
        </Card>
        <Card style={{ gap: 10 }}>
          <Txt variant="bodyStrong">أضف حجز</Txt>
          <Row gap={8}>
            <AddWay icon="mail-outline" label="حوّل الإيميل" onPress={() => Linking.openURL(`mailto:trips+${trip.id}@yallansafer.app`)} />
            <AddWay icon="camera-outline" label="صوّر" onPress={() => pickImage(trip.id)} />
            <AddWay icon="document-outline" label="ملف PDF" onPress={() => pickPdf(trip.id)} />
          </Row>
          <Txt variant="caption" tone="muted">
            حوّل تأكيد الحجز إلى trips+{trip.id.slice(-6)}@yallansafer.app وينضاف هنا وفي الجدول تلقائياً.
          </Txt>
        </Card>
      </ScrollView>
      <DocForm tripId={trip.id} visible={adding} onClose={() => setAdding(false)} />
      <Sheet visible={!!qr} onClose={() => setQr(null)} title={qr?.title ?? ''} subtitle="اعرضها عند البوابة">
        <View style={{ alignItems: 'center', padding: 24, backgroundColor: '#fff', borderRadius: 18 }}>
          <View style={{ width: 200, height: 200, flexDirection: 'row', flexWrap: 'wrap' }}>
            {Array.from({ length: 100 }, (_, i) => (
              <View key={i} style={{ width: 20, height: 20, backgroundColor: (i * 7 + (qr?.data.code?.length ?? 3) * i) % 3 === 0 ? '#000' : '#fff' }} />
            ))}
          </View>
          <Txt style={{ color: '#000', marginTop: 10 }} variant="bodyStrong">
            {qr?.data.code}
          </Txt>
        </View>
      </Sheet>
    </View>
  );
}

function DocCard({ d, onQr }: { d: TripDoc; onQr: () => void }) {
  const { colors } = useAppTheme();
  const head = { flight: 'airplane-outline', stay: 'bed-outline', ticket: 'ticket-outline', other: 'document-outline', private: 'lock-closed-outline' } as const;
  return (
    <Card padded={false}>
      <Row style={{ padding: 12, justifyContent: 'space-between', borderBottomWidth: 1, borderStyle: 'dashed', borderColor: colors.border }}>
        <Row gap={6}>
          <Icon name={head[d.kind]} size={18} color={colors.primaryInk} />
          <Txt variant="bodyStrong">
            {d.title}
            {d.startsAt ? ` · ${fmtDayFull(d.startsAt.slice(0, 10))}` : ''}
          </Txt>
        </Row>
        <IconBtn name="trash-outline" label="احذف المستند" variant="bare" size={32} onPress={() => removeDoc(d.id)} />
      </Row>
      {d.kind === 'flight' ? (
        <>
          <Row style={{ padding: 14, justifyContent: 'space-between' }}>
            <View style={{ alignItems: 'center' }}>
              <Txt variant="display">{d.data.from}</Txt>
              <Txt variant="caption" tone="muted">
                {d.data.fromCity} · {d.data.dep}
              </Txt>
            </View>
            <Icon name="airplane" color={colors.mutedForeground} style={{ transform: [{ scaleX: -1 }] }} />
            <View style={{ alignItems: 'center' }}>
              <Txt variant="display">{d.data.to}</Txt>
              <Txt variant="caption" tone="muted">
                {d.data.toCity} · {d.data.arr}
              </Txt>
            </View>
          </Row>
          <Row gap={0} style={{ borderTopWidth: 1, borderColor: colors.border }}>
            {[
              ['الرحلة', d.data.flight],
              ['البوابة', d.data.gate],
              ['المقعد', d.data.seat],
              ['الحجز', d.data.pnr],
            ].map(([k, v]) => (
              <View key={k} style={{ flex: 1, alignItems: 'center', paddingVertical: 8 }}>
                <Txt variant="caption" tone="muted">
                  {k}
                </Txt>
                <Txt variant="bodyStrong">{v || '—'}</Txt>
              </View>
            ))}
          </Row>
        </>
      ) : d.kind === 'stay' ? (
        <Row style={{ padding: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">{d.data.address}</Txt>
            <Txt variant="caption" tone="muted">
              تسجيل الدخول {d.data.checkin} · {d.data.nights} ليالي · رقم الحجز {d.data.ref}
            </Txt>
          </View>
          {d.data.phone ? <IconBtn name="call-outline" label="اتصال" onPress={() => Linking.openURL(`tel:${d.data.phone}`)} /> : null}
        </Row>
      ) : d.kind === 'ticket' ? (
        <Pressable onPress={onQr} style={{ padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 }} accessibilityRole="button">
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong">اعرض الـ QR عند البوابة</Txt>
            <Txt variant="caption" tone="muted">
              {d.data.count} تذاكر · {d.data.when}
            </Txt>
          </View>
          <Icon name="qr-code-outline" size={36} />
        </Pressable>
      ) : (
        <View style={{ padding: 12 }}>
          <Txt variant="caption" tone="muted">
            {d.fileUri ? 'ملف مرفق' : Object.values(d.data).join(' · ')}
          </Txt>
        </View>
      )}
    </Card>
  );
}

function AddWay({ icon, label, onPress }: { icon: React.ComponentProps<typeof Icon>['name']; label: string; onPress: () => void }) {
  const { colors } = useAppTheme();
  return (
    <Pressable onPress={onPress} accessibilityRole="button" style={{ flex: 1, alignItems: 'center', gap: 4, padding: 10, borderRadius: 12, borderWidth: 1, borderColor: colors.border }}>
      <Icon name={icon} color={colors.primaryInk} />
      <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }}>
        {label}
      </Txt>
    </Pressable>
  );
}

async function pickImage(tripId: ID) {
  const r = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7 });
  if (!r.canceled && r.assets[0]) addDoc({ tripId, kind: 'other', visibility: 'shared', title: 'صورة حجز', data: {}, fileUri: r.assets[0].uri });
}
async function pickPdf(tripId: ID) {
  const r = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true });
  if (!r.canceled && r.assets[0]) addDoc({ tripId, kind: 'other', visibility: 'shared', title: r.assets[0].name, data: {}, fileUri: r.assets[0].uri });
}

function DocForm({ tripId, visible, onClose }: { tripId: ID; visible: boolean; onClose: () => void }) {
  const trip = useTrip(tripId)!;
  const [kind, setKind] = useState<TripDoc['kind']>('flight');
  const [f, setF] = useState<Record<string, string>>({});
  const [vis, setVis] = useState<'shared' | 'private'>('shared');
  const set = (k: string) => (v: string) => setF({ ...f, [k]: v });
  const fields: Record<TripDoc['kind'], [string, string][]> = {
    flight: [['title', 'الوصف (مثلاً: الذهاب)'], ['from', 'من (رمز المطار)'], ['to', 'إلى'], ['date', 'التاريخ (YYYY-MM-DD)'], ['dep', 'وقت الإقلاع (HH:MM)'], ['arr', 'وقت الوصول'], ['flight', 'رقم الرحلة'], ['seat', 'المقعد'], ['pnr', 'رقم الحجز']],
    stay: [['title', 'اسم السكن'], ['address', 'العنوان'], ['date', 'تاريخ الدخول (YYYY-MM-DD)'], ['checkin', 'وقت الدخول'], ['nights', 'عدد الليالي'], ['ref', 'رقم الحجز'], ['phone', 'رقم التواصل']],
    ticket: [['title', 'اسم التذكرة'], ['date', 'التاريخ'], ['when', 'الوقت'], ['count', 'العدد'], ['code', 'رمز التذكرة']],
    private: [['title', 'الوصف'], ['passport', 'رقم الجواز'], ['insurance', 'التأمين']],
    other: [['title', 'الوصف'], ['note', 'تفاصيل']],
  };
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="مستند جديد"
      footer={
        <Btn
          size="lg"
          full
          title="احفظ"
          disabled={!f.title}
          onPress={() => {
            const { title, date, ...data } = f;
            const time = kind === 'flight' ? f.dep : kind === 'stay' ? f.checkin : f.when;
            addDoc({ tripId, kind, title, data: { ...data, fromCity: f.from ?? '', toCity: f.to ?? '' }, visibility: kind === 'private' ? 'private' : vis, startsAt: date ? `${date}T${time || '09:00'}` : trip.startDate ? `${trip.startDate}T${time || '09:00'}` : null });
            setF({});
            onClose();
          }}
        />
      }
    >
      <Row wrap gap={8}>
        {(
          [
            ['flight', 'طيران'],
            ['stay', 'سكن'],
            ['ticket', 'تذكرة'],
            ['private', 'خاص'],
            ['other', 'أخرى'],
          ] as [TripDoc['kind'], string][]
        ).map(([k, l]) => (
          <Pill key={k} label={l} active={kind === k} onPress={() => setKind(k)} />
        ))}
      </Row>
      {fields[kind].map(([k, l]) => (
        <Field key={k} label={l} value={f[k] ?? ''} onChangeText={set(k)} />
      ))}
      {kind !== 'private' ? (
        <Row gap={8}>
          <Pill label="مشترك مع الشلة" active={vis === 'shared'} onPress={() => setVis('shared')} />
          <Pill label="خاص فيني" active={vis === 'private'} onPress={() => setVis('private')} />
        </Row>
      ) : null}
    </Sheet>
  );
}

