import { useEffect, useState } from 'react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { Users, Plus, Search } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';

interface EmployeeData {
  id: string;
  name: string;
  email: string;
  position: string;
}

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', position: '', cpf: '', hourlyRate: 0 });
  const [submitting, setSubmitting] = useState(false);

  const token = useAuthStore(state => state.token);
  const tenant = useTenantStore(state => state.currentTenant);

  const fetchEmployees = () => {
    if (!token || !tenant) return;
    setLoading(true);
    setError(null);
    api.get('/hr/employees')
      .then(res => setEmployees(res.data))
      .catch(err => {
        setError('Erro ao carregar colaboradores.');
        console.error('Failed to fetch employees', err);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    if (token && tenant) {
      fetchEmployees();
    }
  }, [token, tenant]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      // Find a school to associate the employee with
      const schoolsRes = await api.get('/academic/schools');
      const schoolId = schoolsRes.data[0]?.id; // Default to first school for now

      const payload = {
        ...formData,
        schoolId
      };

      await api.post('/hr/employees', payload);
      setIsModalOpen(false);
      setFormData({ name: '', email: '', position: '', cpf: '', hourlyRate: 0 });
      fetchEmployees();
    } catch (err) {
      console.error('Failed to create employee', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Colaboradores</h2>
          <p className="text-text-secondary mt-1">Gestão de RH e equipe escolar.</p>
        </div>
        {error && (
          <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium animate-in fade-in slide-in-from-top-2">
            {error}
          </div>
        )}
        <Button 
          leftIcon={<Plus size={20} />} 
          className="shadow-glow"
          onClick={() => setIsModalOpen(true)}
        >
          Novo Colaborador
        </Button>
      </div>

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
        title="Novo Colaborador"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Nome Completo</label>
            <input 
              required
              type="text" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: João Silva"
              className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">E-mail</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao@escola.com"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">CPF</label>
              <input 
                required
                type="text" 
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                placeholder="000.000.000-00"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Cargo</label>
              <input 
                required
                type="text" 
                value={formData.position}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                placeholder="Ex: Professor"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Valor Hora (R$)</label>
              <input 
                required
                type="number" 
                value={formData.hourlyRate || ''}
                onChange={(e) => setFormData({ ...formData, hourlyRate: parseFloat(e.target.value) || 0 })}
                placeholder="0.00"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
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
              Confirmar Contratação
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
              placeholder="Buscar colaborador..." 
              className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/5">
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Nome</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Cargo</th>
                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-text-muted">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr>
                   <td colSpan={3} className="px-6 py-12 text-center text-text-muted">Carregando colaboradores...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                   <td colSpan={3} className="px-6 py-12 text-center text-text-muted">Nenhum colaborador encontrado.</td>
                </tr>
              ) : employees.map((emp) => (
                <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-secondary flex items-center justify-center text-text-secondary group-hover:text-primary transition-colors">
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="font-semibold text-white leading-none">{emp.name}</p>
                        <p className="text-xs text-text-muted mt-1">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text-secondary font-medium">{emp.position}</span>
                  </td>
                  <td className="px-6 py-4">
                    <button className="text-primary hover:text-primary-light font-bold text-sm">Ver Perfil</button>
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
