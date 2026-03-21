import { useCallback, useEffect, useState, useMemo } from 'react';
import api from '../lib/api';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import Modal from '../components/ui/Modal';
import { LayoutGrid, Plus, Search, Users, Loader2 } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { useTenantStore } from '../stores/tenantStore';
import { useStudentStore } from '../stores/studentStore';

interface ClassData {
  id: string;
  name: string;
  year: number;
  students?: { id: string }[];
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const selectedClass = classes.find(c => c.id === selectedClassId) ?? null;
  const [formData, setFormData] = useState({ name: '', year: new Date().getFullYear() });
  const [studentSearch, setStudentSearch] = useState('');
  
  const token = useAuthStore(state => state.token);
  const tenant = useTenantStore(state => state.currentTenant);
  const { students, fetchStudents } = useStudentStore();

  const fetchClasses = useCallback(async () => {
    if (!token || !tenant) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.get('/academic/classes');
      setClasses(res.data);
    } catch (err) {
      setError('Erro ao carregar turmas.');
      console.error('Failed to fetch classes', err);
    } finally {
      setLoading(false);
    }
  }, [token, tenant]);

  useEffect(() => {
    fetchClasses();
    fetchStudents();
  }, [fetchClasses, fetchStudents]);

  const filteredClasses = useMemo(() => {
    return classes.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [classes, searchTerm]);

  const handleCreateClass = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/academic/classes', { ...formData, schoolId: tenant?.id });
      setIsModalOpen(false);
      setFormData({ name: '', year: new Date().getFullYear() });
      fetchClasses();
    } catch (err) {
      console.error('Error creating class', err);
    }
  };

  const handleAssignStudent = async (studentId: string) => {
    if (!selectedClass) return;
    try {
      await api.post(`/academic/classes/${selectedClass.id}/students`, { studentId });
      fetchClasses();
    } catch (err) {
      console.error('Error assigning student', err);
    }
  };

  const handleRemoveStudent = async (studentId: string) => {
    if (!selectedClass) return;
    try {
      await api.delete(`/academic/classes/${selectedClass.id}/students/${studentId}`);
      fetchClasses();
    } catch (err) {
      console.error('Error removing student', err);
    }
  };

  const filteredModalStudents = useMemo(() => {
    if (!studentSearch) return students;
    return students.filter(s =>
      s.name.toLowerCase().includes(studentSearch.toLowerCase()) ||
      s.enrollmentNumber.toLowerCase().includes(studentSearch.toLowerCase())
    );
  }, [students, studentSearch]);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">Turmas</h2>
          <p className="text-text-secondary mt-1">Gestão de turmas e atribuição de alunos para {tenant?.name}.</p>
        </div>
        <Button 
          leftIcon={<Plus size={20} />} 
          className="shadow-glow"
          onClick={() => setIsModalOpen(true)}
        >
          Nova Turma
        </Button>
      </div>

      <div className="flex items-center justify-between bg-white/5 p-4 rounded-2xl border border-border">
         <div className="relative group max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-primary" size={18} />
            <input 
              type="text" 
              placeholder="Buscar turma..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-surface border border-border rounded-xl py-2.5 pl-12 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
            />
         </div>
      </div>

      {error && (
        <div className="bg-error/10 border border-error/20 text-error px-4 py-3 rounded-xl text-sm font-medium">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
        {loading && (
          <div className="absolute inset-0 bg-secondary/5 backdrop-blur-[1px] z-10 flex items-center justify-center">
            <Loader2 className="text-primary animate-spin" size={32} />
          </div>
        )}

        {filteredClasses.length === 0 && !loading ? (
          <p className="text-text-muted italic col-span-full py-12 text-center text-sm">Nenhuma turma encontrada.</p>
        ) : filteredClasses.map((c) => (
          <Card key={c.id} hover className="bg-surface border-border p-6 group flex flex-col">
            <div className="flex items-center justify-between mb-6">
               <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform duration-300">
                 <LayoutGrid size={24} />
               </div>
               <span className="text-xs font-black text-text-muted bg-white/5 px-2 py-1 rounded italic">{c.year}</span>
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{c.name}</h3>
            <div className="flex items-center gap-2 text-text-muted text-xs mb-6">
               <Users size={14} />
               <span>{c.students?.length || 0} Alunos Matriculados</span>
            </div>
            <div className="mt-auto pt-4 flex gap-2">
              <Button 
                variant="secondary" 
                className="flex-1 text-xs py-2 h-9"
                onClick={() => { setSelectedClassId(c.id); setIsAssignModalOpen(true); }}
              >
                Gerenciar Alunos
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Class Modal */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Criar Nova Turma">
        <form onSubmit={handleCreateClass} className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Nome da Turma</label>
            <input 
              required
              className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none"
              placeholder="Ex: 6º Ano A"
              value={formData.name}
              onChange={e => setFormData({...formData, name: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-xs font-bold text-text-muted uppercase tracking-widest">Ano Letivo</label>
            <input 
              required
              type="number"
              className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none"
              value={formData.year}
              onChange={e => setFormData({...formData, year: parseInt(e.target.value)})}
            />
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="ghost" className="flex-1" type="button" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button className="flex-1" type="submit">Criar Turma</Button>
          </div>
        </form>
      </Modal>

      {/* Manage Students Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => { setIsAssignModalOpen(false); setStudentSearch(''); }}
        title={`Gerenciar Alunos - ${selectedClass?.name}`}
        maxWidth="max-w-xl"
      >
        <div className="space-y-4">
          <p className="text-text-secondary text-sm">
            Matricule ou desmatricule alunos cadastrados nesta turma.
          </p>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
            <input
              type="text"
              placeholder="Buscar aluno..."
              value={studentSearch}
              onChange={(e) => setStudentSearch(e.target.value)}
              className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
            />
          </div>

          <div className="max-h-96 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
            {filteredModalStudents.length === 0 ? (
              <p className="text-text-muted text-sm italic text-center py-6">Nenhum aluno encontrado.</p>
            ) : filteredModalStudents.map(student => {
              const isAssigned = selectedClass?.students?.some(s => s.id === student.id);
              return (
                <div key={student.id} className="flex items-center justify-between p-4 bg-white/5 border border-white/5 rounded-xl">
                  <div>
                    <p className="text-sm font-bold text-white uppercase">{student.name}</p>
                    <p className="text-[10px] text-text-muted uppercase font-black">{student.enrollmentNumber}</p>
                  </div>
                  {isAssigned ? (
                    <Button
                      variant="danger"
                      className="text-[10px] h-8 px-4"
                      onClick={() => handleRemoveStudent(student.id)}
                    >
                      Desmatricular
                    </Button>
                  ) : (
                    <Button
                      variant="outline"
                      className="text-[10px] h-8 px-4"
                      onClick={() => handleAssignStudent(student.id)}
                    >
                      Matricular
                    </Button>
                  )}
                </div>
              );
            })}
          </div>

          <Button
            variant="secondary"
            className="w-full"
            onClick={() => { setIsAssignModalOpen(false); setStudentSearch(''); }}
          >
            Fechar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
