import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, School, Loader2, Search, Edit2, Trash2, X } from 'lucide-react';
import { useSchoolStore } from '../../stores/schoolStore';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import type { ISchool } from '../../stores/schoolStore';

interface SchoolFormData {
  name: string;
  cnpj: string;
  isMatrix: boolean;
  parent_school_id?: string;
}

const Academico: React.FC = () => {
  const { schools, fetchSchools, addSchool, updateSchool, deleteSchool, loading, error } = useSchoolStore();
  const { user, setEscolaSelecionada } = useAuthStore();
  const { setCurrentTenant } = useTenantStore();
  const navigate = useNavigate();

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isMatrixTransferModalOpen, setIsMatrixTransferModalOpen] = useState(false);
  const [isMatrixProtectionModalOpen, setIsMatrixProtectionModalOpen] = useState(false);
  const [editingSchool, setEditingSchool] = useState<ISchool | null>(null);
  const [schoolToDelete, setSchoolToDelete] = useState<ISchool | null>(null);

  const [formData, setFormData] = useState<SchoolFormData>({
    name: '',
    cnpj: '',
    isMatrix: false,
    parent_school_id: '',
  });

  const currentMatrix = useMemo(() => schools.find(s => s.isMatrix), [schools]);
  const hasMatrix = !!currentMatrix;

  useEffect(() => {
    fetchSchools();
  }, [fetchSchools]);

  const filteredSchools = useMemo(() => {
    return schools.filter(school => 
      school.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [schools, searchTerm]);

  const handleOpenModal = (school?: ISchool) => {
    if (school) {
      setEditingSchool(school);
      setFormData({
        name: school.name,
        cnpj: school.cnpj || '',
        isMatrix: school.isMatrix,
        parent_school_id: school.parent_school_id || '',
      });
    } else {
      setEditingSchool(null);
      setFormData({
        name: '',
        cnpj: '',
        isMatrix: false,
        parent_school_id: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    try {
      if (editingSchool) {
        await updateSchool(editingSchool.id, formData);
      } else {
        await addSchool(formData);
      }
      setIsModalOpen(false);
      // Force refresh to handle matrix transfer (backend unsets other schools)
      await fetchSchools();
    } catch (err) {
      console.error('Error saving school:', err);
      // Show backend error message (like the ConflictException)
      alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erro ao salvar unidade.');
    }
  };

  const formatCNPJ = (value: string) => {
    const digits = value.replace(/\D/g, '').slice(0, 14);
    let masked = digits;
    if (digits.length > 2) masked = `${digits.slice(0, 2)}.${digits.slice(2)}`;
    if (digits.length > 5) masked = `${masked.slice(0, 6)}.${digits.slice(5)}`;
    if (digits.length > 8) masked = `${masked.slice(0, 10)}/${digits.slice(8)}`;
    if (digits.length > 12) masked = `${masked.slice(0, 15)}-${digits.slice(12)}`;
    return masked;
  };

  const handleMatrixChange = (checked: boolean) => {
    if (checked && currentMatrix && currentMatrix.id !== editingSchool?.id) {
      setIsMatrixTransferModalOpen(true);
    } else {
      setFormData({ ...formData, isMatrix: checked });
    }
  };

  const confirmMatrixTransfer = () => {
    setFormData({ ...formData, isMatrix: true });
    setIsMatrixTransferModalOpen(false);
  };

  const handleDelete = async () => {
    if (schoolToDelete) {
      if (schoolToDelete.isMatrix && schools.length > 1) {
        setIsDeleteModalOpen(false); // Close the regular delete modal
        setIsMatrixProtectionModalOpen(true); // Open protection alert modal
        return;
      }

      try {
        await deleteSchool(schoolToDelete.id);
        setIsDeleteModalOpen(false);
        setSchoolToDelete(null);
      } catch (err) {
        console.error('Error deleting school:', err);
        alert((err as { response?: { data?: { message?: string } } }).response?.data?.message || 'Erro ao excluir unidade.');
      }
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
          <h2 className="text-3xl font-bold text-white tracking-tight">Gestão de Unidades</h2>
          <p className="text-text-secondary mt-2">Cadastre e monitore as unidades escolares da franquia.</p>
        </div>
        <Button 
          onClick={() => handleOpenModal()}
          leftIcon={<Plus size={20} />} 
          className="shadow-glow"
        >
          Nova Unidade
        </Button>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-border">
         <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={18} />
            <input 
              type="text" 
              placeholder="Buscar unidade por nome..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
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
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
          Erro ao carregar unidades: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-secondary/5 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-2xl">
            <Loader2 className="text-primary animate-spin" size={32} />
          </div>
        )}

        {filteredSchools.length > 0 ? filteredSchools.map((unit) => (
          <Card key={unit.id} className="p-6 bg-surface border-border hover:border-primary/50 transition-all group">
            <div className="flex items-start justify-between mb-6">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                <School size={24} />
              </div>
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => handleOpenModal(unit)}
                  className="text-text-muted hover:text-primary transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => { setSchoolToDelete(unit); setIsDeleteModalOpen(true); }}
                  className="text-text-muted hover:text-error transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{unit.name}</h3>
            <p className="text-sm text-text-secondary mb-6">{unit.isMatrix ? 'Unidade Matriz' : 'Unidade Filial'}</p>
            <div className="flex items-center justify-between pt-6 border-t border-border">
              <span className="text-xs font-bold text-text-muted uppercase tracking-widest">Ativa</span>
              <button 
                onClick={() => {
                  const tenant = user?.tenants?.find(t => t.id === unit.id);
                  if (tenant) {
                    setEscolaSelecionada(tenant.id);
                    setCurrentTenant(tenant);
                    navigate(`/escola/${tenant.id}/painel`);
                  } else {
                    // Fallback to construction if not in user tenants yet (e.g. newly created)
                    const constructedTenant = { id: unit.id, name: unit.name, schema: 'public' }; // Default schema
                    setEscolaSelecionada(unit.id);
                    setCurrentTenant(constructedTenant);
                    navigate(`/escola/${unit.id}/painel`);
                  }
                }}
                className="text-xs font-black text-primary uppercase tracking-widest hover:underline"
              >
                Acessar Unidade
              </button>
            </div>
          </Card>
        )) : !loading && (
          <p className="text-text-muted italic col-span-full py-12 text-center">
            {searchTerm ? `Nenhuma unidade encontrada para "${searchTerm}"` : 'Nenhuma unidade cadastrada.'}
          </p>
        )}
      </div>

      {/* Form Modal */}
      <Modal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title={editingSchool ? 'Editar Unidade' : 'Nova Unidade'}
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">Nome da Unidade</label>
              <input 
                required
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
            </div>

            <div>
              <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">CNPJ</label>
              <input 
                required
                type="text" 
                placeholder="00.000.000/0000-00"
                value={formData.cnpj}
                onChange={(e) => setFormData({...formData, cnpj: formatCNPJ(e.target.value)})}
                className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
            </div>
            
            <div className="flex items-center gap-3 p-4 bg-white/5 rounded-xl border border-white/5">
              <input 
                type="checkbox" 
                id="isMatrix"
                checked={formData.isMatrix}
                onChange={(e) => handleMatrixChange(e.target.checked)}
                className="w-5 h-5 rounded border-border bg-surface-light text-primary focus:ring-primary"
              />
              <div>
                <label htmlFor="isMatrix" className="text-sm font-bold text-white cursor-pointer">Unidade Matriz</label>
                <p className="text-[10px] text-text-muted uppercase font-black tracking-widest">
                  Define se é a sede principal da rede
                </p>
              </div>
            </div>

            {!formData.isMatrix && hasMatrix && (
              <div>
                <label className="text-xs font-black uppercase text-text-muted tracking-widest block mb-2">Unidade Pai (Matriz)</label>
                <div className="relative group">
                  <select 
                    disabled
                    value={formData.parent_school_id || currentMatrix?.id || ''}
                    className="w-full bg-surface-light border border-border rounded-xl py-3 px-4 text-sm text-white/50 cursor-not-allowed outline-none transition-all appearance-none"
                  >
                    {!formData.parent_school_id && !currentMatrix && <option value="">Nenhuma Matriz Definida</option>}
                    {schools.filter(s => s.isMatrix).map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                    {/* Fallback for currentMatrix name if not in schools list yet (rare) */}
                    {currentMatrix && !schools.find(s => s.id === currentMatrix.id) && (
                      <option value={currentMatrix.id}>{currentMatrix.name}</option>
                    )}
                  </select>
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-text-muted">
                    <School size={16} />
                  </div>
                </div>
                <p className="text-[10px] text-text-muted mt-2 italic">
                  Todas as filiais são automaticamente vinculadas à unidade matriz vigente.
                </p>
              </div>
            )}
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
              {editingSchool ? 'Salvar Unidade' : 'Criar Unidade'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => setIsDeleteModalOpen(false)}
        title="Excluir Unidade"
      >
        <div className="text-center space-y-6">
          <div className="h-20 w-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={40} />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Excluir unidade?</p>
            <p className="text-text-secondary text-sm mt-2">
              Você está prestes a excluir a <strong>{schoolToDelete?.name}</strong>. Todos os dados vinculados a esta unidade podem ser afetados.
            </p>
          </div>
          <div className="flex gap-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsDeleteModalOpen(false)}
            >
              Manter Unidade
            </Button>
            <Button 
              onClick={handleDelete}
              className="flex-1 bg-error hover:bg-error-dark text-white border-none" 
              isLoading={loading}
            >
              Confirmar Exclusão
            </Button>
          </div>
        </div>
      </Modal>

      {/* Matrix Transfer Confirmation Modal */}
      <Modal 
        isOpen={isMatrixTransferModalOpen} 
        onClose={() => setIsMatrixTransferModalOpen(false)}
        title="Transferir Função de Matriz"
      >
        <div className="text-center space-y-6">
          <div className="h-20 w-20 bg-warning/10 text-warning rounded-full flex items-center justify-center mx-auto">
            <School size={40} />
          </div>
          <div>
            <p className="text-white font-bold text-lg">Confirmar transferência?</p>
            <p className="text-text-secondary text-sm mt-4">
              A unidade <strong className="text-white">{currentMatrix?.name}</strong> deixará de ser a Matriz.
            </p>
            <p className="text-text-secondary text-sm mt-2">
              A função de Matriz será transferida para <strong className="text-primary">{formData.name || 'esta nova unidade'}</strong>.
            </p>
          </div>
          <div className="flex gap-4 pt-4">
            <Button 
              variant="outline" 
              className="flex-1" 
              onClick={() => setIsMatrixTransferModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button 
              onClick={confirmMatrixTransfer}
              className="flex-1 shadow-glow" 
            >
              Confirmar Transferência
            </Button>
          </div>
        </div>
      </Modal>

      {/* Matrix Protection Modal */}
      <Modal 
        isOpen={isMatrixProtectionModalOpen} 
        onClose={() => setIsMatrixProtectionModalOpen(false)}
        title="Operação Impedida"
      >
        <div className="text-center space-y-6 py-4">
          <div className="h-20 w-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
            <X size={40} />
          </div>
          <div className="space-y-4">
            <p className="text-white font-bold text-lg">Unidade Matriz Protegida</p>
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-left">
               <p className="text-text-secondary text-sm leading-relaxed">
                Não é possível excluir a unidade matriz enquanto houverem filiais vinculadas.
               </p>
               <p className="text-text-secondary text-sm mt-3 leading-relaxed">
                Para prosseguir com a exclusão desta unidade, você deve primeiro <strong>transformar uma das filiais em Matriz</strong>.
               </p>
            </div>
          </div>
          <Button 
            className="w-full shadow-glow" 
            onClick={() => setIsMatrixProtectionModalOpen(false)}
          >
            Entendi
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default Academico;
