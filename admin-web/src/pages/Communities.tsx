import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = { id: string; name: string; tagline: string; emoji: string; color: string; base_member_count: number };

const EMPTY: Row = { id: '', name: '', tagline: '', emoji: '🧭', color: '#1359D3', base_member_count: 0 };

export default function Communities() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase.from('communities').select('id,name,tagline,emoji,color,base_member_count');
    setRows(data ?? []);
    const { data: members } = await supabase.from('community_members').select('community_id');
    const tally: Record<string, number> = {};
    for (const m of members ?? []) tally[m.community_id] = (tally[m.community_id] ?? 0) + 1;
    setCounts(tally);
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setEditing(EMPTY);
    setIsNew(true);
    setError(null);
  };

  const openEdit = (row: Row) => {
    setEditing(row);
    setIsNew(false);
    setError(null);
  };

  const handleSave = async () => {
    if (!editing || !editing.id.trim() || !editing.name.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: editing.name.trim(),
      tagline: editing.tagline.trim(),
      emoji: editing.emoji.trim() || '🧭',
      color: editing.color.trim() || '#1359D3',
      base_member_count: Number(editing.base_member_count) || 0,
    };
    const { error: saveError } = isNew
      ? await supabase.from('communities').insert({ id: editing.id.trim(), ...payload })
      : await supabase.from('communities').update(payload).eq('id', editing.id);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    setEditing(null);
    load();
  };

  const handleDelete = async (row: Row) => {
    if (!confirm(`حذف مجتمع "${row.name}" نهائيًا؟`)) return;
    await supabase.from('communities').delete().eq('id', row.id);
    load();
  };

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      label: 'المجتمع',
      render: (c) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-base" style={{ backgroundColor: `${c.color}22` }}>
            {c.emoji}
          </div>
          <div>
            <div className="font-bold text-foreground">{c.name}</div>
            <div className="text-xs text-muted-foreground">{c.tagline}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'members',
      label: 'الأعضاء',
      className: 'num',
      render: (c) => `${(counts[c.id] ?? 0) + c.base_member_count} عضو`,
    },
    {
      key: 'actions',
      label: '',
      render: (c) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDelete(c);
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
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">المجتمعات</h1>
        <button onClick={openNew} className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground">
          + مجتمع جديد
        </button>
      </div>

      <div className="mb-4 rounded-md bg-secondary p-3 text-xs leading-5 text-foreground">
        الانضمام لمجتمع قائم يبقى فوري (مطابق لتجربة الدردشة الجماعية بالتطبيق). ما يحتاج موافقة هو{' '}
        <strong>إنشاء</strong> مجتمع جديد — المستخدم يرسل طلبًا من التطبيق وتوافق عليه الإدارة من صفحة{' '}
        «طلبات إنشاء مجتمعات».
      </div>

      {editing ? (
        <div className="surface-card mb-6 flex flex-col gap-4 p-5">
          <h2 className="text-sm font-bold text-foreground">{isNew ? 'مجتمع جديد' : `تعديل: ${editing.name}`}</h2>
          {isNew ? (
            <Field label="المعرّف (بالإنجليزي، فريد)">
              <input
                value={editing.id}
                onChange={(e) => setEditing({ ...editing, id: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })}
                dir="ltr"
                className="input"
              />
            </Field>
          ) : null}
          <Field label="الاسم">
            <input value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} className="input" />
          </Field>
          <Field label="الوصف القصير">
            <input value={editing.tagline} onChange={(e) => setEditing({ ...editing, tagline: e.target.value })} className="input" />
          </Field>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="إيموجي">
              <input value={editing.emoji} onChange={(e) => setEditing({ ...editing, emoji: e.target.value })} className="input" />
            </Field>
            <Field label="اللون (hex)">
              <input value={editing.color} onChange={(e) => setEditing({ ...editing, color: e.target.value })} dir="ltr" className="input" />
            </Field>
          </div>
          <Field label="عدد أعضاء أساسي (base_member_count)">
            <input
              value={String(editing.base_member_count)}
              onChange={(e) => setEditing({ ...editing, base_member_count: Number(e.target.value) || 0 })}
              dir="ltr"
              className="input"
            />
          </Field>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <div className="flex items-center gap-3 pt-2">
            <button onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
              {saving ? 'جاري الحفظ...' : 'حفظ'}
            </button>
            <button onClick={() => setEditing(null)} className="text-sm font-semibold text-muted-foreground">
              إلغاء
            </button>
          </div>
        </div>
      ) : null}

      <DataTable columns={columns} rows={rows} rowKey={(c) => c.id} onRowClick={openEdit} emptyMessage="ما فيه مجتمعات بعد" />
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-muted-foreground">{label}</label>
      {children}
    </div>
  );
}
