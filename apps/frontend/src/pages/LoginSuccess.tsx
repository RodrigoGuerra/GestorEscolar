import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LoginSuccess: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // F3: the backend now sets an HttpOnly cookie on redirect (no ?token= in URL).
    // Exchange the cookie for an access token + user profile via a credentialed fetch.
    fetch(`${API_URL}/auth/token`, { credentials: 'include' })
      .then((res) => {
        if (!res.ok) throw new Error('Authentication failed');
        return res.json();
      })
      .then(({ accessToken, user }) => {
        setAuth(accessToken, {
          id: user.userId,
          email: user.email,
          name: user.name || user.email,
          role: user.role,
          tenants: user.tenants,
        });

        if (user.tenants?.length > 0) {
          const t = user.tenants[0];
          useTenantStore.getState().setCurrentTenant({
            id: t.schoolId,
            name: t.schoolName || t.schoolId,
            schema: t.schema,
          });
          useAuthStore.getState().setEscolaSelecionada(t.schoolId);
        }

        navigate('/');
      })
      .catch(() => {
        navigate('/login');
      });
  }, [navigate, setAuth]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
    </div>
  );
};

export default LoginSuccess;
