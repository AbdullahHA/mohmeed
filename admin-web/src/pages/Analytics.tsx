import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

type FunnelStep = { label: string; count: number };
type Retention = { d7Pct: number | null; d30Pct: number | null; eligibleD7: number; eligibleD30: number };
type EventCount = { name: string; last7: number; last30: number };

const EVENT_LABELS: Record<string, string> = {
  app_opened: 'فتح التطبيق',
  sign_up: 'تسجيل حساب جديد',
  trip_created: 'إنشاء رحلة',
  trip_joined: 'الانضمام لرحلة',
};

export default function Analytics() {
  const [funnel, setFunnel] = useState<FunnelStep[] | null>(null);
  const [retention, setRetention] = useState<Retention | null>(null);
  const [events, setEvents] = useState<EventCount[] | null>(null);

  useEffect(() => {
    (async () => {
      const since30 = new Date(Date.now() - 30 * 86400000).toISOString();
      const { data: eventRows } = await supabase
        .from('analytics_events')
        .select('name,created_at')
        .gte('created_at', since30);
      const since7Ms = Date.now() - 7 * 86400000;
      const counts = new Map<string, EventCount>();
      (eventRows ?? []).forEach((e: any) => {
        const row = counts.get(e.name) ?? { name: e.name, last7: 0, last30: 0 };
        row.last30 += 1;
        if (new Date(e.created_at).getTime() >= since7Ms) row.last7 += 1;
        counts.set(e.name, row);
      });
      setEvents(Array.from(counts.values()).sort((a, b) => b.last30 - a.last30));
    })();
  }, []);

  useEffect(() => {
    (async () => {
      const [{ data: profiles }, { data: trips }, { data: checkIns }, { data: guideMsgs }] = await Promise.all([
        supabase.from('profiles').select('id,created_at'),
        supabase.from('trips').select('owner_id,created_at'),
        supabase.from('check_ins').select('user_id,created_at'),
        supabase.from('guide_messages').select('profile_id,at').eq('from_id', 'me'),
      ]);

      const allUsers = profiles ?? [];
      const tripUsers = new Set((trips ?? []).map((t: any) => t.owner_id));
      const checkInUsers = new Set((checkIns ?? []).map((c: any) => c.user_id));
      const guideUsers = new Set((guideMsgs ?? []).map((g: any) => g.profile_id));

      setFunnel([
        { label: 'سجّلوا حساب', count: allUsers.length },
        { label: 'أنشأوا رحلة', count: allUsers.filter((u: any) => tripUsers.has(u.id)).length },
        { label: 'سجّلوا حضور', count: allUsers.filter((u: any) => checkInUsers.has(u.id)).length },
        { label: 'استخدموا دليل السفر الذكي', count: allUsers.filter((u: any) => guideUsers.has(u.id)).length },
      ]);

      // Real retention: does a user have at least one real action (trip,
      // check-in, or guide message) timestamped at or after signup+7d /
      // signup+30d? Only users old enough for the window to have fully
      // elapsed count in that window's denominator — someone who signed up
      // yesterday can't fail the 30-day check yet, so they're excluded
      // instead of counted as churn.
      const actionTimesByUser = new Map<string, number[]>();
      const addAction = (userId: string, iso: string) => {
        const t = new Date(iso).getTime();
        const list = actionTimesByUser.get(userId) ?? [];
        list.push(t);
        actionTimesByUser.set(userId, list);
      };
      (trips ?? []).forEach((t: any) => t.owner_id && addAction(t.owner_id, t.created_at));
      (checkIns ?? []).forEach((c: any) => c.user_id && addAction(c.user_id, c.created_at));
      (guideMsgs ?? []).forEach((g: any) => g.profile_id && addAction(g.profile_id, g.at));

      const now = Date.now();
      const isActiveAfter = (userId: string, signupMs: number, windowMs: number) => {
        const times = actionTimesByUser.get(userId);
        if (!times) return false;
        return times.some((t) => t >= signupMs + windowMs);
      };

      const DAY = 86400000;
      const eligibleD7 = allUsers.filter((u: any) => now - new Date(u.created_at).getTime() >= 7 * DAY);
      const eligibleD30 = allUsers.filter((u: any) => now - new Date(u.created_at).getTime() >= 30 * DAY);
      const activeD7 = eligibleD7.filter((u: any) => isActiveAfter(u.id, new Date(u.created_at).getTime(), 7 * DAY));
      const activeD30 = eligibleD30.filter((u: any) => isActiveAfter(u.id, new Date(u.created_at).getTime(), 30 * DAY));

      setRetention({
        d7Pct: eligibleD7.length ? Math.round((activeD7.length / eligibleD7.length) * 100) : null,
        d30Pct: eligibleD30.length ? Math.round((activeD30.length / eligibleD30.length) * 100) : null,
        eligibleD7: eligibleD7.length,
        eligibleD30: eligibleD30.length,
      });
    })();
  }, []);

  const maxCount = funnel ? Math.max(1, funnel[0]?.count ?? 1) : 1;

  return (
    <div>
      <h1 className="mb-1 text-xl font-bold text-foreground">التحليلات</h1>
      <p className="mb-6 text-sm text-muted-foreground">
        قمع تفعيل حقيقي محسوب من بيانات فعلية (تسجيل، رحلات، تسجيلات حضور، دليل السفر)، بالإضافة لعدّادات أحداث خفيفة
        (analytics_events) تساعد تتابع هل الميزات الجديدة فعليًا تُستخدم.
      </p>

      <h2 className="mb-3 text-sm font-bold text-foreground">قمع التفعيل</h2>
      <div className="surface-card mb-8 flex flex-col gap-4 p-5">
        {funnel === null ? (
          <div className="text-sm text-muted-foreground">جاري التحميل...</div>
        ) : (
          funnel.map((step, i) => {
            const pct = maxCount ? Math.round((step.count / maxCount) * 100) : 0;
            const ofPrevious = i > 0 && funnel[i - 1].count > 0 ? Math.round((step.count / funnel[i - 1].count) * 100) : null;
            return (
              <div key={step.label}>
                <div className="mb-1 flex items-center justify-between text-xs">
                  <span className="font-semibold text-foreground">{step.label}</span>
                  <span className="num text-muted-foreground">
                    {step.count} {ofPrevious != null ? `· ${ofPrevious}% من الخطوة قبلها` : ''}
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })
        )}
      </div>

      <h2 className="mb-3 text-sm font-bold text-foreground">الاستمرارية</h2>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="surface-card p-5">
          <div className="num text-2xl font-bold text-foreground">{retention?.d7Pct == null ? '—' : `${retention.d7Pct}%`}</div>
          <div className="mt-1 text-sm text-muted-foreground">فعّالون بعد 7 أيام من التسجيل</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {retention ? `من ${retention.eligibleD7} مستخدم عمره أسبوع فأكثر` : ''}
          </div>
        </div>
        <div className="surface-card p-5">
          <div className="num text-2xl font-bold text-foreground">{retention?.d30Pct == null ? '—' : `${retention.d30Pct}%`}</div>
          <div className="mt-1 text-sm text-muted-foreground">فعّالون بعد 30 يوم من التسجيل</div>
          <div className="mt-0.5 text-[11px] text-muted-foreground">
            {retention ? `من ${retention.eligibleD30} مستخدم عمره شهر فأكثر` : ''}
          </div>
        </div>
      </div>

      <h2 className="mb-3 mt-8 text-sm font-bold text-foreground">الأحداث</h2>
      <div className="surface-card overflow-hidden">
        {events === null ? (
          <div className="p-5 text-sm text-muted-foreground">جاري التحميل...</div>
        ) : events.length === 0 ? (
          <div className="p-5 text-sm text-muted-foreground">ولا حدث مسجّل آخر 30 يوم.</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-right text-xs text-muted-foreground">
                <th className="px-5 py-3 font-medium">الحدث</th>
                <th className="px-5 py-3 font-medium">آخر 7 أيام</th>
                <th className="px-5 py-3 font-medium">آخر 30 يوم</th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.name} className="border-b border-border last:border-0">
                  <td className="px-5 py-3 font-semibold text-foreground">{EVENT_LABELS[e.name] ?? e.name}</td>
                  <td className="num px-5 py-3 text-muted-foreground">{e.last7}</td>
                  <td className="num px-5 py-3 text-muted-foreground">{e.last30}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
