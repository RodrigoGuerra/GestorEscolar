import { create } from 'zustand';
import api from '../lib/api';

export interface IStudent {
  id: string;
  name: string;
  email: string;
  cpf: string;
  phone: string;
  birthDate: string;
  enrollmentNumber: string;
  enrollmentDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  guardianName?: string;
  guardianCpf?: string;
  guardianEmail?: string;
  guardianPhone?: string;
  schoolId: string;
  classes?: { id: string }[];
}

interface StudentState {
  students: IStudent[];
  loading: boolean;
  error: string | null;
  fetchStudents: () => Promise<void>;
  addStudent: (student: Omit<IStudent, 'id' | 'enrollmentDate' | 'classes'>) => Promise<void>;
  updateStudent: (id: string, student: Partial<IStudent>) => Promise<void>;
  deleteStudent: (id: string) => Promise<void>;
}

export const useStudentStore = create<StudentState>((set, get) => ({
  students: [],
  loading: false,
  error: null,

  fetchStudents: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/academic/students');
      set({ students: response.data, loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro.', loading: false });
    }
  },

  addStudent: async (student) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/academic/students', student);
      set({ students: [...get().students, response.data], loading: false });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro.', loading: false });
      throw error;
    }
  },

  updateStudent: async (id, student) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/academic/students/${id}`, student);
      set({
        students: get().students.map((s) => (s.id === id ? response.data : s)),
        loading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro.', loading: false });
      throw error;
    }
  },

  deleteStudent: async (id) => {
    set({ loading: true, error: null });
    try {
      await api.delete(`/academic/students/${id}`);
      set({
        students: get().students.filter((s) => s.id !== id),
        loading: false,
      });
    } catch (error) {
      set({ error: error instanceof Error ? error.message : 'Erro.', loading: false });
      throw error;
    }
  },
}));
