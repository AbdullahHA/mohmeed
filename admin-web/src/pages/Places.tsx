import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadCsv } from '../lib/csv';
import { logAction } from '../lib/auditLog';
import DataTable, { type DataTableColumn } from '../components/DataTable';
import ImportFromGooglePlaces from '../components/ImportFromGooglePlaces';
import { findDuplicates, mergePlaces, type DupPair } from '../lib/placeDuplicates';

type Row = {
  id: string;
  name: string;
  image_url: string;
  destination_id: string;
  type: string;
  rating: number;
  updated_at: string;
  latitude: number;
  longitude: number;
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
  const [importOpen, setImportOpen] = useState(false);
  const [merging, setMerging] = useState<string | null>(null);

  const load = async () => {
    const [{ data }, { data: destinations }] = await Promise.all([
      supabase
        .from('places')
        .select('id,name,image_url,destination_id,type,rating,updated_at,latitude,longitude')
        .order('updated_at', { ascending: false }),
      supabase.from('destinations').select('id,name'),
    ]);
    const names: Record<string, string> = {};
    (destinations ?? []).forEach((d: any) => (names[d.id] = d.name));
    setDestNames(names);
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const duplicates = useMemo(() => (rows ? findDuplicates(rows) : []), [rows]);

  const merge = async (pair: DupPair, keep: 'a' | 'b') => {
    const keeper = keep === 'a' ? pair.a : pair.b;
    const loser = keep === 'a' ? pair.b : pair.a;
    if (!confirm(`دمج "${loser.name}" داخل "${keeper.name}"؟ ما ينرجع.`)) return;
    setMerging(pair.a.id + pair.b.id);
    await mergePlaces(keeper.id, loser.id);
    logAction({ type: 'content', action: 'دمج مكانين مكررين', target: `${loser.name} ← ${keeper.name}` });
    setMerging(null);
    load();
  };

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
            onClick={() => setImportOpen(true)}
            className="rounded-md border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted"
          >
            استيراد من Google Places
          </button>
          <button
            onClick={() => navigate('/places/new')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            + مكان جديد
          </button>
        </div>
      </div>

      {duplicates.length > 0 ? (
        <div className="mb-6 rounded-md border border-gold/40 bg-gold-soft p-4">
          <div className="mb-2 text-xs font-bold text-gold-ink">{duplicates.length} تكرارات محتملة (نفس الاسم ونفس الوجهة وأقل من 150م)</div>
          <div className="flex flex-col gap-2">
            {duplicates.map((pair) => {
              const busy = merging === pair.a.id + pair.b.id;
              return (
                <div key={pair.a.id + pair.b.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md bg-card p-2.5 text-xs">
                  <span className="text-foreground">
                    {pair.a.name} <span className="text-muted-foreground">({destNames[pair.a.destination_id]})</span> — متباعدين {pair.distanceM}م
                  </span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => merge(pair, 'a')}
                      disabled={busy}
                      className="rounded-md border border-border px-2.5 py-1 font-bold text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      الاحتفاظ بالأول
                    </button>
                    <button
                      onClick={() => merge(pair, 'b')}
                      disabled={busy}
                      className="rounded-md border border-border px-2.5 py-1 font-bold text-foreground hover:bg-muted disabled:opacity-50"
                    >
                      الاحتفاظ بالثاني
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(p) => p.id}
        onRowClick={(p) => navigate(`/places/${p.id}`)}
        emptyMessage="ما فيه أماكن بعد"
      />

      {importOpen ? <ImportFromGooglePlaces onClose={() => setImportOpen(false)} /> : null}
    </div>
  );
}
