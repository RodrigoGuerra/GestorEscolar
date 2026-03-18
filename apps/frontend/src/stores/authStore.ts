import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type UserRole = 'ADMIN' | 'MANAGER' | 'GESTOR' | 'TEACHER' | 'STUDENT' | 'EMPLOYEE';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  tenants?: { id: string; name: string; schema: string }[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  role: UserRole | null;
  unidadeAtual: string | null;
  setAuth: (token: string, user: User) => void;
  login: (userData: User & { token?: string }) => void;
  setEscolaSelecionada: (escolaId: string | null) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      role: null,
      unidadeAtual: null,
      setAuth: (token, user) => set({
        token,
        user,
        role: user.role,
      }),
      login: (userData) => set({
        user: userData,
        role: userData.role,
        token: userData.token || null,
      }),
      setEscolaSelecionada: (escolaId) => set({ unidadeAtual: escolaId }),
      clearAuth: () => set({
        token: null,
        user: null,
        role: null,
        unidadeAtual: null,
      }),
    }),
    {
      name: 'auth-storage',
      // Exclude token from localStorage — it is re-obtained from the HttpOnly cookie
      // on page reload via the init effect in App.tsx. This prevents XSS from reading
      // the access token from localStorage.
      partialize: (state) => ({
        user: state.user
          ? {
              ...state.user,
              tenants: state.user.tenants?.map(({ id, name }) => ({ id, name })),
            }
          : null,
        role: state.role,
        unidadeAtual: state.unidadeAtual,
      }),
    }
  )
);
