import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadCsv } from '../lib/csv';
import { logAction } from '../lib/auditLog';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = {
  id: string;
  name: string;
  city: string;
  category: string;
  starts_at: string;
  ends_at: string;
  official_url: string | null;
  audience: 'public' | 'internal' | 'kids' | 'women_only';
  is_draft: boolean;
};

type Status = 'draft' | 'upcoming' | 'ongoing' | 'ended';
type Tab = 'all' | 'ongoing' | 'upcoming' | 'draft' | 'ended';
type RowWithStatus = Row & { status: Status };

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'ongoing', label: 'جارية' },
  { key: 'upcoming', label: 'قادمة' },
  { key: 'draft', label: 'مسودات' },
  { key: 'ended', label: 'منتهية' },
];

const STATUS_LABEL: Record<Status, string> = { draft: 'مسودة', upcoming: 'قادمة', ongoing: 'جارية', ended: 'منتهية' };
const STATUS_CLASS: Record<Status, string> = {
  draft: 'bg-muted text-muted-foreground',
  upcoming: 'bg-secondary text-primary-ink',
  ongoing: 'bg-success-soft text-success-ink',
  ended: 'bg-muted text-muted-foreground',
};
const AUDIENCE_LABEL: Record<Row['audience'], string> = {
  public: 'عام',
  internal: 'داخلي',
  kids: 'للأطفال',
  women_only: 'نساء فقط',
};

function computeStatus(row: Row): Status {
  if (row.is_draft) return 'draft';
  const now = Date.now();
  const start = new Date(row.starts_at).getTime();
  const end = new Date(row.ends_at).getTime();
  if (now < start) return 'upcoming';
  if (now > end) return 'ended';
  return 'ongoing';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function Events() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);
  const [tab, setTab] = useState<Tab>('all');

  const load = async () => {
    const { data } = await supabase
      .from('events')
      .select('id,name,city,category,starts_at,ends_at,official_url,audience,is_draft')
      .order('starts_at', { ascending: true });
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const withStatus = useMemo(() => (rows ?? []).map((r) => ({ ...r, status: computeStatus(r) })), [rows]);
  const filtered = tab === 'all' ? withStatus : withStatus.filter((r) => r.status === tab);

  const remove = async (row: Row) => {
    if (!confirm(`حذف فعالية "${row.name}" نهائيًا؟`)) return;
    await supabase.from('events').delete().eq('id', row.id);
    logAction({ type: 'content', action: 'حذف فعالية', target: row.name });
    load();
  };

  const columns: DataTableColumn<RowWithStatus>[] = [
    {
      key: 'name',
      label: 'الفعالية',
      render: (e) => (
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">{e.name}</span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[e.status]}`}>{STATUS_LABEL[e.status]}</span>
            <span className="rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold text-muted-foreground">{AUDIENCE_LABEL[e.audience]}</span>
          </div>
        </div>
      ),
    },
    { key: 'city', label: 'المدينة', render: (e) => e.city },
    { key: 'category', label: 'التصنيف', render: (e) => e.category },
    {
      key: 'dates',
      label: 'التاريخ',
      className: 'num text-xs text-muted-foreground',
      render: (e) => `${fmtDate(e.starts_at)} — ${fmtDate(e.ends_at)}`,
    },
    {
      key: 'actions',
      label: '',
      render: (e) => (
        <button
          onClick={(ev) => {
            ev.stopPropagation();
            remove(e);
          }}
          className="text-xs font-semibold text-destructive"
        >
          حذف
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">الفعاليات</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              downloadCsv(
                'events',
                withStatus,
                [
                  { key: 'name', label: 'الاسم' },
                  { key: 'city', label: 'المدينة' },
                  { key: 'category', label: 'التصنيف' },
                  { key: 'starts_at', label: 'من' },
                  { key: 'ends_at', label: 'إلى' },
                  { key: 'status', label: 'الحالة' },
                ]
              )
            }
            disabled={!rows || rows.length === 0}
            className="rounded-md border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
          >
            تصدير CSV
          </button>
          <button
            onClick={() => navigate('/events/new')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            + فعالية جديدة
          </button>
        </div>
      </div>
      <p className="mb-4 text-sm text-muted-foreground">
        التطبيق يعرض الرابط الرسمي فقط — بلا حجز ولا أسعار ولا دفع. التذكير الآلي قبل الفعالية بيومين لسه ما بُني (يحتاج جدولة تلقائية
        غير موجودة بالمشروع حالياً)، بس «مهتم» يسجَّل فعليًا من التطبيق استعدادًا له.
      </p>

      <div className="mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        rows={rows === null ? null : filtered}
        rowKey={(e) => e.id}
        onRowClick={(e) => navigate(`/events/${e.id}`)}
        emptyMessage="لا توجد فعاليات."
      />
    </div>
  );
}
