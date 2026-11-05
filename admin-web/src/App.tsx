import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
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
        <Route path="destinations" element={<Destinations />} />
        <Route path="destinations/:id" element={<DestinationEdit />} />
        <Route path="country-info" element={<CountryInfo />} />
        <Route path="places" element={<Places />} />
        <Route path="places/:id" element={<PlaceEdit />} />
        <Route path="communities" element={<Communities />} />
        <Route path="community-requests" element={<CommunityRequests />} />
        <Route path="community-reports" element={<CommunityReports />} />
        <Route path="users" element={<Users />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="flags" element={<FeatureFlags />} />
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
        <BrowserRouter basename={import.meta.env.BASE_URL}>
          <Router />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
