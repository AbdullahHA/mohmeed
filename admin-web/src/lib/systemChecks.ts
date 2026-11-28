import { supabase } from './supabase';

export type Status = 'checking' | 'ok' | 'warn' | 'down';
export type Check = { name: string; desc: string; status: Status; latencyMs: number | null; detail?: string };

const FUNCTIONS_BASE = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1`;

export async function checkDatabase(): Promise<Check> {
  const start = performance.now();
  const { error } = await supabase.from('app_flags').select('key', { count: 'exact', head: true });
  const latencyMs = Math.round(performance.now() - start);
  return {
    name: 'قاعدة البيانات',
    desc: 'استعلام حقيقي على Supabase',
    status: error ? 'down' : latencyMs > 1500 ? 'warn' : 'ok',
    latencyMs,
    detail: error?.message,
  };
}

export async function checkFunction(name: string, desc: string): Promise<Check> {
  // GET with no-cors: these functions bail out on missing auth/body before
  // ever reaching the paid API behind them, so this is a real reachability
  // check, not a billed invocation. The response is opaque (no-cors), so we
  // can only tell "something answered" vs "nothing answered" — that's
  // exactly what an uptime ping needs.
  const start = performance.now();
  try {
    await fetch(`${FUNCTIONS_BASE}/${name}`, { method: 'GET', mode: 'no-cors' });
    const latencyMs = Math.round(performance.now() - start);
    return {
      name: desc,
      desc: `فحص وصول حقيقي لدالة ${name} — بدون استدعاء فعلي للخدمة المدفوعة خلفها`,
      status: latencyMs > 2500 ? 'warn' : 'ok',
      latencyMs,
    };
  } catch (e) {
    return {
      name: desc,
      desc: `فحص وصول لدالة ${name}`,
      status: 'down',
      latencyMs: Math.round(performance.now() - start),
      detail: e instanceof Error ? e.message : 'تعذّر الوصول',
    };
  }
}

export const STATUS_LABEL: Record<Status, string> = { checking: 'جاري الفحص...', ok: 'يعمل', warn: 'بطيء', down: 'متوقف' };
export const STATUS_CLASS: Record<Status, string> = {
  checking: 'bg-muted text-muted-foreground',
  ok: 'bg-success-soft text-success-ink',
  warn: 'bg-gold-soft text-gold-ink',
  down: 'bg-destructive/10 text-destructive',
};
export const STATUS_DOT_CLASS: Record<Status, string> = {
  checking: 'bg-muted-foreground',
  ok: 'bg-success',
  warn: 'bg-gold',
  down: 'bg-destructive',
};
