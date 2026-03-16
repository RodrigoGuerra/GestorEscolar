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
  phone?: string;
  position: string;
  cpf: string;
  hourlyRate: number;
  isActive: boolean;
  bankDetails?: {
    bankCode: string;
    agency: string;
    account: string;
    pixKey?: string;
  };
  address?: {
    cep: string;
    street: string;
    number: string;
    complement?: string;
    neighborhood: string;
    city: string;
    state: string;
  };
}

const POSITIONS = [
  "Professor",
  "Diretor",
  "Coordenador",
  "Secretário",
  "Faxineiro",
  "Cozinheiro",
  "Segurança",
  "Monitor",
  "Psicólogo",
  "Bibliotecário"
];

const BANKS = [
  { code: '001', name: 'Banco do Brasil' },
  { code: '033', name: 'Santander' },
  { code: '104', name: 'Caixa Econômica' },
  { code: '237', name: 'Bradesco' },
  { code: '341', name: 'Itaú' },
  { code: '077', name: 'Inter' },
  { code: '260', name: 'Nubank' },
  { code: '336', name: 'C6 Bank' },
  { code: '422', name: 'Safra' },
  { code: '748', name: 'Sicredi' },
  { code: '756', name: 'Sicoob' },
];

const maskCPF = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1');
};

const maskPhone = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{2})(\d)/, '($1) $2')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{4})\d+?$/, '$1');
};

const maskCEP = (value: string) => {
  return value
    .replace(/\D/g, '')
    .replace(/(\d{5})(\d)/, '$1-$2')
    .replace(/(-\d{3})\d+?$/, '$1');
};

const maskAccount = (value: string) => {
  const v = value.replace(/\D/g, '');
  if (v.length <= 1) return v;
  return v.slice(0, -1) + '-' + v.slice(-1);
};

