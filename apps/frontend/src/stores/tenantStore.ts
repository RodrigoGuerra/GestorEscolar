import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Tenant {
  id: string;
  name: string;
  schema: string;
}

interface TenantState {
  currentTenant: Tenant | null;
  setCurrentTenant: (tenant: Tenant | null) => void;
}

export const useTenantStore = create<TenantState>()(
  persist(
    (set) => ({
      currentTenant: null,
      setCurrentTenant: (tenant) => set({ currentTenant: tenant }),
    }),
    {
      name: 'tenant-storage',
      // Exclude schema from localStorage — it is an internal PostgreSQL schema name
      // that should not be exposed to browser storage. schema is derived in-session
      // from authStore.user.tenants and restored on page reload via the init effect.
      partialize: (state) => ({
        currentTenant: state.currentTenant
          ? { id: state.currentTenant.id, name: state.currentTenant.name }
          : null,
      }),
    }
  )
);
