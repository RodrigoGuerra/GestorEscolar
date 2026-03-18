import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { decodeJwtPayload } from '../lib/api';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const LoginSuccess: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  useEffect(() => {
    // M2: use POST /auth/refresh instead of GET /auth/token to avoid reflecting
    // the HttpOnly cookie value into a readable response body.
    fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    })
      .then((res) => {
        if (!res.ok) throw new Error('Authentication failed');
        return res.json();
      })
      .then(({ accessToken }) => {
        const payload = decodeJwtPayload(accessToken);
        setAuth(accessToken, {
          id: payload.sub,
          email: payload.email,
          name: payload.name || payload.email,
          role: payload.role,
          tenants: payload.tenants,
        });

        if (payload.tenants?.length > 0) {
          const t = payload.tenants[0];
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
