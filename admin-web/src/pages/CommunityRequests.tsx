import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditLog';
import DataTable, { type DataTableColumn } from '../components/DataTable';

type Row = {
  id: string;
  requester_id: string;
  name: string;
  tagline: string;
  emoji: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  community_id: string | null;
  requester_name?: string;
};

function slugify(name: string) {
  const base = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9؀-ۿ\s]/g, '')
    .replace(/\s+/g, '-');
  return base || `community-${Date.now()}`;
}

export default function CommunityRequests() {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    const { data } = await supabase
      .from('community_requests')
      .select('id,requester_id,name,tagline,emoji,reason,status,created_at,community_id')
      .order('created_at', { ascending: false });
    const requesterIds = Array.from(new Set((data ?? []).map((r) => r.requester_id)));
    const { data: profiles } = requesterIds.length
      ? await supabase.from('profiles').select('id,name').in('id', requesterIds)
      : { data: [] as { id: string; name: string }[] };
    const names: Record<string, string> = {};
    (profiles ?? []).forEach((p) => (names[p.id] = p.name));
    setRows((data ?? []).map((r) => ({ ...r, requester_name: names[r.requester_id] })));
  };

  useEffect(() => {
    load();
  }, []);

  const approve = async (row: Row) => {
    setBusyId(row.id);
    setError(null);
    // Upsert both steps so a retry after a partial failure (e.g. the
    // community got created but the moderator insert was rejected) never
    // hits a duplicate-key error on the part that already succeeded.
    const communityId = row.community_id ?? slugify(row.name);
    const { error: communityError } = await supabase.from('communities').upsert(
      {
        id: communityId,
        name: row.name,
        tagline: row.tagline,
        emoji: row.emoji,
        color: '#1359D3',
        base_member_count: 0,
      },
      { onConflict: 'id' }
    );
    if (communityError) {
      setBusyId(null);
      setError(`تعذّر إنشاء المجتمع: ${communityError.message}`);
      return;
    }
    const { error: memberError } = await supabase
      .from('community_members')
      .upsert(
        { community_id: communityId, profile_id: row.requester_id, role: 'moderator' },
        { onConflict: 'community_id,profile_id' }
      );
    if (memberError) {
      setBusyId(null);
      setError(`تعذّر تعيين المشرف: ${memberError.message}`);
      return;
    }
    const { data: me } = await supabase.auth.getUser();
    await supabase
      .from('community_requests')
      .update({ status: 'approved', community_id: communityId, reviewed_by: me.user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusyId(null);
    logAction({ type: 'mod', action: 'موافقة على طلب إنشاء مجتمع', target: row.name });
    load();
  };

  const reject = async (row: Row) => {
    setBusyId(row.id);
    const { data: me } = await supabase.auth.getUser();
    await supabase
      .from('community_requests')
      .update({ status: 'rejected', reviewed_by: me.user?.id, reviewed_at: new Date().toISOString() })
      .eq('id', row.id);
    setBusyId(null);
    logAction({ type: 'mod', action: 'رفض طلب إنشاء مجتمع', target: row.name });
    load();
  };

  const pending = (rows ?? []).filter((r) => r.status === 'pending');
  const reviewed = (rows ?? []).filter((r) => r.status !== 'pending');

  const pendingColumns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      label: 'المجتمع',
      render: (r) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-secondary text-base">{r.emoji}</div>
          <div>
            <div className="font-bold text-foreground">{r.name}</div>
            <div className="text-xs text-muted-foreground">{r.tagline}</div>
          </div>
        </div>
      ),
    },
    { key: 'reason', label: 'السبب', className: 'text-xs text-muted-foreground', render: (r) => r.reason },
    {
      key: 'requester',
      label: 'الطالب',
      className: 'text-xs text-muted-foreground',
      render: (r) => `${r.requester_name ?? r.requester_id} · ${new Date(r.created_at).toLocaleDateString('ar')}`,
    },
    {
      key: 'actions',
      label: '',
      render: (r) => (
        <div className="flex gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              approve(r);
            }}
            disabled={busyId === r.id}
            className="rounded-md bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground disabled:opacity-50"
          >
            موافقة
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              reject(r);
            }}
            disabled={busyId === r.id}
            className="rounded-md border border-border px-3 py-1.5 text-xs font-bold text-destructive disabled:opacity-50"
          >
            رفض
          </button>
        </div>
      ),
    },
  ];

  const reviewedColumns: DataTableColumn<Row>[] = [
    {
      key: 'name',
      label: 'المجتمع',
      render: (r) => (
        <div className="flex items-center gap-2">
          <span>{r.emoji}</span>
          <span className="font-semibold text-foreground">{r.name}</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'الحالة',
      render: (r) => (
        <span className={`text-xs font-semibold ${r.status === 'approved' ? 'text-primary' : 'text-destructive'}`}>
          {r.status === 'approved' ? 'تمت الموافقة' : 'مرفوض'}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">طلبات إنشاء مجتمعات</h1>
        <p className="mt-1 text-xs text-muted-foreground">
          كل طلب معتمد يُنشئ مجتمعًا حقيقيًا ويجعل صاحب الطلب مشرفًا عليه (community_members.role = moderator).
        </p>
      </div>

      {error ? <p className="mb-4 text-sm text-destructive">{error}</p> : null}

      <div className="mb-6">
        <DataTable columns={pendingColumns} rows={rows === null ? null : pending} rowKey={(r) => r.id} emptyMessage="ما فيه طلبات قيد المراجعة" />
      </div>

      {reviewed.length > 0 ? (
        <>
          <h2 className="mb-3 text-sm font-bold text-foreground">طلبات سابقة</h2>
          <DataTable columns={reviewedColumns} rows={reviewed} rowKey={(r) => r.id} />
        </>
      ) : null}
    </div>
  );
}
