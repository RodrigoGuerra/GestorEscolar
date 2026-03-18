import { create } from 'zustand';
import api from '../lib/api';

export interface IInvoice {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  dueDate: string;
  paymentDate?: string;
  studentId: string;
}

export interface ITransaction {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  date: string;
  schoolId: string;
}

interface FinanceState {
  invoices: IInvoice[];
  transactions: ITransaction[];
  loading: boolean;
  error: string | null;
  fetchFinanceData: () => Promise<void>;
  addInvoice: (invoice: Omit<IInvoice, 'id'>) => Promise<void>;
  updateInvoiceStatus: (id: string, status: IInvoice['status']) => Promise<void>;
  addTransaction: (transaction: Omit<ITransaction, 'id'>) => Promise<void>;
  getSummary: () => {
    totalBalance: number;
    monthlyRevenue: number;
    monthlyExpenses: number;
    paymentRate: number;
  };
}

export const useFinanceStore = create<FinanceState>((set, get) => ({
  invoices: [],
  transactions: [],
  loading: false,
  error: null,

  fetchFinanceData: async () => {
    set({ loading: true, error: null });
    try {
      const [invoicesRes, transactionsRes] = await Promise.all([
        api.get('/finance/invoices'),
        api.get('/finance/transactions'),
      ]);
      set({ 
        invoices: invoicesRes.data, 
        transactions: transactionsRes.data, 
        loading: false 
      });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      set({ error: e.response?.data?.message || e.message || 'Erro.', loading: false });
    }
  },

  addInvoice: async (invoice) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/finance/invoices', invoice);
      set({ invoices: [...get().invoices, response.data], loading: false });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      set({ error: e.response?.data?.message || e.message || 'Erro.', loading: false });
      throw err;
    }
  },

  updateInvoiceStatus: async (id, status) => {
    set({ loading: true, error: null });
    try {
      const response = await api.patch(`/finance/invoices/${id}`, { status });
      set({ 
        invoices: get().invoices.map(i => i.id === id ? response.data : i),
        loading: false 
      });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      set({ error: e.response?.data?.message || e.message || 'Erro.', loading: false });
      throw err;
    }
  },

  addTransaction: async (transaction) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/finance/transactions', transaction);
      set({ transactions: [...get().transactions, response.data], loading: false });
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      set({ error: e.response?.data?.message || e.message || 'Erro.', loading: false });
      throw err;
    }
  },

  getSummary: () => {
    const { invoices, transactions } = get();
    
    const totalBalance = transactions.reduce((acc, t) => 
      t.type === 'INCOME' ? acc + Number(t.amount) : acc - Number(t.amount)
    , 0);

    const monthlyRevenue = invoices
      .filter(i => i.status === 'PAID')
      .reduce((acc, i) => acc + Number(i.amount), 0);

    const monthlyExpenses = transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((acc, t) => acc + Number(t.amount), 0);

    const paidInvoices = invoices.filter(i => i.status === 'PAID').length;
    const paymentRate = invoices.length > 0 ? (paidInvoices / invoices.length) * 100 : 0;

    return {
      totalBalance,
      monthlyRevenue,
      monthlyExpenses,
      paymentRate,
    };
  },
}));
