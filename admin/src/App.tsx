/** لوحة تحكم يلا نسافر: المختارات، الأماكن، المدن، لفتات الموسم، الدول، طلبات المجتمعات، البلاغات، المستخدمين، مفاتيح الدخل */
import {
  BarChart3,
  Building2,
  Check,
  Flag,
  Globe2,
  LayoutDashboard,
  LogOut,
  MapPin,
  Moon,
  Pencil,
  Plus,
  Search,
  ShieldAlert,
  Sparkles,
  Sun,
  ToggleLeft,
  Trash2,
  Users,
  UsersRound,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';

import { importGoogle, isDemo, list, remove, resetDemo, reviewCommunity, save, stats, supabase, type Row, type Table } from './data';

type Field = { key: string; label: string; type?: 'text' | 'number' | 'bool' | 'select' | 'list' | 'json' | 'textarea'; options?: string[]; hint?: string };
type Resource = { table: Table; title: string; icon: ReactNode; columns: Field[]; fields: Field[]; newRow?: () => Row; searchKey?: string };

const CATS = ['food', 'cafe', 'events', 'experiences', 'hotels', 'landmarks', 'nature', 'shopping'];
const CAT_AR: Record<string, string> = { food: 'مطاعم', cafe: 'كافيهات', events: 'فعاليات', experiences: 'تجارب', hotels: 'فنادق', landmarks: 'معالم', nature: 'طبيعة', shopping: 'تسوّق' };
const SCENES = ['desert', 'sea', 'city', 'green', 'night', 'food', 'old', 'mountain'];
const id = (p: string) => `${p}_${Date.now().toString(36)}`;

const RESOURCES: Record<string, Resource> = {
  places: {
    table: 'places',
    title: 'الأماكن والمختارات',
    icon: <MapPin size={18} />,
    searchKey: 'name',
    columns: [
      { key: 'name', label: 'الاسم' },
      { key: 'category', label: 'التصنيف', type: 'select' },
      { key: 'cityId', label: 'المدينة' },
      { key: 'rating', label: 'التقييم', type: 'number' },
      { key: 'featured', label: 'مختار', type: 'bool' },
      { key: 'trending', label: 'رائج', type: 'bool' },
      { key: 'sponsored', label: 'مُموَّل', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'الاسم' },
      { key: 'category', label: 'التصنيف', type: 'select', options: CATS },
      { key: 'cityId', label: 'معرّف المدينة', hint: 'مثل c_riyadh' },
      { key: 'kind', label: 'الصنف', hint: 'مطعم فاخر، معلم تاريخي…' },
      { key: 'cuisine', label: 'المطبخ' },
      { key: 'description', label: 'الوصف', type: 'textarea' },
      { key: 'address', label: 'العنوان' },
      { key: 'lat', label: 'خط العرض', type: 'number' },
      { key: 'lng', label: 'خط الطول', type: 'number' },
      { key: 'open', label: 'يفتح (HH:MM)' },
      { key: 'close', label: 'يقفل (HH:MM، بعد منتصف الليل 25:00)' },
      { key: 'priceLevel', label: 'مستوى السعر (1–4)', type: 'number' },
      { key: 'avgMin', label: 'أقل سعر للشخص', type: 'number' },
      { key: 'avgMax', label: 'أعلى سعر للشخص', type: 'number' },
      { key: 'ticketFrom', label: 'التذاكر من', type: 'number' },
      { key: 'eventDates', label: 'مواعيد الفعالية' },
      { key: 'rating', label: 'التقييم', type: 'number' },
      { key: 'ratingCount', label: 'عدد التقييمات', type: 'number' },
      { key: 'phone', label: 'الهاتف' },
      { key: 'website', label: 'الموقع' },
      { key: 'menuUrl', label: 'رابط المنيو' },
      { key: 'amenities', label: 'المرافق', type: 'list', hint: 'parking, wifi, family, kids, wheelchair, reservation, halal, prayer' },
      { key: 'tags', label: 'وسوم', type: 'list' },
      { key: 'scene', label: 'صورة بديلة', type: 'select', options: SCENES },
      { key: 'photo', label: 'رابط صورة' },
      { key: 'bestTime', label: 'أفضل وقت' },
      { key: 'durationMin', label: 'المدة (دقيقة)', type: 'number' },
      { key: 'featured', label: 'ضمن «مختارة لك»', type: 'bool' },
      { key: 'trending', label: 'رائج هالأسبوع', type: 'bool' },
      { key: 'sponsored', label: 'مُموَّل (يظهر لما يتفعّل مفتاح الإبراز المدفوع)', type: 'bool' },
      { key: 'affiliateUrl', label: 'رابط «احجز عبر» (مفتاح العمولة)' },
    ],
    newRow: () => ({ id: id('p'), name: '', category: 'food', cityId: 'c_riyadh', kind: '', priceLevel: 2, rating: 4.5, ratingCount: 0, lat: 24.7, lng: 46.7, address: '', open: '09:00', close: '23:00', amenities: [], tags: [], scene: 'city', description: '', durationMin: 60 }),
  },
  cities: {
    table: 'cities',
    title: 'المدن والوجهات',
    icon: <Building2 size={18} />,
    searchKey: 'name',
    columns: [
      { key: 'name', label: 'المدينة' },
      { key: 'country', label: 'الدولة' },
      { key: 'group', label: 'المنطقة' },
      { key: 'budgetPerDay', label: 'الميزانية/يوم', type: 'number' },
      { key: 'tempNow', label: 'الطقس', type: 'number' },
    ],
    fields: [
      { key: 'name', label: 'الاسم' },
      { key: 'country', label: 'الدولة' },
      { key: 'countryCode', label: 'رمز الدولة (SA, AE…)' },
      { key: 'region', label: 'المنطقة' },
      { key: 'group', label: 'المجموعة', type: 'select', options: ['saudi', 'gulf', 'europe', 'asia'] },
      { key: 'blurb', label: 'وصف قصير', type: 'textarea' },
      { key: 'scene', label: 'صورة بديلة', type: 'select', options: SCENES },
      { key: 'lat', label: 'خط العرض', type: 'number' },
      { key: 'lng', label: 'خط الطول', type: 'number' },
      { key: 'bestMonths', label: 'أفضل الأشهر (12 رقم: 2 ممتاز، 1 مقبول، 0 لا)', type: 'json' },
      { key: 'budgetPerDay', label: 'الميزانية لليوم', type: 'number' },
      { key: 'flightFromRUH', label: 'الطيران من الرياض (دقيقة)', type: 'number' },
      { key: 'tempNow', label: 'الحرارة الحين', type: 'number' },
      { key: 'tempNight', label: 'الحرارة بالليل', type: 'number' },
    ],
    newRow: () => ({ id: id('c'), name: '', country: 'السعودية', countryCode: 'SA', region: '', group: 'saudi', blurb: '', scene: 'city', lat: 24.7, lng: 46.7, bestMonths: [2, 2, 2, 1, 0, 0, 0, 0, 0, 1, 2, 2], budgetPerDay: 600, tempNow: 25, tempNight: 18, ourRating: 0, ourCount: 0, googleRating: 0, googleCount: 0 }),
  },
  stories: {
    table: 'seasonal_stories',
    title: 'لفتات الموسم',
    icon: <Sparkles size={18} />,
    columns: [
      { key: 'title', label: 'العنوان' },
      { key: 'cityId', label: 'المدينة' },
      { key: 'startsAt', label: 'من' },
      { key: 'endsAt', label: 'إلى' },
    ],
    fields: [
      { key: 'title', label: 'العنوان' },
      { key: 'cityId', label: 'معرّف المدينة' },
      { key: 'scene', label: 'الصورة', type: 'select', options: SCENES },
      { key: 'startsAt', label: 'يبدأ (YYYY-MM-DD)' },
      { key: 'endsAt', label: 'ينتهي (YYYY-MM-DD)' },
      { key: 'slides', label: 'الشرائح', type: 'json', hint: '[{"title":"…","text":"…"}]' },
    ],
    newRow: () => ({ id: id('s'), title: '', scene: 'night', slides: [{ title: '', text: '' }], startsAt: new Date().toISOString().slice(0, 10), endsAt: new Date(Date.now() + 30 * 864e5).toISOString().slice(0, 10) }),
  },
  countries: {
    table: 'country_info',
    title: 'معلومات الدخول للدول',
    icon: <Globe2 size={18} />,
    columns: [
      { key: 'name', label: 'الدولة' },
      { key: 'visaSA', label: 'تأشيرة الجواز السعودي' },
      { key: 'currency', label: 'العملة' },
      { key: 'emergency', label: 'الطوارئ' },
    ],
    fields: [
      { key: 'code', label: 'الرمز (GE, GB…)' },
      { key: 'name', label: 'الاسم' },
      { key: 'visaSA', label: 'التأشيرة للجواز السعودي' },
      { key: 'visaGCC', label: 'التأشيرة لمواطني الخليج' },
      { key: 'passportMonths', label: 'صلاحية الجواز (شهور)', type: 'number' },
      { key: 'currency', label: 'العملة' },
      { key: 'plugs', label: 'القابس' },
      { key: 'sim', label: 'الشريحة' },
      { key: 'emergency', label: 'رقم الطوارئ' },
      { key: 'embassy', label: 'السفارة السعودية', type: 'textarea' },
      { key: 'sourceUrl', label: 'المصدر الرسمي' },
    ],
    newRow: () => ({ id: id('cc'), code: '', name: '', visaSA: '', visaGCC: '', passportMonths: 6, currency: '', plugs: '', sim: '', emergency: '112', embassy: '', sourceUrl: 'https://www.mofa.gov.sa' }),
  },
  users: {
    table: 'profiles',
    title: 'المستخدمين',
    icon: <Users size={18} />,
    searchKey: 'name',
    columns: [
      { key: 'name', label: 'الاسم' },
      { key: 'handle', label: 'المعرّف' },
      { key: 'city', label: 'المدينة' },
      { key: 'verified', label: 'موثّق', type: 'bool' },
      { key: 'isAdmin', label: 'مشرف', type: 'bool' },
    ],
    fields: [
      { key: 'name', label: 'الاسم' },
      { key: 'verified', label: 'موثّق', type: 'bool' },
      { key: 'localExpertCity', label: 'خبير محلي في (اتركه فاضي إذا لا)' },
      { key: 'isAdmin', label: 'مشرف في لوحة التحكم', type: 'bool' },
    ],
  },
};

type Page = 'overview' | keyof typeof RESOURCES | 'communities' | 'reports' | 'flags';

export default function App() {
  const [page, setPage] = useState<Page>('overview');
  const [authed, setAuthed] = useState(isDemo);
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'));
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setAuthed(!!s));
    return () => data.subscription.unsubscribe();
  }, []);
  const toggleDark = () => {
    const d = !dark;
    setDark(d);
    document.documentElement.classList.toggle('dark', d);
    localStorage.setItem('yalla-theme', d ? 'dark' : 'light');
  };
  if (!authed) return <Login />;
  const nav: [Page, string, ReactNode][] = [
    ['overview', 'نظرة عامة', <LayoutDashboard size={18} />],
    ['places', 'الأماكن والمختارات', <MapPin size={18} />],
    ['cities', 'المدن', <Building2 size={18} />],
    ['stories', 'لفتات الموسم', <Sparkles size={18} />],
    ['communities', 'المجتمعات', <UsersRound size={18} />],
    ['reports', 'البلاغات', <ShieldAlert size={18} />],
    ['users', 'المستخدمين', <Users size={18} />],
    ['countries', 'معلومات الدول', <Globe2 size={18} />],
    ['flags', 'مفاتيح الدخل', <ToggleLeft size={18} />],
  ];
  return (
    <div className="min-h-screen bg-background text-foreground md:flex">
      <aside className="md:w-64 md:min-h-screen border-b md:border-b-0 md:border-l border-border bg-card p-4 flex md:flex-col gap-1 overflow-x-auto">
        <div className="hidden md:flex items-center gap-2 px-2 pb-4">
          <div className="size-9 rounded-xl bg-primary text-primary-foreground grid place-items-center font-bold">ي</div>
          <div>
            <div className="font-bold">يلا نسافر</div>
            <div className="text-xs text-muted-foreground">لوحة التحكم{isDemo ? ' · وضع العرض' : ''}</div>
          </div>
        </div>
        {nav.map(([k, l, ic]) => (
          <button
            key={k}
            onClick={() => setPage(k)}
            className={`flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm whitespace-nowrap transition ${page === k ? 'bg-secondary text-primary-ink font-semibold' : 'hover:bg-muted text-foreground'}`}
          >
            {ic}
            {l}
          </button>
        ))}
        <div className="md:mt-auto flex md:flex-col gap-1">
          <button onClick={toggleDark} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-muted">
            {dark ? <Sun size={18} /> : <Moon size={18} />}
            {dark ? 'فاتح' : 'داكن'}
          </button>
          {supabase ? (
            <button onClick={() => supabase!.auth.signOut()} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm hover:bg-muted text-destructive">
              <LogOut size={18} />
              خروج
            </button>
          ) : (
            <button onClick={() => (resetDemo(), location.reload())} className="rounded-xl px-3 py-2.5 text-sm hover:bg-muted text-muted-foreground text-right">
              رجّع بيانات العرض
            </button>
          )}
        </div>
      </aside>
      <main className="flex-1 p-4 md:p-8 max-w-6xl">
        {page === 'overview' ? <Overview go={setPage} /> : page === 'communities' ? <Communities /> : page === 'reports' ? <Reports /> : page === 'flags' ? <Flags /> : <ResourcePage key={page} r={RESOURCES[page]} />}
      </main>
    </div>
  );
}

