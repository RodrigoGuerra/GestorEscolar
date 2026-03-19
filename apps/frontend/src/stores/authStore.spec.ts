import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

describe('authStore', () => {
  beforeEach(() => {
    useAuthStore.getState().clearAuth();
  });

  it('should initialize with null state', () => {
    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
    expect(state.role).toBeNull();
    expect(state.unidadeAtual).toBeNull();
  });

  it('should set auth data correctly', () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'ADMIN' as const };
    const mockToken = 'mock-token';

    useAuthStore.getState().setAuth(mockToken, mockUser);

    const state = useAuthStore.getState();
    expect(state.token).toBe(mockToken);
    expect(state.user).toEqual(mockUser);
    expect(state.role).toBe('ADMIN');
  });

  it('should clear auth data correctly', () => {
    const mockUser = { id: '1', email: 'test@test.com', name: 'Test', role: 'ADMIN' as const };
    useAuthStore.getState().setAuth('token', mockUser);
    useAuthStore.getState().clearAuth();

    const state = useAuthStore.getState();
    expect(state.token).toBeNull();
    expect(state.user).toBeNull();
  });

  it('should set escola selecionada', () => {
    useAuthStore.getState().setEscolaSelecionada('school-1');
    expect(useAuthStore.getState().unidadeAtual).toBe('school-1');
  });
});
