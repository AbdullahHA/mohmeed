/** المحادثات (12) + محادثة الرحلة (13) + دليل السفر (15.6) + المجتمعات (القرار 7) */
import { useNavigation } from '@react-navigation/native';
import { useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, Pressable, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { catIcon, catLabel, Rating } from '../components';
import { useSheets } from '../components/sheets';
import { applyPlan, closePoll, createPoll, createTrip, joinCommunity, markRead, report, requestCommunity, sendGuide, sendText, sharePlace, toggleMute, vote } from '../data/actions';
import { useCol, useMap, useMe, useMeId, useToday, useUnread } from '../data/selectors';
import type { Chat, GuidePlan, Message } from '../data/types';
import { toast } from '../data/ui';
import { chatTime, inDays, sar, todayISO } from '../lib/format';
import { askGuide } from '../lib/guide';
import { SLOT_LABEL, countdown, tripDays, tripStatus } from '../lib/logic';
import type { RootProps } from '../navigation/types';
import { ExpenseSheet } from './Trip';
import { useAppTheme } from '../theme/ThemeProvider';
import { BACK, Avatar, Btn, Card, Chip, Empty, Field, HScroll, Icon, IconBtn, Photo, Pill, PillRow, Row, Screen, Section, Sheet, Txt, type IconName } from '../ui';

/* ---------- القائمة ---------- */
export function ChatsScreen() {
  const nav = useNavigation();
  const me = useMeId();
  const chats = useCol('chats');
  const messages = useCol('messages');
  const communities = useCol('communities');
  const [filter, setFilter] = useState<'all' | 'trip' | 'community' | 'direct'>('all');
  const mine = useMemo(() => {
    const last = (c: Chat) => messages.filter((m) => m.chatId === c.id).sort((a, b) => b.createdAt - a.createdAt)[0];
    return chats
      .filter((c) => c.memberIds.includes(me) && c.type !== 'guide')
      .map((c) => ({ chat: c, last: last(c) }))
      .sort((a, b) => (b.last?.createdAt ?? 0) - (a.last?.createdAt ?? 0));
  }, [chats, messages, me]);
  const list = filter === 'all' ? mine : mine.filter((x) => x.chat.type === filter);
  const suggested = communities.filter((c) => c.status === 'approved' && !c.memberIds.includes(me));
  return (
    <Screen
      header={
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: 18, paddingVertical: 8 }}>
          <Txt variant="title" accessibilityRole="header">
            المحادثة
          </Txt>
          <Row gap={8}>
            <IconBtn name="search" label="بحث" onPress={() => nav.navigate('Search')} />
            <IconBtn name="people-outline" label="المجتمعات" onPress={() => nav.navigate('Communities')} />
          </Row>
        </Row>
      }
    >
      <GuideBanner />
      <PillRow>
        <Pill label="الكل" active={filter === 'all'} onPress={() => setFilter('all')} />
        <Pill label="الرحلات" active={filter === 'trip'} onPress={() => setFilter('trip')} />
        <Pill label="المجتمعات" active={filter === 'community'} onPress={() => setFilter('community')} />
        <Pill label="خاص" active={filter === 'direct'} onPress={() => setFilter('direct')} />
      </PillRow>
      <View>
        {list.length ? (
          list.map(({ chat, last }, i) => <ChatRow key={chat.id} chat={chat} last={last} first={i === 0} />)
        ) : (
          <Empty icon="chatbubbles-outline" title="محادثات رحلاتك ومجتمعاتك بتطلع هنا" action={{ label: 'استكشف المجتمعات', onPress: () => nav.navigate('Communities') }} />
        )}
      </View>
      {suggested.length ? (
        <Section title="مجتمعات تناسبك" action={{ label: 'الكل', onPress: () => nav.navigate('Communities') }}>
          <HScroll>
            {suggested.map((c) => (
              <Card key={c.id} style={{ width: 160, gap: 8 }}>
                <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: c.color, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name={c.icon as IconName} color="#fff" />
                </View>
                <Txt variant="bodyStrong" numberOfLines={1}>
                  {c.name}
                </Txt>
                <Txt variant="caption" tone="muted">
                  {c.memberIds.length} أعضاء
                </Txt>
                <Btn size="sm" variant="ghost" title="انضم" onPress={() => { const id = joinCommunity(c.id); if (id) nav.navigate('Chat', { id }); }} />
              </Card>
            ))}
          </HScroll>
        </Section>
      ) : null}
    </Screen>
  );
}

