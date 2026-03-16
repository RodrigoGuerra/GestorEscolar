import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'GESTOR' | 'FUNCIONARIO' | 'ALUNO';
  tenants?: { id: string; name: string; schema: string }[];
}

interface AuthState {
  token: string | null;
  user: User | null;
  role: 'GESTOR' | 'FUNCIONARIO' | 'ALUNO' | null;
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
        role: user.role 
      }),
      login: (userData) => set({ 
        user: userData, 
        role: userData.role,
        token: userData.token || null 
      }),
      setEscolaSelecionada: (escolaId) => set({ unidadeAtual: escolaId }),
      clearAuth: () => set({ 
        token: null, 
        user: null, 
        role: null, 
        unidadeAtual: null 
      }),
    }),
    {
      name: 'auth-storage',
    }
  )
);
