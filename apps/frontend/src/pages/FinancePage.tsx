import { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import { CreditCard, TrendingUp, TrendingDown, Search, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

interface TransactionData {
  id: string;
  amount: number;
  type: 'INCOME' | 'EXPENSE';
  description: string;
  createdAt: string;
}

export default function FinancePage() {
  const [transactions, setTransactions] = useState<TransactionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore(state => state.token);
  const tenant = useTenantStore(state => state.currentTenant);

  const fetchTransactions = () => {
    if (!token || !tenant) return;
    setLoading(true);
    setError(null);
    api.get('/finance/transactions')
      .then(res => setTransactions(res.data))
      .catch(err => {
        setError('Erro ao carregar transações financeiras.');
        console.error('Failed to fetch transactions', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token && tenant) {
      fetchTransactions();
    }
  }, [token, tenant]);

  const balance = transactions.reduce((acc, curr) => {
    return curr.type === 'INCOME' ? acc + Number(curr.amount) : acc - Number(curr.amount);
  }, 0);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div>
        <h2 className="text-3xl font-extrabold text-white tracking-tight">Financeiro</h2>
        <p className="text-text-secondary mt-1">Balanço e fluxo de caixa da unidade.</p>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium mb-6 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/10 border-primary/20 p-6">
           <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
                 <CreditCard size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary bg-primary/10 px-2 py-1 rounded">Balanço Geral</span>
           </div>
           <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Saldo Atual</p>
           <h3 className="text-3xl font-black text-white mt-1">R$ {balance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </Card>

        <Card className="bg-success/10 border-success/20 p-6">
           <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-success/20 flex items-center justify-center text-success">
                 <TrendingUp size={20} />
              </div>
           </div>
           <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Entradas</p>
           <h3 className="text-2xl font-black text-success mt-1">
             R$ {transactions.filter(t => t.type === 'INCOME').reduce((a, b) => a + Number(b.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </h3>
        </Card>

        <Card className="bg-error/10 border-error/20 p-6">
           <div className="flex items-center justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-error/20 flex items-center justify-center text-error">
                 <TrendingDown size={20} />
              </div>
           </div>
           <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Saídas</p>
           <h3 className="text-2xl font-black text-error mt-1">
             R$ {transactions.filter(t => t.type === 'EXPENSE').reduce((a, b) => a + Number(b.amount), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
           </h3>
        </Card>
      </div>

      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between gap-4">
          <h4 className="font-bold text-white uppercase tracking-widest text-sm">Últimas Transações</h4>
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar..." 
              className="w-full bg-secondary border border-border rounded-xl py-2 px-10 text-sm text-white focus:ring-1 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                   <td className="px-6 py-12 text-center text-text-muted">Carregando transações...</td>
                </tr>
              ) : transactions.length === 0 ? (
                <tr>
                   <td className="px-6 py-12 text-center text-text-muted text-sm">Sem movimentações financeiras.</td>
                </tr>
              ) : transactions.map((t) => (
                <tr key={t.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-4">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center ${t.type === 'INCOME' ? 'bg-success/10 text-success' : 'bg-error/10 text-error'}`}>
                        {t.type === 'INCOME' ? <ArrowUpRight size={20} /> : <ArrowDownRight size={20} />}
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{t.description}</p>
                        <p className="text-[10px] text-text-muted uppercase tracking-tighter mt-0.5">{new Date(t.createdAt).toLocaleDateString('pt-BR')}</p>
                      </div>
                    </div>
                  </td>
                  <td className={`px-6 py-4 text-right font-black ${t.type === 'INCOME' ? 'text-success' : 'text-error'}`}>
                    {t.type === 'INCOME' ? '+' : '-'} R$ {Number(t.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
