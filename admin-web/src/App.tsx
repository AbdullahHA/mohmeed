import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Destinations from './pages/Destinations';
import CountryInfo from './pages/CountryInfo';
import DestinationEdit from './pages/DestinationEdit';
import Places from './pages/Places';
import PlaceEdit from './pages/PlaceEdit';
import Communities from './pages/Communities';
import CommunityRequests from './pages/CommunityRequests';
import CommunityReports from './pages/CommunityReports';
import Users from './pages/Users';
import Notifications from './pages/Notifications';
import FeatureFlags from './pages/FeatureFlags';
import Account from './pages/Account';
import Team from './pages/Team';
import Audit from './pages/Audit';
import SystemHealth from './pages/SystemHealth';
import RequireRole from './components/RequireRole';

function Gate({ children }: { children: React.ReactNode }) {
  const { session, profile, loading } = useAuth();

  if (loading) {
    return <div className="flex min-h-screen items-center justify-center text-sm text-muted-foreground">جاري التحميل...</div>;
  }
  if (!session) return <Navigate to="/login" replace />;
  if (!profile?.isAdmin) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-2 bg-background p-6 text-center">
        <p className="text-sm font-semibold text-foreground">هذا الحساب غير مصرّح له بدخول لوحة الإدارة</p>
        <p className="text-xs text-muted-foreground">سجّل بحساب إداري (is_admin = true)</p>
      </div>
    );
  }
  return <>{children}</>;
}

function LoginRoute() {
  const { session, loading } = useAuth();
  if (loading) return null;
  if (session) return <Navigate to="/" replace />;
  return <Login />;
}

function Router() {
  return (
    <Routes>
      <Route path="/login" element={<LoginRoute />} />
      <Route
        path="/"
        element={
          <Gate>
            <Layout />
          </Gate>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="destinations" element={<RequireRole page="/destinations"><Destinations /></RequireRole>} />
        <Route path="destinations/:id" element={<RequireRole page="/destinations"><DestinationEdit /></RequireRole>} />
        <Route path="country-info" element={<RequireRole page="/country-info"><CountryInfo /></RequireRole>} />
        <Route path="places" element={<RequireRole page="/places"><Places /></RequireRole>} />
        <Route path="places/:id" element={<RequireRole page="/places"><PlaceEdit /></RequireRole>} />
        <Route path="communities" element={<RequireRole page="/communities"><Communities /></RequireRole>} />
        <Route path="community-requests" element={<RequireRole page="/community-requests"><CommunityRequests /></RequireRole>} />
        <Route path="community-reports" element={<RequireRole page="/community-reports"><CommunityReports /></RequireRole>} />
        <Route path="users" element={<RequireRole page="/users"><Users /></RequireRole>} />
        <Route path="notifications" element={<RequireRole page="/notifications"><Notifications /></RequireRole>} />
        <Route path="flags" element={<RequireRole page="/flags"><FeatureFlags /></RequireRole>} />
        <Route path="team" element={<RequireRole page="/team"><Team /></RequireRole>} />
        <Route path="audit" element={<RequireRole page="/audit"><Audit /></RequireRole>} />
        <Route path="system-health" element={<RequireRole page="/system-health"><SystemHealth /></RequireRole>} />
        <Route path="account" element={<Account />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <BrowserRouter basename={import.meta.env.BASE_URL}>
            <Router />
          </BrowserRouter>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
