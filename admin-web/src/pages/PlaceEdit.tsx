import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type Destination = { id: string; name: string };

type FormState = {
  id: string;
  destination_id: string;
  name: string;
  description: string;
  image_url: string;
  type: 'food' | 'cafe' | 'events' | 'experiences' | 'shopping' | 'nature' | 'landmarks' | 'hotels';
  category: string;
  rating: string;
  price_level: '1' | '2' | '3';
  website: string;
  latitude: string;
  longitude: string;
};

const EMPTY: FormState = {
  id: '',
  destination_id: '',
  name: '',
  description: '',
  image_url: '',
  type: 'experiences',
  category: 'الافتراضي',
  rating: '4.5',
  price_level: '2',
  website: '',
  latitude: '',
  longitude: '',
};

export default function PlaceEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    supabase
      .from('destinations')
      .select('id,name')
      .order('sort_order')
      .then(({ data }) => setDestinations(data ?? []));
  }, []);

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data } = await supabase
        .from('places')
        .select('id,destination_id,name,description,image_url,type,category,rating,price_level,website,latitude,longitude')
        .eq('id', id)
        .single();
      if (data) {
        setForm({
          id: data.id,
          destination_id: data.destination_id,
          name: data.name,
          description: data.description,
          image_url: data.image_url,
          type: data.type,
          category: data.category,
          rating: String(data.rating),
          price_level: String(data.price_level) as '1' | '2' | '3',
          website: data.website ?? '',
          latitude: String(data.latitude),
          longitude: String(data.longitude),
        });
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  const handleSave = async () => {
    if (!form.id.trim() || !form.name.trim() || !form.destination_id) return;
    setSaving(true);
    setError(null);
    const payload = {
      destination_id: form.destination_id,
      name: form.name.trim(),
      description: form.description.trim(),
      image_url: form.image_url.trim(),
      type: form.type,
      category: form.category.trim(),
      rating: Number(form.rating) || 4.5,
      price_level: Number(form.price_level),
      website: form.website.trim() || null,
      latitude: Number(form.latitude) || 0,
      longitude: Number(form.longitude) || 0,
    };
    const { error: saveError } = isNew
      ? await supabase.from('places').insert({ id: form.id.trim(), ...payload })
      : await supabase.from('places').update(payload).eq('id', id);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    navigate('/places');
  };

  const handleDelete = async () => {
    if (!confirm(`حذف "${form.name}" نهائيًا؟`)) return;
    await supabase.from('places').delete().eq('id', id);
    navigate('/places');
  };

  if (loading) return <div className="text-sm text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-bold text-foreground">{isNew ? 'مكان جديد' : form.name}</h1>
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
        <Field label="الوجهة">
          <select value={form.destination_id} onChange={(e) => setForm({ ...form, destination_id: e.target.value })} className="input">
            <option value="">اختر وجهة</option>
            {destinations.map((d) => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </Field>
        <Field label="الاسم">
          <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" />
        </Field>
        <Field label="الوصف">
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="input" />
        </Field>
        <Field label="رابط الصورة">
          <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} dir="ltr" className="input" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="النوع">
            <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as FormState['type'] })} className="input">
              <option value="experiences">تجارب</option>
              <option value="events">فعاليات</option>
              <option value="cafe">كافيهات</option>
              <option value="food">مطاعم</option>
              <option value="shopping">تسوّق</option>
              <option value="nature">طبيعة</option>
              <option value="landmarks">معالم</option>
              <option value="hotels">فنادق</option>
            </select>
          </Field>
          <Field label="مستوى السعر">
            <select value={form.price_level} onChange={(e) => setForm({ ...form, price_level: e.target.value as FormState['price_level'] })} className="input">
              <option value="1">﷼</option>
              <option value="2">﷼﷼</option>
              <option value="3">﷼﷼﷼</option>
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="التقييم (من 5)">
            <input value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} dir="ltr" className="input" />
          </Field>
          <Field label="التصنيف">
            <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className="input" />
          </Field>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="خط العرض (latitude)">
            <input value={form.latitude} onChange={(e) => setForm({ ...form, latitude: e.target.value })} dir="ltr" className="input" />
          </Field>
          <Field label="خط الطول (longitude)">
            <input value={form.longitude} onChange={(e) => setForm({ ...form, longitude: e.target.value })} dir="ltr" className="input" />
          </Field>
        </div>
        <Field label="الموقع الإلكتروني (اختياري)">
          <input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} dir="ltr" className="input" />
        </Field>

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
              حذف المكان
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
