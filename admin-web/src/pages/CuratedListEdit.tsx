import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditLog';

type FormState = {
  title: string;
  subtitle: string;
  icon: string;
  method: 'manual' | 'seasonal';
  season_start: string;
  season_end: string;
  is_published: boolean;
};

const EMPTY: FormState = { title: '', subtitle: '', icon: '✨', method: 'manual', season_start: '', season_end: '', is_published: false };

type Item = { place_id: string; name: string; image_url: string; sort_order: number };

export default function CuratedListEdit() {
  const { id } = useParams();
  const isNew = id === 'new';
  const navigate = useNavigate();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<{ id: string; name: string; image_url: string }[]>([]);

  const loadItems = async (listId: string) => {
    const { data } = await supabase
      .from('curated_list_items')
      .select('place_id,sort_order,places(name,image_url)')
      .eq('list_id', listId)
      .order('sort_order', { ascending: true });
    setItems(
      (data ?? []).map((r: any) => ({ place_id: r.place_id, sort_order: r.sort_order, name: r.places?.name ?? r.place_id, image_url: r.places?.image_url ?? '' }))
    );
  };

  useEffect(() => {
    if (isNew) return;
    (async () => {
      const { data } = await supabase
        .from('curated_lists')
        .select('title,subtitle,icon,method,season_start,season_end,is_published')
        .eq('id', id)
        .single();
      if (data) {
        setForm({
          title: data.title,
          subtitle: data.subtitle ?? '',
          icon: data.icon,
          method: data.method,
          season_start: data.season_start ?? '',
          season_end: data.season_end ?? '',
          is_published: data.is_published,
        });
        await loadItems(id!);
      }
      setLoading(false);
    })();
  }, [id, isNew]);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.from('places').select('id,name,image_url').ilike('name', `%${q}%`).limit(8);
      setResults((data ?? []).filter((p) => !items.some((i) => i.place_id === p.id)));
    }, 250);
    return () => clearTimeout(timer);
  }, [query, items]);

  const handleSave = async () => {
    if (!form.title.trim()) return;
    setSaving(true);
    setError(null);
    const payload = {
      title: form.title.trim(),
      subtitle: form.subtitle.trim() || null,
      icon: form.icon.trim() || '✨',
      method: form.method,
      season_start: form.method === 'seasonal' ? form.season_start || null : null,
      season_end: form.method === 'seasonal' ? form.season_end || null : null,
      is_published: form.is_published,
    };
    if (isNew) {
      const { data, error: saveError } = await supabase.from('curated_lists').insert(payload).select('id').single();
      setSaving(false);
      if (saveError || !data) {
        setError(saveError?.message ?? 'تعذّر الحفظ');
        return;
      }
      logAction({ type: 'content', action: 'إضافة قائمة مختارات', target: payload.title });
      navigate(`/curated-lists/${data.id}`);
      return;
    }
    const { error: saveError } = await supabase.from('curated_lists').update(payload).eq('id', id);
    setSaving(false);
    if (saveError) {
      setError(saveError.message);
      return;
    }
    logAction({ type: 'content', action: 'تعديل قائمة مختارات', target: payload.title });
    navigate('/curated-lists');
  };

  const addItem = async (place: { id: string; name: string; image_url: string }) => {
    if (!id || isNew) return;
    const sort_order = items.length;
    await supabase.from('curated_list_items').insert({ list_id: id, place_id: place.id, sort_order });
    setQuery('');
    setResults([]);
    loadItems(id);
  };

  const removeItem = async (placeId: string) => {
    if (!id || isNew) return;
    await supabase.from('curated_list_items').delete().eq('list_id', id).eq('place_id', placeId);
    loadItems(id);
  };

  const move = async (index: number, dir: -1 | 1) => {
    if (!id || isNew) return;
    const target = index + dir;
    if (target < 0 || target >= items.length) return;
    const a = items[index];
    const b = items[target];
    await supabase.from('curated_list_items').update({ sort_order: b.sort_order }).eq('list_id', id).eq('place_id', a.place_id);
    await supabase.from('curated_list_items').update({ sort_order: a.sort_order }).eq('list_id', id).eq('place_id', b.place_id);
    loadItems(id);
  };

  const handleDelete = async () => {
    if (!id || isNew || !confirm(`حذف قائمة "${form.title}" نهائيًا؟`)) return;
    await supabase.from('curated_lists').delete().eq('id', id);
    logAction({ type: 'content', action: 'حذف قائمة مختارات', target: form.title });
    navigate('/curated-lists');
  };

  if (loading) return <div className="text-sm text-muted-foreground">جاري التحميل...</div>;

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-bold text-foreground">{isNew ? 'قائمة جديدة' : form.title}</h1>
      <div className="surface-card mb-6 flex flex-col gap-4 p-5">
        <Field label="العنوان">
          <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" />
        </Field>
        <Field label="وصف فرعي (اختياري)">
          <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input" />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="إيموجي">
            <input value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })} className="input" />
          </Field>
          <Field label="طريقة التعبئة">
            <select value={form.method} onChange={(e) => setForm({ ...form, method: e.target.value as FormState['method'] })} className="input">
              <option value="manual">يدوي (دائم)</option>
              <option value="seasonal">موسمي (بتاريخ)</option>
            </select>
          </Field>
        </div>
        {form.method === 'seasonal' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="من">
              <input type="date" value={form.season_start} onChange={(e) => setForm({ ...form, season_start: e.target.value })} dir="ltr" className="input" />
            </Field>
            <Field label="إلى">
              <input type="date" value={form.season_end} onChange={(e) => setForm({ ...form, season_end: e.target.value })} dir="ltr" className="input" />
            </Field>
          </div>
        ) : null}
        <label className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} />
          منشورة (تظهر في التطبيق)
        </label>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <div className="flex items-center justify-between pt-2">
          <button onClick={handleSave} disabled={saving} className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50">
            {saving ? 'جاري الحفظ...' : 'حفظ'}
          </button>
          {!isNew ? (
            <button onClick={handleDelete} className="text-sm font-semibold text-destructive">
              حذف القائمة
            </button>
          ) : null}
        </div>
      </div>

      {!isNew ? (
        <>
          <h2 className="mb-3 text-sm font-bold text-foreground">الأماكن ({items.length})</h2>
          <div className="surface-card mb-4 p-3">
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="ابحث باسم المكان لإضافته..."
              className="input"
            />
            {results.length > 0 ? (
              <div className="mt-2 flex flex-col gap-1">
                {results.map((p) => (
                  <button key={p.id} onClick={() => addItem(p)} className="flex items-center gap-2 rounded-md p-2 text-right text-sm hover:bg-muted">
                    <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />
                    <span className="text-foreground">{p.name}</span>
                    <span className="mr-auto text-xs text-primary-ink">+ إضافة</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>
          <div className="surface-card divide-y divide-border">
            {items.length === 0 ? (
              <div className="p-4 text-sm text-muted-foreground">ما فيه أماكن بالقائمة بعد</div>
            ) : (
              items.map((item, i) => (
                <div key={item.place_id} className="flex items-center gap-3 p-3">
                  <img src={item.image_url} alt="" className="h-9 w-9 rounded object-cover" />
                  <span className="flex-1 text-sm font-semibold text-foreground">{item.name}</span>
                  <button onClick={() => move(i, -1)} disabled={i === 0} className="text-muted-foreground disabled:opacity-30">
                    ↑
                  </button>
                  <button onClick={() => move(i, 1)} disabled={i === items.length - 1} className="text-muted-foreground disabled:opacity-30">
                    ↓
                  </button>
                  <button onClick={() => removeItem(item.place_id)} className="text-xs font-semibold text-destructive">
                    حذف
                  </button>
                </div>
              ))
            )}
          </div>
        </>
      ) : (
        <p className="text-xs text-muted-foreground">احفظ القائمة أول عشان تقدر تضيف لها أماكن.</p>
      )}
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