function Login() {
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [sent, setSent] = useState(false);
  const [err, setErr] = useState('');
  return (
    <div className="min-h-screen grid place-items-center bg-background p-4">
      <div className="surface-card w-full max-w-sm p-6 space-y-4">
        <h1 className="text-xl font-bold">دخول لوحة التحكم</h1>
        <p className="text-sm text-muted-foreground">للمشرفين فقط. نرسل لك رمز من 6 أرقام.</p>
        <input className="w-full h-11 rounded-xl border border-border bg-card px-3 text-left" dir="ltr" placeholder="admin@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        {sent ? <input className="w-full h-11 rounded-xl border border-border bg-card px-3 text-center tracking-widest" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value)} placeholder="123456" /> : null}
        {err ? <p className="text-sm text-destructive">{err}</p> : null}
        <button
          className="w-full h-11 rounded-xl bg-primary text-primary-foreground font-semibold"
          onClick={async () => {
            setErr('');
            if (!sent) {
              const { error } = await supabase!.auth.signInWithOtp({ email, options: { shouldCreateUser: false } });
              error ? setErr('ما قدرنا نرسل الرمز. تأكد من البريد.') : setSent(true);
            } else {
              const { error } = await supabase!.auth.verifyOtp({ email, token: code, type: 'email' });
              if (error) setErr('الرمز غلط أو انتهى.');
            }
          }}
        >
          {sent ? 'دخول' : 'أرسل الرمز'}
        </button>
      </div>
    </div>
  );
}

