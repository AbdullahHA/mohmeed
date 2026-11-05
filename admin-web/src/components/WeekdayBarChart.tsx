type DayBucket = { label: string; value: number };

const WIDTH = 320;
const HEIGHT = 160;
const PAD_TOP = 28;
const PAD_BOTTOM = 24;
const GAP = 10;

export default function WeekdayBarChart({ title, data }: { title: string; data: DayBucket[] }) {
  const max = Math.max(1, ...data.map((d) => d.value));
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;
  const barWidth = (WIDTH - GAP * (data.length - 1)) / data.length;
  const peakIndex = data.reduce((best, d, i) => (d.value > data[best].value ? i : best), 0);

  return (
    <div className="surface-card p-5">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full" style={{ height: 160 }}>
        {data.map((d, i) => {
          const barHeight = (d.value / max) * plotHeight;
          const x = i * (barWidth + GAP);
          const y = PAD_TOP + plotHeight - barHeight;
          const isPeak = i === peakIndex && d.value > 0;
          return (
            <g key={d.label}>
              {d.value > 0 ? (
                <text
                  x={x + barWidth / 2}
                  y={y - 6}
                  textAnchor="middle"
                  fontSize="11"
                  fontWeight={isPeak ? 700 : 500}
                  className="num"
                  fill={isPeak ? 'var(--color-primary-ink)' : 'var(--color-muted-foreground)'}
                >
                  {d.value}
                </text>
              ) : null}
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={Math.max(barHeight, 3)}
                rx={4}
                fill={isPeak ? 'var(--color-primary-ink)' : 'var(--color-secondary)'}
              />
              <text
                x={x + barWidth / 2}
                y={HEIGHT - 6}
                textAnchor="middle"
                fontSize="11"
                fill="var(--color-muted-foreground)"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}
