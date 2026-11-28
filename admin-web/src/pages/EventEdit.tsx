import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditLog';

type Place = { id: string; name: string };

type FormState = {
  name: string;
  city: string;
  category: string;
  starts_at: string;
  ends_at: string;
  place_id: string;
  official_url: string;
  audience: 'public' | 'internal' | 'kids' | 'women_only';
  is_draft: boolean;
  notify_interested: boolean;
};

const EMPTY: FormState = {
  name: '',
  city: '',
  category: '',
  starts_at: '',
  ends_at: '',
  place_id: '',
  official_url: '',
  audience: 'public',
  is_draft: true,
  notify_interested: true,
};

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function EventEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('places')
      .select('id,name')
      .order('name')
      .then(({ data }) => setPlaces(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data } = await supabase
        .from('events')
        .select('name,city,category,starts_at,ends_at,place_id,official_url,audience,is_draft,notify_interested')
        .eq('id', id)
        .single();
      if (data) {
        setForm({
          name: data.name,
          city: data.city,
          category: data.category,
          starts_at: toLocalInput(data.starts_at),
          ends_at: toLocalInput(data.ends_at),
          place_id: data.place_id ?? '',
          official_url: data.official_url ?? '',
          audience: data.audience,
          is_draft: data.is_draft,
          notify_interested: data.notify_interested,
        });
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  const handleSave = async () => {
    if (!form.name.trim() || !form.city.trim() || !form.category.trim() || !form.starts_at || !form.ends_at) return;
    if (new Date(form.ends_at) < new Date(form.starts_at)) {
      setError('تاريخ الانتهاء لازم يكون بعد تاريخ البداية');
      return;
    }
    setSaving(true);
    setError(null);
    const payload = {
      name: form.name.trim(),
      city: form.city.trim(),
      category: form.category.trim(),
      starts_at: new Date(form.starts_at).toISOString(),
      ends_at: new Date(form.ends_at).toISOString(),
      place_id: form.place_id || null,
      official_url: form.official_url.trim() || null,
      audience: form.audience,
      is_draft: form.is_draft,
      notify_interested: form.notify_interested,
    };
    if (isNew) {
      const { data: auth } = await supabase.auth.getUser();
      const { error: saveError } = await supabase.from('events').insert({ ...payload, created_by: auth.user?.id ?? null });
      setSaving(false);
      if (saveError) {
        setError(saveError.message);
        return;
      }
      logAction({ type: 'content', action: 'إضافة فعالية', target: payload.name });
    } else {
      const { error: saveError } = await supabase.from('events').update(payload).eq('id', id);
      setSaving(false);
      if (saveError) {
        setError(saveError.message);
        return;
      }
      logAction({ type: 'content', action: 'تعديل فعالية', target: payload.name });
    }
    navigate('/events');
  };

  if (loading) return <div className="text-sm text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-bold text-foreground">{isNew ? 'فعالية جديدة' : form.name}</h1>
      <div className="surface-card flex flex-col gap-4 p-5">
        <Field label="اسم الفعالية">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="المدينة">
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} className="input" />
          </Field>
          <Field label="التصنيف">
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="من">
            <input
              type="datetime-local"
              value={form.starts_at}
              onChange={(e) => setForm({ ...form, starts_at: e.target.value })}
              dir="ltr"
              className="input"
            />
          </Field>
          <Field label="إلى">
            <input
              type="datetime-local"
              value={form.ends_at}
              onChange={(e) => setForm({ ...form, ends_at: e.target.value })}
              dir="ltr"
              className="input"
            />
          </Field>
        </div>
        <Field label="ربط بمكان (اختياري)">
          <select value={form.place_id} onChange={(e) => setForm({ ...form, place_id: e.target.value })} className="input">
            <option value="">بدون ربط</option>
            {places.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </Field>
        <Field label="الرابط الرسمي">
          <input
            value={form.official_url}
            onChange={(e) => setForm({ ...form, official_url: e.target.value })}
            dir="ltr"
            placeholder="https://..."
            className="input"
          />
        </Field>
        <Field label="منسّبة لـ">
          <select
            value={form.audience}
            onChange={(e) => setForm({ ...form, audience: e.target.value as FormState['audience'] })}
            className="input"
          >
            <option value="public">عام</option>
            <option value="internal">داخلي (لا تظهر في التطبيق)</option>
            <option value="kids">للأطفال</option>
            <option value="women_only">نساء فقط</option>
          </select>
          {form.audience === 'kids' || form.audience === 'women_only' ? (
            <p className="mt-1 text-[11px] text-muted-foreground">
              شارة توضيحية فقط — ما عندنا بيانات عمر أو جنس للمستخدمين، فما فيه تصفية فعلية حسبها.
            </p>
          ) : null}
        </Field>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <input type="checkbox" checked={form.is_draft} onChange={(e) => setForm({ ...form, is_draft: e.target.checked })} />
          مسودة (ما تظهر في التطبيق لين تُنشر)
        </label>
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <input
            type="checkbox"
            checked={form.notify_interested}
            onChange={(e) => setForm({ ...form, notify_interested: e.target.checked })}
          />
          تفعيل زر «مهتم» في التطبيق
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
