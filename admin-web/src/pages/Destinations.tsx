import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Row = { id: string; name: string; country: string; tagline: string; image_url: string };

export default function Destinations() {
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('destinations')
      .select('id,name,country,tagline,image_url')
      .order('sort_order', { ascending: true });
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">الوجهات</h1>
        <Link to="/destinations/new" className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          + وجهة جديدة
        </Link>
      </div>
      <div className="surface-card divide-y divide-border">
        {rows === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه وجهات بعد</div>
        ) : (
          rows.map((d) => (
            <Link key={d.id} to={`/destinations/${d.id}`} className="flex items-center gap-3 p-3 hover:bg-muted">
              <img src={d.image_url} alt="" className="h-12 w-12 rounded-md object-cover" />
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">{d.name}</div>
                <div className="text-xs text-muted-foreground">{d.country} · {d.tagline}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
