type Item = { label: string; value: number };

export default function RankedBarList({ title, items }: { title: string; items: Item[] }) {
  const max = Math.max(1, ...items.map((i) => i.value));

  return (
    <div className="surface-card p-5">
      <h3 className="mb-3 text-sm font-bold text-foreground">{title}</h3>
      {items.length === 0 ? (
        <div className="py-4 text-sm text-muted-foreground">ما فيه بيانات كافية بعد</div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {items.map((item) => (
            <div key={item.label} className="flex items-center gap-3 text-sm">
              <span className="w-24 shrink-0 truncate text-foreground">{item.label}</span>
              <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary-ink"
                  style={{ width: `${Math.max(4, (item.value / max) * 100)}%` }}
                />
              </div>
              <span className="num w-8 shrink-0 text-right font-bold text-foreground">{item.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
