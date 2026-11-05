import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

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

export default function CountryInfo() {
  const [countries, setCountries] = useState<string[] | null>(null);
  const [rows, setRows] = useState<Record<string, Row>>({});
  const [open, setOpen] = useState<string | null>(null);
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

  const setField = (country: string, patch: Partial<Row>) => {
    setRows((prev) => ({ ...prev, [country]: { ...getRow(country), ...patch } }));
  };

  const handleSave = async (country: string) => {
    setSaving(true);
    const row = getRow(country);
    await supabase.from('country_info').upsert(row, { onConflict: 'country' });
    setSaving(false);
    load();
  };

  if (countries === null) return <div className="text-sm text-muted-foreground">جاري التحميل...</div>;

  return (
    <div>
      <h1 className="mb-2 text-xl font-bold text-foreground">معلومات الدخول للدول</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        تظهر هذي المعلومات للمستخدمين في صفحة الرحلة لما الوجهة برّا السعودية. الدول هنا مأخوذة من حقل "الدولة" بصفحات الوجهات.
      </p>
      <div className="surface-card divide-y divide-border">
        {countries.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه وجهات خارج السعودية بعد</div>
        ) : (
          countries.map((country) => {
            const row = getRow(country);
            const configured = !!rows[country];
            const isOpen = open === country;
            return (
              <div key={country} className="p-3">
                <button
                  onClick={() => setOpen(isOpen ? null : country)}
                  className="flex w-full items-center justify-between text-right"
                >
                  <span className="text-sm font-bold text-foreground">{country}</span>
                  <span className={`text-xs ${configured ? 'text-green-600' : 'text-muted-foreground'}`}>
                    {configured ? 'مُعدّة' : 'غير معدّة بعد'}
                  </span>
                </button>
                {isOpen ? (
                  <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    <Field label="حالة التأشيرة">
                      <select
                        value={row.visa_status ?? ''}
                        onChange={(e) => setField(country, { visa_status: e.target.value || null })}
                        className="input"
                      >
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
                        value={row.passport_validity_months ?? ''}
                        onChange={(e) => setField(country, { passport_validity_months: e.target.value ? Number(e.target.value) : null })}
                        className="input"
                      />
                    </Field>
                    <Field label="العملة">
                      <input
                        value={row.currency ?? ''}
                        onChange={(e) => setField(country, { currency: e.target.value || null })}
                        className="input"
                      />
                    </Field>
                    <Field label="نوع القابس (مفصول بفاصلة)">
                      <input
                        value={row.plug_types.join(', ')}
                        onChange={(e) => setField(country, { plug_types: e.target.value.split(',').map((s) => s.trim()).filter(Boolean) })}
                        dir="ltr"
                        className="input"
                      />
                    </Field>
                    <label className="col-span-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                      <input
                        type="checkbox"
                        checked={row.esim_available}
                        onChange={(e) => setField(country, { esim_available: e.target.checked })}
                      />
                      شريحة eSIM متوفرة
                    </label>
                    <Field label="رقم الطوارئ">
                      <input
                        value={row.emergency_number ?? ''}
                        onChange={(e) => setField(country, { emergency_number: e.target.value || null })}
                        dir="ltr"
                        className="input"
                      />
                    </Field>
                    <Field label="رابط المصدر الرسمي">
                      <input
                        value={row.source_url ?? ''}
                        onChange={(e) => setField(country, { source_url: e.target.value || null })}
                        dir="ltr"
                        className="input"
                      />
                    </Field>
                    <Field label="عنوان السفارة السعودية">
                      <input
                        value={row.embassy_address ?? ''}
                        onChange={(e) => setField(country, { embassy_address: e.target.value || null })}
                        className="input"
                      />
                    </Field>
                    <Field label="هاتف السفارة السعودية">
                      <input
                        value={row.embassy_phone ?? ''}
                        onChange={(e) => setField(country, { embassy_phone: e.target.value || null })}
                        dir="ltr"
                        className="input"
                      />
                    </Field>
                    <div className="col-span-2">
                      <button
                        onClick={() => handleSave(country)}
                        disabled={saving}
                        className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
                      >
                        {saving ? 'جاري الحفظ...' : 'حفظ'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })
        )}
      </div>
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
