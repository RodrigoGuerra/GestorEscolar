import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
// Stores
import { useAuthStore } from './stores/authStore';
import { useTenantStore } from './stores/tenantStore';

// Layout & Components
import MainLayout from './layout/MainLayout';
import RoleGuard from './components/RoleGuard';
// Pages
import LoginPage from './pages/LoginPage';
import LoginSuccess from './pages/LoginSuccess';
import Dashboard from './pages/matriz/Dashboard';
import Disciplina from './pages/matriz/Disciplina';
import Academico from './pages/matriz/Academico';
import Colaboradores from './pages/matriz/Colaboradores';
import Financeiro from './pages/matriz/Financeiro';
import Alunos from './pages/matriz/Alunos';
import NotificationsPage from './pages/NotificationsPage';
import ClassesPage from './pages/ClassesPage';
import SeletorEscolas from './pages/escola/SeletorEscolas';
import PainelEscolaLayout from './pages/escola/PainelEscolaLayout';
import OverviewGestor from './pages/escola/gestor/Overview';
import OverviewFuncionario from './pages/escola/funcionario/Overview';
import OverviewAluno from './pages/escola/aluno/Overview';
import SchoolAlunos from './pages/escola/gestor/SchoolAlunos';
import SchoolTurmas from './pages/escola/gestor/SchoolTurmas';
import SchoolCronograma from './pages/escola/gestor/SchoolCronograma';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Guards
const ProtectedRoute = ({ children, isRestoringSession }: { children: React.ReactNode; isRestoringSession: boolean }) => {
  const token = useAuthStore((state) => state.token);
  if (isRestoringSession) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const TenantProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const tenant = useTenantStore((state) => state.currentTenant);
  const user = useAuthStore((state) => state.user);
  const setCurrentTenant = useTenantStore((state) => state.setCurrentTenant);
  const setEscolaSelecionada = useAuthStore((state) => state.setEscolaSelecionada);

  if (!tenant && user?.tenants && user.tenants.length > 0) {
    // Fallback automático para a Matriz
    const matriz = user.tenants[0];
    setCurrentTenant(matriz);
    setEscolaSelecionada(matriz.id);
    return <>{children}</>;
  }

  if (!tenant) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

function RoleSpecificOverview() {
  const role = useAuthStore((state) => state.role);
  if (role === 'GESTOR' || role === 'ADMIN' || role === 'MANAGER') return <OverviewGestor />;
  if (role === 'EMPLOYEE' || role === 'TEACHER') return <OverviewFuncionario />;
  if (role === 'STUDENT') return <OverviewAluno />;
  return null;
}

function App() {
  // Initialize to true if we already know we need to restore the session,
  // so we never call setIsRestoringSession(true) synchronously inside an effect.
  const [isRestoringSession, setIsRestoringSession] = useState(() => {
    const { user, token } = useAuthStore.getState();
    return !!(user && !token);
  });

  useEffect(() => {
    const { user, token, setAuth, clearAuth } = useAuthStore.getState();
    // If user data is persisted but token is absent (token is excluded from localStorage),
    // try to restore the access token from the HttpOnly cookie.
    if (user && !token) {
      fetch(`${API_URL}/auth/token`, { credentials: 'include' })
        .then((res) => (res.ok ? res.json() : Promise.reject()))
        .then(({ accessToken, user: freshUser }) => {
          setAuth(accessToken, {
            id: freshUser.userId,
            email: freshUser.email,
            name: freshUser.name || freshUser.email,
            role: freshUser.role,
            tenants: freshUser.tenants,
          });
        })
        .catch(() => clearAuth())
        .finally(() => setIsRestoringSession(false));
    }
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/success" element={<LoginSuccess />} />

        <Route
          path="/select-tenant"
          element={
            <ProtectedRoute isRestoringSession={isRestoringSession}>
              <SeletorEscolas />
            </ProtectedRoute>
          }
        />

        <Route
          path="/"
          element={
            <ProtectedRoute isRestoringSession={isRestoringSession}>
              <TenantProtectedRoute>
                <MainLayout />
              </TenantProtectedRoute>
            </ProtectedRoute>
          }
        >
          <Route index element={<Dashboard />} />

          {/* Rotas Protegidas do Gestor */}
          <Route path="academic" element={<RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER']}><Academico /></RoleGuard>} />
          <Route path="subjects" element={<RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER']}><Disciplina /></RoleGuard>} />
          <Route path="students" element={<RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER']}><Alunos /></RoleGuard>} />
          <Route path="classes" element={<RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER']}><ClassesPage /></RoleGuard>} />
          <Route path="employees" element={<RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER']}><Colaboradores /></RoleGuard>} />
          <Route path="finance" element={<RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER']}><Financeiro /></RoleGuard>} />

          {/* Módulo Escola (Visão Local) */}
          <Route path="escola/:id" element={<PainelEscolaLayout />}>
             <Route index element={<Navigate to="painel" replace />} />
             <Route path="painel" element={
               <RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'TEACHER', 'STUDENT']}>
                  <RoleSpecificOverview />
               </RoleGuard>
             } />
             <Route path="alunos" element={
               <RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER']}>
                  <SchoolAlunos />
               </RoleGuard>
             } />
             <Route path="turmas" element={
               <RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'TEACHER', 'STUDENT']}>
                  <SchoolTurmas />
               </RoleGuard>
             } />
             <Route path="cronograma" element={
               <RoleGuard allowedRoles={['GESTOR', 'ADMIN', 'MANAGER', 'EMPLOYEE', 'TEACHER', 'STUDENT']}>
                  <SchoolCronograma />
               </RoleGuard>
             } />
          </Route>

          {/* Rotas Globais */}
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
