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

export default function Dashboard() {
  const [counts, setCounts] = useState<Counts | null>(null);

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
  }, []);

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
