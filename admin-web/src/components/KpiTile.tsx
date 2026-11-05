import type { ReactNode } from 'react';

export default function KpiTile({
  icon,
  iconBg,
  iconColor,
  label,
  value,
  deltaPercent,
  deltaLabel,
}: {
  icon: ReactNode;
  iconBg: string;
  iconColor: string;
  label: string;
  value: number | null;
  deltaPercent: number | null;
  deltaLabel: string;
}) {
  const hasDelta = deltaPercent != null && Number.isFinite(deltaPercent);
  const isUp = hasDelta && deltaPercent! >= 0;

  return (
    <div className="surface-card p-5">
      <div className="mb-3 flex items-center justify-between">
        <div className="flex h-9 w-9 items-center justify-center rounded-full" style={{ backgroundColor: iconBg, color: iconColor }}>
          {icon}
        </div>
        {hasDelta ? (
          <span
            className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold ${
              isUp ? 'bg-success-soft text-success-ink' : 'bg-destructive/10 text-destructive'
            }`}
          >
            {isUp ? <ArrowUp /> : <ArrowDown />}
            {Math.abs(deltaPercent!).toFixed(0)}%
          </span>
        ) : null}
      </div>
      <div className="num text-2xl font-bold text-foreground">{value ?? '—'}</div>
      <div className="mt-1 text-sm text-muted-foreground">{label}</div>
      {hasDelta ? <div className="mt-0.5 text-[11px] text-muted-foreground">{deltaLabel}</div> : null}
    </div>
  );
}

function ArrowUp() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}
function ArrowDown() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 5v14M5 12l7 7 7-7" />
    </svg>
  );
}
