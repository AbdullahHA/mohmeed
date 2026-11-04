import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  { to: '/', label: 'نظرة عامة', end: true },
  { to: '/destinations', label: 'الوجهات' },
  { to: '/country-info', label: 'معلومات الدول' },
  { to: '/places', label: 'الأماكن' },
  { to: '/communities', label: 'المجتمعات' },
  { to: '/community-requests', label: 'طلبات إنشاء مجتمعات' },
  { to: '/community-reports', label: 'بلاغات المجتمعات' },
  { to: '/users', label: 'المستخدمون' },
  { to: '/notifications', label: 'الإشعارات' },
  { to: '/flags', label: 'مفاتيح الميزات' },
];

export default function Layout() {
  const { profile, signOut } = useAuth();
  const { theme, resolved, setTheme } = useTheme();

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <aside className="w-60 shrink-0 border-l border-border bg-card p-4 flex flex-col gap-1">
        <div className="mb-6 px-2">
          <div className="text-lg font-bold text-primary-ink">يلا نسافر</div>
          <div className="text-xs text-muted-foreground">لوحة الإدارة</div>
        </div>
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `rounded-md px-3 py-2 text-sm font-semibold transition-colors ${
                isActive ? 'bg-secondary text-primary-ink' : 'text-foreground hover:bg-muted'
              }`
            }
          >
            {item.label}
          </NavLink>
        ))}
        <div className="mt-auto flex flex-col gap-2 pt-4">
          <button
            onClick={() => setTheme(theme === 'dark' ? 'light' : theme === 'light' ? 'system' : 'dark')}
            className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-muted-foreground hover:bg-muted"
          >
            المظهر: {theme === 'system' ? `تلقائي (${resolved === 'dark' ? 'داكن' : 'فاتح'})` : theme === 'dark' ? 'داكن' : 'فاتح'}
          </button>
          <div className="px-2 text-xs text-muted-foreground">{profile?.name}</div>
          <button
            onClick={() => signOut()}
            className="rounded-md px-3 py-2 text-right text-sm font-semibold text-destructive hover:bg-muted"
          >
            تسجيل الخروج
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto p-6">
        <Outlet />
      </main>
    </div>
  );
}
