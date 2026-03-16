import React, { useEffect } from 'react';
import Card from '../../components/ui/Card';
import { 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  UserCheck,
  UserX,
  FileText,
  Loader2
} from 'lucide-react';
import { useFinanceStore } from '../../stores/financeStore';
import { useSchoolStore } from '../../stores/schoolStore';
import { useAcademicStore } from '../../stores/academicStore';

const Dashboard: React.FC = () => {
  const { fetchFinanceData, getSummary, loading: financeLoading } = useFinanceStore();
  const { fetchSchools, schools, getMetrics, loading: schoolLoading } = useSchoolStore();
  const { getOverviewMetrics } = useAcademicStore();

  const financeSummary = getSummary();
  const schoolMetrics = getMetrics();
  const academicMetrics = getOverviewMetrics();

  useEffect(() => {
    fetchFinanceData();
    fetchSchools();
  }, [fetchFinanceData, fetchSchools]);

  const isLoading = financeLoading || schoolLoading;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 relative">
      {isLoading && (
        <div className="absolute inset-0 bg-secondary/10 backdrop-blur-[1px] z-50 flex items-center justify-center rounded-3xl">
          <Loader2 className="text-primary animate-spin" size={48} />
        </div>
      )}

      <div>
        <h2 className="text-3xl font-bold text-white tracking-tight">Dashboard Global</h2>
        <p className="text-text-secondary mt-2">Visão geral de todas as unidades escolares.</p>
      </div>

      {/* Métricas Rápidas */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="p-6 bg-surface border-border hover:border-primary/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Receita Mensal</p>
              <p className="text-2xl font-bold text-white leading-none mt-1">
                R$ {financeSummary.monthlyRevenue.toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border-border hover:border-success/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success group-hover:scale-110 transition-transform">
              <UserCheck size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Presença Média</p>
              <p className="text-2xl font-bold text-white leading-none mt-1">{academicMetrics.frequency}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border-border hover:border-error/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-error/10 flex items-center justify-center text-error group-hover:scale-110 transition-transform">
              <UserX size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Unidades</p>
              <p className="text-2xl font-bold text-white leading-none mt-1">{schools.length}</p>
            </div>
          </div>
        </Card>

        <Card className="p-6 bg-surface border-border hover:border-secondary/50 transition-colors group">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary group-hover:scale-110 transition-transform">
              <TrendingUp size={24} />
            </div>
            <div>
              <p className="text-xs font-bold text-text-muted uppercase tracking-wider">Eventos</p>
              <p className="text-2xl font-bold text-white leading-none mt-1">{schoolMetrics.eventsCount}</p>
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Seção Financeiro */}
        <Card className="p-8 bg-surface border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <DollarSign className="text-primary" size={24} />
              Fluxo Financeiro
            </h3>
            <button className="text-xs font-bold text-primary hover:underline">Ver Detalhes</button>
          </div>
          <div className="h-64 flex flex-col items-center justify-center border-2 border-dashed border-border rounded-2xl bg-white/5 gap-4">
             <DollarSign size={48} className="text-text-muted opacity-20" />
             <p className="text-text-muted italic text-sm">Dados financeiros reais vindos de /finance/invoices</p>
          </div>
        </Card>

        {/* Seção Acadêmico */}
        <Card className="p-8 bg-surface border-border">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <FileText className="text-secondary" size={24} />
              Unidades Escolares
            </h3>
            <button className="text-xs font-bold text-secondary hover:underline">Ver Todas</button>
          </div>
          <div className="space-y-4">
            {schools.slice(0, 3).map((school) => (
              <div key={school.id} className="flex items-center justify-between p-4 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                  <span className="text-sm font-medium text-white">{school.name}</span>
                </div>
                <span className="text-sm font-bold text-success uppercase text-[10px] tracking-widest">{school.isMatrix ? 'Matriz' : 'Filial'}</span>
              </div>
            ))}
            {schools.length === 0 && !isLoading && (
              <p className="text-text-muted italic text-sm text-center py-8">Nenhuma unidade escolar encontrada.</p>
            )}
          </div>
        </Card>
      </div>

      {/* Alertas e Notificações Rápidas */}
      <Card className="p-8 bg-surface border-border">
        <h3 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
          <AlertCircle className="text-error" size={24} />
          Alertas do Sistema
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border">
                <th className="pb-4 text-xs font-black uppercase text-text-muted tracking-widest">Tipo</th>
                <th className="pb-4 text-xs font-black uppercase text-text-muted tracking-widest">Unidade</th>
                <th className="pb-4 text-xs font-black uppercase text-text-muted tracking-widest">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
               {financeSummary.paymentRate < 100 && (
                  <tr>
                    <td className="py-4 text-sm text-text-secondary">Inadimplência detectada</td>
                    <td className="py-4 text-sm text-white font-bold">Geral Franquia</td>
                    <td className="py-4"><span className="px-3 py-1 bg-error/10 text-error text-[10px] font-black uppercase rounded-full">Alerta</span></td>
                  </tr>
               )}
               <tr>
                <td className="py-4 text-sm text-text-secondary">Integridade de Dados</td>
                <td className="py-4 text-sm text-white font-bold">API Gateway</td>
                <td className="py-4"><span className="px-3 py-1 bg-success/10 text-success text-[10px] font-black uppercase rounded-full">OK</span></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default Dashboard;
