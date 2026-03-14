import { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { BookOpen, Plus, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

interface SubjectData {
  id: string;
  name: string;
  workload: number;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', workload: 0 });
  const [submitting, setSubmitting] = useState(false);

  const token = useAuthStore(state => state.token);
  const tenant = useTenantStore(state => state.currentTenant);

  const fetchSubjects = () => {
    if (!token || !tenant) return;
    setLoading(true);
    setError(null);
    api.get('/academic/subjects')
      .then(res => setSubjects(res.data))
      .catch(err => {
        setError('Erro ao carregar disciplinas. Selecione uma unidade.');
        console.error('Failed to fetch subjects', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token && tenant) {
      fetchSubjects();
    }
  }, [token, tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Find a matrix school to satisfy backend requirement
      const schoolsRes = await api.get('/academic/schools');
      const matrixSchool = schoolsRes.data.find((s: any) => s.isMatrix);
      
      const payload = {
        ...formData,
        matrixId: matrixSchool?.id // Backend might still need it if we didn't fix DTO yet or if DB requires it
      };

      await api.post('/academic/subjects', payload);
      setIsModalOpen(false);
      setFormData({ name: '', workload: 0 });
      fetchSubjects();
    } catch (err) {
      console.error('Failed to create subject', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Disciplinas</h2>
          <p className="text-text-secondary mt-1">Catálogo de disciplinas da rede.</p>
        </div>
        <Button 
          leftIcon={<Plus size={20} />} 
          className="shadow-glow"
          onClick={() => setIsModalOpen(true)}
        >
          Nova Disciplina
        </Button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Nova Disciplina"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Nome da Disciplina</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Matemática"
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Carga Horária (Horas)</label>
            <input 
              required
              type="number" 
              value={formData.workload || ''}
              onChange={(e) => setFormData({ ...formData, workload: parseInt(e.target.value) || 0 })}
              placeholder="Ex: 80"
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              variant="secondary" 
              className="flex-1" 
              type="button" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              className="flex-1 shadow-glow" 
              type="submit"
              isLoading={submitting}
            >
              Salvar Disciplina
            </Button>
          </div>
        </form>
      </Modal>

      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar disciplina..." 
              className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Nome</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Carga Horária</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                   <td colSpan={3} className="px-6 py-12 text-center text-text-muted">Carregando disciplinas...</td>
                </tr>
              ) : subjects.length === 0 ? (
                <tr>
                   <td colSpan={3} className="px-6 py-12 text-center text-text-muted">Nenhuma disciplina cadastrada.</td>
                </tr>
              ) : subjects.map((subject) => (
                <tr key={subject.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                        <BookOpen size={16} />
                      </div>
                      <span className="font-semibold text-white">{subject.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary font-medium">{subject.workload}h</td>
                  <td className="px-6 py-4">
                    <button className="text-primary hover:text-primary-light font-bold text-sm">Editar</button>
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
