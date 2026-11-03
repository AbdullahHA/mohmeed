import { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabase';

type LogEntry = { id: string; title: string; body: string; recipient_count: number; sent_at: string };

export default function Notifications() {
  const { profile } = useAuth();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [tokenCount, setTokenCount] = useState<number | null>(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [log, setLog] = useState<LogEntry[]>([]);

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

  const canSubmit = title.trim().length > 0 && body.trim().length > 0 && !sending;

  const handleSend = async () => {
    if (!canSubmit || !profile) return;
    setSending(true);
    setError(null);
    const { error: sendError } = await supabase.from('notifications_log').insert({
      sent_by: profile.id,
      title: title.trim(),
      body: body.trim(),
      recipient_count: tokenCount ?? 0,
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
        هذا يسجل الإشعار فعلياً في قاعدة البيانات. التوصيل الفعلي لإشعارات الجوال (Push) يحتاج إعداد إضافي
        (دالة إرسال على الأجهزة المسجّلة). حالياً عدد الأجهزة المسجّلة:{' '}
        <span className="font-bold text-primary-ink">{tokenCount ?? '...'}</span>
      </div>

      <div className="surface-card flex flex-col gap-4 p-5">
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
          {sending ? 'جاري التسجيل...' : 'تسجيل الإشعار'}
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
                {new Date(item.sent_at).toLocaleString('ar-SA')} · {item.recipient_count} جهاز
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
