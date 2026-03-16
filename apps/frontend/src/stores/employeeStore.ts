import { create } from 'zustand';
import api from '../lib/api';

export interface IEmployee {
  id: string;
  name: string;
  email: string;
  position: string;
  isActive: boolean;
  schoolId: string;
}

interface EmployeeState {
  employees: IEmployee[];
  loading: boolean;
  error: string | null;
  fetchEmployees: () => Promise<void>;
  addEmployee: (employee: Omit<IEmployee, 'id'>) => Promise<void>;
  updateEmployee: (id: string, employee: Partial<IEmployee>) => Promise<void>;
  deleteEmployee: (id: string) => Promise<void>;
}

export const useEmployeeStore = create<EmployeeState>((set, get) => ({
  employees: [],
  loading: false,
  error: null,

  fetchEmployees: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/hr/employees');
      set({ employees: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  addEmployee: async (employee) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/hr/employees', employee);
      set({ employees: [...get().employees, response.data], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  updateEmployee: async (id, employee) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/hr/employees/${id}`, employee);
      set({ 
        employees: get().employees.map(e => e.id === id ? response.data : e),
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  deleteEmployee: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/hr/employees/${id}`);
      set({ 
        employees: get().employees.filter(e => e.id !== id),
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },
}));
