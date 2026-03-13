import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

const TenantSelectionPage: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant);
  const navigate = useNavigate();

  const handleSelectTenant = (tenant: { id: string; name: string; schema: string }) => {
    setCurrentTenant(tenant);
    navigate('/');
  };

  if (!user) return null;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold text-gray-900 tracking-tight">
            Selecione uma Franquia
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Olá, {user.name}. Escolha qual unidade você deseja gerenciar agora.
          </p>
        </div>

        <div className="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2">
          {user.tenants.map((tenant) => (
            <button
              key={tenant.id}
              onClick={() => handleSelectTenant(tenant)}
              className="group relative flex flex-col items-center p-8 bg-gray-50 rounded-2xl border-2 border-transparent hover:border-primary hover:bg-white transition-all duration-300 shadow-sm hover:shadow-xl"
            >
              <div className="h-16 w-16 flex items-center justify-center rounded-2xl bg-white group-hover:bg-primary/10 mb-4 shadow-sm transition-colors">
                <svg className="h-8 w-8 text-gray-400 group-hover:text-primary transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <span className="text-lg font-bold text-gray-900 group-hover:text-primary transition-colors">
                {tenant.name}
              </span>
              <span className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
                Unidade Escolar
              </span>
              
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                 <div className="h-2 w-2 rounded-full bg-primary animate-ping"></div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-8 text-center">
          <button 
            onClick={() => navigate('/login')}
            className="text-sm font-medium text-gray-500 hover:text-primary transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </div>
    </div>
  );
};

export default TenantSelectionPage;
