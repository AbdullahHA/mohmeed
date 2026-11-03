import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type FormState = {
  id: string;
  name: string;
  country: string;
  tagline: string;
  image_url: string;
  why_visit: string;
  trending: boolean;
  latitude: string;
  longitude: string;
};

const EMPTY: FormState = {
  id: '',
  name: '',
  country: '',
  tagline: '',
  image_url: '',
  why_visit: '',
  trending: false,
  latitude: '',
  longitude: '',
};

export default function DestinationEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data } = await supabase
        .from('destinations')
        .select('id,name,country,tagline,image_url,why_visit,trending,latitude,longitude')
        .eq('id', id)
        .single();
      if (data) {
        setForm({
          ...(data as any),
          latitude: data.latitude != null ? String(data.latitude) : '',
          longitude: data.longitude != null ? String(data.longitude) : '',
        });
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  const handleSave = async () => {
    if (!form.id.trim() || !form.name.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      country: form.country.trim(),
      tagline: form.tagline.trim(),
      image_url: form.image_url.trim(),
      why_visit: form.why_visit.trim(),
      trending: form.trending,
      latitude: form.latitude.trim() ? Number(form.latitude) : null,
      longitude: form.longitude.trim() ? Number(form.longitude) : null,
    };
    const { error: saveError } = isNew
      ? await supabase.from('destinations').insert({ id: form.id.trim(), ...payload })
      : await supabase.from('destinations').update(payload).eq('id', id);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    navigate('/destinations');
  };

  const handleDelete = async () => {
    if (!confirm(`حذف "${form.name}" نهائيًا؟`)) return;
    await supabase.from('destinations').delete().eq('id', id);
    navigate('/destinations');
  };

  if (loading) return <div className="text-sm text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-bold text-foreground">{isNew ? 'وجهة جديدة' : form.name}</h1>
      <div className="surface-card flex flex-col gap-4 p-5">
        {isNew ? (
          <Field label="المعرّف (بالإنجليزي، فريد)">
            <input
              value={form.id}
              onChange={(e) => setForm({ ...form, id: e.target.value.trim().toLowerCase().replace(/\s+/g, '-') })}
              dir="ltr"
              className="input"
            />
          </Field>
        ) : null}
        <Field label="الاسم">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </Field>
        <Field label="الدولة">
          <input value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} className="input" />
        </Field>
        <Field label="الوصف القصير">
          <input value={form.tagline} onChange={(e) => setForm({ ...form, tagline: e.target.value })} className="input" />
        </Field>
        <Field label="رابط الصورة">
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} dir="ltr" className="input" />
        </Field>
        <Field label="ليش تزورها">
          <textarea
            value={form.why_visit}
            onChange={(e) => setForm({ ...form, why_visit: e.target.value })}
            rows={3}
            className="input"
          />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="خط العرض (latitude)">
            <input
              value={form.latitude}
              onChange={(e) => setForm({ ...form, latitude: e.target.value })}
              dir="ltr"
              inputMode="decimal"
              placeholder="مثال: 24.7136"
              className="input"
            />
          </Field>
          <Field label="خط الطول (longitude)">
            <input
              value={form.longitude}
              onChange={(e) => setForm({ ...form, longitude: e.target.value })}
              dir="ltr"
              inputMode="decimal"
              placeholder="مثال: 46.6753"
              className="input"
            />
          </Field>
        </div>
        <p className="text-xs text-muted-foreground">
          تحديد الإحداثيات يفعّل بطاقة مواقيت الصلاة واتجاه القبلة في صفحة المدينة بالتطبيق.
        </p>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <input type="checkbox" checked={form.trending} onChange={(e) => setForm({ ...form, trending: e.target.checked })} />
          رائجة الآن
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
          >
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          {!isNew ? (
            <button onClick={handleDelete} className="text-sm font-semibold text-destructive">
              حذف الوجهة
            </button>
          ) : null}
        </div>
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
