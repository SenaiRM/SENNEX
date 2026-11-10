import React from 'react';
import { Home, FileText, Settings, Pill, Bell, LogOut, User, Users, ChevronLeft, ChevronRight, Sun, Moon, Syringe, Stethoscope } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import logo from '../../assets/logo';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate, isCollapsed = false, onToggleCollapse }) => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const menuItems = [
    { icon: Home, label: 'Dashboard', route: 'dashboard' },
    { icon: User, label: 'Meu Perfil', route: 'profile' },
    { icon: Pill, label: 'Medicamentos', route: 'medications' },
    { icon: Syringe, label: 'Cartão de Vacina', route: 'vaccines' },
    { icon: Stethoscope, label: 'Consultas', route: 'consultations' },
    { icon: Settings, label: 'Preferências Médicas', route: 'preferences' },
    { icon: Bell, label: 'Notificações', route: 'notifications' },
    { icon: FileText, label: 'Minha Ficha', route: 'pdf' },
    ...(user?.profile === 'Administrador' ? [{ icon: Users, label: 'Usuários', route: 'users' }] : [])
  ];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-card border-r border-border min-h-screen flex flex-col transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} relative transition-all duration-300`}>
        <img
          src={logo}
          alt="SENNEX Logo"
          className={`${isCollapsed ? 'h-10' : 'h-20'} w-auto mx-auto transition-all duration-300`}
        />
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-8 bg-card border border-border rounded-full p-1 hover:bg-accent transition-all shadow-sm"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        )}
      </div>

      <nav className="flex-1 px-4">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentRoute === item.route;

          return (
            <button
              key={item.route}
              onClick={() => onNavigate(item.route)}
              className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-4' : 'space-x-3 px-4 py-3'} rounded-lg mb-1 transition-all ${
                isActive
                  ? 'bg-blue-50 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400'
                  : 'text-foreground/80 hover:bg-accent'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={isCollapsed ? 24 : 20} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border space-y-1">
        <button
          onClick={toggleTheme}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-4' : 'space-x-3 px-4 py-3'} rounded-lg text-foreground/80 hover:bg-accent transition-all`}
          title={isCollapsed ? (theme === 'dark' ? 'Modo Claro' : 'Modo Escuro') : undefined}
        >
          {theme === 'dark' ? (
            <Sun size={isCollapsed ? 24 : 20} className="flex-shrink-0" />
          ) : (
            <Moon size={isCollapsed ? 24 : 20} className="flex-shrink-0" />
          )}
          {!isCollapsed && (
            <span className="font-medium">{theme === 'dark' ? 'Modo Claro' : 'Modo Escuro'}</span>
          )}
        </button>
        <button
          onClick={logout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-4' : 'space-x-3 px-4 py-3'} rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/40 transition-all`}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut size={isCollapsed ? 24 : 20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );
};
