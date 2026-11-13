import { useEffect, useState } from 'react';
import { checkDatabase, checkFunction, STATUS_LABEL, STATUS_CLASS, type Check } from '../lib/systemChecks';

export default function SystemHealth() {
  const [checks, setChecks] = useState<Check[] | null>(null);
  const [checkedAt, setCheckedAt] = useState<Date | null>(null);
  const [running, setRunning] = useState(false);

  const runChecks = async () => {
    setRunning(true);
    const results = await Promise.all([
      checkDatabase(),
      checkFunction('places-search', 'بحث الأماكن (Google Places)'),
      checkFunction('guide-chat', 'دليل السفر الذكي (Claude)'),
      checkFunction('delete-account', 'حذف الحساب'),
      checkFunction('smart-api', 'إرسال الإشعارات (Expo Push)'),
    ]);
    setChecks(results);
    setCheckedAt(new Date());
    setRunning(false);
  };

  useEffect(() => {
    runChecks();
  }, []);

  const allOk = checks?.every((c) => c.status === 'ok');

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground">صحة النظام</h1>
        <button
          onClick={runChecks}
          disabled={running}
          className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
        >
          {running ? 'جاري الفحص...' : 'إعادة الفحص'}
        </button>
      </div>
      <p className="mb-6 text-sm text-muted-foreground">
        فحوصات حقيقية مباشرة من المتصفح — زمن استجابة فعلي، مو حالة ثابتة.
        {checkedAt ? ` آخر فحص: ${checkedAt.toLocaleTimeString('ar-SA')}` : ''}
      </p>

      {checks === null ? (
        <div className="surface-card p-4 text-sm text-muted-foreground">جاري الفحص...</div>
      ) : (
        <div className="surface-card divide-y divide-border">
          {checks.map((c) => (
            <div key={c.name} className="flex items-center gap-3 p-4">
              <div className="flex-1">
                <div className="text-sm font-bold text-foreground">{c.name}</div>
                <div className="text-xs text-muted-foreground">{c.desc}</div>
                {c.detail ? <div className="mt-0.5 text-xs text-destructive">{c.detail}</div> : null}
              </div>
              {c.latencyMs != null ? <span className="num text-xs text-muted-foreground">{c.latencyMs}ms</span> : null}
              <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_CLASS[c.status]}`}>
                {STATUS_LABEL[c.status]}
              </span>
            </div>
          ))}
        </div>
      )}

      {checks && !allOk ? (
        <p className="mt-3 text-xs text-muted-foreground">
          ملاحظة: الفحص يتأكد إن الخدمة توصل ويرد عليها بس — مو إنها تعمل بشكل كامل داخليًا (مثلاً مفتاح API منتهي بعد ما يوصل الفحص لو الخدمة نفسها شغّالة).
        </p>
      ) : null}
    </div>
  );
}
