import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

const LoginSuccess: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      // In a real app, we would decode the JWT to get user info or fetch profile
      // For now, we mock the user info based on requirements
      const mockUser = {
        id: '1',
        email: 'user@example.com',
        name: 'Usuário Teste',
        role: 'ADMIN',
        tenants: [
          { id: '1', name: 'Franquia Alpha', schema: 'franchise_alpha' },
          { id: '2', name: 'Franquia Beta', schema: 'franchise_beta' },
        ],
      };
      
      setAuth(token, mockUser);
      navigate('/select-tenant');
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
