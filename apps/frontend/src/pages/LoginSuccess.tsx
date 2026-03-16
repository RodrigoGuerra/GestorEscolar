import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

const LoginSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // In a real app, we would decode the JWT to get user info or fetch profile
      // For now, we mock the user info based on requirements
      const mockUser: any = {
        id: '1',
        email: 'user@example.com',
        name: 'Usuário Teste',
        role: 'GESTOR',
        tenants: [
          { id: '1', name: 'Franquia Alpha', schema: 'franchise_alpha' },
          { id: '2', name: 'Franquia Beta', schema: 'franchise_beta' },
        ],
      };
      
      setAuth(token, mockUser);
      
      // Auto-seleciona o primeiro tenant (Matriz)
      if (mockUser.tenants && mockUser.tenants.length > 0) {
        useTenantStore.getState().setCurrentTenant(mockUser.tenants[0]);
        useAuthStore.getState().setEscolaSelecionada(mockUser.tenants[0].id);
      }
      
      navigate('/');
    } else {
      navigate('/login');
    }
  }, [searchParams, navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default LoginSuccess;
