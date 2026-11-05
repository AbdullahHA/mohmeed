import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../lib/supabase';
import { logAction } from '../lib/auditLog';
import Drawer from '../components/Drawer';

type Ticket = {
  id: string;
  user_id: string;
  subject: string;
  type: 'bug' | 'account' | 'content' | 'suggestion' | 'other';
  status: 'open' | 'in_progress' | 'closed';
  app_version: string | null;
  device: string | null;
  satisfaction: number | null;
  created_at: string;
  updated_at: string;
  user_name?: string;
};

type Message = {
  id: string;
  ticket_id: string;
  author_id: string;
  from_admin: boolean;
  text: string;
  created_at: string;
};

type Tab = 'all' | 'open' | 'in_progress' | 'closed';

const TABS: { key: Tab; label: string }[] = [
  { key: 'all', label: 'الكل' },
  { key: 'open', label: 'مفتوحة' },
  { key: 'in_progress', label: 'قيد المتابعة' },
  { key: 'closed', label: 'مغلقة' },
];

const TYPE_LABEL: Record<Ticket['type'], string> = {
  bug: 'خلل تقني',
  account: 'حساب',
  content: 'محتوى',
  suggestion: 'اقتراح',
  other: 'غير ذلك',
};

const STATUS_LABEL: Record<Ticket['status'], string> = { open: 'مفتوحة', in_progress: 'قيد المتابعة', closed: 'مغلقة' };
const STATUS_CLASS: Record<Ticket['status'], string> = {
  open: 'bg-gold-soft text-gold-ink',
  in_progress: 'bg-secondary text-primary-ink',
  closed: 'bg-success-soft text-success-ink',
};

