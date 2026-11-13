import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { downloadCsv } from '../lib/csv';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = { id: string; name: string; country: string; tagline: string; image_url: string };

export default function Destinations() {
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[] | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('destinations')
      .select('id,name,country,tagline,image_url')
      .order('sort_order', { ascending: true });
    setRows(data ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      label: 'الوجهة',
      render: (d) => (
        <div className="flex items-center gap-3">
          <img src={d.image_url} alt="" className="h-10 w-10 shrink-0 rounded-md object-cover" />
          <span className="font-bold text-foreground">{d.name}</span>
        </div>
      ),
    },
    { key: 'country', label: 'الدولة', render: (d) => d.country },
    { key: 'tagline', label: 'الوصف القصير', className: 'text-muted-foreground', render: (d) => d.tagline },
  ];

  return (
    <div>
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-xl font-bold text-foreground">الوجهات</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              downloadCsv(
                'destinations',
                rows ?? [],
                [
                  { key: 'id', label: 'المعرّف' },
                  { key: 'name', label: 'الاسم' },
                  { key: 'country', label: 'الدولة' },
                  { key: 'tagline', label: 'الوصف القصير' },
                ]
              )
            }
            disabled={!rows || rows.length === 0}
            className="rounded-md border border-border px-4 py-2 text-xs font-bold text-foreground hover:bg-muted disabled:opacity-50"
          >
            تصدير CSV
          </button>
          <button
            onClick={() => navigate('/destinations/new')}
            className="rounded-md bg-primary px-4 py-2 text-sm font-bold text-primary-foreground"
          >
            + وجهة جديدة
          </button>
        </div>
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(d) => d.id}
        onRowClick={(d) => navigate(`/destinations/${d.id}`)}
        emptyMessage="ما فيه وجهات بعد"
      />
    </div>
  );
}
