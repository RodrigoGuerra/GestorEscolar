import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { Bell, User as UserIcon, LogOut } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Header: React.FC = () => {
  const navigate = useNavigate();
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const currentTenant = useTenantStore((state) => state.currentTenant);

  const handleLogout = async () => {
    try {
      // F24: revoke refresh token in Redis and clear cookies server-side
      await fetch(`${API_URL}/auth/logout`, { method: 'POST', credentials: 'include' });
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  return (
    <header className="h-20 bg-surface/80 backdrop-blur-md border-b border-border flex items-center justify-between px-6 lg:px-10 sticky top-0 z-30">
      <div className="flex flex-col">
        <h1 className="text-lg font-bold text-white leading-tight">
          {currentTenant?.name || 'Selecione uma Unidade'}
        </h1>
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <p className="text-[10px] text-text-muted font-black uppercase tracking-[0.15em]">
            {user?.role === 'GESTOR' ? 'Painel Administrativo' : 'Visão Unidade'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-6">
        <button className="p-2.5 text-text-secondary hover:text-primary transition-all relative">
          <Bell className="h-6 w-6" />
          <span className="absolute top-2.5 right-2.5 h-2.5 w-2.5 bg-error rounded-full border-2 border-surface"></span>
        </button>
        <div className="h-8 w-px bg-border hidden sm:block"></div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-xs font-bold text-white">{user?.name}</p>
            <p className="text-[10px] text-text-muted">{user?.role}</p>
          </div>
          <div className="h-11 w-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20 shadow-glow">
            <UserIcon size={24} />
          </div>
          {/* F24: logout button — revokes refresh token and clears cookies */}
          <button
            onClick={handleLogout}
            className="p-2.5 text-text-secondary hover:text-error transition-all"
            title="Sair"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;
