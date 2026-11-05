import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import TrendChart from '../components/TrendChart';

const TREND_DAYS = 30;

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

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);
  const [pending, setPending] = useState<PendingCounts | null>(null);
  const [userTrend, setUserTrend] = useState<{ date: string; value: number }[] | null>(null);
  const [tripTrend, setTripTrend] = useState<{ date: string; value: number }[] | null>(null);

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

      {userTrend && tripTrend ? (
        <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <TrendChart title="مستخدمون جدد (آخر 30 يوم)" data={userTrend} />
          <TrendChart title="رحلات جديدة (آخر 30 يوم)" data={tripTrend} />
        </div>
      ) : null}

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
