import { useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import CommandPalette from './CommandPalette';
import { canAccess, effectiveRole, ROLE_LABELS, type PageKey } from '../lib/roles';

const NAV_GROUPS: { label: string; items: { to: PageKey; label: string; end?: boolean }[] }[] = [
  { label: 'عام', items: [{ to: '/', label: 'نظرة عامة', end: true }] },
  {
    label: 'المحتوى',
    items: [
      { to: '/destinations', label: 'الوجهات' },
      { to: '/country-info', label: 'معلومات الدول' },
      { to: '/places', label: 'الأماكن' },
    ],
  },
  {
    label: 'المجتمع',
    items: [
      { to: '/communities', label: 'المجتمعات' },
      { to: '/community-requests', label: 'طلبات إنشاء مجتمعات' },
      { to: '/community-reports', label: 'بلاغات المجتمعات' },
      { to: '/users', label: 'المستخدمون' },
      { to: '/support', label: 'الدعم والملاحظات' },
    ],
  },
  { label: 'النمو', items: [{ to: '/notifications', label: 'الإشعارات' }, { to: '/events', label: 'الفعاليات' }] },
  {
    label: 'النظام',
    items: [
      { to: '/flags', label: 'مفاتيح الميزات' },
      { to: '/team', label: 'الفريق والصلاحيات' },
      { to: '/system-health', label: 'صحة النظام' },
      { to: '/audit', label: 'سجل العمليات' },
    ],
  },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const { theme, resolved, setTheme } = useTheme();
  const [mobileOpen, setMobileOpen] = useState(false);
  const location = useLocation();
  const role = effectiveRole(profile?.adminRole ?? null);

  const visibleGroups = NAV_GROUPS.map((g) => ({
    ...g,
    items: g.items.filter((item) => canAccess(role, item.to)),
  })).filter((g) => g.items.length > 0);

  const allVisibleItems = visibleGroups.flatMap((g) => g.items);
  const currentLabel = allVisibleItems.find((item) => (item.end ? location.pathname === item.to : location.pathname.startsWith(item.to)))?.label;

  const sidebarContent = (
    <>
      <div className="mb-4 flex items-center justify-between px-2">
        <div>
          <div className="text-lg font-bold text-primary-ink">يلا نسافر</div>
          <div className="text-xs text-muted-foreground">لوحة الإدارة</div>
        </div>
        <button
          onClick={() => setMobileOpen(false)}
          aria-label="إغلاق القائمة"
          className="rounded-md p-2 text-muted-foreground hover:bg-muted md:hidden"
        >
          <CloseIcon />
        </button>
      </div>

      <div className="px-2">
        <CommandPalette items={allVisibleItems} />
      </div>

      {visibleGroups.map((group) => (
        <div key={group.label} className="mb-1">
          <div className="px-3 pb-1 pt-2 text-[11px] font-bold text-muted-foreground">{group.label}</div>
          {group.items.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `block rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                  isActive ? 'bg-secondary text-primary-ink' : 'text-foreground hover:bg-muted'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      ))}

      <div className="mt-auto flex flex-col gap-2 pt-4">
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
          className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
        >
          المظهر: {theme === 'system' ? `تلقائي (${resolved === 'dark' ? 'داكن' : 'فاتح'})` : theme === 'dark' ? 'داكن' : 'فاتح'}
        </button>
        <Link
          to="/account"
          onClick={() => setMobileOpen(false)}
          className="flex items-center justify-between rounded-md px-2 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted hover:text-foreground"
        >
          <span>{profile?.name} · إعدادات الحساب</span>
          <span className="rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold text-primary-ink">{ROLE_LABELS[role]}</span>
        </Link>
        <button
          onClick={() => signOut()}
          className="rounded-md px-3 py-2 text-right text-sm font-semibold text-destructive hover:bg-muted"
        >
          تسجيل الخروج
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      {/* شريط علوي بالجوال فقط */}
      <div className="fixed inset-x-0 top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-card px-4 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          aria-label="فتح القائمة"
          className="rounded-md p-2 text-foreground hover:bg-muted"
        >
          <MenuIcon />
        </button>
        <div className="text-sm font-bold text-foreground">{currentLabel ?? 'يلا نسافر'}</div>
        <div className="w-9" />
      </div>

      {/* الخلفية المعتمة عند فتح القائمة بالجوال */}
      {mobileOpen ? (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/40 md:hidden"
          aria-hidden="true"
        />
      ) : null}

      <aside
        className={`fixed inset-y-0 right-0 z-50 flex w-72 shrink-0 flex-col gap-1 overflow-y-auto border-l border-border bg-card p-4 transition-transform duration-200 md:static md:z-auto md:w-60 md:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {sidebarContent}
      </aside>

      <main className="min-w-0 flex-1 overflow-y-auto p-4 pt-20 md:p-6 md:pt-6">
        <Outlet />
      </main>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="4" y1="7" x2="20" y2="7" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="17" x2="20" y2="17" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="5" y1="5" x2="19" y2="19" />
      <line x1="19" y1="5" x2="5" y2="19" />
    </svg>
  );
}
