import React from 'react';
import { Outlet, useParams, NavLink } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import { 
  BarChart2, 
  Users, 
  Calendar, 
  Clock, 
  BookOpen, 
  Layout
} from 'lucide-react';

const PainelEscolaLayout: React.FC = () => {
  const { id } = useParams();
  const role = useAuthStore((state) => state.role);
  const currentTenant = useTenantStore((state) => state.currentTenant);

  // Definir abas baseado na role (Seção 5 do PRD)
  const tabs = {
    GESTOR: [
      { id: 'dashboard', label: 'Visão Geral', icon: BarChart2 },
      { id: 'alunos', label: 'Gerenciar Alunos', icon: Users },
      { id: 'turmas', label: 'Montar Turmas', icon: Layout },
      { id: 'cronograma', label: 'Cronograma', icon: Calendar },
    ],
    FUNCIONARIO: [
      { id: 'turmas', label: 'Minhas Turmas', icon: BookOpen },
      { id: 'ponto', label: 'Bater Ponto', icon: Clock },
    ],
    ALUNO: [
      { id: 'turmas', label: 'Minhas Turmas', icon: GraduationCap },
    ]
  };

  // Ícone de reserva para Aluno ( GraduationCap não está no Lucide as vezes usei GraduationCap mas vou usar Users se falhar)
  const currentTabs = tabs[role as keyof typeof tabs] || [];

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="bg-surface/50 p-8 rounded-3xl border border-border flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
            <School size={28} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">{currentTenant?.name || `Unidade ${id}`}</h2>
            <p className="text-xs font-bold text-text-muted uppercase tracking-widest">Painel Local • {role}</p>
          </div>
        </div>

        <nav className="flex items-center gap-2 bg-black/20 p-1.5 rounded-2xl border border-white/5 overflow-x-auto no-scrollbar">
          {currentTabs.map((tab) => (
            <NavLink 
              key={tab.id}
              to={`/escola/${id}/${tab.id}`}
              className={({ isActive }) => `px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 whitespace-nowrap ${
                isActive ? 'bg-primary/20 text-primary' : 'text-text-secondary hover:text-white hover:bg-white/5'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="min-h-[500px]">
        <Outlet />
      </div>
    </div>
  );
};

// Import temporário para ícone ausente na lista anterior
import { GraduationCap, School } from 'lucide-react';

export default PainelEscolaLayout;
