import React from 'react';
import { Home, FileText, Settings, Pill, Bell, LogOut, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface SidebarProps {
  currentRoute: string;
  onNavigate: (route: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentRoute, onNavigate, isCollapsed = false, onToggleCollapse }) => {
  const { logout } = useAuth();

  const menuItems = [
    { icon: Home, label: 'Dashboard', route: 'dashboard' },
    { icon: User, label: 'Meu Perfil', route: 'profile' },
    { icon: Pill, label: 'Medicamentos', route: 'medications' },
    { icon: Settings, label: 'Preferências Médicas', route: 'preferences' },
    { icon: Bell, label: 'Notificações', route: 'notifications' },
    { icon: FileText, label: 'Minha Ficha', route: 'pdf' }
  ];

  return (
    <div className={`${isCollapsed ? 'w-20' : 'w-64'} bg-white border-r border-gray-200 min-h-screen flex flex-col transition-all duration-300`}>
      <div className={`${isCollapsed ? 'p-3' : 'p-6'} relative transition-all duration-300`}>
        <img
          src="/src/imports/Gemini_Generated_Image_91hvjp91hvjp91hv-removebg-preview.png"
          alt="SENNEX Logo"
          className={`${isCollapsed ? 'h-10' : 'h-20'} w-auto mx-auto transition-all duration-300`}
        />
        {onToggleCollapse && (
          <button
            onClick={onToggleCollapse}
            className="absolute -right-3 top-8 bg-white border border-gray-200 rounded-full p-1 hover:bg-gray-50 transition-all shadow-sm"
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
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-700 hover:bg-gray-50'
              }`}
              title={isCollapsed ? item.label : undefined}
            >
              <Icon size={isCollapsed ? 24 : 20} className="flex-shrink-0" />
              {!isCollapsed && <span className="font-medium">{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-200">
        <button
          onClick={logout}
          className={`w-full flex items-center ${isCollapsed ? 'justify-center px-2 py-4' : 'space-x-3 px-4 py-3'} rounded-lg text-red-600 hover:bg-red-50 transition-all`}
          title={isCollapsed ? 'Sair' : undefined}
        >
          <LogOut size={isCollapsed ? 24 : 20} className="flex-shrink-0" />
          {!isCollapsed && <span className="font-medium">Sair</span>}
        </button>
      </div>
    </div>
  );
};
