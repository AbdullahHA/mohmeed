export default function Sparkline({ data, color = 'currentColor' }: { data: number[]; color?: string }) {
  const width = 100;
  const height = 28;
  const pad = 2;
  const max = Math.max(1, ...data);
  const min = Math.min(0, ...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = data.length > 1 ? pad + (i / (data.length - 1)) * (width - pad * 2) : width / 2;
    const y = pad + (height - pad * 2) * (1 - (v - min) / range);
    return { x, y };
  });

  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const areaPath = points.length
    ? `${linePath} L ${points[points.length - 1].x.toFixed(1)} ${height - pad} L ${points[0].x.toFixed(1)} ${height - pad} Z`
    : '';

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-full" preserveAspectRatio="none" aria-hidden="true">
      {areaPath ? <path d={areaPath} fill={color} fillOpacity={0.12} stroke="none" /> : null}
      {linePath ? <path d={linePath} fill="none" stroke={color} strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" /> : null}
      {points.length ? <circle cx={points[points.length - 1].x} cy={points[points.length - 1].y} r={2} fill={color} /> : null}
    </svg>
  );
}
