import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ROLE_LABELS, effectiveRole, type AdminRole } from '../lib/roles';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = { id: string; name: string; username: string; admin_role: string | null };

export default function Team() {
  const [rows, setRows] = useState<Row[] | null>(null);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id,name,username,admin_role')
        .eq('is_admin', true)
        .order('name');
      setRows(data ?? []);
    })();
  }, []);

  const columns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      label: 'العضو',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary-ink">
            {r.name.charAt(0)}
          </div>
          <div>
            <div className="font-bold text-foreground">{r.name}</div>
            <div className="text-xs text-muted-foreground" dir="ltr">@{r.username}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      label: 'الدور',
      render: (r) => {
        const role = effectiveRole(r.admin_role) as AdminRole;
        return (
          <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary-ink">
            {ROLE_LABELS[role]}
            {!r.admin_role ? ' (افتراضي)' : ''}
          </span>
        );
      },
    },
  ];

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-foreground">الفريق والصلاحيات</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        كل أعضاء الفريق اللي عندهم دخول للوحة التحكم، ودورهم الحالي.
      </p>

      <div className="mb-6 rounded-md bg-secondary p-3 text-xs leading-5 text-foreground">
        تغيير دور أي عضو، أو إضافة عضو جديد للفريق، يحتاج أمر SQL مباشر من صاحب المشروع — نفس الإجراء الأمني
        المتعمّد المستخدم مع صلاحية «مدير» (is_admin) — ما يصير عبر هذي اللوحة عمدًا، عشان ما تصير ثغرة تصعيد
        صلاحيات لو انخُرق حساب إداري. مثال الأمر:
        <code className="mt-2 block rounded bg-card px-2 py-1 font-mono text-[11px]" dir="ltr">
          update profiles set admin_role = 'mod' where username = 'USERNAME';
        </code>
      </div>

      <DataTable columns={columns} rows={rows} rowKey={(r) => r.id} emptyMessage="ما فيه أعضاء فريق بعد" />
    </div>
  );
}
