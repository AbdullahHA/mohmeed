import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { ROLE_LABELS, effectiveRole, type AdminRole } from '../lib/roles';

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

      <div className="surface-card divide-y divide-border">
        {rows === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : rows.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه أعضاء فريق بعد</div>
        ) : (
          rows.map((r) => {
            const role = effectiveRole(r.admin_role) as AdminRole;
            return (
              <div key={r.id} className="flex items-center gap-3 p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-bold text-primary-ink">
                  {r.name.charAt(0)}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-bold text-foreground">{r.name}</div>
                  <div className="text-xs text-muted-foreground" dir="ltr">@{r.username}</div>
                </div>
                <span className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary-ink">
                  {ROLE_LABELS[role]}
                  {!r.admin_role ? ' (افتراضي)' : ''}
                </span>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
