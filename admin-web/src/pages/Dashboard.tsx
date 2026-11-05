import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TrendChart from '../components/TrendChart';
import Gauge from '../components/Gauge';
import WeekdayBarChart from '../components/WeekdayBarChart';
import KpiTile from '../components/KpiTile';
import RankedBarList from '../components/RankedBarList';
import { UsersIcon, RouteIcon, PinIcon, BellIcon } from '../components/icons';

const TREND_DAYS = 30;
const WEEKDAY_LABELS = ['أحد', 'اثنين', 'ثلاثاء', 'أربعاء', 'خميس', 'جمعة', 'سبت'];

function lastNDays(n: number): string[] {
  const out: string[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    out.push(d.toISOString().slice(0, 10));
  }
  return out;
}

function bucketByDay(timestamps: string[], days: string[]): { date: string; value: number }[] {
  const counts: Record<string, number> = {};
  for (const day of days) counts[day] = 0;
  for (const ts of timestamps) {
    const day = ts.slice(0, 10);
    if (day in counts) counts[day] += 1;
  }
  return days.map((date) => ({ date, value: counts[date] }));
}

function bucketByWeekday(timestamps: string[]): { label: string; value: number }[] {
  const counts = new Array(7).fill(0);
  for (const ts of timestamps) counts[new Date(ts).getDay()] += 1;
  return WEEKDAY_LABELS.map((label, i) => ({ label, value: counts[i] }));
}

function countInWindow(timestamps: string[], start: Date, end: Date): number {
  return timestamps.filter((ts) => {
    const t = new Date(ts).getTime();
    return t >= start.getTime() && t < end.getTime();
  }).length;
}

function percentDelta(curr: number, prev: number): number | null {
  if (prev === 0) return null;
  return ((curr - prev) / prev) * 100;
}

type Counts = {
  destinations: number;
  places: number;
  users: number;
  trips: number;
  communities: number;
  pushTokens: number;
};

type PendingCounts = {
  communityRequests: number;
  openReports: number;
};

type Kpis = {
  users: { curr: number; prev: number; trend: number[] };
  trips: { curr: number; prev: number; trend: number[] };
  checkIns: { curr: number; prev: number; trend: number[] };
  pushTokens: { curr: number; prev: number; trend: number[] };
};

type TopPlace = { id: string; name: string; rating: number; recommendCount: number };