export default function Support() {
  const [tickets, setTickets] = useState<Ticket[] | null>(null);
  const [tab, setTab] = useState<Tab>('all');
  const [selected, setSelected] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [reply, setReply] = useState('');
  const [sending, setSending] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from('support_tickets')
      .select('id,user_id,subject,type,status,app_version,device,satisfaction,created_at,updated_at')
      .order('updated_at', { ascending: false });
    const rows = data ?? [];
    const userIds = Array.from(new Set(rows.map((r) => r.user_id)));
    const { data: profiles } = userIds.length
      ? await supabase.from('profiles').select('id,name').in('id', userIds)
      : { data: [] };
    const names: Record<string, string> = {};
    (profiles ?? []).forEach((p: any) => (names[p.id] = p.name));
    setTickets(rows.map((r) => ({ ...r, user_name: names[r.user_id] ?? r.user_id })));
  };

  useEffect(() => {
    load();
  }, []);

  const openTicket = async (t: Ticket) => {
    setSelected(t);
    const { data } = await supabase
      .from('support_messages')
      .select('id,ticket_id,author_id,from_admin,text,created_at')
      .eq('ticket_id', t.id)
      .order('created_at', { ascending: true });
    setMessages(data ?? []);
  };

  const sendReply = async () => {
    if (!selected || !reply.trim()) return;
    setSending(true);
    const { data: auth } = await supabase.auth.getUser();
    const actorId = auth.user?.id;
    if (!actorId) {
      setSending(false);
      return;
    }
    await supabase.from('support_messages').insert({
      ticket_id: selected.id,
      author_id: actorId,
      from_admin: true,
      text: reply.trim(),
    });
    if (selected.status === 'open') {
      await supabase.from('support_tickets').update({ status: 'in_progress' }).eq('id', selected.id);
    }
    logAction({ type: 'mod', action: 'ردّ على تذكرة دعم', target: selected.subject });
    setReply('');
    setSending(false);
    await load();
    await openTicket({ ...selected, status: selected.status === 'open' ? 'in_progress' : selected.status });
  };

  const setStatus = async (status: Ticket['status']) => {
    if (!selected) return;
    await supabase.from('support_tickets').update({ status }).eq('id', selected.id);
    logAction({
      type: 'mod',
      action: 'تغيير حالة تذكرة',
      target: selected.subject,
      diff: { status: { before: selected.status, after: status } },
    });
    setSelected({ ...selected, status });
    load();
  };

  const filtered = useMemo(
    () => (tab === 'all' ? tickets ?? [] : (tickets ?? []).filter((t) => t.status === tab)),
    [tickets, tab]
  );

  const stats = useMemo(() => {
    const all = tickets ?? [];
    const open = all.filter((t) => t.status !== 'closed').length;
    const rated = all.filter((t) => t.satisfaction != null);
    const satisfiedPct = rated.length ? Math.round((rated.filter((t) => (t.satisfaction ?? 0) >= 4).length / rated.length) * 100) : null;
    return { open, satisfiedPct, ratedCount: rated.length, total: all.length };
  }, [tickets]);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-foreground">الدعم والملاحظات</h1>
        <p className="mt-1 text-xs text-muted-foreground">الرد على رسائل المستخدمين مباشرة من التطبيق.</p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatTile label="مفتوحة" value={tickets === null ? '—' : String(stats.open)} />
        <StatTile label="إجمالي التذاكر" value={tickets === null ? '—' : String(stats.total)} />
        <StatTile
          label="رضا المستخدمين"
          value={stats.satisfiedPct == null ? '—' : `${stats.satisfiedPct}%`}
          hint={stats.ratedCount ? `من ${stats.ratedCount} تقييم` : 'ما فيه تقييمات بعد'}
        />
      </div>

      <div className="mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`shrink-0 rounded-full px-4 py-1.5 text-xs font-bold transition-colors ${
              tab === t.key ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-secondary'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="surface-card divide-y divide-border">
        {tickets === null ? (
          <div className="p-4 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : filtered.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه تذاكر.</div>
        ) : (
          filtered.map((t) => (
            <button key={t.id} onClick={() => openTicket(t)} className="flex w-full items-center gap-3 p-4 text-right hover:bg-muted">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="truncate text-sm font-bold text-foreground">{t.subject}</span>
                  <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[t.status]}`}>
                    {STATUS_LABEL[t.status]}
                  </span>
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {t.user_name} · {TYPE_LABEL[t.type]} · {new Date(t.updated_at).toLocaleString('ar-SA')}
                </div>
              </div>
              {t.satisfaction != null ? (
                <span className="num shrink-0 text-xs font-bold text-gold-ink">{'★'.repeat(t.satisfaction)}</span>
              ) : null}
            </button>
          ))
        )}
      </div>

      <Drawer open={!!selected} onClose={() => setSelected(null)} title={selected?.subject ?? ''}>
        {selected ? (
          <div className="flex h-full flex-col">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span>{selected.user_name}</span>
              <span>· {TYPE_LABEL[selected.type]}</span>
              {selected.app_version ? <span>· إصدار {selected.app_version}</span> : null}
              {selected.device ? <span>· {selected.device}</span> : null}
            </div>
            <div className="mb-3 flex gap-2">
              {(['open', 'in_progress', 'closed'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`rounded-full px-3 py-1 text-[11px] font-bold ${
                    selected.status === s ? STATUS_CLASS[s] : 'bg-muted text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {STATUS_LABEL[s]}
                </button>
              ))}
            </div>
            <div className="flex-1 space-y-2 overflow-y-auto">
              {messages.map((m) => (
                <div
                  key={m.id}
                  className={`max-w-[85%] rounded-lg p-2.5 text-sm ${
                    m.from_admin ? 'mr-auto bg-primary text-primary-foreground' : 'ml-auto bg-secondary text-foreground'
                  }`}
                >
                  <div>{m.text}</div>
                  <div className={`mt-1 text-[10px] ${m.from_admin ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                    {new Date(m.created_at).toLocaleString('ar-SA')}
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 flex gap-2">
              <textarea
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                rows={2}
                placeholder="اكتب ردّك..."
                className="input flex-1"
              />
              <button
                onClick={sendReply}
                disabled={sending || !reply.trim()}
                className="shrink-0 rounded-md bg-primary px-4 py-2 text-xs font-bold text-primary-foreground disabled:opacity-50"
              >
                إرسال
              </button>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}

function StatTile({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="surface-card p-4">
      <div className="num text-2xl font-bold text-foreground">{value}</div>
      <div className="mt-1 text-xs text-muted-foreground">{label}</div>
      {hint ? <div className="mt-0.5 text-[10px] text-muted-foreground">{hint}</div> : null}
    </div>
  );
}
