import React, { useState, useEffect, lazy, Suspense } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { Login } from './components/auth/Login';
import { Sidebar } from './components/layout/Sidebar';
import { Toaster } from 'sonner';
import { Menu, X } from 'lucide-react';
import logo from './assets/logo';
import { useMedicationReminders } from './hooks/useMedicationReminders';

// Telas carregadas sob demanda: cada uma vira um arquivo separado no build
// e só é baixada na primeira vez que o usuário a abre.
const Register = lazy(() => import('./components/auth/Register').then((m) => ({ default: m.Register })));
const ForgotPassword = lazy(() => import('./components/auth/ForgotPassword').then((m) => ({ default: m.ForgotPassword })));
const ResetPassword = lazy(() => import('./components/auth/ResetPassword').then((m) => ({ default: m.ResetPassword })));
const Dashboard = lazy(() => import('./components/dashboard/Dashboard').then((m) => ({ default: m.Dashboard })));
const UserProfile = lazy(() => import('./components/profile/UserProfile').then((m) => ({ default: m.UserProfile })));
const Medications = lazy(() => import('./components/medications/Medications').then((m) => ({ default: m.Medications })));
const Vaccines = lazy(() => import('./components/vaccines/Vaccines').then((m) => ({ default: m.Vaccines })));
const Consultations = lazy(() => import('./components/consultations/Consultations').then((m) => ({ default: m.Consultations })));
const Preferences = lazy(() => import('./components/preferences/Preferences').then((m) => ({ default: m.Preferences })));
const Notifications = lazy(() => import('./components/notifications/Notifications').then((m) => ({ default: m.Notifications })));
const PDFGenerator = lazy(() => import('./components/pdf/PDFGenerator').then((m) => ({ default: m.PDFGenerator })));
const Users = lazy(() => import('./components/users/Users').then((m) => ({ default: m.Users })));

const ScreenLoader = () => (
  <div className="flex h-full min-h-[200px] items-center justify-center">
    <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
  </div>
);

function AppContent() {
  const { isAuthenticated, user } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  useMedicationReminders(user?.id);

  useEffect(() => {
    if (isAuthenticated && (currentRoute === 'login' || currentRoute === 'register' || currentRoute === 'forgot-password' || currentRoute === 'reset-password')) {
      setCurrentRoute('dashboard');
    } else if (!isAuthenticated) {
      setCurrentRoute('login');
    }
  }, [isAuthenticated]);

  const handleNavigation = (route: string) => {
    setCurrentRoute(route);
    setMobileMenuOpen(false);
  };

  if (!isAuthenticated) {
    return (
      <Suspense fallback={<ScreenLoader />}>
        {currentRoute === 'login' && <Login onNavigate={handleNavigation} />}
        {currentRoute === 'register' && <Register onNavigate={handleNavigation} />}
        {currentRoute === 'forgot-password' && (
          <ForgotPassword onNavigate={handleNavigation} />
        )}
        {currentRoute === 'reset-password' && (
          <ResetPassword onNavigate={handleNavigation} />
        )}
      </Suspense>
    );
  }

  return (
    <div className="flex h-screen bg-background">
      <div className="hidden lg:block">
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={handleNavigation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 bg-card border-b border-border z-40">
        <div className="flex items-center justify-between p-4">
          <img
            src={logo}
            alt="SENNEX Logo"
            className="h-12 w-auto"
          />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-accent"
            aria-label={mobileMenuOpen ? 'Fechar menu' : 'Abrir menu'}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black/50 z-30" onClick={() => setMobileMenuOpen(false)}>
          <div className="bg-card w-64 max-w-[80vw] h-full overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="pt-16">
              <Sidebar currentRoute={currentRoute} onNavigate={handleNavigation} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        <Suspense fallback={<ScreenLoader />}>
          {currentRoute === 'dashboard' && <Dashboard />}
          {currentRoute === 'profile' && <UserProfile />}
          {currentRoute === 'medications' && <Medications />}
          {currentRoute === 'vaccines' && <Vaccines />}
          {currentRoute === 'consultations' && <Consultations />}
          {currentRoute === 'preferences' && <Preferences />}
          {currentRoute === 'notifications' && <Notifications />}
          {currentRoute === 'pdf' && <PDFGenerator />}
          {currentRoute === 'users' && user?.profile === 'Administrador' && <Users />}
        </Suspense>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <AppContent />
        <Toaster position="top-right" richColors />
      </AuthProvider>
    </ThemeProvider>
  );
}