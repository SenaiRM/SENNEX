import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Login } from './components/auth/Login';
import { Register } from './components/auth/Register';
import { ForgotPassword } from './components/auth/ForgotPassword';
import { ResetPassword } from './components/auth/ResetPassword';
import { Dashboard } from './components/dashboard/Dashboard';
import { UserProfile } from './components/profile/UserProfile';
import { Medications } from './components/medications/Medications';
import { Preferences } from './components/preferences/Preferences';
import { Notifications } from './components/notifications/Notifications';
import { PDFGenerator } from './components/pdf/PDFGenerator';
import { Sidebar } from './components/layout/Sidebar';
import { Toaster } from 'sonner';
import { Menu, X } from 'lucide-react';

function AppContent() {
  const { isAuthenticated } = useAuth();
  const [currentRoute, setCurrentRoute] = useState<string>('login');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

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
      <>
        {currentRoute === 'login' && <Login onNavigate={handleNavigation} />}
        {currentRoute === 'register' && <Register onNavigate={handleNavigation} />}
        {currentRoute === 'forgot-password' && (
          <ForgotPassword onNavigate={handleNavigation} />
        )}
        {currentRoute === 'reset-password' && (
          <ResetPassword onNavigate={handleNavigation} />
        )}
      </>
    );
  }

  return (
    <div className="flex h-screen bg-gray-50">
      <div className="hidden lg:block">
        <Sidebar
          currentRoute={currentRoute}
          onNavigate={handleNavigation}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      </div>

      <div className="lg:hidden fixed top-0 left-0 right-0 bg-white border-b border-gray-200 z-40">
        <div className="flex items-center justify-between p-4">
          <img
            src="/src/imports/Gemini_Generated_Image_91hvjp91hvjp91hv-removebg-preview.png"
            alt="SENNEX Logo"
            className="h-12 w-auto"
          />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 rounded-lg hover:bg-gray-100"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-30">
          <div className="bg-white w-64 h-full">
            <div className="pt-16">
              <Sidebar currentRoute={currentRoute} onNavigate={handleNavigation} />
            </div>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto pt-16 lg:pt-0">
        {currentRoute === 'dashboard' && <Dashboard />}
        {currentRoute === 'profile' && <UserProfile />}
        {currentRoute === 'medications' && <Medications />}
        {currentRoute === 'preferences' && <Preferences />}
        {currentRoute === 'notifications' && <Notifications />}
        {currentRoute === 'pdf' && <PDFGenerator />}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-right" richColors />
    </AuthProvider>
  );
}