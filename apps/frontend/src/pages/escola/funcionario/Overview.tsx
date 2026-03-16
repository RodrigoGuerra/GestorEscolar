import React from 'react';
import Card from '../../../components/ui/Card';
import { Clock, BookOpen, CheckCircle } from 'lucide-react';

const OverviewFuncionario: React.FC = () => {
  return (
    <div className="space-y-6 animate-in slide-in-from-right-4 duration-500">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-8 bg-surface border-border">
          <h4 className="text-xs font-black uppercase text-text-muted tracking-widest mb-6">Próxima Aula</h4>
          <div className="flex items-start gap-4">
             <div className="h-16 w-16 rounded-2xl bg-secondary/10 flex flex-col items-center justify-center text-secondary border border-secondary/20">
                <span className="text-lg font-black leading-none">14</span>
                <span className="text-[10px] uppercase font-bold">OUT</span>
             </div>
             <div>
                <p className="text-xl font-bold text-white">Matemática III - Turma A</p>
                <p className="text-sm text-text-secondary mt-1 flex items-center gap-1"><Clock size={14} /> 14:00 - 15:30 • Sala 04</p>
             </div>
          </div>
        </Card>

        <Card className="p-8 bg-surface border-border">
          <h4 className="text-xs font-black uppercase text-text-muted tracking-widest mb-6">Status de Ponto</h4>
          <div className="flex items-center justify-between">
             <div className="flex items-center gap-3">
                <div className="h-4 w-4 rounded-full bg-success animate-pulse" />
                <span className="text-sm font-bold text-white">Expediente Aberto</span>
             </div>
             <button className="px-6 py-2 bg-error text-white text-xs font-black uppercase rounded-xl shadow-glow">Registrar Saída</button>
          </div>
        </Card>
      </div>

      <Card className="bg-surface border-border overflow-hidden">
         <div className="p-6 border-b border-border bg-white/5">
            <h4 className="text-xs font-black uppercase text-text-muted tracking-widest">Minhas Turmas</h4>
         </div>
         <div className="divide-y divide-border">
            {[1, 2, 3].map((i) => (
              <div key={i} className="p-6 flex items-center justify-between hover:bg-white/5 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    <BookOpen size={20} />
                  </div>
                  <span className="font-bold text-white">Turma {i} - 2º Ano Ensino Médio</span>
                </div>
                <button className="text-xs font-bold text-primary flex items-center gap-1"><CheckCircle size={14} /> Frequência</button>
              </div>
            ))}
         </div>
      </Card>
    </div>
  );
};

export default OverviewFuncionario;
