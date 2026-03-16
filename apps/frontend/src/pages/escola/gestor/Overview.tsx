import React, { useEffect } from 'react';
import Card from '../../../components/ui/Card';
import { Users, BookOpen, Calendar, ArrowUpRight, Loader2 } from 'lucide-react';
import { useSchoolStore } from '../../../stores/schoolStore';
import { useTenantStore } from '../../../stores/tenantStore';

const OverviewGestor: React.FC = () => {
  const { fetchMetrics, loading, error, getMetrics } = useSchoolStore();
  const { currentTenant } = useTenantStore();
  const metrics = getMetrics();

  useEffect(() => {
    if (currentTenant?.id) {
      fetchMetrics(currentTenant.id);
    }
  }, [currentTenant?.id, fetchMetrics]);

  if (loading) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-in slide-in-from-right-4 duration-500">
      {error && (
        <div className="col-span-full p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
          Erro ao carregar métricas: {error}
        </div>
      )}

      <Card className="p-8 bg-surface border-border hover:border-primary/50 transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Alunos Ativos</h4>
            <p className="text-3xl font-bold text-white">{metrics.activeStudents}</p>
          </div>
        </div>
        <button className="w-full py-3 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/10 flex items-center justify-center gap-2">
           Ver Listagem <ArrowUpRight size={14} />
        </button>
      </Card>

      <Card className="p-8 bg-surface border-border hover:border-secondary/50 transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-secondary/10 flex items-center justify-center text-secondary">
            <BookOpen size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Turmas</h4>
            <p className="text-3xl font-bold text-white">{metrics.classesCount}</p>
          </div>
        </div>
        <button className="w-full py-3 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/10 flex items-center justify-center gap-2">
           Grade Horária <ArrowUpRight size={14} />
        </button>
      </Card>

      <Card className="p-8 bg-surface border-border hover:border-success/50 transition-all">
        <div className="flex items-center gap-4 mb-6">
          <div className="h-12 w-12 rounded-xl bg-success/10 flex items-center justify-center text-success">
            <Calendar size={24} />
          </div>
          <div>
            <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Eventos</h4>
            <p className="text-3xl font-bold text-white">{metrics.eventsCount}</p>
          </div>
        </div>
        <button className="w-full py-3 bg-white/5 rounded-xl border border-white/10 text-xs font-bold text-white hover:bg-white/10 flex items-center justify-center gap-2">
           Calendário <ArrowUpRight size={14} />
        </button>
      </Card>
    </div>
  );
};

export default OverviewGestor;
