const SIZE = 140;
const STROKE = 12;
const RADIUS = (SIZE - STROKE) / 2;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export default function Gauge({
  percent,
  label,
  sublabel,
}: {
  percent: number;
  label: string;
  sublabel: string;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const color = clamped >= 70 ? 'var(--color-success)' : clamped >= 40 ? 'var(--color-gold)' : 'var(--color-destructive)';
  const offset = CIRCUMFERENCE * (1 - clamped / 100);

  return (
    <div className="surface-card flex flex-col items-center p-5">
      <h3 className="mb-3 self-start text-sm font-bold text-foreground">{label}</h3>
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
        <circle cx={SIZE / 2} cy={SIZE / 2} r={RADIUS} fill="none" stroke="var(--color-muted)" strokeWidth={STROKE} />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          stroke={color}
          strokeWidth={STROKE}
          strokeLinecap="round"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={offset}
          transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
        />
        <text x={SIZE / 2} y={SIZE / 2 - 4} textAnchor="middle" fontSize="28" fontWeight="700" fill="var(--color-foreground)" className="num">
          {Math.round(clamped)}%
        </text>
        <text x={SIZE / 2} y={SIZE / 2 + 18} textAnchor="middle" fontSize="11" fill="var(--color-muted-foreground)">
          {sublabel}
        </text>
      </svg>
    </div>
  );
}
