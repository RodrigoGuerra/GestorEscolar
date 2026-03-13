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
    }
  )
);
