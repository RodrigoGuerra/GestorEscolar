import React from 'react';
import Button from '../components/ui/Button';
import { School } from 'lucide-react';

const LoginPage: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redirect to backend OAuth via Kong
    window.location.href = 'http://localhost:8000/auth/google';
  };

  return (
    <main className="min-h-screen flex items-center justify-center bg-secondary py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Premium ambient light effects */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[160px] animate-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[160px] animate-pulse delay-700" />
      
      {/* Grid pattern background */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 pointer-events-none" />

      <div className="max-w-md w-full space-y-8 p-10 bg-surface/40 backdrop-blur-2xl rounded-3xl border border-white/10 shadow-premium relative z-10 animate-in fade-in zoom-in-95 duration-700">
        <div className="text-center">
          <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-2xl bg-primary shadow-glow mb-8 group transition-transform hover:scale-110 duration-500">
            <School size={40} className="text-white" />
          </div>
          
          <h1 className="text-4xl font-black text-white tracking-tighter mb-3">
            Gestor <span className="text-primary italic">Escolar</span>
          </h1>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 mb-8">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            <p className="text-[10px] text-text-secondary font-bold uppercase tracking-[0.2em]">
              Acesso Institucional
            </p>
          </div>
        </div>

        <div className="mt-10 space-y-6">
          <Button
            size="lg"
            variant="secondary"
            className="w-full h-16 text-lg tracking-tight group"
            onClick={handleGoogleLogin}
            leftIcon={
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6 transition-transform group-hover:scale-110">
                <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.153-1.908 4.153-1.26 1.26-3.153 2.64-6.392 2.64-5.11 0-9.28-4.14-9.28-9.28s4.17-9.28 9.28-9.28c2.77 0 4.79 1.1 6.22 2.45l2.31-2.31C18.67 1.05 15.89 0 12.48 0 5.86 0 .48 5.38.48 12s5.38 12 12 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.04-1.34-.17-1.92h-11.06z" />
              </svg>
            }
          >
            Entrar com Google
          </Button>

          <p className="text-center text-sm text-text-muted">
            Problemas com o acesso? <a href="#" className="text-primary hover:underline font-medium">Contate o suporte</a>
          </p>
        </div>

        <div className="pt-8 border-t border-white/5 text-center">
          <p className="text-[11px] text-text-muted leading-relaxed font-medium">
            &copy; 2024 GestorEscolar • Sistema Inteligente de Gestão Educacional
          </p>
        </div>
      </div>
    </main>
  );
};

export default LoginPage;
