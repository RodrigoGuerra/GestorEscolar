import React from 'react';

const LoginPage: React.FC = () => {
  const handleGoogleLogin = () => {
    // Redirect to backend OAuth via Kong
    window.location.href = 'http://localhost:8000/auth/google';
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-2xl shadow-xl border border-gray-100">
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
            <svg className="h-8 w-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l9-5-9-5-9 5 9 5z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z" />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            Gestor Escolar
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Plataforma Multi-tenant de Gestão Integrada
          </p>
        </div>
        <div className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <button
              onClick={handleGoogleLogin}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-xl text-white bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary transition-all duration-200 transform hover:scale-[1.02] active:scale-95 shadow-lg shadow-primary/25"
            >
              <span className="absolute left-0 inset-y-0 flex items-center pl-3">
                <svg className="h-5 w-5 text-white/50 group-hover:text-white/80 transition-colors" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.48 10.92v3.28h7.84c-.24 1.84-.908 3.153-1.908 4.153-1.26 1.26-3.153 2.64-6.392 2.64-5.11 0-9.28-4.14-9.28-9.28s4.17-9.28 9.28-9.28c2.77 0 4.79 1.1 6.22 2.45l2.31-2.31C18.67 1.05 15.89 0 12.48 0 5.86 0 .48 5.38.48 12s5.38 12 12 12c3.57 0 6.27-1.17 8.37-3.36 2.16-2.16 2.84-5.21 2.84-7.67 0-.76-.04-1.34-.17-1.92h-11.06z" />
                </svg>
              </span>
              Entrar com Google
            </button>
          </div>
        </div>
        <div className="text-center">
            <p className="text-xs text-gray-400">
                Ao entrar, você concorda com nossos Termos e Política de Privacidade.
            </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