type GuideUsage = { messages: number; uniqueUsers: number };

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [pending, setPending] = useState<PendingCounts | null>(null);
  const [userTrend, setUserTrend] = useState<{ date: string; value: number }[] | null>(null);
  const [tripTrend, setTripTrend] = useState<{ date: string; value: number }[] | null>(null);
  const [kpis, setKpis] = useState<Kpis | null>(null);
  const [satisfaction, setSatisfaction] = useState<{ percent: number; total: number } | null>(null);
  const [weekdayActivity, setWeekdayActivity] = useState<{ label: string; value: number }[] | null>(null);
  const [topPlaces, setTopPlaces] = useState<TopPlace[] | null>(null);
  const [guideUsage, setGuideUsage] = useState<GuideUsage | null>(null);
  const [topDestinations, setTopDestinations] = useState<{ label: string; value: number }[] | null>(null);

  useEffect(() => {
    (async () => {
      const days = lastNDays(TREND_DAYS);
      const since = new Date();
      since.setDate(since.getDate() - (TREND_DAYS - 1));
      since.setHours(0, 0, 0, 0);
      const [{ data: profileRows }, { data: tripRows }] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', since.toISOString()),
        supabase.from('trips').select('created_at').gte('created_at', since.toISOString()),
      ]);
      setUserTrend(bucketByDay((profileRows ?? []).map((r) => r.created_at), days));
      setTripTrend(bucketByDay((tripRows ?? []).map((r) => r.created_at), days));
    })();

    (async () => {
      const [destinations, places, users, trips, communities, pushTokens] = await Promise.all([
        supabase.from('destinations').select('id', { count: 'exact', head: true }),
        supabase.from('places').select('id', { count: 'exact', head: true }),
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('trips').select('id', { count: 'exact', head: true }),
        supabase.from('communities').select('id', { count: 'exact', head: true }),
        supabase.from('push_tokens').select('id', { count: 'exact', head: true }),
      ]);
      setCounts({
        destinations: destinations.count ?? 0,
        places: places.count ?? 0,
        users: users.count ?? 0,
        trips: trips.count ?? 0,
        communities: communities.count ?? 0,
        pushTokens: pushTokens.count ?? 0,
      });
    })();

    (async () => {
      const [communityRequests, openReports] = await Promise.all([
        supabase.from('community_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('community_reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
      ]);
      setPending({
        communityRequests: communityRequests.count ?? 0,
        openReports: openReports.count ?? 0,
      });
    })();

    (async () => {
      const now = new Date();
      const start14 = new Date(now);
      start14.setDate(start14.getDate() - 14);
      const start7 = new Date(now);
      start7.setDate(start7.getDate() - 7);

      const [{ data: profileRows }, { data: tripRows }, { data: checkInRows }, { data: pushRows }] = await Promise.all([
        supabase.from('profiles').select('created_at').gte('created_at', start14.toISOString()),
        supabase.from('trips').select('created_at').gte('created_at', start14.toISOString()),
        supabase.from('check_ins').select('created_at').gte('created_at', start14.toISOString()),
        supabase.from('push_tokens').select('created_at').gte('created_at', start14.toISOString()),
      ]);

      const days14 = lastNDays(14);
      const makeWindowCounts = (rows: { created_at: string }[] | null) => {
        const ts = (rows ?? []).map((r) => r.created_at);
        return {
          curr: countInWindow(ts, start7, now),
          prev: countInWindow(ts, start14, start7),
          trend: bucketByDay(ts, days14).map((d) => d.value),
        };
      };

      setKpis({
        users: makeWindowCounts(profileRows),
        trips: makeWindowCounts(tripRows),
        checkIns: makeWindowCounts(checkInRows),
        pushTokens: makeWindowCounts(pushRows),
      });
    })();

    (async () => {
      const { data } = await supabase.from('feedback').select('rating');
      const rows = data ?? [];
      const total = rows.length;
      const loved = rows.filter((r) => r.rating === 'loved').length;
      setSatisfaction({ percent: total > 0 ? (loved / total) * 100 : 0, total });
    })();

    (async () => {
      const since90 = new Date();
      since90.setDate(since90.getDate() - 90);
      const { data } = await supabase.from('trips').select('created_at').gte('created_at', since90.toISOString());
      setWeekdayActivity(bucketByWeekday((data ?? []).map((r) => r.created_at)));
    })();

    (async () => {
      const { data } = await supabase.from('trips').select('destination');
      const tally: Record<string, number> = {};
      for (const r of data ?? []) tally[r.destination] = (tally[r.destination] ?? 0) + 1;
      setTopDestinations(
        Object.entries(tally)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 6)
          .map(([label, value]) => ({ label, value }))
      );
    })();

    (async () => {
      const since30 = new Date();
      since30.setDate(since30.getDate() - 30);
      const { data } = await supabase
        .from('guide_messages')
        .select('profile_id')
        .eq('from_id', 'me')
        .gte('at', since30.toISOString());
      const rows = data ?? [];
      setGuideUsage({ messages: rows.length, uniqueUsers: new Set(rows.map((r) => r.profile_id)).size });
    })();

    (async () => {
      const { data: recs } = await supabase.from('recommended_places').select('place_id');
      const tally: Record<string, number> = {};
      for (const r of recs ?? []) tally[r.place_id] = (tally[r.place_id] ?? 0) + 1;
      const topIds = Object.entries(tally)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([id]) => id);
      if (topIds.length === 0) {
        setTopPlaces([]);
        return;
      }
      const { data: places } = await supabase.from('places').select('id,name,rating').in('id', topIds);
      const byId: Record<string, { name: string; rating: number }> = {};
      for (const p of places ?? []) byId[p.id] = { name: p.name, rating: p.rating };
      setTopPlaces(
        topIds
          .filter((id) => byId[id])
          .map((id) => ({ id, name: byId[id].name, rating: byId[id].rating, recommendCount: tally[id] }))
      );
    })();
  }, []);

  const alerts = [
    { label: 'طلبات إنشاء مجتمعات قيد المراجعة', value: pending?.communityRequests, to: '/community-requests' },
    { label: 'بلاغات مجتمعات مفتوحة', value: pending?.openReports, to: '/community-reports' },
  ].filter((a) => (a.value ?? 0) > 0);

  const cards = [
    { label: 'المستخدمون', value: counts?.users, to: '/users' },
    { label: 'الوجهات', value: counts?.destinations, to: '/destinations' },
    { label: 'الأماكن', value: counts?.places, to: '/places' },
    { label: 'الرحلات', value: counts?.trips, to: null },
    { label: 'المجتمعات', value: counts?.communities, to: '/communities' },
    { label: 'أجهزة مسجّلة للإشعارات', value: counts?.pushTokens, to: '/notifications' },
  ];

  return (
    <div>
      <h1 className="mb-6 text-xl font-bold text-foreground">نظرة عامة</h1>
      {alerts.length > 0 ? (
        <div className="mb-6 flex flex-col gap-2">
          {alerts.map((a) => (
            <Link
              key={a.label}
              to={a.to}
              className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive hover:bg-destructive/15"
            >
              <span>{a.label}</span>
              <span className="num rounded-full bg-destructive px-2.5 py-0.5 text-xs font-bold text-destructive-foreground">{a.value}</span>
            </Link>
          ))}
        </div>
      ) : null}

      {/* مؤشرات سلوك المستخدم — آخر 7 أيام مقابل الأسبوع اللي قبله */}
      <div className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiTile
          icon={<UsersIcon />}
          iconBg="var(--color-secondary)"
          iconColor="var(--color-primary-ink)"
          label="مستخدمون جدد"
          value={kpis?.users.curr ?? null}
          deltaPercent={kpis ? percentDelta(kpis.users.curr, kpis.users.prev) : null}
          deltaLabel="مقابل الأسبوع اللي قبله"
          trend={kpis?.users.trend}
        />
        <KpiTile
          icon={<RouteIcon />}
          iconBg="var(--color-gold-soft)"
          iconColor="var(--color-gold-ink)"
          label="رحلات جديدة"
          value={kpis?.trips.curr ?? null}
          deltaPercent={kpis ? percentDelta(kpis.trips.curr, kpis.trips.prev) : null}
          deltaLabel="مقابل الأسبوع اللي قبله"
          trend={kpis?.trips.trend}
        />
        <KpiTile
          icon={<PinIcon />}
          iconBg="var(--color-success-soft)"
          iconColor="var(--color-success-ink)"
          label="تسجيلات حضور"
          value={kpis?.checkIns.curr ?? null}
          deltaPercent={kpis ? percentDelta(kpis.checkIns.curr, kpis.checkIns.prev) : null}
          deltaLabel="مقابل الأسبوع اللي قبله"
          trend={kpis?.checkIns.trend}
        />
        <KpiTile
          icon={<BellIcon />}
          iconBg="var(--color-secondary)"
          iconColor="var(--color-primary-ink)"
          label="تفعيلات إشعارات"
          value={kpis?.pushTokens.curr ?? null}
          deltaPercent={kpis ? percentDelta(kpis.pushTokens.curr, kpis.pushTokens.prev) : null}
          deltaLabel="مقابل الأسبوع اللي قبله"
          trend={kpis?.pushTokens.trend}
        />
      </div>

      {userTrend && tripTrend ? (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <TrendChart title="مستخدمون جدد (آخر 30 يوم)" data={userTrend} />
          <TrendChart title="رحلات جديدة (آخر 30 يوم)" data={tripTrend} />
        </div>
      ) : null}

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {satisfaction ? (
          <Gauge
            percent={satisfaction.percent}
            label="نسبة الرضا"
            sublabel={satisfaction.total > 0 ? `من ${satisfaction.total} تقييم` : 'ما فيه تقييمات بعد'}
          />
        ) : null}
        {weekdayActivity ? <WeekdayBarChart title="أكثر أيام الأسبوع نشاطًا (رحلات آخر 90 يوم)" data={weekdayActivity} /> : null}
        {topDestinations ? <RankedBarList title="أكثر الوجهات تخطيطًا" items={topDestinations} /> : null}
      </div>

      <h2 className="mb-3 text-sm font-bold text-foreground">استخدام دليل السفر الذكي (آخر 30 يوم)</h2>
      <div className="surface-card mb-6 grid grid-cols-2 divide-x divide-x-reverse divide-border">
        <div className="p-4">
          <div className="num text-2xl font-bold text-foreground">{guideUsage?.messages ?? '—'}</div>
          <div className="mt-1 text-sm text-muted-foreground">رسالة أُرسلت</div>
        </div>
        <div className="p-4">
          <div className="num text-2xl font-bold text-foreground">{guideUsage?.uniqueUsers ?? '—'}</div>
          <div className="mt-1 text-sm text-muted-foreground">مستخدم استخدمه</div>
        </div>
      </div>

      <h2 className="mb-3 text-sm font-bold text-foreground">الأماكن الأكثر إعجابًا</h2>
      <div className="surface-card mb-6 divide-y divide-border">
        {topPlaces === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : topPlaces.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه إعجابات على الأماكن بعد</div>
        ) : (
          topPlaces.map((p, i) => (
            <div key={p.id} className="flex items-center gap-3 p-3">
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-bold text-primary-ink">
                {i + 1}
              </div>
              <div className="flex-1 text-sm font-bold text-foreground">{p.name}</div>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <span className="num">{p.rating}</span>★
              </div>
              <div className="num text-sm font-bold text-foreground">{p.recommendCount} إعجاب</div>
            </div>
          ))
        )}
      </div>

      <h2 className="mb-3 text-sm font-bold text-foreground">إجمالي المحتوى</h2>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {cards.map((card) => {
          const inner = (
            <div className="surface-card p-5">
              <div className="num text-2xl font-bold text-foreground">{card.value ?? '—'}</div>
              <div className="mt-1 text-sm text-muted-foreground">{card.label}</div>
            </div>
          );
          return card.to ? (
            <Link key={card.label} to={card.to} className="block hover:opacity-85">
              {inner}
            </Link>
          ) : (
            <div key={card.label}>{inner}</div>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold text-foreground">تحميلات التطبيق (App Store + Google Play)</h2>
      <div className="surface-card divide-y divide-border">
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="text-sm font-bold text-foreground">iOS</div>
            <div className="text-xs text-muted-foreground">متوفر حاليًا على TestFlight (تجريبي) فقط — ما نُشر بعد على App Store رسميًا</div>
          </div>
          <div className="num text-lg font-bold text-foreground">0</div>
        </div>
        <div className="flex items-center justify-between p-4">
          <div>
            <div className="text-sm font-bold text-foreground">أندرويد</div>
            <div className="text-xs text-muted-foreground">ما فيه نسخة أندرويد مبنية بعد</div>
          </div>
          <div className="num text-lg font-bold text-foreground">0</div>
        </div>
        <div className="flex items-center justify-between p-4">
          <div className="text-sm font-bold text-foreground">الإجمالي</div>
          <div className="num text-lg font-bold text-primary-ink">0</div>
        </div>
      </div>
      <p className="mt-2 text-xs text-muted-foreground">
        هذا رقم حقيقي وليس تقديريًا — التطبيق لسه ما نُشر للعموم على أي من المتجرين، فمافيه تحميلات فعلية يتم قياسها حاليًا. لما يُنشر، هذا القسم يحتاج ربط حقيقي بـ App Store Connect و Google Play Console API لعرض الأرقام الفعلية.
      </p>
    </div>
  );
}
