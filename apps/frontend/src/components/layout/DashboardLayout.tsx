import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  School, 
  CreditCard, 
  Bell, 
  LogOut, 
  Menu,
  User
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const DashboardLayout: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const currentTenant = useTenantStore((state) => state.currentTenant);
  const navigate = useNavigate();

  const handleLogout = () => {
    clearAuth();
    navigate('/login');
  };

  const navItems = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
    { name: 'Acadêmico', icon: School, href: '/academic', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Disciplinas', icon: BookOpen, href: '/subjects', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
    { name: 'Colaboradores', icon: Users, href: '/employees', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Financeiro', icon: CreditCard, href: '/finance', roles: ['ADMIN', 'MANAGER'] },
    { name: 'Notificações', icon: Bell, href: '/notifications', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
  ];

  const filteredNavItems = navItems.filter(item => user && item.roles.includes(user.role));

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-20 lg:hidden" 
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-30 w-64 bg-secondary text-white transition-transform duration-300 transform lg:relative lg:translate-x-0 shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center gap-3 mb-10 px-2">
            <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
              <svg className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              </svg>
            </div>
            <span className="font-bold text-xl tracking-tight">GestorEscolar</span>
          </div>

          <nav className="flex-1 space-y-2">
            {filteredNavItems.map((item) => (
              <NavLink
                key={item.href}
                to={item.href}
                className={({ isActive }) => cn(
                  "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group",
                  isActive 
                    ? "bg-primary text-white shadow-lg shadow-primary/25" 
                    : "text-gray-400 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="font-medium">{item.name}</span>
              </NavLink>
            ))}
          </nav>

          <button
            onClick={handleLogout}
            className="mt-auto flex items-center gap-3 px-4 py-3 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-400/10 transition-all duration-200"
          >
            <LogOut className="h-5 w-5" />
            <span className="font-medium">Sair</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-20 bg-white border-b border-gray-100 flex items-center justify-between px-6 lg:px-10 sticky top-0 z-10 shadow-sm">
          <button 
            className="lg:hidden p-2 text-gray-500 hover:bg-gray-100 rounded-lg transition-colors"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="h-6 w-6" />
          </button>

          <div className="hidden lg:flex flex-col">
            <h1 className="text-xl font-bold text-gray-900">
              {currentTenant?.name || 'Selecione uma Franquia'}
            </h1>
            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">
              {user?.role === 'ADMIN' ? 'Administrador do Sistema' : 'Gestor de Unidade'}
            </p>
          </div>

          <div className="flex items-center gap-4">
            <button className="p-2 text-gray-400 hover:text-primary transition-colors relative">
               <Bell className="h-6 w-6" />
               <span className="absolute top-2 right-2 h-2 w-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-10 w-px bg-gray-100 mx-2"></div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-bold text-gray-900 leading-tight">{user?.name}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
                <User className="h-6 w-6" />
              </div>
            </div>
          </div>
        </header>

        <section className="flex-1 p-6 lg:p-10">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