function useRows(t: Table) {
  const [rows, setRows] = useState<Row[] | null>(null);
  const [err, setErr] = useState('');
  const load = useCallback(() => list(t).then(setRows).catch((e) => setErr(String(e.message ?? e))), [t]);
  useEffect(() => {
    void load();
  }, [load]);
  return { rows, err, reload: load };
}

function Card({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`surface-card p-4 ${className}`}>{children}</div>;
}
function H1({ children, action }: { children: ReactNode; action?: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
      <h1 className="text-2xl font-bold">{children}</h1>
      {action}
    </div>
  );
}
function Btn({ children, onClick, tone = 'primary', small }: { children: ReactNode; onClick?: () => void; tone?: 'primary' | 'ghost' | 'danger'; small?: boolean }) {
  const t = { primary: 'bg-primary text-primary-foreground', ghost: 'border border-border bg-card hover:bg-muted', danger: 'border border-border bg-card text-destructive hover:bg-muted' }[tone];
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1.5 rounded-xl font-semibold ${small ? 'h-9 px-3 text-sm' : 'h-11 px-4'} ${t}`}>
      {children}
    </button>
  );
}

function Overview({ go }: { go: (p: Page) => void }) {
  const [s, setS] = useState<Record<string, number> | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => {
    stats().then(setS).catch((e) => setErr(String(e.message ?? e)));
  }, []);
  const tiles: [string, string, Page | null][] = [
    ['users', 'مستخدم', 'users'],
    ['trips', 'رحلة', null],
    ['posts', 'منشور', null],
    ['active_week', 'نشط هالأسبوع', null],
    ['pending_communities', 'طلب مجتمع ينتظر', 'communities'],
    ['open_reports', 'بلاغ مفتوح', 'reports'],
  ];
  return (
    <>
      <H1>نظرة عامة</H1>
      {isDemo ? (
        <Card className="mb-6 bg-secondary border-primary">
          <p className="text-sm text-primary-ink">وضع العرض: البيانات تجريبية ومحفوظة في متصفحك. اربط Supabase من ملف .env (شوف README) عشان تتحكم في التطبيق الحقيقي.</p>
        </Card>
      ) : null}
      {err ? <p className="text-destructive">{err}</p> : null}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {tiles.map(([k, l, p]) => (
          <button key={k} onClick={() => p && go(p)} className={`surface-card p-5 text-right ${p ? 'hover:border-primary' : 'cursor-default'}`}>
            <div className="text-3xl font-bold tabular-nums">{s ? s[k] ?? 0 : '…'}</div>
            <div className="text-sm text-muted-foreground mt-1">{l}</div>
          </button>
        ))}
      </div>
      <Card className="mt-6">
        <div className="flex items-center gap-2 font-semibold mb-2">
          <BarChart3 size={18} /> وش تقدر تسوي من هنا
        </div>
        <ul className="text-sm text-muted-foreground leading-7 list-disc pr-5">
          <li>تختار الأماكن اللي تطلع في «مختارة لك» و«رائج هالأسبوع»، وتستورد أماكن من Google.</li>
          <li>تضيف لفتات الموسم والمدن ومعلومات الدخول للدول.</li>
          <li>توافق أو ترفض طلبات المجتمعات، وتراجع البلاغات.</li>
          <li>توثّق الحسابات، وتعيّن «خبير محلي»، وتعطي صلاحية مشرف.</li>
          <li>تشغّل مفاتيح الدخل (الإبراز المدفوع، العمولة، الاشتراك) لما تقرر.</li>
        </ul>
      </Card>
    </>
  );
}

function fmt(v: unknown, f: Field) {
  if (f.type === 'bool') return v ? <Check size={16} className="text-success-ink" /> : <span className="text-muted-foreground">—</span>;
  if (f.type === 'select' && f.key === 'category') return CAT_AR[String(v)] ?? String(v ?? '');
  if (Array.isArray(v)) return v.join('، ');
  return String(v ?? '');
}

function ResourcePage({ r }: { r: Resource }) {
  const { rows, err, reload } = useRows(r.table);
  const [edit, setEdit] = useState<Row | null>(null);
  const [q, setQ] = useState('');
  const [imp, setImp] = useState(false);
  const shown = useMemo(() => (rows ?? []).filter((x) => !q || String(x[r.searchKey ?? 'name'] ?? x.title ?? '').includes(q)), [rows, q, r.searchKey]);
  return (
    <>
      <H1
        action={
          <div className="flex gap-2">
            {r.table === 'places' ? (
              <Btn tone="ghost" onClick={() => setImp(true)}>
                <Search size={16} /> استيراد من Google
              </Btn>
            ) : null}
            {r.newRow ? (
              <Btn onClick={() => setEdit(r.newRow!())}>
                <Plus size={16} /> إضافة
              </Btn>
            ) : null}
          </div>
        }
      >
        {r.title}
      </H1>
      <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="بحث…" className="mb-4 w-full max-w-sm h-11 rounded-xl border border-border bg-card px-3" />
      {err ? <p className="text-destructive mb-4">{err}</p> : null}
      <div className="surface-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground">
            <tr>
              {r.columns.map((c) => (
                <th key={c.key} className="text-right font-semibold px-4 py-3 whitespace-nowrap">
                  {c.label}
                </th>
              ))}
              <th className="w-24" />
            </tr>
          </thead>
          <tbody>
            {rows === null ? (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                  جاري التحميل…
                </td>
              </tr>
            ) : shown.length ? (
              shown.map((row) => (
                <tr key={row.id} className="border-t border-border hover:bg-muted/50">
                  {r.columns.map((c) => (
                    <td key={c.key} className="px-4 py-3">
                      {c.type === 'bool' && r.table !== 'profiles' ? (
                        <input
                          type="checkbox"
                          aria-label={c.label}
                          className="size-4 accent-[var(--color-primary)]"
                          checked={!!row[c.key]}
                          onChange={async () => {
                            await save(r.table, { ...row, [c.key]: !row[c.key] });
                            void reload();
                          }}
                        />
                      ) : (
                        fmt(row[c.key], c)
                      )}
                    </td>
                  ))}
                  <td className="px-2 py-2 whitespace-nowrap">
                    <button aria-label="تعديل" className="p-2 rounded-lg hover:bg-muted" onClick={() => setEdit(row)}>
                      <Pencil size={16} />
                    </button>
                    {r.table !== 'profiles' ? (
                      <button
                        aria-label="حذف"
                        className="p-2 rounded-lg hover:bg-muted text-destructive"
                        onClick={async () => {
                          if (window.confirm('متأكد من الحذف؟')) {
                            await remove(r.table, row.id);
                            void reload();
                          }
                        }}
                      >
                        <Trash2 size={16} />
                      </button>
                    ) : null}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td className="px-4 py-6 text-muted-foreground" colSpan={9}>
                  ما فيه نتائج
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      {edit ? <EditDrawer r={r} row={edit} onClose={() => setEdit(null)} onSaved={() => (setEdit(null), void reload())} /> : null}
      {imp ? <ImportDialog onClose={() => setImp(false)} onDone={() => (setImp(false), void reload())} /> : null}
    </>
  );
}

function EditDrawer({ r, row, onClose, onSaved }: { r: Resource; row: Row; onClose: () => void; onSaved: () => void }) {
  const [f, setF] = useState<Row>(row);
  const [err, setErr] = useState('');
  const set = (k: string, v: unknown) => setF({ ...f, [k]: v });
  return (
    <div className="fixed inset-0 z-50 flex" role="dialog" aria-modal="true">
      <button aria-label="إغلاق" className="flex-1 bg-black/40" onClick={onClose} />
      <div className="w-full max-w-lg bg-background h-full overflow-y-auto p-6 space-y-4 border-r border-border">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{String(row.name ?? row.title ?? 'جديد') || 'جديد'}</h2>
          <button aria-label="إغلاق" onClick={onClose} className="p-2 rounded-lg hover:bg-muted">
            <X size={18} />
          </button>
        </div>
        {r.fields.map((fl) => (
          <label key={fl.key} className="block space-y-1.5">
            <span className="text-sm font-semibold">{fl.label}</span>
            {fl.type === 'bool' ? (
              <div>
                <input type="checkbox" className="size-5 accent-[var(--color-primary)]" checked={!!f[fl.key]} onChange={(e) => set(fl.key, e.target.checked)} />
              </div>
            ) : fl.type === 'select' ? (
              <select className="w-full h-11 rounded-xl border border-border bg-card px-3" value={String(f[fl.key] ?? '')} onChange={(e) => set(fl.key, e.target.value)}>
                {fl.options!.map((o) => (
                  <option key={o} value={o}>
                    {CAT_AR[o] ?? o}
                  </option>
                ))}
              </select>
            ) : fl.type === 'textarea' ? (
              <textarea className="w-full min-h-24 rounded-xl border border-border bg-card p-3" value={String(f[fl.key] ?? '')} onChange={(e) => set(fl.key, e.target.value)} />
            ) : fl.type === 'json' ? (
              <textarea
                dir="ltr"
                className="w-full min-h-24 rounded-xl border border-border bg-card p-3 font-mono text-xs"
                defaultValue={JSON.stringify(f[fl.key] ?? null)}
                onBlur={(e) => {
                  try {
                    set(fl.key, JSON.parse(e.target.value));
                    setErr('');
                  } catch {
                    setErr(`«${fl.label}» مو JSON صحيح`);
                  }
                }}
              />
            ) : (
              <input
                className="w-full h-11 rounded-xl border border-border bg-card px-3"
                type={fl.type === 'number' ? 'number' : 'text'}
                step="any"
                value={fl.type === 'list' ? ((f[fl.key] as string[] | undefined) ?? []).join(', ') : String(f[fl.key] ?? '')}
                onChange={(e) => set(fl.key, fl.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : fl.type === 'list' ? e.target.value.split(',').map((s) => s.trim()).filter(Boolean) : e.target.value)}
              />
            )}
            {fl.hint ? <span className="text-xs text-muted-foreground">{fl.hint}</span> : null}
          </label>
        ))}
        {err ? <p className="text-destructive text-sm">{err}</p> : null}
        <div className="flex gap-2 pt-2">
          <Btn
            onClick={async () => {
              try {
                await save(r.table, f);
                onSaved();
              } catch (e) {
                setErr(String((e as Error).message));
              }
            }}
          >
            احفظ
          </Btn>
          <Btn tone="ghost" onClick={onClose}>
            إلغاء
          </Btn>
        </div>
      </div>
    </div>
  );
}

function ImportDialog({ onClose, onDone }: { onClose: () => void; onDone: () => void }) {
  const [q, setQ] = useState('');
  const [city, setCity] = useState('c_riyadh');
  const [msg, setMsg] = useState('');
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" role="dialog" aria-modal="true">
      <div className="surface-card bg-background w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-bold">استيراد من Google Places</h2>
        <input className="w-full h-11 rounded-xl border border-border bg-card px-3" placeholder="مثلاً: مطاعم سعودية في الرياض" value={q} onChange={(e) => setQ(e.target.value)} />
        <input className="w-full h-11 rounded-xl border border-border bg-card px-3" placeholder="معرّف المدينة" value={city} onChange={(e) => setCity(e.target.value)} />
        {msg ? <p className="text-sm text-muted-foreground">{msg}</p> : null}
        <div className="flex gap-2">
          <Btn
            onClick={async () => {
              try {
                const r = await importGoogle(q, city);
                setMsg(`انستورد ${r.imported} مكان`);
                setTimeout(onDone, 900);
              } catch (e) {
                setMsg(String((e as Error).message));
              }
            }}
          >
            استورد
          </Btn>
          <Btn tone="ghost" onClick={onClose}>
            إلغاء
          </Btn>
        </div>
      </div>
    </div>
  );
}

function Communities() {
  const { rows, err, reload } = useRows('communities');
  const [tab, setTab] = useState<'pending' | 'approved' | 'rejected'>('pending');
  const list = (rows ?? []).filter((c) => c.status === tab);
  return (
    <>
      <H1>المجتمعات</H1>
      <div className="flex gap-2 mb-4">
        {(
          [
            ['pending', 'تنتظر المراجعة'],
            ['approved', 'مقبولة'],
            ['rejected', 'مرفوضة'],
          ] as const
        ).map(([k, l]) => (
          <button key={k} onClick={() => setTab(k)} className={`h-10 px-4 rounded-full border text-sm ${tab === k ? 'bg-foreground text-background border-foreground' : 'border-border bg-card'}`}>
            {l} ({(rows ?? []).filter((c) => c.status === k).length})
          </button>
        ))}
      </div>
      {err ? <p className="text-destructive">{err}</p> : null}
      <div className="grid gap-3">
        {list.map((c) => (
          <Card key={c.id} className="flex flex-wrap items-center gap-4">
            <div className="size-12 rounded-2xl grid place-items-center text-white font-bold" style={{ background: String(c.color) }}>
              {String(c.name).charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold">{String(c.name)}</div>
              <div className="text-sm text-muted-foreground">{String(c.description ?? '')}</div>
              <div className="text-xs text-muted-foreground mt-1">
                طلبه: {String(c.requestedBy)} · {(c.memberIds as string[] | undefined)?.length ?? 0} أعضاء
              </div>
            </div>
            {tab === 'pending' ? (
              <div className="flex gap-2">
                <Btn small onClick={async () => (await reviewCommunity(c.id, true), reload())}>
                  <Check size={16} /> قبول
                </Btn>
                <Btn
                  small
                  tone="danger"
                  onClick={async () => {
                    const reason = window.prompt('سبب الرفض (يوصل لصاحب الطلب):') ?? '';
                    await reviewCommunity(c.id, false, reason);
                    void reload();
                  }}
                >
                  <X size={16} /> رفض
                </Btn>
              </div>
            ) : tab === 'approved' ? (
              <Btn small tone="danger" onClick={async () => (await save('communities', { ...c, status: 'rejected', rejectReason: 'أُوقف من الإدارة' }), reload())}>
                إيقاف
              </Btn>
            ) : null}
          </Card>
        ))}
        {rows && !list.length ? <p className="text-muted-foreground">ما فيه شي هنا.</p> : null}
      </div>
    </>
  );
}

function Reports() {
  const { rows, err, reload } = useRows('reports');
  const open = (rows ?? []).filter((r) => r.status === 'open');
  const done = (rows ?? []).filter((r) => r.status !== 'open');
  return (
    <>
      <H1>البلاغات</H1>
      {err ? <p className="text-destructive">{err}</p> : null}
      <div className="grid gap-3">
        {open.map((r) => (
          <Card key={r.id} className="flex flex-wrap items-center gap-4">
            <Flag size={20} className="text-destructive" />
            <div className="flex-1">
              <div className="font-semibold">{String(r.reason)}</div>
              <div className="text-xs text-muted-foreground">
                المبلِّغ: {String(r.reporterId)} · على: {String(r.userId ?? '—')} · المجتمع: {String(r.communityId ?? '—')} · الرسالة: {String(r.messageId ?? '—')}
              </div>
            </div>
            <Btn small onClick={async () => (await save('reports', { ...r, status: 'resolved' }), reload())}>
              <Check size={16} /> تمت المعالجة
            </Btn>
          </Card>
        ))}
        {rows && !open.length ? <p className="text-muted-foreground">ما فيه بلاغات مفتوحة 👌</p> : null}
        {done.length ? <p className="text-sm text-muted-foreground mt-4">{done.length} بلاغ تمت معالجته</p> : null}
      </div>
    </>
  );
}

const FLAG_INFO: Record<string, [string, string]> = {
  sponsored_places: ['الإبراز المدفوع', 'الأماكن المعلّمة «مُموَّل» تطلع في «مختارة لك» بشارة واضحة.'],
  affiliate_booking: ['عمولة الحجز', 'زر «احجز عبر…» يطلع في الفنادق والتجارب اللي لها رابط، ويفتح برّا التطبيق.'],
  premium: ['الاشتراك المدفوع', 'يفعّل شاشة الاشتراك والميزات الإضافية (لما تنبني).'],
};
function Flags() {
  const { rows, err, reload } = useRows('app_flags');
  return (
    <>
      <H1>مفاتيح الدخل</H1>
      <p className="text-sm text-muted-foreground mb-4">كلها مطفية عند الإطلاق (قرار المنتج). تشغيلها يطبق على كل المستخدمين مع المزامنة التالية.</p>
      {err ? <p className="text-destructive">{err}</p> : null}
      <div className="grid gap-3">
        {(rows ?? []).map((f) => {
          const [t, d] = FLAG_INFO[String(f.key)] ?? [String(f.key), ''];
          return (
            <Card key={f.id} className="flex items-center gap-4">
              <div className="flex-1">
                <div className="font-semibold">{t}</div>
                <div className="text-sm text-muted-foreground">{d}</div>
              </div>
              <button
                role="switch"
                aria-checked={!!f.enabled}
                aria-label={t}
                onClick={async () => (await save('app_flags', { ...f, enabled: !f.enabled }), reload())}
                className={`relative h-7 w-12 rounded-full transition ${f.enabled ? 'bg-primary' : 'bg-border'}`}
              >
                <span className={`absolute top-1 size-5 rounded-full bg-white shadow transition-all ${f.enabled ? 'left-1' : 'left-6'}`} />
              </button>
            </Card>
          );
        })}
      </div>
    </>
  );
}
