import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, BookOpen, Search, Edit2, Trash2, ChevronLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { useDisciplineStore } from '../../stores/disciplineStore';
import type { IDisciplina } from '../../stores/disciplineStore';

const ITEMS_PER_PAGE = 50;

const Disciplina: React.FC = () => {
  const { 
    disciplinas, 
    loading, 
    error: storeError, 
    fetchDisciplinas, 
    addDisciplina, 
    updateDisciplina, 
    deleteDisciplina 
  } = useDisciplineStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  // Modal States
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingDisciplina, setEditingDisciplina] = useState<IDisciplina | null>(null);
  const [deletingDisciplina, setEditingDeletingDisciplina] = useState<IDisciplina | null>(null);
  
  const [formData, setFormData] = useState<Omit<IDisciplina, 'id'>>({
    name: '',
    workload: 0,
    syllabus: ''
  });

  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    fetchDisciplinas();
  }, [fetchDisciplinas]);

  // Filtering Logic
  const filteredData = useMemo(() => {
    return disciplinas.filter(d => 
      d.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      (d.syllabus && d.syllabus.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => a.name.localeCompare(b.name));
  }, [disciplinas, searchTerm]);

  // Pagination Logic
  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handleOpenFormModal = (disciplina: IDisciplina | null = null) => {
    setLocalError(null);
    if (disciplina) {
      setEditingDisciplina(disciplina);
      setFormData({
        name: disciplina.name,
        workload: disciplina.workload,
        syllabus: disciplina.syllabus || ''
      });
    } else {
      setEditingDisciplina(null);
      setFormData({
        name: '',
        workload: 0,
        syllabus: ''
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    const normalizedName = formData.name.trim().toUpperCase();

    if (!normalizedName) {
      setLocalError('O nome da disciplina é obrigatório.');
      return;
    }

    // Check for duplicates - although backend also does this
    const isDuplicate = disciplinas.some(d => 
      d.name.toUpperCase() === normalizedName && d.id !== editingDisciplina?.id
    );

    if (isDuplicate) {
      setLocalError('Já existe uma disciplina cadastrada com este nome.');
      return;
    }

    try {
      if (editingDisciplina) {
        await updateDisciplina(editingDisciplina.id, { 
          name: normalizedName, 
          workload: Number(formData.workload),
          syllabus: formData.syllabus
        });
      } else {
        await addDisciplina({
          name: normalizedName,
          workload: Number(formData.workload),
          syllabus: formData.syllabus
        });
      }
      setIsFormModalOpen(false);
      setEditingDisciplina(null);
    } catch (err: any) {
      // Message comes from store throw Error(message)
      setLocalError(err.message);
    }
  };

  const confirmDelete = (disciplina: IDisciplina) => {
    setEditingDeletingDisciplina(disciplina);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (deletingDisciplina) {
      try {
        await deleteDisciplina(deletingDisciplina.id);
        setIsDeleteModalOpen(false);
        setEditingDeletingDisciplina(null);
        if (paginatedData.length === 1 && currentPage > 1) {
          setCurrentPage(prev => prev - 1);
        }
      } catch (err: any) {
        setLocalError(err.message);
      }
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Catálogo de Disciplinas</h2>
          <p className="text-text-secondary mt-2">Gerencie as disciplinas oferecidas globalmente pela rede.</p>
        </div>
        <Button 
          onClick={() => handleOpenFormModal()}
          leftIcon={<Plus size={20} />} 
          className="shadow-glow"
          disabled={loading}
        >
          Nova Disciplina
        </Button>
      </div>

      {storeError && !isFormModalOpen && !isDeleteModalOpen && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="text-error mt-0.5" size={18} />
          <p className="text-sm text-error font-medium">{storeError}</p>
        </div>
      )}

      <Card className="bg-surface border-border overflow-hidden relative">
        {loading && (
          <div className="absolute inset-0 bg-surface/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
            <Loader2 className="text-primary animate-spin" size={32} />
          </div>
        )}

        <div className="p-6 border-b border-border bg-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
           <div className="relative group max-w-sm w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={18} />
              <input 
                type="text" 
                placeholder="Buscar por nome ou conteúdo..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary/20 outline-none transition-all"
              />
           </div>
           
           <div className="text-xs font-medium text-text-muted uppercase tracking-widest">
             Mostrando {paginatedData.length} de {filteredData.length} resultados
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-white/5">
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Disciplina</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Ementa</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Carga Horária</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <BookOpen size={20} />
                        </div>
                        <span className="font-bold text-white uppercase">{item.name}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6 max-w-xs xl:max-w-md">
                      <p className="text-xs text-text-secondary truncate" title={item.syllabus}>
                        {item.syllabus || <span className="italic opacity-50">Sem ementa cadastrada</span>}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-sm text-text-secondary">{item.workload}H</td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button 
                          onClick={() => handleOpenFormModal(item)}
                          className="p-2 text-text-muted hover:text-primary transition-colors disabled:opacity-30"
                          title="Editar"
                          disabled={loading}
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(item)}
                          className="p-2 text-text-muted hover:text-error transition-colors disabled:opacity-30"
                          title="Excluir"
                          disabled={loading}
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading ? (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-text-muted italic">
                    Nenhuma disciplina encontrada.
                  </td>
                </tr>
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-24 text-center">
                    {/* Placeholder during loading */}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="p-6 border-t border-border flex items-center justify-between bg-white/5">
            <button 
              type="button"
              disabled={currentPage === 1 || loading}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-white/5 rounded-xl border border-border disabled:opacity-20 hover:bg-white/10 transition-all text-nowrap"
            >
              <ChevronLeft size={18} /> Anterior
            </button>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-[0.2em] px-4 text-center">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              type="button"
              disabled={currentPage === totalPages || loading}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-white/5 rounded-xl border border-border disabled:opacity-20 hover:bg-white/10 transition-all text-nowrap"
            >
              Próximo <ChevronRight size={18} />
            </button>
          </div>
        )}
      </Card>

      {/* Form Modal (Create/Edit) */}
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={() => !loading && setIsFormModalOpen(false)} 
        title={editingDisciplina ? 'Editar Disciplina' : 'Nova Disciplina'}
      >
        <form onSubmit={handleSave} className="space-y-6">
          {localError && (
             <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 animate-in fade-in zoom-in-95">
                <AlertTriangle className="text-error mt-0.5" size={18} />
                <p className="text-sm text-error font-medium">{localError}</p>
             </div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nome da Disciplina</label>
            <input 
              required
              disabled={loading}
              type="text" 
              className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all placeholder:text-text-muted/30 disabled:opacity-50"
              placeholder="EX: MATEMÁTICA FINANCEIRA"
              value={formData.name}
              onChange={(e) => setFormData({...formData, name: e.target.value})}
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Carga Horária (H)</label>
            <div className="relative group">
               <input 
                required
                disabled={loading}
                type="number" 
                className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all placeholder:text-text-muted/30 disabled:opacity-50 pr-12"
                placeholder="EX: 80"
                value={formData.workload || ''}
                onChange={(e) => setFormData({...formData, workload: Number(e.target.value)})}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-text-muted">HORAS</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Ementa (Syllabus)</label>
            <textarea 
              disabled={loading}
              className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all placeholder:text-text-muted/30 disabled:opacity-50 min-h-[140px] resize-none"
              placeholder="Descreva detalhadamente o conteúdo programático, objetivos e bibliografia básica da disciplina..."
              value={formData.syllabus}
              onChange={(e) => setFormData({...formData, syllabus: e.target.value})}
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" type="button" onClick={() => setIsFormModalOpen(false)} disabled={loading}>Cancelar</Button>
            <Button type="submit" disabled={loading} isLoading={loading}>
              {editingDisciplina ? 'Salvar Alterações' : 'Criar Disciplina'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal 
        isOpen={isDeleteModalOpen} 
        onClose={() => !loading && setIsDeleteModalOpen(false)} 
        title="Confirmar Exclusão"
      >
        <div className="space-y-6">
          {localError && (
             <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 animate-in fade-in">
                <AlertTriangle className="text-error mt-0.5" size={18} />
                <p className="text-sm text-error font-medium">{localError}</p>
             </div>
          )}

          <div className="flex items-center gap-4 p-4 bg-error/10 border border-error/20 rounded-2xl">
            <div className="h-12 w-12 rounded-xl bg-error/20 flex items-center justify-center text-error shrink-0">
              <Trash2 size={24} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Você está prestes a excluir uma disciplina.</p>
              <p className="text-xs text-error font-medium mt-1">Esta ação é irreversível.</p>
            </div>
          </div>

          <p className="text-sm text-text-secondary leading-relaxed">
            Tem certeza que deseja remover <span className="text-white font-bold">{deletingDisciplina?.name}</span> do catálogo?
          </p>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-white/5">
            <Button variant="ghost" type="button" onClick={() => setIsDeleteModalOpen(false)} disabled={loading}>Manter Disciplina</Button>
            <Button 
              variant="danger"
              className="px-8"
              onClick={handleDelete}
              disabled={loading}
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

export default Disciplina;
