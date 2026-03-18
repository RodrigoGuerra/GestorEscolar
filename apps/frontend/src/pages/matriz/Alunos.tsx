import React, { useState, useMemo, useEffect } from 'react';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';
import { Plus, Users, Search, Edit2, Trash2, ChevronLeft, ChevronRight, AlertTriangle, Loader2, Mail, Phone, MapPin, User as UserIcon } from 'lucide-react';
import { useStudentStore, type IStudent } from '../../stores/studentStore';
import { useSchoolStore } from '../../stores/schoolStore';

const ITEMS_PER_PAGE = 50;

const maskCPF = (v: string) => v.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})/, '$1-$2').replace(/(-\d{2})\d+?$/, '$1');
const maskCEP = (v: string) => v.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{3})\d+?$/, '$1');
const maskPhone = (v: string) => v.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');

const BRAZILIAN_STATES = [
  { value: 'AC', label: 'Acre' }, { value: 'AL', label: 'Alagoas' }, { value: 'AP', label: 'Amapá' },
  { value: 'AM', label: 'Amazonas' }, { value: 'BA', label: 'Bahia' }, { value: 'CE', label: 'Ceará' },
  { value: 'DF', label: 'Distrito Federal' }, { value: 'ES', label: 'Espírito Santo' }, { value: 'GO', label: 'Goiás' },
  { value: 'MA', label: 'Maranhão' }, { value: 'MT', label: 'Mato Grosso' }, { value: 'MS', label: 'Mato Grosso do Sul' },
  { value: 'MG', label: 'Minas Gerais' }, { value: 'PA', label: 'Pará' }, { value: 'PB', label: 'Paraíba' },
  { value: 'PR', label: 'Paraná' }, { value: 'PE', label: 'Pernambuco' }, { value: 'PI', label: 'Piauí' },
  { value: 'RJ', label: 'Rio de Janeiro' }, { value: 'RN', label: 'Rio Grande do Norte' }, { value: 'RS', label: 'Rio Grande do Sul' },
  { value: 'RO', label: 'Rondônia' }, { value: 'RR', label: 'Roraima' }, { value: 'SC', label: 'Santa Catarina' },
  { value: 'SP', label: 'São Paulo' }, { value: 'SE', label: 'Sergipe' }, { value: 'TO', label: 'Tocantins' }
];

