import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useToast } from '../context/ToastContext';
import { logAction } from '../lib/auditLog';

type Flag = { key: string; enabled: boolean; updated_at: string; rollout_pct: number };

const LABELS: Record<string, { title: string; desc: string }> = {
  sponsored_places: { title: 'الأماكن المُموَّلة', desc: 'بطاقة «مُموَّل» بعلامة واضحة في اكتشف' },
  affiliate_booking: { title: 'الحجز بالعمولة', desc: 'زر ثانوي «احجز عبر…» في الفنادق والتجارب، يفتح برّا التطبيق' },
  premium: { title: 'الاشتراك المميز', desc: 'اشتراك مدفوع (لاحقاً)' },
};

export default function FeatureFlags() {
  const [flags, setFlags] = useState<Flag[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = async () => {
    const { data, error: loadError } = await supabase.from('app_flags').select('key,enabled,updated_at,rollout_pct').order('key');
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
    const label = LABELS[key]?.title ?? key;
    showToast(`${enabled ? 'تفعيل' : 'إيقاف'} «${label}»`, () => toggle(key, !enabled));
    logAction({ type: 'settings', action: enabled ? 'تفعيل ميزة' : 'إيقاف ميزة', target: label });
    load();
  };

  const setRollout = async (key: string, pct: number) => {
    setError(null);
    const { error: updateError } = await supabase
      .from('app_flags')
      .update({ rollout_pct: pct, updated_at: new Date().toISOString() })
      .eq('key', key);
    if (updateError) {
      setError(updateError.message);
      return;
    }
    setFlags((prev) => (prev ? prev.map((f) => (f.key === key ? { ...f, rollout_pct: pct } : f)) : prev));
  };

  const commitRollout = (key: string, pct: number) => {
    const label = LABELS[key]?.title ?? key;
    logAction({ type: 'settings', action: 'تغيير نسبة الإطلاق', target: label, diff: { rollout_pct: { before: null, after: pct } } });
  };

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-foreground">مفاتيح الميزات</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        التطبيق ينطلق مجانياً. هذي المفاتيح جاهزة في التصميم بس مطفية افتراضياً — شغّلها فقط إذا قررت تفعيل طريقة دخل.
      </p>
      <div className="mb-4 rounded-md bg-secondary p-3 text-xs leading-5 text-foreground">
        صراحةً: نسبة الإطلاق التدريجي هنا بنية حقيقية مخزّنة، بس التطبيق لسه ما يقرأ ولا مفتاح من هالثلاثة فعليًا — كل الميزات المرتبطة فيها (الأماكن المُموَّلة، الحجز بالعمولة، الاشتراك المميز) لسه ما بُنيت بالتطبيق. يعني تفعيلها أو تغيير نسبتها الحين ما يغيّر شي للمستخدمين، لين تُبنى الميزة نفسها.
      </div>
      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}
      <div className="surface-card divide-y divide-border">
        {flags === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : (
          flags.map((f) => {
            const label = LABELS[f.key] ?? { title: f.key, desc: '' };
            return (
              <div key={f.key} className="p-4">
                <div className="flex items-center justify-between">
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
                <div className="mt-3 flex items-center gap-3">
                  <span className="text-xs text-muted-foreground">نسبة الإطلاق</span>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    step={5}
                    value={f.rollout_pct}
                    onChange={(e) => setRollout(f.key, Number(e.target.value))}
                    onMouseUp={(e) => commitRollout(f.key, Number((e.target as HTMLInputElement).value))}
                    onTouchEnd={(e) => commitRollout(f.key, Number((e.target as HTMLInputElement).value))}
                    className="h-1.5 flex-1 accent-primary-ink"
                  />
                  <span className="num w-10 shrink-0 text-xs font-bold text-foreground">{f.rollout_pct}%</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
