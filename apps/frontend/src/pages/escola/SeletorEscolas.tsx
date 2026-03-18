import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { useTenantStore } from '../../stores/tenantStore';
import Card from '../../components/ui/Card';
import { School, ArrowRight, User } from 'lucide-react';

const SeletorEscolas: React.FC = () => {
  const user = useAuthStore((state) => state.user);
  const setEscolaSelecionada = useAuthStore((state) => state.setEscolaSelecionada);
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant);
  const navigate = useNavigate();

  const handleSelect = (escola: { id: string; name: string; schema: string }) => {
    setEscolaSelecionada(escola.id);
    setCurrentTenant(escola);
    navigate(`/escola/${escola.id}/painel`);
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-secondary flex items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-primary/5 via-secondary to-secondary">
      <div className="max-w-4xl w-full space-y-12">
        <div className="text-center space-y-4">
          <div className="h-20 w-20 bg-primary/10 rounded-3xl flex items-center justify-center text-primary mx-auto shadow-glow rotate-3 animate-bounce-slow">
            <School size={40} />
          </div>
          <h2 className="text-4xl font-black text-white tracking-tight">
            Olá, <span className="text-primary">{user.name.split(' ')[0]}</span>
          </h2>
          <p className="text-text-secondary text-lg max-w-md mx-auto">
            Selecione qual unidade escolar você deseja acessar agora.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {user.tenants?.map((tenant) => (
            <Card 
              key={tenant.id} 
              hover 
              className="p-10 bg-surface border-border hover:border-primary group cursor-pointer relative overflow-hidden"
              onClick={() => handleSelect(tenant)}
            >
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-100 transition-opacity">
                 <ArrowRight className="text-primary" size={24} />
              </div>
              
              <div className="flex flex-col items-center text-center">
                <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center text-primary mb-6 group-hover:scale-110 transition-transform">
                  <School size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-2">{tenant.name}</h3>
                <p className="text-xs font-black uppercase text-text-muted tracking-[0.2em]">Unidade Operacional</p>
                
                <div className="mt-8 pt-8 border-t border-border w-full flex items-center justify-center gap-2 text-primary font-bold text-sm">
                   Acessar Painel <ArrowRight size={16} />
                </div>
              </div>
            </Card>
          ))}
        </div>

        <div className="text-center pt-8">
           <button 
             onClick={() => navigate('/login')}
             className="text-text-muted hover:text-white flex items-center gap-2 mx-auto text-sm font-medium transition-colors"
           >
             <User size={16} /> Sair da conta
           </button>
        </div>
      </div>
    </div>
  );
};

export default SeletorEscolas;
