import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import Card from '../../../components/ui/Card';
import { Layout, Loader2, Users } from 'lucide-react';
import { useAcademicStore, type IClass } from '../../../stores/academicStore';

const SchoolTurmas: React.FC = () => {
  const { id } = useParams();
  const { classes, fetchClasses, loading, error } = useAcademicStore();

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  // Filter classes based on the school id from the URL matching their schoolId field
  const schoolClasses = classes.filter((c: IClass) => c.schoolId === id);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold text-white">Montar Turmas</h3>
          <p className="text-text-muted">Turmas vinculadas a esta unidade</p>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {schoolClasses.length > 0 ? (
            schoolClasses.map((cls: IClass) => (
              <Card key={cls.id} className="p-6 bg-surface border-border hover:border-primary/50 transition-all flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <Layout size={24} />
                    </div>
                    <span className={`px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ${
                      cls.status === 'ACTIVE' ? 'bg-success/20 text-success' : 'bg-warning/20 text-warning'
                    }`}>
                      {cls.status === 'ACTIVE' ? 'Ativo' : 'Inativo'}
                    </span>
                  </div>
                  <h4 className="text-xl font-bold text-white mb-1">{cls.code}</h4>
                  <p className="text-sm font-bold text-text-muted uppercase tracking-wider mb-4">{cls.name}</p>
                  
                  <div className="space-y-2 mb-6">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted font-medium">Turno</span>
                      <span className="text-white font-bold">{cls.shift}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted font-medium">Capacidade</span>
                      <span className="text-white font-bold">{cls.capacity} alunos</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-text-muted font-medium">Ano Letivo</span>
                      <span className="text-white font-bold">{cls.academicYear}</span>
                    </div>
                  </div>
                </div>
                <div className="flex bg-white/5 rounded-lg p-3 items-center justify-center gap-2">
                   <Users className="text-primary" size={16} />
                   <span className="text-xs font-bold text-white uppercase tracking-wider">
                     Turma Local
                   </span>
                </div>
              </Card>
            ))
          ) : (
            <div className="col-span-full p-8 text-center text-text-muted italic bg-surface/50 border border-border rounded-xl">
              Nenhuma turma encontrada para esta unidade.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SchoolTurmas;