export default function EmployeesPage() {
  const [employees, setEmployees] = useState<EmployeeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', email: '', phone: '', position: '', cpf: '', hourlyRate: 0,
    cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
    bankCode: '', agency: '', account: '', pixKey: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<EmployeeData | null>(null);

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
    setError(null);
    try {
      // Find a school to associate the employee with
      const schoolsRes = await api.get('/academic/schools');
      const schoolId = schoolsRes.data[0]?.id; // Default to first school for now

      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        position: formData.position,
        cpf: formData.cpf,
        hourlyRate: formData.hourlyRate,
        schoolId,
        address: {
          cep: formData.cep,
          street: formData.street,
          number: formData.number,
          complement: formData.complement,
          neighborhood: formData.neighborhood,
          city: formData.city,
          state: formData.state
        },
        bankDetails: {
          bankCode: formData.bankCode,
          agency: formData.agency,
          account: formData.account,
          pixKey: formData.pixKey
        }
      };

      if (isEditing && selectedEmployee) {
        await api.patch(`/hr/employees/${selectedEmployee.id}`, payload);
      } else {
        await api.post('/hr/employees', payload);
      }

      setIsModalOpen(false);
      setIsEditing(false);
      setSelectedEmployee(null);
      setFormData({ 
        name: '', email: '', phone: '', position: '', cpf: '', hourlyRate: 0,
        cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
        bankCode: '', agency: '', account: '', pixKey: ''
      });
      fetchEmployees();
    } catch (err: any) {
      console.error('Failed to create employee', err);
      setError(err.response?.data?.message || 'Erro ao contratar colaborador.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditClick = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setFormData({
      name: employee.name,
      email: employee.email,
      phone: employee.phone || '',
      position: employee.position,
      cpf: employee.cpf,
      hourlyRate: employee.hourlyRate,
      cep: employee.address?.cep || '',
      street: employee.address?.street || '',
      number: employee.address?.number || '',
      complement: employee.address?.complement || '',
      neighborhood: employee.address?.neighborhood || '',
      city: employee.address?.city || '',
      state: employee.address?.state || '',
      bankCode: employee.bankDetails?.bankCode || '',
      agency: employee.bankDetails?.agency || '',
      account: employee.bankDetails?.account || '',
      pixKey: employee.bankDetails?.pixKey || ''
    });
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleToggleStatus = async (employee: EmployeeData) => {
    try {
      await api.patch(`/hr/employees/${employee.id}`, { isActive: !employee.isActive });
      fetchEmployees();
    } catch (err) {
      console.error('Failed to toggle status', err);
    }
  };

  const handleDeleteClick = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (!selectedEmployee) return;
    setSubmitting(true);
    try {
      await api.delete(`/hr/employees/${selectedEmployee.id}`);
      setIsDeleteModalOpen(false);
      setSelectedEmployee(null);
      fetchEmployees();
    } catch (err) {
      console.error('Failed to delete employee', err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleViewProfile = (employee: EmployeeData) => {
    setSelectedEmployee(employee);
    setIsProfileModalOpen(true);
  };

  const handleCepBlur = async () => {
    const cep = formData.cep.replace(/\D/g, '');
    if (cep.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setFormData(prev => ({
            ...prev,
            street: data.logradouro,
            neighborhood: data.bairro,
            city: data.localidade,
            state: data.uf
          }));
        }
      } catch (err) {
        console.error('Failed to fetch CEP', err);
      }
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <Modal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          setIsEditing(false);
          setSelectedEmployee(null);
          setFormData({ 
            name: '', email: '', phone: '', position: '', cpf: '', hourlyRate: 0,
            cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
            bankCode: '', agency: '', account: '', pixKey: ''
          });
        }} 
        title={isEditing ? "Editar Colaborador" : "Novo Colaborador"}
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[70vh] overflow-y-auto pr-2 custom-scrollbar">
          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Informações Básicas</h4>
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
                  onChange={(e) => setFormData({ ...formData, cpf: maskCPF(e.target.value) })}
                  placeholder="000.000.000-00"
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Telefone Celular</label>
              <input 
                type="text" 
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: maskPhone(e.target.value) })}
                placeholder="(00) 00000-0000"
                className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Cargo</label>
                <select 
                  required
                  value={formData.position}
                  onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                >
                  <option value="">Selecione um cargo</option>
                  {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
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
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Endereço</h4>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">CEP</label>
                <input 
                  required
                  type="text" 
                  value={formData.cep}
                  onChange={(e) => setFormData({ ...formData, cep: maskCEP(e.target.value) })}
                  onBlur={handleCepBlur}
                  placeholder="00000-000"
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Logradouro</label>
                <input 
                  required
                  type="text" 
                  value={formData.street}
                  onChange={(e) => setFormData({ ...formData, street: e.target.value })}
                  placeholder="Rua, Avenida..."
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Número</label>
                <input 
                  required
                  type="text" 
                  value={formData.number}
                  onChange={(e) => setFormData({ ...formData, number: e.target.value })}
                  placeholder="123"
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="md:col-span-2 space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Complemento</label>
                <input 
                  type="text" 
                  value={formData.complement}
                  onChange={(e) => setFormData({ ...formData, complement: e.target.value })}
                  placeholder="Apt, Bloco..."
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Bairro</label>
                <input 
                  required
                  type="text" 
                  value={formData.neighborhood}
                  onChange={(e) => setFormData({ ...formData, neighborhood: e.target.value })}
                  placeholder="Bairro"
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Cidade</label>
                <input 
                  required
                  type="text" 
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  placeholder="Cidade"
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Estado</label>
                <input 
                  required
                  type="text" 
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  placeholder="UF"
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="text-xs font-black uppercase tracking-widest text-primary border-b border-primary/20 pb-2">Dados Bancários</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Banco</label>
                <select 
                  required
                  value={formData.bankCode}
                  onChange={(e) => setFormData({ ...formData, bankCode: e.target.value })}
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                >
                  <option value="">Selecione um banco</option>
                  {BANKS.map(b => <option key={b.code} value={b.code}>{b.code} - {b.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Agência</label>
                <input 
                  required
                  type="text" 
                  value={formData.agency}
                  onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                  placeholder="0000"
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Conta</label>
                <input 
                  required
                  type="text" 
                  value={formData.account}
                  onChange={(e) => setFormData({ ...formData, account: maskAccount(e.target.value) })}
                  placeholder="0000000-0"
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-text-secondary uppercase tracking-wider">Chave PIX (Opcional)</label>
                <input 
                  type="text" 
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  placeholder="CPF, E-mail, Celular..."
                  className="w-full bg-secondary border border-border rounded-xl py-3 px-4 text-white placeholder:text-text-muted focus:ring-2 focus:ring-primary/50 focus:border-primary outline-none transition-all"
                />
              </div>
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <Button 
              type="submit" 
              className="flex-1 shadow-glow" 
              isLoading={submitting}
            >
              {isEditing ? 'Salvar Alterações' : 'Contratar Colaborador'}
            </Button>
            <Button 
              type="button" 
              variant="secondary" 
              onClick={() => {
                setIsModalOpen(false);
                setIsEditing(false);
                setSelectedEmployee(null);
                setFormData({ 
                  name: '', email: '', phone: '', position: '', cpf: '', hourlyRate: 0,
                  cep: '', street: '', number: '', complement: '', neighborhood: '', city: '', state: '',
                  bankCode: '', agency: '', account: '', pixKey: ''
                });
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Confirmar Desligamento"
      >
        <div className="space-y-6">
          <p className="text-text-secondary leading-relaxed">
            Tem certeza que deseja excluir o colaborador <span className="text-white font-bold">"{selectedEmployee?.name}"</span>? 
            Esta ação removerá permanentemente o registro de RH.
          </p>
          <div className="flex gap-3">
            <Button variant="secondary" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>
              Cancelar
            </Button>
            <Button 
              className="flex-1 bg-error hover:bg-error/80 border-none shadow-glow-error" 
              onClick={confirmDelete}
              isLoading={submitting}
            >
              Excluir
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        title="Perfil do Colaborador"
      >
        {selectedEmployee && (
          <div className="space-y-6">
            <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10">
              <div className="h-16 w-16 rounded-2xl bg-primary/20 flex items-center justify-center text-primary text-2xl font-bold">
                {selectedEmployee.name.charAt(0)}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{selectedEmployee.name}</h3>
                <p className="text-primary font-medium">{selectedEmployee.position}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-secondary rounded-xl border border-border">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-1">E-mail</p>
                <p className="text-white font-medium truncate">{selectedEmployee.email}</p>
              </div>
              <div className="p-4 bg-secondary rounded-xl border border-border">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-1">CPF</p>
                <p className="text-white font-medium">{selectedEmployee.cpf}</p>
              </div>
              <div className="p-4 bg-secondary rounded-xl border border-border">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-1">Telefone</p>
                <p className="text-white font-medium">{selectedEmployee.phone || '-'}</p>
              </div>
              <div className="p-4 bg-secondary rounded-xl border border-border">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-1">Valor Hora</p>
                <p className="text-white font-medium">R$ {selectedEmployee.hourlyRate}</p>
              </div>
              <div className="p-4 bg-secondary rounded-xl border border-border">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-1">Status</p>
                <p className={selectedEmployee.isActive ? "text-success font-bold" : "text-error font-bold"}>
                  {selectedEmployee.isActive ? "ATIVO" : "INATIVO"}
                </p>
              </div>
            </div>

            {selectedEmployee.address && (
              <div className="p-4 bg-secondary rounded-xl border border-border space-y-2">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted">Endereço</p>
                <p className="text-white text-sm">
                  {selectedEmployee.address.street}, {selectedEmployee.address.number}
                  {selectedEmployee.address.complement && ` - ${selectedEmployee.address.complement}`}
                </p>
                <p className="text-white text-sm">
                  {selectedEmployee.address.neighborhood} - {selectedEmployee.address.city}/{selectedEmployee.address.state}
                </p>
                <p className="text-text-muted text-xs">CEP: {selectedEmployee.address.cep}</p>
              </div>
            )}

            {selectedEmployee.bankDetails && (
              <div className="p-4 bg-secondary rounded-xl border border-border">
                <p className="text-xs font-black uppercase tracking-widest text-text-muted mb-2">Dados Bancários</p>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <p className="text-text-muted text-[10px] uppercase font-bold">Banco</p>
                    <p className="text-white">{selectedEmployee.bankDetails.bankCode}</p>
                  </div>
                  <div>
                    <p className="text-text-muted text-[10px] uppercase font-bold">Agência</p>
                    <p className="text-white">{selectedEmployee.bankDetails.agency}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-text-muted text-[10px] uppercase font-bold">Conta</p>
                    <p className="text-white">{selectedEmployee.bankDetails.account}</p>
                  </div>
                  {selectedEmployee.bankDetails.pixKey && (
                    <div className="col-span-2">
                      <p className="text-text-muted text-[10px] uppercase font-bold">Chave PIX</p>
                      <p className="text-white truncate">{selectedEmployee.bankDetails.pixKey}</p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <Button variant="secondary" className="w-full" onClick={() => setIsProfileModalOpen(false)}>
              Fechar
            </Button>
          </div>
        )}
      </Modal>

      <Card className="bg-surface border-border overflow-hidden">
        <div className="p-6 border-b border-border flex items-center justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
            <input 
              type="text" 
              placeholder="Buscar colaborador..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
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
              ) : filteredEmployees.length === 0 ? (
                <tr>
                   <td colSpan={3} className="px-6 py-12 text-center text-text-muted">Nenhum colaborador encontrado para "{searchTerm}".</td>
                </tr>
              ) : filteredEmployees.map((emp) => (
                <tr key={emp.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`h-8 w-8 rounded-lg flex items-center justify-center transition-colors ${emp.isActive ? 'bg-secondary text-text-secondary group-hover:text-primary' : 'bg-error/10 text-error'}`}>
                        <Users size={16} />
                      </div>
                      <div>
                        <p className={`font-semibold leading-none ${emp.isActive ? 'text-white' : 'text-text-muted line-through'}`}>{emp.name}</p>
                        <p className="text-xs text-text-muted mt-1">{emp.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-text-secondary font-medium">{emp.position}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-4">
                      <button 
                        onClick={() => handleViewProfile(emp)}
                        className="text-primary hover:text-primary-light font-bold text-sm"
                      >
                        Ver Perfil
                      </button>
                      <button 
                        onClick={() => handleEditClick(emp)}
                        className="text-text-secondary hover:text-white font-bold text-sm"
                      >
                        Editar
                      </button>
                      <button 
                        onClick={() => handleToggleStatus(emp)}
                        className={`${emp.isActive ? 'text-warning' : 'text-success'} hover:opacity-80 font-bold text-sm`}
                      >
                        {emp.isActive ? 'Desativar' : 'Ativar'}
                      </button>
                      <button 
                        onClick={() => handleDeleteClick(emp)}
                        className="text-error hover:text-error/80 font-bold text-sm"
                      >
                        Excluir
                      </button>
                    </div>
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
