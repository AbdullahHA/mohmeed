import { useMemo, useRef, useState } from 'react';

type Point = { date: string; value: number };

const WIDTH = 600;
const HEIGHT = 160;
const PAD_X = 8;
const PAD_TOP = 14;
const PAD_BOTTOM = 24;

function formatShortDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' });
}

export default function TrendChart({
  title,
  data,
  color = 'var(--color-primary-ink)',
}: {
  title: string;
  data: Point[];
  color?: string;
}) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const total = useMemo(() => data.reduce((sum, p) => sum + p.value, 0), [data]);
  const max = Math.max(1, ...data.map((p) => p.value));

  const plotWidth = WIDTH - PAD_X * 2;
  const plotHeight = HEIGHT - PAD_TOP - PAD_BOTTOM;

  const points = useMemo(
    () =>
      data.map((p, i) => {
        const x = data.length > 1 ? PAD_X + (i / (data.length - 1)) * plotWidth : PAD_X + plotWidth / 2;
        const y = PAD_TOP + plotHeight - (p.value / max) * plotHeight;
        return { x, y, ...p };
      }),
    [data, max, plotWidth, plotHeight]
  );

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x} ${PAD_TOP + plotHeight} L ${points[0].x} ${PAD_TOP + plotHeight} Z`
    : '';

  const handleMove = (clientX: number) => {
    if (!svgRef.current || points.length === 0) return;
    const rect = svgRef.current.getBoundingClientRect();
    const relX = ((clientX - rect.left) / rect.width) * WIDTH;
    let nearest = 0;
    let nearestDist = Infinity;
    points.forEach((p, i) => {
      const dist = Math.abs(p.x - relX);
      if (dist < nearestDist) {
        nearestDist = dist;
        nearest = i;
      }
    });
    setHoverIndex(nearest);
  };

  const hovered = hoverIndex != null ? points[hoverIndex] : null;
  const gradientId = useMemo(() => `trend-fill-${Math.random().toString(36).slice(2)}`, []);

  return (
    <div className="surface-card p-5">
      <div className="mb-1 flex items-baseline justify-between">
        <h3 className="text-sm font-bold text-foreground">{title}</h3>
        <span className="num text-xs text-muted-foreground">
          {total} خلال {data.length} يوم
        </span>
      </div>
      <div className="relative">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
          className="w-full touch-none"
          style={{ height: 160 }}
          onMouseMove={(e) => handleMove(e.clientX)}
          onMouseLeave={() => setHoverIndex(null)}
          onTouchMove={(e) => handleMove(e.touches[0].clientX)}
          onTouchEnd={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={0.18} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>

          {areaPath ? <path d={areaPath} fill={`url(#${gradientId})`} stroke="none" /> : null}
          {linePath ? (
            <path d={linePath} fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
          ) : null}

          {points.length > 0 ? (
            <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={4} fill={color} />
          ) : null}

          {hovered ? (
            <>
              <line
                x1={hovered.x}
                y1={PAD_TOP}
                x2={hovered.x}
                y2={PAD_TOP + plotHeight}
                stroke="var(--color-border)"
                strokeWidth={1}
              />
              <circle cx={hovered.x} cy={hovered.y} r={4.5} fill={color} stroke="var(--color-card)" strokeWidth={2} />
            </>
          ) : null}
        </svg>

        {hovered ? (
          <div
            className="surface-float pointer-events-none absolute -translate-x-1/2 -translate-y-full rounded-md px-2.5 py-1.5 text-[11px]"
            style={{
              left: `${(hovered.x / WIDTH) * 100}%`,
              top: `${(hovered.y / HEIGHT) * 100}%`,
            }}
          >
            <div className="font-bold text-foreground num">{hovered.value}</div>
            <div className="text-muted-foreground">{formatShortDate(hovered.date)}</div>
          </div>
        ) : null}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-muted-foreground">
        <span>{data[0] ? formatShortDate(data[0].date) : ''}</span>
        <span>{data[data.length - 1] ? formatShortDate(data[data.length - 1].date) : ''}</span>
      </div>
    </div>
  );
}
