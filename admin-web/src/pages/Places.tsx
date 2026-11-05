import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadCsv } from '../lib/csv';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = {
  id: string;
  name: string;
  image_url: string;
  destination_id: string;
  type: string;
  rating: number;
  updated_at: string;
};

const TYPE_LABELS: Record<string, string> = {
  food: 'مطاعم',
  cafe: 'كافيهات',
  events: 'فعاليات',
  experiences: 'تجارب',
  shopping: 'تسوّق',
  nature: 'طبيعة',
  landmarks: 'معالم',
  hotels: 'فنادق',
};

export default function Places() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [destNames, setDestNames] = useState<Record<string, string>>({});

  useEffect(() => {
    (async () => {
      const [{ data }, { data: destinations }] = await Promise.all([
        supabase
          .from('places')
          .select('id,name,image_url,destination_id,type,rating,updated_at')
          .order('updated_at', { ascending: false }),
        supabase.from('destinations').select('id,name'),
      ]);
      const names: Record<string, string> = {};
      (destinations ?? []).forEach((d: any) => (names[d.id] = d.name));
      setDestNames(names);
      setRows(data ?? []);
    })();
  }, []);

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      label: 'المكان',
      render: (p) => (
        <div className="flex items-center gap-3">
          <img src={p.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
          <span className="font-bold text-foreground">{p.name}</span>
        </div>
      ),
    },
    { key: 'type', label: 'النوع', render: (p) => TYPE_LABELS[p.type] ?? p.type },
    { key: 'destination', label: 'الوجهة', render: (p) => destNames[p.destination_id] ?? p.destination_id },
    {
      key: 'rating',
      label: 'التقييم',
      className: 'num',
      render: (p) => (
        <span className="inline-flex items-center gap-1">
          <span>{p.rating}</span>
          <span className="text-gold-ink">★</span>
        </span>
      ),
    },
    {
      key: 'updated_at',
      label: 'آخر تحديث',
      className: 'num text-xs text-muted-foreground',
      render: (p) => new Date(p.updated_at).toLocaleDateString('ar-SA'),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">الأماكن</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              downloadCsv(
                'places',
                rows ?? [],
                [
                  { key: 'id', label: 'المعرّف' },
                  { key: 'name', label: 'الاسم' },
                  { key: 'type', label: 'النوع' },
                  { key: 'destination_id', label: 'الوجهة' },
                ]
              )
            }
            disabled={!rows || rows.length === 0}
            className="rounded-md border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
          >
            تصدير CSV
          </button>
          <button
            onClick={() => navigate('/places/new')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            + مكان جديد
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => navigate(`/places/${p.id}`)}
        emptyMessage="ما فيه أماكن بعد"
      />
    </div>
  );
}
