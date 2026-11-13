import { supabase } from './supabase';

type AuditType = 'mod' | 'content' | 'settings' | 'security' | 'data';

export async function logAction(entry: {
  type: AuditType;
  action: string;
  target: string;
  diff?: Record<string, unknown>;
  note?: string;
}) {
  const { data: auth } = await supabase.auth.getUser();
  const actorId = auth.user?.id;
  if (!actorId) return;
  await supabase.from('admin_audit_log').insert({
    actor_id: actorId,
    type: entry.type,
    action: entry.action,
    target: entry.target,
    diff: entry.diff ?? null,
    note: entry.note ?? null,
    device: typeof navigator !== 'undefined' ? navigator.userAgent : null,
  });
}