function GuideBanner() {
  const nav = useNavigation();
  return (
    <Pressable onPress={() => nav.navigate('Guide')} accessibilityRole="button" accessibilityLabel="دليل السفر">
      <View style={{ borderRadius: 18, padding: 14, gap: 10, backgroundColor: '#2a46c8' }}>
        <Row gap={10}>
          <View style={{ width: 42, height: 42, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.18)', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="compass" color="#fff" />
          </View>
          <View style={{ flex: 1 }}>
            <Txt variant="bodyStrong" tone="white">
              دليل السفر
            </Txt>
            <Txt variant="caption" tone="white" style={{ opacity: 0.85 }}>
              اسألني عن أفضل الوجهات والأوقات والأماكن
            </Txt>
          </View>
        </Row>
        <Row gap={6}>
          {['وش أسوي في العلا 3 أيام؟', 'وين أروح بالشتاء؟'].map((q) => (
            <Pressable key={q} onPress={() => nav.navigate('Guide', { q })} style={{ borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.16)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', paddingHorizontal: 10, paddingVertical: 5 }}>
              <Txt variant="caption" tone="white">
                {q}
              </Txt>
            </Pressable>
          ))}
        </Row>
      </View>
    </Pressable>
  );
}

function ChatRow({ chat, last, first }: { chat: Chat; last?: Message; first: boolean }) {
  const nav = useNavigation();
  const { colors } = useAppTheme();
  const me = useMeId();
  const unread = useUnread(chat.id);
  const trips = useMap('trips');
  const users = useMap('users');
  const comms = useMap('communities');
  const places = useMap('places');
  const today = useToday();
  const trip = chat.tripId ? trips.get(chat.tripId) : undefined;
  const other = chat.type === 'direct' ? users.get(chat.memberIds.find((m) => m !== me)!) : undefined;
  const comm = chat.communityId ? comms.get(chat.communityId) : undefined;
  const title = trip?.title ?? comm?.name ?? other?.name ?? '';
  const sender = last ? (last.senderId === me ? 'أنت' : last.senderId === 'system' ? '' : users.get(last.senderId)?.name.split(' ')[0]) : '';
  const preview = !last
    ? 'ابدأ المحادثة'
    : last.kind === 'text' || last.kind === 'system'
      ? last.body
      : last.kind === 'place'
        ? `أرسل مكان: ${places.get(last.placeId!)?.name}`
        : last.kind === 'poll'
          ? 'سوّى تصويت'
          : last.kind === 'expense'
            ? 'سجّل مصروف'
            : 'صورة';
  const cd = trip ? countdown(trip, today) : null;
  const muted = chat.muted?.includes(me);
  return (
    <Pressable
      onPress={() => nav.navigate('Chat', { id: chat.id })}
      onLongPress={() => (toggleMute(chat.id), toast(muted ? 'رجعت الإشعارات' : 'انكتمت المحادثة'))}
      accessibilityRole="button"
      accessibilityLabel={`${title}${unread ? `، ${unread} رسائل جديدة` : ''}`}
      accessibilityHint="اضغط مطوّل للكتم"
      style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingVertical: 11, borderTopWidth: first ? 0 : 1, borderColor: colors.border }}
    >
      <View>
        {trip ? (
          <Photo scene={trip.scene} style={{ width: 52, height: 52, borderRadius: 16 }} />
        ) : comm ? (
          <View style={{ width: 52, height: 52, borderRadius: 16, backgroundColor: comm.color, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={comm.icon as IconName} color="#fff" size={24} />
          </View>
        ) : (
          <Avatar name={other?.name ?? ''} color={other?.color} size={52} />
        )}
        {trip || comm ? (
          <View style={{ position: 'absolute', bottom: -3, start: -3, width: 20, height: 20, borderRadius: 7, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
            <Icon name={trip ? 'briefcase' : 'people'} size={11} color={colors.primaryInk} />
          </View>
        ) : null}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Row gap={6}>
          <Txt variant="bodyStrong" numberOfLines={1} style={{ flexShrink: 1 }}>
            {title}
          </Txt>
          {trip && cd != null && cd > 0 ? <Chip tone="success" label={inDays(cd)} /> : null}
          {muted ? <Icon name="notifications-off-outline" size={14} /> : null}
        </Row>
        <Txt variant="caption" tone={unread ? 'foreground' : 'muted'} numberOfLines={1} style={unread ? { fontFamily: 'IBMPlexSansArabic_500Medium' } : null}>
          {sender ? `${sender}: ` : ''}
          {preview}
        </Txt>
      </View>
      <View style={{ alignItems: 'flex-end', gap: 4 }}>
        <Txt variant="caption" tone={unread ? 'primaryInk' : 'muted'} style={{ fontSize: 11 }}>
          {last ? chatTime(last.createdAt) : ''}
        </Txt>
        {unread ? (
          <View style={{ backgroundColor: colors.primary, borderRadius: 999, minWidth: 20, height: 20, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
            <Txt variant="badge" style={{ color: '#fff' }}>
              {unread}
            </Txt>
          </View>
        ) : null}
      </View>
    </Pressable>
  );
}

/* ---------- المحادثة ---------- */
export function ChatScreen({ route, navigation }: RootProps<'Chat'>) {
  const id = route.params.id;
  const { colors } = useAppTheme();
  const me = useMeId();
  const chat = useCol('chats').find((c) => c.id === id);
  const all = useCol('messages');
  const msgs = useMemo(() => all.filter((m) => m.chatId === id).sort((a, b) => b.createdAt - a.createdAt), [all, id]);
  const trips = useMap('trips');
  const users = useMap('users');
  const comms = useMap('communities');
  const items = useCol('items');
  const places = useMap('places');
  const today = useToday();
  const [text, setText] = useState('');
  const [pollOpen, setPollOpen] = useState(false);
  const [expOpen, setExpOpen] = useState(false);
  const [placeOpen, setPlaceOpen] = useState(false);
  const [reportMsg, setReportMsg] = useState<Message | null>(null);
  useEffect(() => {
    markRead(id);
  }, [id, msgs.length]);
  if (!chat) return <Empty icon="chatbubbles-outline" title="المحادثة غير موجودة" />;
  const trip = chat.tripId ? trips.get(chat.tripId) : undefined;
  const comm = chat.communityId ? comms.get(chat.communityId) : undefined;
  const other = chat.type === 'direct' ? users.get(chat.memberIds.find((m) => m !== me)!) : undefined;
  const title = trip?.title ?? comm?.name ?? other?.name ?? '';
  const names = chat.memberIds.map((m) => (m === me ? 'أنت' : users.get(m)?.name.split(' ')[0])).join('، ');
  const st = trip ? tripStatus(trip, today) : null;
  const nextDay = trip ? tripDays(trip).find((d) => d >= today) : undefined;
  const pinned = trip && nextDay ? items.filter((i) => i.tripId === trip.id && i.day === nextDay && i.placeId).map((i) => places.get(i.placeId!)?.name) : [];
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <Row gap={10} style={{ paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
        <IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} />
        {trip ? <Photo scene={trip.scene} style={{ width: 44, height: 44, borderRadius: 14 }} /> : other ? <Avatar name={other.name} color={other.color} size={44} /> : comm ? <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: comm.color, alignItems: 'center', justifyContent: 'center' }}><Icon name={comm.icon as IconName} color="#fff" /></View> : null}
        <Pressable style={{ flex: 1 }} onPress={() => (trip ? navigation.navigate('Trip', { id: trip.id }) : other ? navigation.navigate('User', { id: other.id }) : null)}>
          <Txt variant="bodyStrong" numberOfLines={1}>
            {title}
          </Txt>
          <Txt variant="caption" tone="muted" numberOfLines={1}>
            {comm ? `${comm.memberIds.length} أعضاء` : names}
            {trip && st === 'upcoming' ? ` · ${inDays(countdown(trip, today) ?? 0)}` : ''}
          </Txt>
        </Pressable>
        {trip ? <IconBtn name="calendar-outline" label="الجدول" onPress={() => navigation.navigate('Trip', { id: trip.id })} /> : null}
      </Row>
      {pinned.length ? (
        <Pressable onPress={() => navigation.navigate('Trip', { id: trip!.id })} style={{ margin: 10, marginBottom: 0, padding: 10, borderRadius: 14, backgroundColor: colors.primarySoft, flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          <Icon name="pin" size={16} color={colors.primaryInk} />
          <Txt variant="caption" style={{ flex: 1 }} numberOfLines={1}>
            <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_700Bold' }}>
              {nextDay === todayISO() ? 'اليوم' : 'أول يوم'}:{' '}
            </Txt>
            {pinned.join(' ← ')}
          </Txt>
        </Pressable>
      ) : null}
      <FlatList
        inverted
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 14, gap: 10 }}
        renderItem={({ item }) => <Bubble m={item} chat={chat} onLong={() => comm && item.senderId !== me && setReportMsg(item)} />}
      />
      <View style={{ borderTopWidth: 1, borderColor: colors.border, padding: 10, gap: 8, backgroundColor: colors.background }}>
        {(
          <PillRow>
            <Pill label="مكان" icon="location-outline" onPress={() => setPlaceOpen(true)} />
            {trip ? <Pill label="تصويت" icon="stats-chart-outline" onPress={() => setPollOpen(true)} /> : null}
            {trip ? <Pill label="مصروف" icon="wallet-outline" onPress={() => setExpOpen(true)} /> : null}
          </PillRow>
        )}
        <Row gap={8}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="اكتب رسالة…"
            placeholderTextColor={colors.mutedForeground}
            multiline
            accessibilityLabel="اكتب رسالة"
            style={{ flex: 1, minHeight: 44, maxHeight: 120, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, paddingVertical: 10, color: colors.foreground, fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 15, textAlign: 'right' }}
          />
          <IconBtn name="send" label="إرسال" variant="primary" size={44} onPress={() => (sendText(id, text), setText(''))} />
        </Row>
      </View>
      {trip ? <PollSheet chatId={id} tripId={trip.id} visible={pollOpen} onClose={() => setPollOpen(false)} /> : null}
      {trip ? <ExpenseSheet tripId={trip.id} visible={expOpen} onClose={() => setExpOpen(false)} fromChat /> : null}
      <PlacePickSheet visible={placeOpen} onClose={() => setPlaceOpen(false)} cityId={trip?.cityId} onPick={(pid) => { sharePlace(id, pid); setPlaceOpen(false); }} />
      <Sheet visible={!!reportMsg} onClose={() => setReportMsg(null)} title="بلاغ عن الرسالة">
        {['محتوى غير لائق', 'إزعاج أو إعلانات', 'معلومات مضللة'].map((r) => (
          <Card key={r} onPress={() => (report({ communityId: comm?.id, messageId: reportMsg?.id, userId: reportMsg?.senderId, reason: r }), setReportMsg(null))}>
            <Txt>{r}</Txt>
          </Card>
        ))}
      </Sheet>
    </SafeAreaView>
  );
}

function Bubble({ m, chat, onLong }: { m: Message; chat: Chat; onLong: () => void }) {
  const { colors } = useAppTheme();
  const nav = useNavigation();
  const me = useMeId();
  const users = useMap('users');
  const places = useMap('places');
  const polls = useMap('polls');
  const expenses = useMap('expenses');
  const openAdd = useSheets((s) => s.openAddToTrip);
  const mine = m.senderId === me;
  const u = users.get(m.senderId);
  if (m.kind === 'system')
    return (
      <View style={{ alignSelf: 'center', backgroundColor: colors.muted, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 }}>
        <Txt variant="caption" tone="muted">
          {m.body}
        </Txt>
      </View>
    );
  const wrap = (child: React.ReactNode, padded = true) => (
    <Pressable onLongPress={onLong} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-end', alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '86%' }}>
      {!mine ? <Avatar name={u?.name ?? 'د'} color={u?.color} size={28} /> : null}
      <View
        style={{
          flexShrink: 1,
          backgroundColor: mine && padded ? colors.primary : colors.card,
          borderWidth: mine && padded ? 0 : 1,
          borderColor: colors.border,
          borderRadius: 18,
          borderBottomEndRadius: mine ? 6 : 18,
          borderBottomStartRadius: mine ? 18 : 6,
          padding: padded ? 10 : 0,
          overflow: 'hidden',
          minWidth: 120,
        }}
      >
        {!mine && chat.type !== 'direct' && padded ? (
          <Txt variant="badge" style={{ color: u?.color ?? colors.primaryInk }}>
            {u?.name}
          </Txt>
        ) : null}
        {child}
        {padded ? (
          <Txt variant="caption" style={{ fontSize: 11, color: mine ? 'rgba(255,255,255,0.75)' : colors.mutedForeground, alignSelf: 'flex-start' }}>
            {chatTime(m.createdAt)}
            {mine ? ' ✓✓' : ''}
          </Txt>
        ) : null}
      </View>
    </Pressable>
  );
  if (m.kind === 'text') return wrap(<Txt style={{ color: mine ? '#fff' : colors.foreground }}>{m.body}</Txt>);
  if (m.kind === 'place') {
    const p = places.get(m.placeId!);
    if (!p) return null;
    return wrap(
      <View style={{ width: 240 }}>
        <Pressable onPress={() => nav.navigate('Place', { id: p.id })}>
          <Photo uri={p.photo} scene={p.scene} icon={catIcon(p.category)} style={{ height: 100 }} />
        </Pressable>
        <View style={{ padding: 10, gap: 6 }}>
          <Txt variant="bodyStrong">{p.name}</Txt>
          <Row gap={6}>
            <Rating value={p.rating} />
            <Txt variant="caption" tone="muted">
              · {catLabel(p.category)}
            </Txt>
          </Row>
          {chat.tripId ? <Btn size="sm" variant="ghost" icon="add" title="أضف للجدول" onPress={() => openAdd(p.id, chat.tripId!)} /> : <Btn size="sm" variant="ghost" title="افتح" onPress={() => nav.navigate('Place', { id: p.id })} />}
        </View>
      </View>,
      false,
    );
  }
  if (m.kind === 'poll') {
    const p = polls.get(m.pollId!);
    if (!p) return null;
    const total = Object.keys(p.votes).length;
    const myVote = p.votes[me];
    return wrap(
      <View style={{ width: 250, padding: 12, gap: 8 }}>
        <Row gap={6}>
          <Icon name="stats-chart" size={16} color={colors.primaryInk} />
          <Txt variant="bodyStrong">{p.question}</Txt>
        </Row>
        {p.options.map((o) => {
          const n = Object.values(p.votes).filter((v) => v === o.id).length;
          return (
            <Pressable
              key={o.id}
              disabled={p.closed}
              onPress={() => vote(p.id, o.id)}
              accessibilityRole="radio"
              accessibilityState={{ selected: myVote === o.id, disabled: p.closed }}
              style={{ borderWidth: myVote === o.id ? 2 : 1, borderColor: myVote === o.id ? colors.primary : colors.border, borderRadius: 10, overflow: 'hidden', minHeight: 40, justifyContent: 'center' }}
            >
              <View style={{ position: 'absolute', top: 0, bottom: 0, start: 0, width: `${total ? (n / total) * 100 : 0}%`, backgroundColor: colors.primarySoft }} />
              <Row style={{ justifyContent: 'space-between', paddingHorizontal: 10 }}>
                <Txt variant={myVote === o.id ? 'bodyStrong' : 'body'}>
                  {o.label}
                  {myVote === o.id ? ' ✓' : ''}
                </Txt>
                <Txt variant="caption" tone="muted">
                  {n}
                </Txt>
              </Row>
            </Pressable>
          );
        })}
        <Txt variant="caption" tone="muted">
          {p.closed ? (p.target ? 'انقفل التصويت · انضاف الفائز للجدول' : 'انقفل التصويت') : `${total} من ${chat.memberIds.length} صوّتوا`}
        </Txt>
        {!p.closed && p.createdBy === me ? <Btn size="sm" variant="plain" title="اقفل التصويت الحين" onPress={() => closePoll(p.id)} /> : null}
      </View>,
      false,
    );
  }
  if (m.kind === 'expense') {
    const e = expenses.get(m.expenseId!);
    if (!e) return null;
    return wrap(
      <View style={{ width: 230, padding: 12, gap: 4 }}>
        <Row gap={6}>
          <Icon name="wallet" size={16} color={colors.goldInk} />
          <Txt variant="bodyStrong">مصروف: {e.note}</Txt>
        </Row>
        <Txt variant="heading">{sar(e.amountSar)}</Txt>
        <Txt variant="caption" tone="muted">
          مقسوم على {e.splitBetween.length} · نصيب كل واحد {sar(e.amountSar / e.splitBetween.length)}
        </Txt>
      </View>,
      false,
    );
  }
  return null;
}

function PollSheet({ chatId, tripId, visible, onClose }: { chatId: string; tripId: string; visible: boolean; onClose: () => void }) {
  const trip = useMap('trips').get(tripId)!;
  const places = useCol('places').filter((p) => p.cityId === trip.cityId);
  const [q, setQ] = useState('');
  const [opts, setOpts] = useState<{ label: string; placeId?: string }[]>([]);
  const [day, setDay] = useState<string | null>(null);
  const [slot, setSlot] = useState<'breakfast' | 'lunch' | 'dinner' | null>('dinner');
  const days = tripDays(trip);
  return (
    <Sheet
      visible={visible}
      onClose={onClose}
      title="تصويت جديد"
      subtitle="لما يصوّت الكل، الفائز ينضاف للجدول"
      footer={
        <Btn
          size="lg"
          full
          title="أرسل التصويت"
          disabled={!q.trim() || opts.length < 2}
          onPress={() => {
            createPoll(chatId, q, opts, day && slot ? { tripId, day, slot } : null);
            setQ('');
            setOpts([]);
            onClose();
          }}
        />
      }
    >
      <Field label="السؤال" placeholder="وين نتعشى أول ليلة؟" value={q} onChangeText={setQ} />
      <Txt variant="bodyStrong">الخيارات ({opts.length})</Txt>
      <Row wrap gap={8}>
        {places.map((p) => {
          const on = opts.some((o) => o.placeId === p.id);
          return <Pill key={p.id} label={p.name} active={on} onPress={() => setOpts(on ? opts.filter((o) => o.placeId !== p.id) : [...opts, { label: p.name, placeId: p.id }])} />;
        })}
      </Row>
      {days.length ? (
        <>
          <Txt variant="bodyStrong">الفائز ينضاف لـ (اختياري)</Txt>
          <Row wrap gap={8}>
            {days.map((d, i) => (
              <Pill key={d} label={`اليوم ${i + 1}`} active={day === d} onPress={() => setDay(day === d ? null : d)} />
            ))}
          </Row>
          <Row gap={8}>
            {(['breakfast', 'lunch', 'dinner'] as const).map((s) => (
              <Pill key={s} label={SLOT_LABEL[s]} active={slot === s} onPress={() => setSlot(s)} />
            ))}
          </Row>
        </>
      ) : null}
    </Sheet>
  );
}

function PlacePickSheet({ visible, onClose, onPick, cityId }: { visible: boolean; onClose: () => void; onPick: (id: string) => void; cityId?: string }) {
  const places = useCol('places');
  const [q, setQ] = useState('');
  const list = places.filter((p) => (!cityId || p.cityId === cityId || q) && (!q || p.name.includes(q))).slice(0, 20);
  return (
    <Sheet visible={visible} onClose={onClose} title="شارك مكان">
      <Field placeholder="ابحث" value={q} onChangeText={setQ} />
      {list.map((p) => (
        <Card key={p.id} onPress={() => onPick(p.id)}>
          <Row>
            <Photo scene={p.scene} style={{ width: 40, height: 40, borderRadius: 10 }} />
            <Txt variant="bodyStrong" style={{ flex: 1 }}>
              {p.name}
            </Txt>
          </Row>
        </Card>
      ))}
    </Sheet>
  );
}

/* ---------- دليل السفر ---------- */
export function GuideScreen({ route, navigation }: RootProps<'Guide'>) {
  const { colors } = useAppTheme();
  const me = useMe();
  const cities = useCol('cities');
  const places = useCol('places');
  const all = useCol('messages');
  const msgs = useMemo(() => all.filter((m) => m.chatId === 'ch_guide').sort((a, b) => b.createdAt - a.createdAt), [all]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const asked = useRef(false);
  const lastPlan = msgs.find((m) => m.plan)?.plan ?? null;
  const ask = async (q: string) => {
    if (!q.trim()) return;
    sendGuide('ch_guide', me.id, q.trim());
    setText('');
    setThinking(true);
    const r = await askGuide(q, { cities, places, me, prev: lastPlan });
    setTimeout(() => {
      sendGuide('ch_guide', 'guide', r.text, r.plan);
      setThinking(false);
    }, 600);
  };
  useEffect(() => {
    if (route.params?.q && !asked.current) {
      asked.current = true;
      void ask(route.params.q);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <SafeAreaView edges={['top', 'bottom']} style={{ flex: 1, backgroundColor: colors.background }}>
      <Row gap={10} style={{ paddingHorizontal: 14, paddingVertical: 8, borderBottomWidth: 1, borderColor: colors.border }}>
        <IconBtn name={BACK} label="رجوع" onPress={() => navigation.goBack()} />
        <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="compass" color="#fff" />
        </View>
        <View style={{ flex: 1 }}>
          <Txt variant="bodyStrong">دليل السفر</Txt>
          <Txt variant="caption" tone="muted">
            يعرف اهتماماتك وميزانيتك
          </Txt>
        </View>
      </Row>
      <FlatList
        inverted
        data={msgs}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 14, gap: 12 }}
        ListHeaderComponent={thinking ? <Txt tone="muted">الدليل يكتب…</Txt> : null}
        renderItem={({ item }) => (item.senderId === 'guide' ? <GuideAnswer m={item} onAsk={ask} /> : <View style={{ alignSelf: 'flex-end', maxWidth: '85%', backgroundColor: colors.primary, borderRadius: 18, borderBottomEndRadius: 6, padding: 10 }}><Txt style={{ color: '#fff' }}>{item.body}</Txt></View>)}
      />
      <View style={{ borderTopWidth: 1, borderColor: colors.border, padding: 10, gap: 8 }}>
        <PillRow>
          {(lastPlan ? ['أرخص؟', 'أضف يوم ثالث', 'مطاعم بس'] : ['وش أسوي في العلا 3 أيام؟', 'ويكند في جدة', 'تبليسي 4 أيام مع العائلة']).map((q) => (
            <Pill key={q} label={q} onPress={() => ask(q)} />
          ))}
        </PillRow>
        <Row gap={8}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="اسأل الدليل…"
            placeholderTextColor={colors.mutedForeground}
            onSubmitEditing={() => ask(text)}
            returnKeyType="send"
            accessibilityLabel="اسأل الدليل"
            style={{ flex: 1, height: 44, borderRadius: 22, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, paddingHorizontal: 14, color: colors.foreground, fontFamily: 'IBMPlexSansArabic_400Regular', fontSize: 15, textAlign: 'right' }}
          />
          <IconBtn name="send" label="إرسال" variant="primary" size={44} onPress={() => ask(text)} />
        </Row>
      </View>
    </SafeAreaView>
  );
}

function GuideAnswer({ m, onAsk }: { m: Message; onAsk: (q: string) => void }) {
  const nav = useNavigation();
  const { colors } = useAppTheme();
  const places = useMap('places');
  const plan = m.plan as GuidePlan | null | undefined;
  return (
    <Row gap={8} style={{ alignItems: 'flex-start' }}>
      <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="compass" size={16} color="#fff" />
      </View>
      <View style={{ flex: 1, gap: 8 }}>
        <Txt>{m.body}</Txt>
        {plan?.days.map((d) => (
          <Card key={d.title} style={{ gap: 4 }}>
            <Txt variant="bodyStrong" tone="primaryInk">
              {d.title}
            </Txt>
            {d.placeIds.map((pid) => (
              <Pressable key={pid} onPress={() => nav.navigate('Place', { id: pid })}>
                <Txt>• {places.get(pid)?.name}</Txt>
              </Pressable>
            ))}
            {d.notes.map((n) => (
              <Txt key={n} variant="caption" tone="goldInk">
                {n}
              </Txt>
            ))}
          </Card>
        ))}
        {plan ? (
          <>
            <HScroll gap={8}>
              {plan.days.flatMap((d) => d.placeIds).slice(0, 6).map((pid) => {
                const p = places.get(pid);
                return p ? (
                  <Card key={pid} padded={false} onPress={() => nav.navigate('Place', { id: pid })} style={{ width: 130 }}>
                    <Photo scene={p.scene} style={{ height: 70 }} />
                    <View style={{ padding: 6 }}>
                      <Txt variant="caption" style={{ fontFamily: 'IBMPlexSansArabic_600SemiBold' }} numberOfLines={1}>
                        {p.name}
                      </Txt>
                      <Rating value={p.rating} />
                    </View>
                  </Card>
                ) : null;
              })}
            </HScroll>
            <Row gap={8} wrap>
              <Btn
                icon="briefcase-outline"
                title="حوّلها لرحلة"
                onPress={() => {
                  const start = new Date(Date.now() + 864e5 * 14).toISOString().slice(0, 10);
                  const end = new Date(Date.now() + 864e5 * (13 + plan.days.length)).toISOString().slice(0, 10);
                  const id = createTrip({ cityId: plan.cityId, startDate: start, endDate: end, datesMode: 'fixed', travelerType: 'group', needs: [], autoPlan: null });
                  applyPlan(id, plan, start);
                  nav.navigate('Trip', { id });
                  toast('انسوت الرحلة بالجدول كامل. عدّل التواريخ براحتك');
                }}
              />
              <Btn variant="ghost" title="اسأل أكثر" onPress={() => onAsk('أرخص؟')} />
            </Row>
          </>
        ) : null}
      </View>
    </Row>
  );
}

/* ---------- المجتمعات ---------- */
const ICONS: IconName[] = ['sunny', 'water', 'restaurant', 'people', 'camera', 'car', 'airplane', 'business'];
const COLORS = ['#d97a2b', '#2a55d8', '#e07b24', '#1f9d63', '#b2449a', '#2a9bb0', '#6a5cf0', '#ab5637'];
export function CommunitiesScreen({ navigation }: RootProps<'Communities'>) {
  const me = useMeId();
  const comms = useCol('communities');
  const [req, setReq] = useState(false);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [icon, setIcon] = useState<IconName>('sunny');
  const [color, setColor] = useState(COLORS[0]);
  const approved = comms.filter((c) => c.status === 'approved');
  const myPending = comms.filter((c) => c.status !== 'approved' && c.requestedBy === me);
  return (
    <Screen header={<Header2 title="المجتمعات" onBack={() => navigation.goBack()} right={<Btn size="sm" icon="add" title="اطلب مجتمع" onPress={() => setReq(true)} />} />}>
      {myPending.map((c) => (
        <Card key={c.id} tone={c.status === 'rejected' ? 'gold' : 'primary'}>
          <Txt variant="bodyStrong">{c.name}</Txt>
          <Txt variant="caption" tone="muted">
            {c.status === 'pending' ? 'طلبك قيد المراجعة، بنبلغك أول ما ينقبل' : `انرفض الطلب${c.rejectReason ? `: ${c.rejectReason}` : ''}`}
          </Txt>
        </Card>
      ))}
      {approved.map((c) => {
        const member = c.memberIds.includes(me);
        return (
          <Card key={c.id}>
            <Row gap={12}>
              <View style={{ width: 48, height: 48, borderRadius: 14, backgroundColor: c.color, alignItems: 'center', justifyContent: 'center' }}>
                <Icon name={c.icon as IconName} color="#fff" />
              </View>
              <View style={{ flex: 1 }}>
                <Txt variant="bodyStrong">{c.name}</Txt>
                <Txt variant="caption" tone="muted" numberOfLines={2}>
                  {c.description}
                </Txt>
              </View>
              <Btn
                size="sm"
                variant={member ? 'ghost' : 'primary'}
                title={member ? 'افتح' : 'انضم'}
                onPress={() => {
                  const id = joinCommunity(c.id);
                  if (id) navigation.navigate('Chat', { id });
                }}
              />
            </Row>
          </Card>
        );
      })}
      <Sheet
        visible={req}
        onClose={() => setReq(false)}
        title="اطلب مجتمع جديد"
        subtitle="بنراجع الطلب، وإذا انقبل تصير مشرف المجتمع"
        footer={<Btn size="lg" full title="أرسل الطلب" disabled={!name.trim() || !desc.trim()} onPress={() => (requestCommunity(name, desc, icon, color), setReq(false), setName(''), setDesc(''))} />}
      >
        <Field label="اسم المجتمع" value={name} onChangeText={setName} placeholder="مثلاً: سفر مع الأطفال" />
        <Field label="عن وش المجتمع؟" value={desc} onChangeText={setDesc} multiline />
        <Txt variant="bodyStrong">الأيقونة</Txt>
        <Row wrap gap={8}>
          {ICONS.map((i) => (
            <IconBtn key={i} name={i} label={i} variant={icon === i ? 'primary' : 'plain'} onPress={() => setIcon(i)} />
          ))}
        </Row>
        <Row wrap gap={8}>
          {COLORS.map((c) => (
            <Pressable key={c} onPress={() => setColor(c)} accessibilityLabel={`لون ${c}`} style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c, borderWidth: color === c ? 3 : 0, borderColor: '#fff' }} />
          ))}
        </Row>
      </Sheet>
    </Screen>
  );
}

function Header2({ title, onBack, right }: { title: string; onBack: () => void; right?: React.ReactNode }) {
  return (
    <Row gap={10} style={{ paddingHorizontal: 18, paddingVertical: 8 }}>
      <IconBtn name={BACK} label="رجوع" onPress={onBack} />
      <Txt variant="heading" style={{ flex: 1 }}>
        {title}
      </Txt>
      {right}
    </Row>
  );
}

