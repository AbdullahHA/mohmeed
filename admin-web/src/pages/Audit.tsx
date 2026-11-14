import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Drawer from '../components/Drawer';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = {
  id: string;
  actor_id: string;
  type: string;
  action: string;
  target: string;
  diff: Record<string, { before: unknown; after: unknown }> | null;
  note: string | null;
  device: string | null;
  at: string;
  actor_name?: string;
};

const TYPE_LABELS: Record<string, string> = {
  mod: 'إشراف',
  content: 'محتوى',
  settings: 'إعدادات',
  security: 'أمان',
  data: 'بيانات',
};

export default function Audit() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [selected, setSelected] = useState<Row | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('admin_audit_log')
        .select('id,actor_id,type,action,target,diff,note,device,at')
        .order('at', { ascending: false })
        .limit(200);
      const rowsData = data ?? [];
      const actorIds = Array.from(new Set(rowsData.map((r) => r.actor_id)));
      const { data: profiles } = actorIds.length
        ? await supabase.from('profiles').select('id,name').in('id', actorIds)
        : { data: [] as { id: string; name: string }[] };
      const names: Record<string, string> = {};
      (profiles ?? []).forEach((p) => (names[p.id] = p.name));
      setRows(rowsData.map((r) => ({ ...r, actor_name: names[r.actor_id] })));
    })();
  }, []);

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'type',
      label: 'النوع',
      render: (r) => (
        <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary-ink">
          {TYPE_LABELS[r.type] ?? r.type}
        </span>
      ),
    },
    { key: 'action', label: 'العملية', render: (r) => <span className="font-semibold text-foreground">{r.action}</span> },
    { key: 'target', label: 'الهدف', className: 'text-xs text-muted-foreground', render: (r) => r.target },
    {
      key: 'actor',
      label: 'العضو',
      className: 'text-xs text-muted-foreground',
      render: (r) => <span dir="ltr">{r.actor_name ?? r.actor_id.slice(0, 8)}</span>,
    },
    {
      key: 'at',
      label: 'الوقت',
      className: 'num text-xs text-muted-foreground',
      render: (r) => new Date(r.at).toLocaleString('ar-SA'),
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-foreground">سجل العمليات</h1>
      <p className="mb-6 text-sm text-muted-foreground">كل تغيير يسجَّل ولا يُنحذف. للقراءة فقط، حق للمالك.</p>

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} onRowClick={setSelected} emptyMessage="ما فيه عمليات مسجّلة بعد" />

      <Drawer open={selected != null} onClose={() => setSelected(null)} title="تفاصيل العملية">
        {selected ? (
          <div className="flex flex-col gap-4 text-sm">
            <Field label="الوقت" value={new Date(selected.at).toLocaleString('ar-SA')} />
            <Field label="العضو" value={selected.actor_name ?? selected.actor_id} />
            <Field label="النوع" value={TYPE_LABELS[selected.type] ?? selected.type} />
            <Field label="العملية" value={selected.action} />
            <Field label="الهدف" value={selected.target} />
            {selected.device ? <Field label="الجهاز" value={selected.device} /> : null}
            {selected.diff ? (
              <div>
                <div className="mb-1 text-xs font-bold text-muted-foreground">التغييرات</div>
                <div className="surface-card divide-y divide-border">
                  {Object.entries(selected.diff).map(([field, { before, after }]) => (
                    <div key={field} className="flex items-center justify-between p-2 text-xs">
                      <span className="text-muted-foreground">{field}</span>
                      <span>
                        <span className="text-destructive">{String(before)}</span>
                        {' ← '}
                        <span className="text-success-ink">{String(after)}</span>
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="mb-0.5 text-xs font-bold text-muted-foreground">{label}</div>
      <div className="text-foreground">{value}</div>
    </div>
  );
}
