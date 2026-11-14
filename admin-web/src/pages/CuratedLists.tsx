import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string;
  method: 'manual' | 'seasonal';
  season_start: string | null;
  season_end: string | null;
  is_published: boolean;
  item_count?: number;
};

const METHOD_LABEL: Record<Row['method'], string> = { manual: 'يدوي', seasonal: 'موسمي' };

export default function CuratedLists() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('curated_lists')
        .select('id,title,subtitle,icon,method,season_start,season_end,is_published')
        .order('sort_order', { ascending: true });
      const lists = data ?? [];
      const { data: items } = await supabase.from('curated_list_items').select('list_id');
      const counts: Record<string, number> = {};
      (items ?? []).forEach((i) => (counts[i.list_id] = (counts[i.list_id] ?? 0) + 1));
      setRows(lists.map((l) => ({ ...l, item_count: counts[l.id] ?? 0 })));
    })();
  }, []);

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'title',
      label: 'القائمة',
      render: (r) => (
        <div className="flex items-center gap-3">
          <span className="text-lg">{r.icon}</span>
          <div>
            <div className="font-bold text-foreground">{r.title}</div>
            {r.subtitle ? <div className="text-xs text-muted-foreground">{r.subtitle}</div> : null}
          </div>
        </div>
      ),
    },
    {
      key: 'method',
      label: 'طريقة التعبئة',
      render: (r) => (
        <span>
          {METHOD_LABEL[r.method]}
          {r.method === 'seasonal' && r.season_start && r.season_end ? (
            <span className="text-muted-foreground">
              {' '}
              ({new Date(r.season_start).toLocaleDateString('ar-SA')} – {new Date(r.season_end).toLocaleDateString('ar-SA')})
            </span>
          ) : null}
        </span>
      ),
    },
    { key: 'count', label: 'عدد الأماكن', className: 'num', render: (r) => r.item_count },
    {
      key: 'status',
      label: 'الحالة',
      render: (r) =>
        r.is_published ? (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success-ink">منشورة</span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">مسودة</span>
        ),
    },
  ];

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">المختارات والمواسم</h1>
        <button
          onClick={() => navigate('/curated-lists/new')}
          className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
        >
          + قائمة جديدة
        </button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">القوائم اللي تظهر في «اكتشف» بالتطبيق — يدوية دائمة أو موسمية بتاريخ.</p>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(r) => r.id}
        onRowClick={(r) => navigate(`/curated-lists/${r.id}`)}
        emptyMessage="ما فيه قوائم بعد"
      />
    </div>
  );
}
