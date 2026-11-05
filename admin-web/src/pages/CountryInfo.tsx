import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import Drawer from '../components/Drawer';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = {
  country: string;
  visa_status: string | null;
  passport_validity_months: number | null;
  currency: string | null;
  plug_types: string[];
  esim_available: boolean;
  emergency_number: string | null;
  embassy_address: string | null;
  embassy_phone: string | null;
  source_url: string | null;
};

const EMPTY = (country: string): Row => ({
  country,
  visa_status: null,
  passport_validity_months: null,
  currency: null,
  plug_types: [],
  esim_available: false,
  emergency_number: null,
  embassy_address: null,
  embassy_phone: null,
  source_url: null,
});

const VISA_OPTIONS = [
  { value: '', label: '— غير محدد' },
  { value: 'required', label: 'تأشيرة مسبقة مطلوبة' },
  { value: 'on_arrival', label: 'تأشيرة عند الوصول' },
  { value: 'e_visa', label: 'تأشيرة إلكترونية' },
  { value: 'none', label: 'بدون تأشيرة' },
];

const VISA_LABEL: Record<string, string> = Object.fromEntries(VISA_OPTIONS.filter((o) => o.value).map((o) => [o.value, o.label]));

export default function CountryInfo() {
  const [countries, setCountries] = useState<string[] | null>(null);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [editing, setEditing] = useState<Row | null>(null);
  const [saving, setSaving] = useState(false);

  const load = async () => {
    const [destRes, infoRes] = await Promise.all([
      supabase.from('destinations').select('country'),
      supabase.from('country_info').select('*'),
    ]);
    const uniqueCountries = Array.from(
      new Set((destRes.data ?? []).map((d: any) => d.country).filter((c: string) => c && c !== 'السعودية'))
    );
    setCountries(uniqueCountries);
    const map: Record<string, Row> = {};
    for (const r of (infoRes.data ?? []) as any[]) map[r.country] = r;
    setRows(map);
  };

  useEffect(() => {
    load();
  }, []);

  const getRow = (country: string): Row => rows[country] ?? EMPTY(country);

  const setField = (patch: Partial<Row>) => {
    if (!editing) return;
    setEditing({ ...editing, ...patch });
  };

  const handleSave = async () => {
    if (!editing) return;
    setSaving(true);
    await supabase.from('country_info').upsert(editing, { onConflict: 'country' });
    setSaving(false);
    setEditing(null);
    load();
  };

  const columns: DataTableColumn<string>[] = [
    { key: 'country', label: 'الدولة', render: (c) => <span className="font-bold text-foreground">{c}</span> },
    {
      key: 'visa',
      label: 'حالة التأشيرة',
      render: (c) => {
        const v = getRow(c).visa_status;
        return v ? VISA_LABEL[v] : <span className="text-muted-foreground">—</span>;
      },
    },
    { key: 'currency', label: 'العملة', render: (c) => getRow(c).currency ?? <span className="text-muted-foreground">—</span> },
    {
      key: 'status',
      label: 'الحالة',
      render: (c) =>
        rows[c] ? (
          <span className="rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-bold text-success-ink">مُعدّة</span>
        ) : (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">غير معدّة</span>
        ),
    },
  ];

  if (countries === null) return <div className="text-sm text-muted-foreground">جاري التحميل...</div>;

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-foreground">معلومات الدخول للدول</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        تظهر هذي المعلومات للمستخدمين في صفحة الرحلة لما الوجهة برّا السعودية. الدول هنا مأخوذة من حقل "الدولة" بصفحات الوجهات.
      </p>
      <DataTable
        columns={columns}
        rows={countries}
        rowKey={(c) => c}
        onRowClick={(c) => setEditing(getRow(c))}
        emptyMessage="ما فيه وجهات خارج السعودية بعد"
      />

      <Drawer open={editing != null} onClose={() => setEditing(null)} title={editing?.country ?? ''}>
        {editing ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="حالة التأشيرة">
              <select value={editing.visa_status ?? ''} onChange={(e) => setField({ visa_status: e.target.value || null })} className="input">
                {VISA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="صلاحية الجواز (أشهر)">
              <input
                type="number"
                value={editing.passport_validity_months ?? ''}
                onChange={(e) => setField({ passport_validity_months: e.target.value ? Number(e.target.value) : null })}
                className="input"
              />
            </Field>
            <Field label="العملة">
              <input value={editing.currency ?? ''} onChange={(e) => setField({ currency: e.target.value || null })} className="input" />
            </Field>
            <Field label="نوع القابس (مفصول بفاصلة)">
              <input
                value={editing.plug_types.join(', ')}
                onChange={(e) => setField({ plug_types: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                dir="ltr"
                className="input"
              />
            </Field>
            <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-foreground">
              <input type="checkbox" checked={editing.esim_available} onChange={(e) => setField({ esim_available: e.target.checked })} />
              شريحة eSIM متوفرة
            </label>
            <Field label="رقم الطوارئ">
              <input value={editing.emergency_number ?? ''} onChange={(e) => setField({ emergency_number: e.target.value || null })} dir="ltr" className="input" />
            </Field>
            <Field label="رابط المصدر الرسمي">
              <input value={editing.source_url ?? ''} onChange={(e) => setField({ source_url: e.target.value || null })} dir="ltr" className="input" />
            </Field>
            <Field label="عنوان السفارة السعودية">
              <input value={editing.embassy_address ?? ''} onChange={(e) => setField({ embassy_address: e.target.value || null })} className="input" />
            </Field>
            <Field label="هاتف السفارة السعودية">
              <input value={editing.embassy_phone ?? ''} onChange={(e) => setField({ embassy_phone: e.target.value || null })} dir="ltr" className="input" />
            </Field>
            <div className="col-span-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
              >
                {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>
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
