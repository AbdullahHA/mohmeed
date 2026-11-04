import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
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
    </div>
  );
}
