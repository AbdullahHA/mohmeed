import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadCsv } from '../lib/csv';
import Drawer from '../components/Drawer';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = { id: string; name: string; username: string; emoji: string; is_admin: boolean; created_at: string };

type UserStats = { trips: number; recommendations: number; checkIns: number };

export default function Users() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Row | null>(null);
  const [stats, setStats] = useState<UserStats | null>(null);
  const location = useLocation();
  const openUserId = (location.state as { openUserId?: string } | null)?.openUserId;

  const openUser = async (u: Row) => {
    setSelected(u);
    setStats(null);
    const [trips, recs, checkIns] = await Promise.all([
      supabase.from('trips').select('id', { count: 'exact', head: true }).eq('owner_id', u.id),
      supabase.from('recommended_places').select('place_id', { count: 'exact', head: true }).eq('profile_id', u.id),
      supabase.from('check_ins').select('id', { count: 'exact', head: true }).eq('user_id', u.id),
    ]);
    setStats({ trips: trips.count ?? 0, recommendations: recs.count ?? 0, checkIns: checkIns.count ?? 0 });
  };

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,name,username,emoji,is_admin,created_at')
        .order('created_at', { ascending: false });
      setRows(data ?? []);
      if (openUserId) {
        const match = (data ?? []).find((r) => r.id === openUserId);
        if (match) openUser(match);
      }
    })();
  }, []);

  const filtered = (rows ?? []).filter((r) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return r.name.toLowerCase().includes(q) || r.username.toLowerCase().includes(q);
  });

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      label: 'المستخدم',
      render: (u) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-base">{u.emoji}</div>
          <div>
            <div className="font-bold text-foreground">
              {u.name}
              {u.is_admin ? <span className="mr-1 rounded bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-gold-ink">مدير</span> : null}
            </div>
            <div className="text-xs text-muted-foreground" dir="ltr">@{u.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'created_at',
      label: 'تاريخ الانضمام',
      className: 'num text-xs text-muted-foreground',
      render: (u) => new Date(u.created_at).toLocaleDateString('ar-SA'),
    },
  ];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">المستخدمون</h1>
        <span className="text-sm text-muted-foreground">{rows ? `${rows.length} مستخدم` : ''}</span>
      </div>

      <div className="mb-4 flex flex-wrap items-center gap-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="بحث بالاسم أو المعرّف..."
          className="input min-w-0 flex-1 sm:max-w-sm"
        />
        <button
          onClick={() =>
            downloadCsv(
              'users',
              filtered,
              [
                { key: 'name', label: 'الاسم' },
                { key: 'username', label: 'المعرّف' },
                { key: 'is_admin', label: 'مدير' },
                { key: 'created_at', label: 'تاريخ الانضمام' },
              ]
            )
          }
          disabled={filtered.length === 0}
          className="shrink-0 rounded-md border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
        >
          تصدير CSV
        </button>
      </div>

      <div className="mb-4 rounded-md bg-secondary p-3 text-xs leading-5 text-foreground">
        هذا العرض للقراءة فقط حالياً. تغيير صلاحية «مدير» مقفول عمداً من قاعدة البيانات (ولو عبر هذه اللوحة) ولا يصير
        إلا بأمر SQL مباشر من صاحب المشروع — هذا إجراء أمني متعمّد بالمشروع. حذف حساب مستخدم يحتاج صلاحية خدمة
        (service role) غير متاحة بأمان من لوحة ويب عامة.
      </div>

      <DataTable
        columns={columns}
        rows={rows === null ? null : filtered}
        rowKey={(u) => u.id}
        onRowClick={openUser}
        emptyMessage="ما فيه نتائج"
      />

      <Drawer open={selected != null} onClose={() => setSelected(null)} title={selected?.name ?? ''}>
        {selected ? (
          <div>
            <div className="mb-5 flex items-center gap-3">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-secondary text-2xl">{selected.emoji}</div>
              <div>
                <div className="text-base font-bold text-foreground">
                  {selected.name}
                  {selected.is_admin ? (
                    <span className="mr-1 rounded bg-gold-soft px-1.5 py-0.5 text-[10px] font-bold text-gold-ink">مدير</span>
                  ) : null}
                </div>
                <div className="text-xs text-muted-foreground" dir="ltr">@{selected.username}</div>
              </div>
            </div>

            <div className="mb-5 text-xs text-muted-foreground">
              انضم بتاريخ {new Date(selected.created_at).toLocaleDateString('ar-SA')}
            </div>

            <h3 className="mb-2 text-xs font-bold text-muted-foreground">النشاط</h3>
            <div className="grid grid-cols-3 gap-3">
              <div className="surface-card p-3 text-center">
                <div className="num text-lg font-bold text-foreground">{stats?.trips ?? '—'}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">رحلة أنشأها</div>
              </div>
              <div className="surface-card p-3 text-center">
                <div className="num text-lg font-bold text-foreground">{stats?.recommendations ?? '—'}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">مكان أعجبه</div>
              </div>
              <div className="surface-card p-3 text-center">
                <div className="num text-lg font-bold text-foreground">{stats?.checkIns ?? '—'}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">تسجيل حضور</div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