const Alunos: React.FC = () => {
  const { 
    students, 
    loading, 
    error: storeError, 
    fetchStudents, 
    addStudent, 
    updateStudent, 
    deleteStudent 
  } = useStudentStore();

  const { schools, fetchSchools } = useSchoolStore();

  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [editingStudent, setEditingStudent] = useState<IStudent | null>(null);
  const [deletingStudent, setDeletingStudent] = useState<IStudent | null>(null);
  
  const [formData, setFormData] = useState<Omit<IStudent, 'id' | 'enrollmentDate' | 'classes'>>({
    name: '',
    email: '',
    cpf: '',
    phone: '',
    birthDate: '',
    enrollmentNumber: '',
    status: 'ACTIVE',
    street: '',
    number: '',
    complement: '',
    neighborhood: '',
    city: '',
    state: '',
    zipCode: '',
    guardianName: '',
    guardianCpf: '',
    guardianEmail: '',
    guardianPhone: '',
    schoolId: '',
  });

  const [localError, setLocalError] = useState<string | null>(null);
  const [cepLoading, setCepLoading] = useState(false);

  useEffect(() => {
    fetchStudents();
    fetchSchools();
  }, [fetchStudents, fetchSchools]);

  const matrixSchool = useMemo(() => schools.find(s => s.isMatrix), [schools]);

  useEffect(() => {
    if (matrixSchool && !formData.schoolId) {
      setFormData(prev => ({ ...prev, schoolId: matrixSchool.id }));
    }
  }, [matrixSchool, formData.schoolId]);

  const filteredData = useMemo(() => {
    const term = searchTerm.toLowerCase();
    const cleanTerm = term.replace(/\D/g, '');

    return students.filter(s => {
      const matchName = s.name.toLowerCase().includes(term);
      const matchEnrollment = s.enrollmentNumber.toLowerCase().includes(term);
      
      const cleanCpf = s.cpf.replace(/\D/g, '');
      const matchCpf = s.cpf.includes(term) || (cleanTerm.length > 0 && cleanCpf.includes(cleanTerm));

      return matchName || matchEnrollment || matchCpf;
    }).sort((a, b) => a.name.localeCompare(b.name));
  }, [students, searchTerm]);

  const totalPages = Math.ceil(filteredData.length / ITEMS_PER_PAGE);
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredData.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredData, currentPage]);

  const handleOpenFormModal = (student: IStudent | null = null) => {
    setLocalError(null);
    if (student) {
      setEditingStudent(student);
      setFormData({
        name: student.name,
        email: student.email,
        cpf: student.cpf,
        phone: student.phone || '',
        birthDate: student.birthDate.split('T')[0],
        enrollmentNumber: student.enrollmentNumber,
        status: student.status,
        street: student.street || '',
        number: student.number || '',
        complement: student.complement || '',
        neighborhood: student.neighborhood || '',
        city: student.city || '',
        state: student.state || '',
        zipCode: student.zipCode || '',
        guardianName: student.guardianName || '',
        guardianCpf: student.guardianCpf || '',
        guardianEmail: student.guardianEmail || '',
        guardianPhone: student.guardianPhone || '',
        schoolId: student.schoolId,
      });
    } else {
      setEditingStudent(null);
      setFormData({
        name: '',
        email: '',
        cpf: '',
        phone: '',
        birthDate: '',
        enrollmentNumber: `AL${Math.floor(Date.now() / 1000)}`,
        status: 'ACTIVE',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: '',
        guardianName: '',
        guardianCpf: '',
        guardianEmail: '',
        guardianPhone: '',
        schoolId: matrixSchool?.id || '',
      });
    }
    setIsFormModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    
    try {
      if (editingStudent) {
        await updateStudent(editingStudent.id, formData);
      } else {
        await addStudent(formData);
      }
      setIsFormModalOpen(false);
      setEditingStudent(null);
    } catch (err) {
      const e = err as { response?: { data?: { message?: string } }; message?: string };
      setLocalError(e.response?.data?.message || e.message || 'Erro desconhecido.');
    }
  };

  const confirmDelete = (student: IStudent) => {
    setDeletingStudent(student);
    setIsDeleteModalOpen(true);
  };

  const handleDelete = async () => {
    if (deletingStudent) {
      try {
        await deleteStudent(deletingStudent.id);
        setIsDeleteModalOpen(false);
        setDeletingStudent(null);
      } catch (err: any) {
        setLocalError(err.message);
      }
    }
  };

  const handleCepBlur = async () => {
    if (!formData.zipCode) return;
    const cep = formData.zipCode.replace(/\D/g, '');
    if (cep.length !== 8) return;
    
    setCepLoading(true);
    setLocalError(null);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`, { signal: AbortSignal.timeout(5000) });
      const data = await response.json();
      
      if (data.erro) {
        setLocalError('CEP não encontrado.');
        return;
      }
      
      setFormData(prev => ({
        ...prev,
        street: data.logradouro || prev.street,
        neighborhood: data.bairro || prev.neighborhood,
        complement: data.complemento || prev.complement,
        city: data.localidade || prev.city,
        state: data.uf || prev.state,
      }));
    } catch (err) {
      setLocalError('Erro ao buscar CEP.');
    } finally {
      setCepLoading(false);
    }
  };

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">Gestão de Alunos</h2>
          <p className="text-text-secondary mt-2">Cadastre e gerencie os alunos da rede (Vinculados à Matriz).</p>
        </div>
        <Button 
          onClick={() => handleOpenFormModal()}
          leftIcon={<Plus size={20} />} 
          className="shadow-glow"
          disabled={loading}
        >
          Novo Aluno
        </Button>
      </div>

      {(storeError || localError) && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2">
          <AlertTriangle className="text-error mt-0.5" size={18} />
          <p className="text-sm text-error font-medium">{storeError || localError}</p>
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
                placeholder="Buscar por nome, CPF ou matrícula..." 
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full bg-surface border border-border rounded-xl py-3 pl-12 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
           </div>
           
           <div className="text-xs font-medium text-text-muted uppercase tracking-widest">
             {paginatedData.length} de {filteredData.length} alunos
           </div>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-border bg-white/5">
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Aluno</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Matrícula/CPF</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest">Status</th>
                <th className="px-8 py-5 text-xs font-black uppercase text-text-muted tracking-widest text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {paginatedData.length > 0 ? (
                paginatedData.map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                          <UserIcon size={20} />
                        </div>
                        <div>
                          <p className="font-bold text-white uppercase">{item.name}</p>
                          <p className="text-xs text-text-muted">{item.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <p className="text-sm text-white font-mono">{item.enrollmentNumber}</p>
                      <p className="text-xs text-text-muted font-mono">{item.cpf}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        item.status === 'ACTIVE' ? 'bg-success/20 text-success' : 
                        item.status === 'INACTIVE' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                      }`}>
                        {item.status === 'ACTIVE' ? 'Ativo' : item.status === 'INACTIVE' ? 'Inativo' : 'Suspenso'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex items-center justify-end gap-3 translate-x-4 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        <button 
                          onClick={() => handleOpenFormModal(item)}
                          className="p-2 text-text-muted hover:text-primary transition-colors"
                          title="Editar"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => confirmDelete(item)}
                          className="p-2 text-text-muted hover:text-error transition-colors"
                          title="Excluir"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : !loading && (
                <tr>
                  <td colSpan={4} className="px-8 py-12 text-center text-text-muted italic">
                    Nenhum aluno encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-6 border-t border-border flex items-center justify-between bg-white/5">
            <button 
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(prev => prev - 1)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-white/5 rounded-xl border border-border disabled:opacity-20"
            >
              <ChevronLeft size={18} /> Anterior
            </button>
            <span className="text-[10px] font-black text-text-muted uppercase tracking-widest">
              Página {currentPage} de {totalPages}
            </span>
            <button 
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(prev => prev + 1)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-bold text-white bg-white/5 rounded-xl border border-border disabled:opacity-20"
            >
              Próximo <ChevronRight size={18} />
            </button>
          </div>
        )}
      </Card>

      {/* Form Modal */}
      <Modal 
        isOpen={isFormModalOpen} 
        onClose={() => setIsFormModalOpen(false)} 
        title={editingStudent ? 'Editar Aluno' : 'Novo Aluno'}
        maxWidth="max-w-5xl"
      >
        <form onSubmit={handleSave} className="space-y-12 py-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-x-12 gap-y-12">
            {/* Dados Pessoais */}
            <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase text-primary tracking-widest border-b border-primary/20 pb-2">
              <UserIcon size={16} /> Dados Pessoais
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Nome Completo</label>
                <input required value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all focus:ring-1 focus:ring-primary/20" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">CPF *</label>
                  <input required value={formData.cpf} onChange={e => setFormData({...formData, cpf: maskCPF(e.target.value)})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Data de Nascimento</label>
                  <input required type="date" value={formData.birthDate} onChange={e => setFormData({...formData, birthDate: e.target.value})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Telefone *</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input required value={formData.phone} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} className="w-full bg-secondary border border-border rounded-xl p-3 pl-10 text-white focus:border-primary outline-none transition-all" placeholder="(00) 00000-0000" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">E-mail *</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input required type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full bg-secondary border border-border rounded-xl p-3 pl-10 text-white focus:border-primary outline-none transition-all" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Dados de Endereço */}
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase text-primary tracking-widest border-b border-primary/20 pb-2">
              <MapPin size={16} /> Endereço
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block flex items-center gap-2 tracking-wider">
                    CEP {cepLoading && <Loader2 className="animate-spin text-primary" size={12} />}
                  </label>
                  <input 
                    required
                    value={formData.zipCode} 
                    onChange={e => setFormData({...formData, zipCode: maskCEP(e.target.value)})} 
                    onBlur={handleCepBlur}
                    maxLength={9}
                    placeholder="00000-000"
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" 
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Logradouro (Rua)</label>
                  <input value={formData.street} onChange={e => setFormData({...formData, street: e.target.value})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" />
                </div>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Número</label>
                  <input value={formData.number} onChange={e => setFormData({...formData, number: e.target.value})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" />
                </div>
                <div className="sm:col-span-2">
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Complemento</label>
                  <input value={formData.complement} onChange={e => setFormData({...formData, complement: e.target.value})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" placeholder="Apto, Bloco, etc." />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Bairro</label>
                <input value={formData.neighborhood} onChange={e => setFormData({...formData, neighborhood: e.target.value})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">UF</label>
                  <select 
                    value={formData.state} 
                    onChange={e => setFormData({...formData, state: e.target.value})} 
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all appearance-none"
                  >
                    <option value="">Selecione...</option>
                    {BRAZILIAN_STATES.map(s => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Cidade</label>
                  <input 
                    list="cities-list"
                    value={formData.city} 
                    onChange={e => setFormData({...formData, city: e.target.value})} 
                    className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" 
                    placeholder="Digite ou selecione..."
                  />
                  <datalist id="cities-list">
                    {/* Basic list of capitals or let it be free-form since we don't have all cities DB */}
                    {formData.state === 'SP' && <option value="São Paulo" />}
                    {formData.state === 'RJ' && <option value="Rio de Janeiro" />}
                    {/* The User asked for combos, I'll use datalist which is a combo (input+select) */}
                  </datalist>
                </div>
              </div>
            </div>
          </div>

          {/* Responsável */}
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase text-primary tracking-widest border-b border-primary/20 pb-2">
              <Users size={16} /> Responsável
            </h4>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Nome do Responsável</label>
                <input value={formData.guardianName} onChange={e => setFormData({...formData, guardianName: e.target.value})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">CPF Responsável</label>
                  <input value={formData.guardianCpf} onChange={e => setFormData({...formData, guardianCpf: maskCPF(e.target.value)})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none transition-all" placeholder="000.000.000-00" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Telefone</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" size={16} />
                    <input value={formData.guardianPhone} onChange={e => setFormData({...formData, guardianPhone: maskPhone(e.target.value)})} className="w-full bg-secondary border border-border rounded-xl p-3 pl-10 text-white focus:border-primary outline-none transition-all" placeholder="(00) 00000-0000" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Matrícula & Status */}
          <div className="space-y-6">
            <h4 className="flex items-center gap-2 text-sm font-black uppercase text-primary tracking-widest border-b border-primary/20 pb-2">
              <AlertTriangle size={16} /> Matrícula
            </h4>
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Nº Matrícula</label>
                  <input disabled value={formData.enrollmentNumber} className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-text-muted cursor-not-allowed font-mono" />
                </div>
                <div>
                  <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Status</label>
                  <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value as any})} className="w-full bg-secondary border border-border rounded-xl p-3 text-white focus:border-primary outline-none appearance-none transition-all">
                    <option value="ACTIVE">Ativo</option>
                    <option value="INACTIVE">Inativo</option>
                    <option value="SUSPENDED">Suspenso</option>
                  </select>
                </div>
              </div>
              <div>
                 <label className="text-xs font-bold text-text-muted uppercase mb-2 block tracking-wider">Unidade Principal</label>
                 <input disabled value={matrixSchool?.name || 'Não definida'} className="w-full bg-secondary/50 border border-border rounded-xl p-3 text-text-muted cursor-not-allowed" />
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-8 border-t border-border">
            <Button variant="ghost" type="button" onClick={() => setIsFormModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={loading} className="px-10 shadow-glow">
              {editingStudent ? 'Salvar Alterações' : 'Cadastrar Aluno'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Modal */}
      <Modal isOpen={isDeleteModalOpen} onClose={() => setIsDeleteModalOpen(false)} title="Excluir Aluno">
        <div className="space-y-6 text-center">
          <div className="h-20 w-20 bg-error/10 text-error rounded-full flex items-center justify-center mx-auto">
            <Trash2 size={40} />
          </div>
          <p className="text-white font-bold text-lg">Excluir aluno {deletingStudent?.name}?</p>
          <div className="flex gap-4">
            <Button variant="ghost" className="flex-1" onClick={() => setIsDeleteModalOpen(false)}>Cancelar</Button>
            <Button variant="danger" className="flex-1" onClick={handleDelete} isLoading={loading}>Excluir</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Alunos;
