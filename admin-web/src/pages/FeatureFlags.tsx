import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type Flag = { key: string; enabled: boolean; updated_at: string };

const LABELS: Record<string, { title: string; desc: string }> = {
  sponsored_places: { title: 'الأماكن المُموَّلة', desc: 'بطاقة «مُموَّل» بعلامة واضحة في اكتشف' },
  affiliate_booking: { title: 'الحجز بالعمولة', desc: 'زر ثانوي «احجز عبر…» في الفنادق والتجارب، يفتح برّا التطبيق' },
  premium: { title: 'الاشتراك المميز', desc: 'اشتراك مدفوع (لاحقاً)' },
};

export default function FeatureFlags() {
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data, error: loadError } = await supabase.from('app_flags').select('key,enabled,updated_at').order('key');
    if (loadError) {
      setError(loadError.message);
      return;
    }
    setFlags(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const toggle = async (key: string, enabled: boolean) => {
    setError(null);
    const { error: updateError } = await supabase
      .from('app_flags')
      .update({ enabled, updated_at: new Date().toISOString() })
      .eq('key', key);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    load();
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-foreground">مفاتيح الدخل</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        التطبيق ينطلق مجانياً. هذي المفاتيح جاهزة في التصميم بس مطفية افتراضياً — شغّلها فقط إذا قررت تفعيل طريقة دخل.
      </p>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="surface-card divide-y divide-border">
        {flags === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : (
          flags.map((f) => {
            const label = LABELS[f.key] ?? { title: f.key, desc: '' };
            return (
              <div key={f.key} className="flex items-center justify-between p-4">
                <div>
                  <div className="text-sm font-bold text-foreground">{label.title}</div>
                  <div className="text-xs text-muted-foreground">{label.desc}</div>
                </div>
                <button
                  onClick={() => toggle(f.key, !f.enabled)}
                  className={`rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
                    f.enabled ? 'bg-success text-success-ink' : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {f.enabled ? 'مفعّل' : 'مطفي'}
                </button>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
