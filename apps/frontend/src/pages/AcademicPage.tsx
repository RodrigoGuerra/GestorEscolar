import { useCallback, useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { School, Plus, Search, Building2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';

interface SchoolData {
  id: string;
  name: string;
  cnpj: string;
  isMatrix: boolean;
}

export default function AcademicPage() {
  const [schools, setSchools] = useState<SchoolData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', cnpj: '', isMatrix: false });
  const [submitting, setSubmitting] = useState(false);

  const token = useAuthStore(state => state.token);

  const fetchSchools = useCallback(() => {
    if (!token) return;
    setLoading(true);
    setError(null);
    api.get('/academic/schools')
      .then(res => setSchools(res.data))
      .catch(err => {
        setError('Não foi possível carregar as unidades. Verifique sua conexão.');
        console.error('Failed to fetch schools', err);
      })
      .finally(() => setLoading(false));
  }, [token]);

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.post('/academic/schools', formData);
      setIsModalOpen(false);
      setFormData({ name: '', cnpj: '', isMatrix: false });
      fetchSchools();
    } catch (err) {
      console.error('Failed to create school', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Gestão Acadêmica</h2>
          <p className="text-text-secondary mt-1">Balanço e fluxo de caixa da unidade.</p>
        </div>
        <Button 
          leftIcon={<Plus size={20} />} 
          className="shadow-glow"
          onClick={() => setIsModalOpen(true)}
        >
          Nova Unidade
        </Button>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium mb-4 animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
          {error}
        </div>
      )}

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        title="Cadastrar Nova Unidade"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Nome da Unidade</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Unidade Central"
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">CNPJ</label>
            <input 
              required
              type="text" 
              value={formData.cnpj}
              onChange={(e) => setFormData({ ...formData, cnpj: e.target.value })}
              placeholder="00.000.000/0000-00"
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl border border-white/5">
            <input 
              type="checkbox" 
              id="isMatrix"
              checked={formData.isMatrix}
              onChange={(e) => setFormData({ ...formData, isMatrix: e.target.checked })}
              className="h-5 w-5 rounded border-border bg-secondary text-primary focus:ring-offset-secondary"
            />
            <label htmlFor="isMatrix" className="text-sm font-medium text-white cursor-pointer select-none">
              Esta é a unidade Matriz?
            </label>
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
              Confirmar Cadastro
            </Button>
          </div>
        </form>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-primary/10 border-primary/20 p-6 flex items-center gap-4">
           <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary">
              <Building2 size={24} />
           </div>
           <div>
              <p className="text-sm font-bold text-text-muted uppercase tracking-wider">Total de Unidades</p>
              <h3 className="text-2xl font-black text-white">{schools.length}</h3>
           </div>
        </Card>
      </div>

      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar unidade..." 
              className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Nome da Unidade</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">CNPJ</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Tipo</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-text-muted">Carregando unidades...</td>
                </tr>
              ) : schools.length === 0 ? (
                <tr>
                   <td colSpan={4} className="px-6 py-12 text-center text-text-muted">Nenhuma unidade encontrada.</td>
                </tr>
              ) : schools.map((school) => (
                <tr key={school.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                        <School size={16} />
                      </div>
                      <span className="font-semibold text-white">{school.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-text-secondary font-mono text-sm">{school.cnpj}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${school.isMatrix ? 'bg-success/20 text-success' : 'bg-primary/20 text-primary'}`}>
                      {school.isMatrix ? 'Matriz' : 'Filial'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary hover:text-primary-light font-bold text-sm">Gerenciar</button>
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
