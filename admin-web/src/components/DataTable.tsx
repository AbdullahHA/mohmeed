import type { ReactNode } from 'react';

export type DataTableColumn<T> = {
  key: string;
  label: string;
  render: (row: T) => ReactNode;
  className?: string;
};

export default function DataTable<T>({
  columns,
  rows,
  rowKey,
  onRowClick,
  emptyMessage = 'ما فيه بيانات.',
}: {
  columns: DataTableColumn<T>[];
  rows: T[] | null;
  rowKey: (row: T) => string;
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}) {
  return (
    <div className="surface-card overflow-x-auto">
      <table className="w-full min-w-max text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/50">
            {columns.map((c) => (
              <th key={c.key} className={`whitespace-nowrap px-4 py-3 text-right text-xs font-bold text-muted-foreground ${c.className ?? ''}`}>
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {rows === null ? (
            <tr>
              <td colSpan={columns.length} className="p-4 text-sm text-muted-foreground">
                جاري التحميل...
              </td>
            </tr>
          ) : rows.length === 0 ? (
            <tr>
              <td colSpan={columns.length} className="p-4 text-sm text-muted-foreground">
                {emptyMessage}
              </td>
            </tr>
          ) : (
            rows.map((row) => (
              <tr
                key={rowKey(row)}
                onClick={onRowClick ? () => onRowClick(row) : undefined}
                className={onRowClick ? 'cursor-pointer hover:bg-muted' : undefined}
              >
                {columns.map((c) => (
                  <td key={c.key} className={`px-4 py-3 text-foreground ${c.className ?? ''}`}>
                    {c.render(row)}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
