/**
 * دليل السفر. لما Supabase مربوط، يسأل الـ Edge Function «guide» (Claude) ويرجع خطة JSON.
 * بدونه (أو لو فشل الاتصال) يبني خطة محلية من الأماكن المحفوظة، عشان الدليل يشتغل حتى بدون نت.
 */
import type { City, GuidePlan, Place, User } from '../data/types';
import { supabase } from './supabase';

const WORD_DAYS: Record<string, number> = { يوم: 1, يومين: 2, ثلاث: 3, ثلاثة: 3, اربع: 4, أربع: 4, خمس: 5, ويكند: 2 };

export function parseQuestion(q: string, cities: City[]) {
  const city = cities.find((c) => q.includes(c.name)) ?? null;
  let days = 0;
  const m = q.match(/(\d+)\s*(?:أيام|ايام|يوم)/);
  if (m) days = Number(m[1]);
  else for (const [w, n] of Object.entries(WORD_DAYS)) if (q.includes(w)) days = Math.max(days, n);
  return {
    city,
    days: Math.min(Math.max(days || 3, 1), 7),
    foodOnly: /مطاعم|أكل/.test(q) && /بس|فقط/.test(q),
    cheap: /أرخص|ارخص|اقتصادي|ميزانية/.test(q),
    family: /عائل|أطفال|اطفال/.test(q),
  };
}

export function localPlan(q: string, cities: City[], places: Place[], me: User, prev?: GuidePlan | null): GuidePlan | null {
  const p = parseQuestion(q, cities);
  const city = p.city ?? (prev ? cities.find((c) => c.id === prev.cityId) ?? null : null);
  if (!city) return null;
  let days = p.days;
  if (prev && /يوم ثالث|زيد يوم|أضف يوم/.test(q)) days = prev.days.length + 1;
  let pool = places.filter((x) => x.cityId === city.id && x.category !== 'hotels');
  if (p.foodOnly) pool = pool.filter((x) => x.category === 'food' || x.category === 'cafe');
  if (p.cheap) pool = pool.filter((x) => x.priceLevel <= 2);
  if (p.family || me.travelerType === 'family') pool = pool.filter((x) => x.amenities.includes('family') || x.amenities.includes('kids'));
  pool.sort((a, b) => b.rating - a.rating);
  const food = pool.filter((x) => x.category === 'food' || x.category === 'cafe');
  const see = pool.filter((x) => !(x.category === 'food' || x.category === 'cafe'));
  const titles = ['التاريخ', 'الطبيعة', 'المغامرة', 'الأكل', 'على راحتكم', 'الأسواق', 'الوداع'];
  const out: GuidePlan['days'] = [];
  for (let d = 0; d < days; d++) {
    const ids = [see[d * 2], food[d], see[d * 2 + 1]].filter(Boolean).map((x) => x!.id);
    if (!ids.length) break;
    const notes: string[] = [];
    const hasTickets = ids.some((id) => pool.find((x) => x.id === id)?.amenities.includes('reservation'));
    if (hasTickets) notes.push('فيه أماكن تحتاج حجز مسبق، احجزوا قبلها بيومين.');
    out.push({ title: `اليوم ${d + 1} · ${titles[d % titles.length]}`, placeIds: ids, notes });
  }
  if (!out.length) return null;
  const why = [me.interests.length ? `ركّزت على ${me.interests.slice(0, 2).join(' و')} لأنها من اهتماماتك` : '', p.cheap ? 'واخترت أماكن أرخص' : ''].filter(Boolean).join('، ');
  return { cityId: city.id, intro: `خطة ${out.length} أيام في ${city.name}${why ? '. ' + why : ''}:`, days: out };
}

export async function askGuide(q: string, ctx: { cities: City[]; places: Place[]; me: User; prev?: GuidePlan | null }): Promise<{ text: string; plan: GuidePlan | null }> {
  if (supabase) {
    try {
      const { data, error } = await supabase.functions.invoke('guide', {
        body: {
          question: q,
          profile: { interests: ctx.me.interests, budget: ctx.me.budget, travelerType: ctx.me.travelerType, dietary: ctx.me.dietary },
          previousPlan: ctx.prev ?? null,
        },
      });
      if (!error && data?.text) return { text: data.text, plan: data.plan ?? null };
    } catch {
      /* نكمل بالخطة المحلية */
    }
  }
  const plan = localPlan(q, ctx.cities, ctx.places, ctx.me, ctx.prev);
  if (plan) return { text: plan.intro, plan };
  const names = ctx.cities.slice(0, 4).map((c) => c.name).join('، ');
  return { text: `قلّي وين تبي تروح وكم يوم، وأسوي لك خطة. مثلاً: «وش أسوي في العلا 3 أيام؟». الوجهات اللي أعرفها: ${names}…`, plan: null };
}

/** قائمة تجهيز مقترحة حسب الوجهة والشهر */
export function suggestPacking(city: City, month: number): string[] {
  const cold = city.tempNight < 15 || [11, 0, 1].includes(month);
  const base = ['شاحن متنقل', 'أدوية شخصية', 'نسخة من الهوية/الجواز'];
  if (city.scene === 'desert') base.push('حذاء مشي', 'نظارة شمس', 'واقي شمس');
  if (city.scene === 'sea') base.push('ملابس سباحة', 'واقي شمس');
  if (city.scene === 'mountain' || city.scene === 'green') base.push('جاكيت مطر');
  if (cold) base.push('جاكيت للمساء');
  if (city.countryCode !== 'SA') base.push('محوّل كهرباء', 'شريحة eSIM');
  return base;
}
