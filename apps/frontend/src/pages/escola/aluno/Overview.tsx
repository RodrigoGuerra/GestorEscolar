import React, { useEffect } from 'react';
import Card from '../../../components/ui/Card';
import { BookOpen, FileText, Calendar, Star, Loader2 } from 'lucide-react';
import { useAcademicStore } from '../../../stores/academicStore';
import { useAuthStore } from '../../../stores/authStore';

const OverviewAluno: React.FC = () => {
  const { user } = useAuthStore();
  const { fetchStudentData, loading, error, getOverviewMetrics, grades } = useAcademicStore();
  const metrics = getOverviewMetrics();

  useEffect(() => {
    if (user?.id) {
      fetchStudentData(user.id);
    }
  }, [user?.id, fetchStudentData]);

  if (loading && grades.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center">
        <Loader2 className="text-primary animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
      {error && (
        <div className="p-4 bg-error/10 border border-error/20 rounded-xl text-error text-sm font-medium">
          Erro ao carregar dados acadêmicos: {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 bg-surface border-border">
           <Star className="text-secondary mb-4" size={24} />
           <p className="text-xs font-black uppercase text-text-muted tracking-widest">Média Geral</p>
           <p className="text-3xl font-black text-white">{metrics.averageGrade || '-'}</p>
        </Card>
        <Card className="p-6 bg-surface border-border">
           <FileText className="text-primary mb-4" size={24} />
           <p className="text-xs font-black uppercase text-text-muted tracking-widest">Frequência</p>
           <p className="text-3xl font-black text-white">{metrics.frequency}</p>
        </Card>
        <Card className="p-6 bg-surface border-border">
           <Calendar className="text-success mb-4" size={24} />
           <p className="text-xs font-black uppercase text-text-muted tracking-widest">Aulas Hoje</p>
           <p className="text-3xl font-black text-white">{metrics.classesToday}</p>
        </Card>
      </div>

      <h3 className="text-xl font-bold text-white mb-6">Minhas Notas</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
         {grades.length > 0 ? grades.map((item) => (
           <Card key={item.id} className="p-6 bg-surface border-border hover:border-primary/50 transition-all flex items-start gap-4">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                 <BookOpen size={24} />
              </div>
              <div className="flex-1">
                 <div className="flex justify-between items-start">
                   <div>
                     <p className="font-bold text-white uppercase">{item.subject.name}</p>
                     <p className="text-xs text-text-muted uppercase font-black">{item.term}</p>
                   </div>
                   <p className="text-2xl font-black text-primary">{item.score}</p>
                 </div>
              </div>
           </Card>
         )) : (
           <p className="text-text-muted italic col-span-full">Nenhuma nota lançada até o momento.</p>
         )}
      </div>
    </div>
  );
};

export default OverviewAluno;
