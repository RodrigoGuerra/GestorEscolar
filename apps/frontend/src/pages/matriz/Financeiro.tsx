import React, { useEffect, useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { DollarSign, TrendingUp, Loader2, Plus, Search, CheckCircle2, AlertCircle } from 'lucide-react';
import { useFinanceStore } from '../../stores/financeStore';
import { useSchoolStore } from '../../stores/schoolStore';

interface InvoiceFormData {
  studentId: string;
  amount: number;
  dueDate: string;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
}

const Financeiro: React.FC = () => {
  const { fetchFinanceData, addInvoice, updateInvoiceStatus, loading, error, getSummary, invoices, transactions } = useFinanceStore();
  const { schools, fetchSchools } = useSchoolStore();
  
  const [selectedSchoolId, setSelectedSchoolId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState<InvoiceFormData>({
    studentId: '',
    amount: 0,
    dueDate: new Date().toISOString().split('T')[0],
    status: 'PENDING',
  });

  const summary = getSummary();

  useEffect(() => {
    fetchFinanceData();
    fetchSchools();
  }, [fetchFinanceData, fetchSchools]);

  const filteredSchools = useMemo(() => {
    return schools.filter(s => 
      s.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schools, searchTerm]);

  const schoolBalance = useMemo(() => {
    const balances: Record<string, number> = {};
    transactions.forEach(t => {
      balances[t.schoolId] = (balances[t.schoolId] || 0) + (t.type === 'INCOME' ? Number(t.amount) : -Number(t.amount));
    });
    return balances;
  }, [transactions]);

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addInvoice(formData);
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error creating invoice:', err);
    }
  };

  const handleUpdateStatus = async (id: string, status: 'PAID' | 'PENDING' | 'OVERDUE') => {
    try {
      await updateInvoiceStatus(id, status);
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  if (loading && schools.length === 0) {
    return (
      <div className="h-96 flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={40} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Financeiro Matriz</h2>
          <p className="text-text-secondary mt-2">Visão consolidada de balanço e fluxo de caixa de toda a rede.</p>
        </div>
        <div className="flex items-center gap-3">
          <select 
            value={selectedSchoolId}
            onChange={(e) => setSelectedSchoolId(e.target.value)}
            className="px-4 py-2.5 bg-white/5 border border-border rounded-xl text-sm font-bold text-white outline-none focus:border-primary transition-all appearance-none"
          >
            <option value="all">Todas as Unidades</option>
            {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <Button 
            onClick={() => setIsModalOpen(true)}
            leftIcon={<Plus size={18} />} 
            className="shadow-glow"
          >
            Nova Fatura
          </Button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
          Erro ao carregar dados financeiros: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-surface border-border overflow-hidden group">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-primary/10 rounded-lg text-primary">
              <DollarSign size={20} />
            </div>
            <p className="text-xs font-black uppercase text-text-muted tracking-widest">Saldo Total</p>
          </div>
          <p className="text-3xl font-bold text-white">R$ {summary.totalBalance.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="mt-4 flex items-center gap-2 text-success text-xs font-bold">
            <TrendingUp size={14} /> +0% vs mês anterior
          </div>
        </Card>
        
        <Card className="p-6 bg-surface border-border overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-success/10 rounded-lg text-success">
              <CheckCircle2 size={20} />
            </div>
            <p className="text-xs font-black uppercase text-text-muted tracking-widest">Receitas (Mês)</p>
          </div>
          <p className="text-3xl font-bold text-success">R$ {summary.monthlyRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="mt-4 flex items-center gap-2 text-text-muted text-xs">
            {summary.paymentRate.toFixed(0)}% das faturas pagas
          </div>
        </Card>

        <Card className="p-6 bg-surface border-border overflow-hidden">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-error/10 rounded-lg text-error">
              <AlertCircle size={20} />
            </div>
            <p className="text-xs font-black uppercase text-text-muted tracking-widest">Despesas (Mês)</p>
          </div>
          <p className="text-3xl font-bold text-error">R$ {summary.monthlyExpenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
          <div className="mt-4 flex items-center gap-2 text-error text-xs font-bold">
            <TrendingUp size={14} /> 0% em folha
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Tabela de Balanço */}
        <Card className="bg-surface border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h3 className="font-bold text-white uppercase tracking-widest text-xs">Balanço por Unidade</h3>
            <div className="relative group max-w-[200px] w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={14} />
              <input 
                type="text" 
                placeholder="Filtrar unidade..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-border rounded-lg py-1.5 pl-9 pr-3 text-xs text-white focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border text-[10px] font-black uppercase text-text-muted tracking-widest bg-white/5">
                  <th className="px-6 py-4">Unidade</th>
                  <th className="px-6 py-4 text-right">Saldo</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredSchools.length > 0 ? filteredSchools.map((school) => (
                  <tr key={school.id} className="hover:bg-white/5 transition-colors text-sm">
                    <td className="px-6 py-4 text-white font-medium">{school.name}</td>
                    <td className="px-6 py-4 text-right text-white font-mono">
                      R$ {(schoolBalance[school.id] || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`px-2 py-0.5 ${(schoolBalance[school.id] || 0) >= 0 ? 'bg-success/10 text-success' : 'bg-error/10 text-error'} text-[10px] font-black rounded uppercase`}>
                        {(schoolBalance[school.id] || 0) >= 0 ? 'Regular' : 'Atenção'}
                      </span>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-text-muted italic">Nenhuma unidade encontrada.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Faturas Recentes */}
        <Card className="bg-surface border-border overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border bg-white/5 flex items-center justify-between">
            <h3 className="font-bold text-white uppercase tracking-widest text-xs">Faturas Recentes</h3>
          </div>
          <div className="overflow-x-auto flex-1">
             <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-border text-[10px] font-black uppercase text-text-muted tracking-widest bg-white/5">
                    <th className="px-6 py-4">Vencimento</th>
                    <th className="px-6 py-4">Valor</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {invoices.length > 0 ? invoices.slice(0, 5).map(inv => (
                    <tr key={inv.id} className="hover:bg-white/5 transition-colors text-xs text-white">
                      <td className="px-6 py-4">{new Date(inv.dueDate).toLocaleDateString('pt-BR')}</td>
                      <td className="px-6 py-4 font-bold">R$ {Number(inv.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold ${
                          inv.status === 'PAID' ? 'bg-success/10 text-success' : 
                          inv.status === 'OVERDUE' ? 'bg-error/10 text-error' : 'bg-warning/10 text-warning'
                        }`}>
                          {inv.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        {inv.status !== 'PAID' && (
                          <button 
                            onClick={() => handleUpdateStatus(inv.id, 'PAID')}
                            className="text-primary hover:underline font-bold"
                          >
                            Pagar
                          </button>
                        )}
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={4} className="px-6 py-12 text-center">
                        <DollarSign size={32} className="text-text-muted mx-auto mb-2 opacity-20" />
                        <p className="text-text-muted italic text-sm">Nenhuma fatura registrada.</p>
                      </td>
                    </tr>
                  )}
                </tbody>
             </table>
          </div>
        </Card>
      </div>

      {/* Nova Fatura Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nova Fatura Manual">
        <form onSubmit={handleCreateInvoice} className="space-y-5">
           <div>
              <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">Aluno (ID)</label>
              <input 
                required
                type="text" 
                value={formData.studentId}
                onChange={(e) => setFormData({...formData, studentId: e.target.value})}
                placeholder="UUID do aluno..."
                className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
           </div>
           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">Valor (R$)</label>
                <input 
                  required
                  type="number" 
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: Number(e.target.value)})}
                  className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all"
                />
              </div>
              <div>
                <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">Vencimento</label>
                <input 
                  required
                  type="date" 
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                  className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all"
                />
              </div>
           </div>
           <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" className="flex-1" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
              <Button type="submit" className="flex-1 shadow-glow" isLoading={loading}>Gerar Fatura</Button>
           </div>
        </form>
      </Modal>
    </div>
  );
};

export default Financeiro;
