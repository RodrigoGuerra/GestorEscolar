import { create } from 'zustand';
import api from '../lib/api';

export interface ISchool {
  id: string;
  name: string;
  cnpj: string;
  isMatrix: boolean;
  parent_school_id?: string;
}

interface SchoolState {
  schools: ISchool[];
  loading: boolean;
  error: string | null;
  fetchSchools: () => Promise<void>;
  addSchool: (school: Omit<ISchool, 'id'>) => Promise<void>;
  updateSchool: (id: string, school: Partial<ISchool>) => Promise<void>;
  deleteSchool: (id: string) => Promise<void>;
  fetchMetrics: (schoolId: string) => Promise<void>;
  metrics: { activeStudents: number; classesCount: number; eventsCount: number };
  getMetrics: () => { activeStudents: number; classesCount: number; eventsCount: number };
}

export const useSchoolStore = create<SchoolState>((set, get) => ({
  schools: [],
  metrics: { activeStudents: 0, classesCount: 0, eventsCount: 0 },
  loading: false,
  error: null,

  fetchSchools: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/academic/schools');
      set({ schools: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  addSchool: async (school) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/academic/schools', school);
      set({ schools: [...get().schools, response.data], loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  updateSchool: async (id, school) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/academic/schools/${id}`, school);
      set({ 
        schools: get().schools.map(s => s.id === id ? response.data : s),
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  deleteSchool: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/academic/schools/${id}`);
      set({ 
        schools: get().schools.filter(s => s.id !== id),
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
      throw err;
    }
  },

  fetchMetrics: async (schoolId) => {
    set({ loading: true, error: null });
    try {
      const response = await api.get(`/academic/schools/${schoolId}/metrics`);
      set({ metrics: response.data, loading: false });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  getMetrics: () => get().metrics,
}));
