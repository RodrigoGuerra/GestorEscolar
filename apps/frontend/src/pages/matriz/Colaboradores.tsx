import React, { useEffect, useState, useMemo } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, Search, Mail, Shield, Loader2, Edit2, Trash2, X } from 'lucide-react';
import { useEmployeeStore } from '../../stores/employeeStore';
import type { IEmployee } from '../../stores/employeeStore';
import { useSchoolStore } from '../../stores/schoolStore';

interface EmployeeFormData {
  name: string;
  email: string;
  position: string;
  isActive: boolean;
  schoolId: string;
}

const Colaboradores: React.FC = () => {
  const { employees, fetchEmployees, addEmployee, updateEmployee, deleteEmployee, loading, error } = useEmployeeStore();
  const { schools, fetchSchools } = useSchoolStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<IEmployee | null>(null);
  const [employeeToDelete, setEmployeeToDelete] = useState<IEmployee | null>(null);

  const [formData, setFormData] = useState<EmployeeFormData>({
    name: '',
    email: '',
    position: '',
    isActive: true,
    schoolId: '',
  });

  useEffect(() => {
    fetchEmployees();
    fetchSchools();
  }, [fetchEmployees, fetchSchools]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => 
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.position.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [employees, searchTerm]);

  const handleOpenModal = (emp?: IEmployee) => {
    if (emp) {
      setEditingEmployee(emp);
      setFormData({
        name: emp.name,
        email: emp.email,
        position: emp.position,
        isActive: emp.isActive,
        schoolId: emp.schoolId,
      });
    } else {
      setEditingEmployee(null);
      setFormData({
        name: '',
        email: '',
        position: '',
        isActive: true,
        schoolId: schools[0]?.id || '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingEmployee) {
        await updateEmployee(editingEmployee.id, formData);
      } else {
        await addEmployee(formData);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Error saving employee:', err);
    }
  };

  const handleDelete = async () => {
    if (employeeToDelete) {
      try {
        await deleteEmployee(employeeToDelete.id);
        setIsDeleteModalOpen(false);
        setEmployeeToDelete(null);
      } catch (err) {
        console.error('Error deleting employee:', err);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Equipe Global</h2>
          <p className="text-text-secondary mt-2">Gerencie professores e administrativos de toda a rede.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()} 
          leftIcon={<Plus size={20} />} 
          className="shadow-glow"
        >
          Novo Colaborador
        </Button>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
          Erro ao carregar colaboradores: {error}
        </div>
      )}

      <Card className="bg-surface border-border overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="text-primary animate-spin" size={32} />
          </div>
        )}

        <div className="p-6 border-b border-border bg-white/5 flex flex-col md:flex-row md:items-center justify-between gap-4">
           <div className="relative group max-w-sm w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome, e-mail ou cargo..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
              {searchTerm && (
                <button 
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted hover:text-white"
                >
                  <X size={16} />
                </button>
              )}
           </div>
           <div className="text-xs font-bold text-text-muted uppercase tracking-widest">
              {filteredEmployees.length} colaboradores encontrados
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-white/5">
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Colaborador</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Cargo</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredEmployees.length > 0 ? filteredEmployees.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary font-bold">
                        {item.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-white">{item.name}</p>
                        <p className="text-[10px] text-text-muted flex items-center gap-1 mt-0.5"><Mail size={10} /> {item.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-white">{item.position}</td>
                  <td className="px-8 py-6">
                    <span className={`px-3 py-1 border text-[10px] font-black uppercase rounded-full flex items-center gap-1 w-fit ${
                      item.isActive ? 'bg-success/10 border-success/20 text-success' : 'bg-error/10 border-error/20 text-error'
                    }`}>
                      <Shield size={10} /> {item.isActive ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <div className="flex items-center justify-end gap-2">
                       <button 
                        onClick={() => handleOpenModal(item)}
                        className="p-2 hover:bg-white/5 text-text-muted hover:text-primary transition-all rounded-lg"
                       >
                         <Edit2 size={16} />
                       </button>
                       <button 
                        onClick={() => { setEmployeeToDelete(item); setIsDeleteModalOpen(true); }}
                        className="p-2 hover:bg-white/5 text-text-muted hover:text-error transition-all rounded-lg"
                       >
                         <Trash2 size={16} />
                       </button>
                    </div>
                  </td>
                </tr>
              )) : !loading && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-text-muted italic">
                    {searchTerm ? `Nenhum colaborador encontrado para "${searchTerm}"` : 'Nenhum colaborador cadastrado.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingEmployee ? 'Editar Colaborador' : 'Novo Colaborador'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">Nome Completo</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">E-mail</label>
              <input 
                required
                type="email" 
                value={formData.email}
                onChange={(e) => setFormData({...formData, email: e.target.value})}
                className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">Cargo / Função</label>
              <input 
                required
                type="text" 
                value={formData.position}
                onChange={(e) => setFormData({...formData, position: e.target.value})}
                className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
            </div>
            <div>
              <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">Unidade Alocada</label>
              <select 
                required
                value={formData.schoolId}
                onChange={(e) => setFormData({...formData, schoolId: e.target.value})}
                className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all appearance-none"
              >
                {schools.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3">
              <input 
                type="checkbox" 
                id="isActive"
                checked={formData.isActive}
                onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
                className="w-5 h-5 rounded border-border bg-surface-light text-primary focus:ring-primary"
              />
              <label htmlFor="isActive" className="text-sm font-bold text-white cursor-pointer">Colaborador Ativo</label>
            </div>
          </div>

          <div className="flex gap-4 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1 shadow-glow" 
              isLoading={loading}
            >
              {editingEmployee ? 'Salvar Alterações' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Colaborador"
      >
        <div className="text-center space-y-6">
          <div className="h-20 w-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={40} />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Tem certeza?</p>
            <p className="text-text-secondary text-sm mt-2">
              Você está prestes a excluir <strong>{employeeToDelete?.name}</strong>. Esta ação não pode ser desfeita.
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Voltar
            </Button>
            <Button 
              onClick={handleDelete}
              className="flex-1 bg-error hover:bg-error-dark text-white border-none" 
              isLoading={loading}
            >
              Sim, Excluir
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Colaboradores;
