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
  User,
  X,
  ShieldCheck
} from 'lucide-react';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import Button from '../ui/Button';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface NavigationItem {
  name: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
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

  const navSections: { label: string; items: NavigationItem[] }[] = [
    {
      label: 'Principal',
      items: [
        { name: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
      ]
    },
    {
      label: 'Gestão Acadêmica',
      items: [
        { name: 'Acadêmico', icon: School, href: '/academic', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Disciplinas', icon: BookOpen, href: '/subjects', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
      ]
    },
    {
      label: 'Administrativo',
      items: [
        { name: 'Colaboradores', icon: Users, href: '/employees', roles: ['ADMIN', 'MANAGER'] },
        { name: 'Financeiro', icon: CreditCard, href: '/finance', roles: ['ADMIN', 'MANAGER'] },
      ]
    },
    {
      label: 'Comunicação',
      items: [
        { name: 'Notificações', icon: Bell, href: '/notifications', roles: ['ADMIN', 'MANAGER', 'TEACHER'] },
      ]
    }
  ];

  const renderNavItems = (items: NavigationItem[]) => {
    return items
      .filter(item => user && item.roles.includes(user.role))
      .map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          onClick={() => setIsSidebarOpen(false)}
          className={({ isActive }) => cn(
            "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative overflow-hidden",
            isActive 
              ? "bg-primary/10 text-primary shadow-sm shadow-primary/5" 
              : "text-text-secondary hover:text-white hover:bg-white/5"
          )}
        >
          {({ isActive }) => (
            <>
              <item.icon className={cn("h-5 w-5 transition-transform duration-300 group-hover:scale-110", isActive && "text-primary")} />
              <span className="font-semibold text-sm">{item.name}</span>
              {isActive && (
                <div className="absolute right-0 top-1/2 -translate-y-1/2 h-6 w-1 bg-primary rounded-l-full shadow-glow" />
              )}
            </>
          )}
        </NavLink>
      ));
  };

  return (
    <div className="min-h-screen bg-secondary flex overflow-hidden font-sans">
      {/* Sidebar Overlay */}
      <div 
        className={cn(
          "fixed inset-0 bg-black/60 backdrop-blur-sm z-40 transition-opacity duration-300 lg:hidden",
          isSidebarOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        )}
        onClick={() => setIsSidebarOpen(false)}
      />

      {/* Sidebar */}
      <aside className={cn(
        "fixed inset-y-0 left-0 z-50 w-72 bg-surface border-r border-border transition-all duration-500 ease-in-out lg:relative lg:translate-x-0 flex flex-col",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary shadow-glow">
                <School className="text-white" size={24} />
              </div>
              <span className="font-bold text-xl tracking-tight text-white italic">
                Gestor<span className="text-primary not-italic">Escolar</span>
              </span>
            </div>
            <button 
              className="lg:hidden text-text-secondary hover:text-white transition-colors"
              onClick={() => setIsSidebarOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={24} />
            </button>
          </div>

          <nav className="flex-1 space-y-8 overflow-y-auto pr-2 -mr-2 custom-scrollbar">
            {navSections.map((section) => {
              const items = renderNavItems(section.items);
              if (items.length === 0) return null;
              
              return (
                <div key={section.label} className="space-y-2">
                  <h3 className="px-4 text-[11px] font-black uppercase tracking-[0.2em] text-text-muted">
                    {section.label}
                  </h3>
                  <div className="space-y-1">
                    {items}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className="pt-6 border-t border-border mt-auto">
            <div className="bg-white/5 rounded-2xl p-4 mb-4 flex items-center gap-3 border border-white/5">
               <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                 <ShieldCheck size={20} />
               </div>
               <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{user?.name}</p>
                  <p className="text-[10px] text-text-muted truncate">{user?.email}</p>
               </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-text-secondary hover:text-error hover:bg-error/10 h-12"
              onClick={handleLogout}
              leftIcon={<LogOut size={20} />}
            >
              Sair da Conta
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 relative">
        <header className="h-20 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <button 
              className="lg:hidden p-2.5 text-text-secondary hover:bg-white/5 rounded-xl transition-all active:scale-95"
              onClick={() => setIsSidebarOpen(true)}
              aria-label="Abrir menu"
            >
              <Menu className="h-6 w-6" />
            </button>

            <div className="flex flex-col">
              <h1 className="text-lg font-bold text-white leading-tight">
                {currentTenant?.name || 'Selecione uma Unidade'}
              </h1>
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.15em]">
                  {user?.role === 'ADMIN' ? 'Painel Administrativo' : 'Gestão de Unidade'}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-6">
            <button 
              className="p-2.5 text-text-secondary hover:text-primary transition-all duration-300 relative group"
              aria-label="Notificações"
            >
               <Bell className="h-6 w-6 group-hover:rotate-12" />
               <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-error rounded-full border-2 border-surface animate-bounce"></span>
            </button>
            
            <div className="h-8 w-px bg-border hidden sm:block"></div>
            
            <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-glow transition-all hover:scale-105 hover:bg-primary/20 cursor-pointer active:scale-95 group">
              <User className="h-6 w-6 transition-transform group-hover:scale-110" />
            </div>
          </div>
        </header>

        <section className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar animate-in fade-in slide-in-from-bottom-2 duration-700">
          <Outlet />
        </section>
      </main>
    </div>
  );
};

export default DashboardLayout;
