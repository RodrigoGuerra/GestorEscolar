import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { Users, Loader2 } from 'lucide-react';
import { useStudentStore, type IStudent } from '../../../stores/studentStore';

const SchoolAlunos: React.FC = () => {
  const { id } = useParams();
  const { students, fetchStudents, loading, error } = useStudentStore();

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Filter students based on the school id from the URL matching their schoolId field
  const schoolStudents = students.filter((s: IStudent) => s.schoolId === id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Gerenciar Alunos</h3>
          <p className="text-text-muted">Alunos vinculados a esta unidade</p>
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
        <Card className="bg-surface border-border overflow-hidden p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
              <Users size={24} />
            </div>
            <div>
              <p className="text-xl font-bold text-white">{schoolStudents.length}</p>
              <h4 className="text-sm font-black uppercase text-text-muted tracking-widest">Alunos Matriculados</h4>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border bg-white/5">
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">Nome do Aluno</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">Matrícula</th>
                  <th className="px-6 py-4 text-xs font-black uppercase text-text-muted tracking-widest">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {schoolStudents.length > 0 ? (
                  schoolStudents.map((student: IStudent) => (
                    <tr key={student.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 font-bold text-white uppercase">{student.name}</td>
                      <td className="px-6 py-4 text-sm text-text-muted font-mono">{student.enrollmentNumber}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                          student.status === 'ACTIVE' ? 'bg-success/20 text-success' : 
                          student.status === 'INACTIVE' ? 'bg-error/20 text-error' : 'bg-warning/20 text-warning'
                        }`}>
                          {student.status === 'ACTIVE' ? 'Ativo' : student.status === 'INACTIVE' ? 'Inativo' : 'Suspenso'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={3} className="px-6 py-8 text-center text-text-muted italic">
                      Nenhum aluno encontrado para esta unidade.
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
