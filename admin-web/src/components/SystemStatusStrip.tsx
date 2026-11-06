import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { checkDatabase, checkFunction, STATUS_LABEL, STATUS_DOT_CLASS, type Check } from '../lib/systemChecks';

export default function SystemStatusStrip() {
  const [checks, setChecks] = useState<Check[] | null>(null);

  useEffect(() => {
    (async () => {
      const results = await Promise.all([
        checkDatabase(),
        checkFunction('places-search', 'بحث الأماكن'),
        checkFunction('guide-chat', 'دليل السفر الذكي'),
      ]);
      setChecks(results);
    })();
  }, []);

  return (
    <div className="surface-card p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-bold text-foreground">حالة الأنظمة</h3>
        <Link to="/system-health" className="text-xs font-semibold text-primary-ink hover:underline">
          عرض التفاصيل الكاملة ←
        </Link>
      </div>
      <div className="flex flex-col gap-2">
        {checks === null
          ? ['قاعدة البيانات', 'بحث الأماكن', 'دليل السفر الذكي'].map((name) => (
              <div key={name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{name}</span>
                <span className="h-2 w-2 animate-pulse rounded-full bg-muted-foreground" />
              </div>
            ))
          : checks.map((c) => (
              <div key={c.name} className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{c.name}</span>
                <span className="flex items-center gap-1.5">
                  <span className="num text-foreground">{c.latencyMs != null ? `${c.latencyMs}ms` : ''}</span>
                  <span className={`h-2 w-2 rounded-full ${STATUS_DOT_CLASS[c.status]}`} title={STATUS_LABEL[c.status]} />
                </span>
              </div>
            ))}
      </div>
    </div>
  );
}
