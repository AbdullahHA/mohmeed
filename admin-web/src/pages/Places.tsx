import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Row = { id: string; name: string; description: string; image_url: string; destination_id: string; type: string };

const TYPE_LABELS: Record<string, string> = {
  hotel: 'فنادق',
  restaurant: 'مطاعم',
  activity: 'أنشطة',
  landmark: 'معالم',
};

export default function Places() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('places')
        .select('id,name,description,image_url,destination_id,type')
        .order('updated_at', { ascending: false });
      setRows(data ?? []);
    })();
  }, []);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">الأماكن</h1>
        <Link to="/places/new" className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          + مكان جديد
        </Link>
      </div>
      <div className="surface-card divide-y divide-border">
        {rows === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه أماكن بعد</div>
        ) : (
          rows.map((p) => (
            <Link key={p.id} to={`/places/${p.id}`} className="flex items-center gap-3 p-3 hover:bg-muted">
              <img src={p.image_url} alt="" className="h-12 w-12 rounded-md object-cover" />
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">{p.name}</div>
                <div className="text-xs text-muted-foreground">{TYPE_LABELS[p.type] ?? p.type} · {p.destination_id}</div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
