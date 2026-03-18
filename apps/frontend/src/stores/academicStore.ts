import { create } from 'zustand';
import api from '../lib/api';

export interface IGrade {
  id: string;
  score: number;
  term: string;
  subject: {
    name: string;
  };
}

export interface IClassSchedule {
  id: string;
  subject: string;
  topic: string;
  date: string;
}

export interface IClass {
  id: string;
  code: string;
  name: string;
  schoolId: string;
  capacity: number;
  academicYear: number;
  shift: 'MORNING' | 'AFTERNOON' | 'EVENING';
  status: 'ACTIVE' | 'INACTIVE';
}

interface AcademicState {
  grades: IGrade[];
  schedules: IClassSchedule[];
  classes: IClass[];
  loading: boolean;
  error: string | null;
  fetchStudentData: (studentId: string) => Promise<void>;
  fetchClasses: () => Promise<void>;
  getOverviewMetrics: () => { averageGrade: number; frequency: string; classesToday: number };
}

export const useAcademicStore = create<AcademicState>((set, get) => ({
  grades: [],
  schedules: [],
  classes: [],
  loading: false,
  error: null,

  fetchStudentData: async (_studentId: string) => {
    set({ loading: true, error: null });
    try {
      const [gradesRes] = await Promise.all([
        api.get('/academic/grades'),
      ]);
      
      set({ 
        grades: gradesRes.data,
        loading: false 
      });
    } catch (err: any) {
      set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  fetchClasses: async () => {
    set({ loading: true, error: null });
    try {
       const res = await api.get('/academic/classes');
       set({ classes: res.data, loading: false });
    } catch (err: any) {
       set({ error: err.response?.data?.message || err.message, loading: false });
    }
  },

  getOverviewMetrics: () => {
    const { grades } = get();
    const averageGrade = grades.length > 0 
      ? grades.reduce((acc, g) => acc + Number(g.score), 0) / grades.length
      : 0;

    return {
      averageGrade: Number(averageGrade.toFixed(1)),
      frequency: '96%', // Mock until frequency system is implemented
      classesToday: 4, // Mock until schedule system is fully implemented
    };
  },
}));
