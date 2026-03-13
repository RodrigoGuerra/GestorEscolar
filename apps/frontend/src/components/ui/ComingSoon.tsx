import React from 'react';
import type { LucideIcon } from 'lucide-react';
import Card from './Card';

interface ComingSoonProps {
  title: string;
  icon: LucideIcon;
}

const ComingSoon: React.FC<ComingSoonProps> = ({ title, icon: Icon }) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] text-center p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="h-24 w-24 rounded-3xl bg-primary/10 flex items-center justify-center text-primary mb-8 relative">
        <Icon size={48} />
        <div className="absolute inset-0 bg-primary/20 blur-2xl rounded-full -z-10 animate-pulse" />
      </div>
      
      <h2 className="text-3xl font-bold text-white mb-4">{title}</h2>
      
      <div className="max-w-md">
        <p className="text-text-secondary mb-8">
          Estamos trabalhando arduamente para trazer as melhores ferramentas de gestão para o módulo 
          <span className="text-primary font-semibold"> {title}</span>. 
          Em breve você terá acesso a todas as funcionalidades.
        </p>
        
        <Card className="bg-white/5 border-dashed border-primary/30 py-4 px-6 inline-flex items-center gap-2">
          <div className="flex gap-1">
             {[0, 1, 2].map((i) => (
               <div key={i} className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" style={{ animationDelay: `${i * 0.15}s` }} />
             ))}
          </div>
          <span className="text-xs font-mono uppercase tracking-widest text-primary">Desenvolvimento em curso</span>
        </Card>
      </div>
    </div>
  );
};

export default ComingSoon;
