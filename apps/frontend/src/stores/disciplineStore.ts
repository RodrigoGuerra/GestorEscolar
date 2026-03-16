import { create } from 'zustand';
import api from '../lib/api';

export interface IDisciplina {
  id: string;
  name: string;
  workload: number;
  syllabus?: string;
  matrixId?: string;
}

interface DisciplineState {
  disciplinas: IDisciplina[];
  loading: boolean;
  error: string | null;
  fetchDisciplinas: () => Promise<void>;
  addDisciplina: (disciplina: Omit<IDisciplina, 'id'>) => Promise<void>;
  updateDisciplina: (id: string, updates: Partial<IDisciplina>) => Promise<void>;
  deleteDisciplina: (id: string) => Promise<void>;
}

export const useDisciplineStore = create<DisciplineState>((set) => ({
  disciplinas: [],
  loading: false,
  error: null,

  fetchDisciplinas: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/academic/subjects');
      set({ disciplinas: response.data, loading: false });
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      set({ error: message, loading: false });
    }
  },

  addDisciplina: async (disciplina) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/academic/subjects', disciplina);
      set((state) => ({ 
        disciplinas: [...state.disciplinas, response.data],
        loading: false 
      }));
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  updateDisciplina: async (id, updates) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/academic/subjects/${id}`, updates);
      set((state) => ({
        disciplinas: state.disciplinas.map(d => d.id === id ? response.data : d),
        loading: false
      }));
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },

  deleteDisciplina: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/academic/subjects/${id}`);
      set((state) => ({
        disciplinas: state.disciplinas.filter(d => d.id !== id),
        loading: false
      }));
    } catch (err: any) {
      const message = err.response?.data?.message || err.message;
      set({ error: message, loading: false });
      throw new Error(message);
    }
  },
}));
