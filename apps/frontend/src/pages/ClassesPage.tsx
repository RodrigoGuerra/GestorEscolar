import { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import { LayoutGrid, Plus, Calendar } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

interface ClassData {
  id: string;
  name: string;
  year: number;
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const token = useAuthStore(state => state.token);
  const tenant = useTenantStore(state => state.currentTenant);

  const fetchClasses = () => {
    if (!token || !tenant) return;
    setLoading(true);
    setError(null);
    api.get('/academic/classes')
      .then(res => setClasses(res.data))
      .catch(err => {
        setError('Erro ao carregar turmas.');
        console.error('Failed to fetch classes', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token && tenant) {
      fetchClasses();
    }
  }, [token, tenant]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Turmas</h2>
          <p className="text-text-secondary mt-1">Balanço e fluxo de caixa da unidade.</p>
        </div>
        <Button leftIcon={<Plus size={20} />} className="shadow-glow">
          Nova Turma
        </Button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <p className="text-text-muted">Carregando turmas...</p>
        ) : classes.length === 0 ? (
          <p className="text-text-muted">Nenhuma turma cadastrada.</p>
        ) : classes.map((c) => (
          <Card key={c.id} hover className="bg-surface border-border p-6 group">
            <div className="flex items-center justify-between mb-6">
               <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                 <LayoutGrid size={24} />
               </div>
               <span className="text-xs font-black text-text-muted bg-white/5 px-2 py-1 rounded italic">{c.year}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{c.name}</h3>
            <div className="flex items-center gap-2 text-text-muted text-xs mb-6">
               <Calendar size={14} />
               <span>Grade Horária Definida</span>
            </div>
            <Button variant="secondary" className="w-full text-xs py-2">
              Gerenciar Turma
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
