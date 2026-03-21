import React, { useEffect, useState, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { Users, Search, Loader2 } from 'lucide-react';
import { useStudentStore } from '../../../stores/studentStore';
import api from '../../../lib/api';

interface AssociatedStudent {
  id: string;
}

const SchoolAlunos: React.FC = () => {
  const { id: schoolId } = useParams<{ id: string }>();
  const { students, fetchStudents } = useStudentStore();

  const [schoolStudents, setSchoolStudents] = useState<AssociatedStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentSearch, setStudentSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  const fetchSchoolStudents = async () => {
    if (!schoolId) return;
    try {
      const res = await api.get(`/academic/schools/${schoolId}/students`);
      setSchoolStudents(res.data.students ?? []);
    } catch {
      setError('Erro ao carregar alunos da escola.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchSchoolStudents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [schoolId]);

  const handleAssociate = async (studentId: string) => {
    try {
      await api.post(`/academic/schools/${schoolId}/students`, { studentId });
      await fetchSchoolStudents();
    } catch {
      setError('Erro ao associar aluno.');
    }
  };

  const handleRemove = async (studentId: string) => {
    try {
      await api.delete(`/academic/schools/${schoolId}/students/${studentId}`);
      await fetchSchoolStudents();
    } catch {
      setError('Erro ao remover aluno.');
    }
  };

  const filteredStudents = useMemo(() => {
    let list = students;
    if (statusFilter === 'ACTIVE') list = list.filter((s) => s.status === 'ACTIVE');
    else if (statusFilter === 'INACTIVE') list = list.filter((s) => s.status !== 'ACTIVE');
    if (!studentSearch) return list;
    const term = studentSearch.toLowerCase();
    return list.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.enrollmentNumber.toLowerCase().includes(term),
    );
  }, [students, studentSearch, statusFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Gerenciar Alunos</h3>
          <p className="text-text-muted">Associe ou remova alunos desta unidade</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
          {error}
        </div>
      )}

      {loading ? (
        <div className="h-64 flex items-center justify-center">
          <Loader2 className="text-primary animate-spin" size={32} />
        </div>
      ) : (
        <Card className="bg-surface border-border overflow-hidden p-6 space-y-4">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{schoolStudents.length}</p>
              <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">
                Alunos Matriculados
              </h4>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                size={16}
              />
              <input
                type="text"
                placeholder="Buscar aluno..."
                value={studentSearch}
                onChange={(e) => setStudentSearch(e.target.value)}
                className="w-full bg-secondary border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:border-primary outline-none transition-all"
              />
            </div>
            <div className="flex gap-1 p-1 bg-secondary rounded-xl border border-border">
              {(['ALL', 'ACTIVE', 'INACTIVE'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setStatusFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    statusFilter === f
                      ? 'bg-primary text-white'
                      : 'text-text-muted hover:text-white'
                  }`}
                >
                  {f === 'ALL' ? 'Todos' : f === 'ACTIVE' ? 'Ativos' : 'Inativos'}
                </button>
              ))}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-white/5">
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">
                    Nome do Aluno
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">
                    Matrícula
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest text-right">
                    Ação
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredStudents.length > 0 ? (
                  filteredStudents.map((student) => {
                    const isAssociated = schoolStudents.some((s) => s.id === student.id);
                    return (
                      <tr key={student.id} className="hover:bg-white/5 transition-colors">
                        <td className="px-6 py-4 font-bold text-white uppercase">
                          {student.name}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-muted font-mono">
                          {student.enrollmentNumber}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                              student.status === 'ACTIVE'
                                ? 'bg-success/20 text-success'
                                : student.status === 'INACTIVE'
                                  ? 'bg-error/20 text-error'
                                  : 'bg-warning/20 text-warning'
                            }`}
                          >
                            {student.status === 'ACTIVE'
                              ? 'Ativo'
                              : student.status === 'INACTIVE'
                                ? 'Inativo'
                                : 'Suspenso'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {isAssociated ? (
                            <Button
                              variant="danger"
                              className="text-xs h-8 px-4"
                              onClick={() => handleRemove(student.id)}
                            >
                              Remover
                            </Button>
                          ) : (
                            <Button
                              variant="outline"
                              className="text-xs h-8 px-4"
                              onClick={() => handleAssociate(student.id)}
                            >
                              Associar
                            </Button>
                          )}
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-6 py-8 text-center text-text-muted italic"
                    >
                      Nenhum aluno encontrado.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
};

export default SchoolAlunos;
