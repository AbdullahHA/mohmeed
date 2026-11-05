import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type LogEntry = { id: string; title: string; body: string; recipient_count: number; sent_at: string };
type Segment = 'all' | 'new_7d' | 'has_trip';

const SEGMENT_OPTIONS: { value: Segment; label: string }[] = [
  { value: 'all', label: 'الكل' },
  { value: 'new_7d', label: 'سجّلوا آخر 7 أيام' },
  { value: 'has_trip', label: 'عندهم رحلة واحدة على الأقل' },
];

export default function Notifications() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [segment, setSegment] = useState<Segment>('all');
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);
  const [audienceCount, setAudienceCount] = useState<number | null>(null);

  const load = async () => {
    const [{ count }, { data: logRows }] = await Promise.all([
      supabase.from('push_tokens').select('id', { count: 'exact', head: true }),
      supabase.from('notifications_log').select('id,title,body,recipient_count,sent_at').order('sent_at', { ascending: false }).limit(20),
    ]);
    setTokenCount(count ?? 0);
    setLog(logRows ?? []);
  };

  useEffect(() => {
    load();
  }, []);

  const resolveSegmentProfileIds = async (): Promise<string[] | null> => {
    if (segment === 'all') return null;
    if (segment === 'new_7d') {
      const since = new Date(Date.now() - 7 * 86400000).toISOString();
      const { data } = await supabase.from('profiles').select('id').gte('created_at', since);
      return (data ?? []).map((r) => r.id);
    }
    // has_trip
    const { data } = await supabase.from('trips').select('owner_id');
    return Array.from(new Set((data ?? []).map((r) => r.owner_id)));
  };

  useEffect(() => {
    (async () => {
      if (segment === 'all') {
        setAudienceCount(tokenCount);
        return;
      }
      const ids = await resolveSegmentProfileIds();
      if (!ids) {
        setAudienceCount(null);
        return;
      }
      const { count } = await supabase.from('push_tokens').select('id', { count: 'exact', head: true }).in('profile_id', ids);
      setAudienceCount(count ?? 0);
    })();
  }, [segment, tokenCount]);

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSubmit || !profile) return;
    setSending(true);
    setError(null);

    const profileIds = await resolveSegmentProfileIds();
    const { data: pushResult, error: pushError } = await supabase.functions.invoke('smart-api', {
      body: { title: title.trim(), body: body.trim(), ...(profileIds ? { profileIds } : {}) },
    });
    if (pushError) {
      setSending(false);
      setError(`تعذّر إرسال الإشعار: ${pushError.message}`);
      return;
    }

    const { error: sendError } = await supabase.from('notifications_log').insert({
      sent_by: profile.id,
      title: title.trim(),
      body: body.trim(),
      recipient_count: pushResult?.delivered ?? 0,
    });
    setSending(false);
    if (sendError) {
      setError(sendError.message);
      return;
    }
    setTitle('');
    setBody('');
    load();
  };

  return (
    <div className="max-w-xl">
      <h1 className="mb-6 text-xl font-bold text-foreground">الإشعارات</h1>

      <div className="mb-4 flex items-start gap-2 rounded-md bg-secondary p-3 text-xs leading-5 text-foreground">
        الإرسال هنا فعلي ويوصل كإشعار Push حقيقي عبر خدمة Expo. عدد الأجهزة المسجّلة إجمالاً:{' '}
        <span className="font-bold text-primary-ink">{tokenCount ?? '...'}</span>. الجدولة واختبار A/B غير مبنية — تحتاج بنية
        جدولة (cron) غير موجودة بالمشروع حاليًا، فكل إرسال هنا فوري.
      </div>

      <div className="surface-card flex flex-col gap-4 p-5">
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">الجمهور</label>
          <select value={segment} onChange={(e) => setSegment(e.target.value as Segment)} className="input">
            {SEGMENT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {audienceCount == null ? 'جاري الحساب...' : `بيوصل فعليًا لـ ${audienceCount} جهاز مسجَّل ضمن هذا الجمهور`}
          </p>
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">العنوان</label>
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="input" placeholder="مثال: عرض جديد في العلا" />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold text-muted-foreground">نص الإشعار</label>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} rows={3} className="input" placeholder="اكتب محتوى الإشعار هنا..." />
        </div>
        {error ? <p className="text-sm text-destructive">{error}</p> : null}
        <button
          onClick={handleSend}
          disabled={!canSubmit}
          className="rounded-md bg-primary px-5 py-2 text-sm font-bold text-primary-foreground disabled:opacity-50"
        >
          {sending ? 'جاري الإرسال...' : 'إرسال الإشعار'}
        </button>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold text-foreground">آخر الإشعارات</h2>
      <div className="surface-card divide-y divide-border">
        {log.length === 0 ? (
          <div className="p-4 text-sm text-muted-foreground">ما فيه إشعارات بعد</div>
        ) : (
          log.map((item) => (
            <div key={item.id} className="p-3">
              <div className="text-sm font-bold text-foreground">{item.title}</div>
              <div className="mt-0.5 text-xs text-muted-foreground">{item.body}</div>
              <div className="mt-1 text-[11px] text-muted-foreground">
                {new Date(item.sent_at).toLocaleString('ar-SA')} · وصل إلى {item.recipient_count} جهاز
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
