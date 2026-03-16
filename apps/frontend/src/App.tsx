import React from 'react';
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

// Guards
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
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
  if (role === 'GESTOR') return <OverviewGestor />;
  if (role === 'FUNCIONARIO') return <OverviewFuncionario />;
  if (role === 'ALUNO') return <OverviewAluno />;
  return null;
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/login/success" element={<LoginSuccess />} />
        
        <Route 
          path="/select-tenant" 
          element={
            <ProtectedRoute>
              <SeletorEscolas />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <TenantProtectedRoute>
                <MainLayout />
              </TenantProtectedRoute>
            </ProtectedRoute>
          } 
        >
          <Route index element={<Dashboard />} />
          
          {/* Rotas Protegidas do Gestor */}
          <Route path="academic" element={<RoleGuard allowedRoles={['GESTOR']}><Academico /></RoleGuard>} />
          <Route path="subjects" element={<RoleGuard allowedRoles={['GESTOR']}><Disciplina /></RoleGuard>} />
          <Route path="students" element={<RoleGuard allowedRoles={['GESTOR']}><Alunos /></RoleGuard>} />
          <Route path="classes" element={<RoleGuard allowedRoles={['GESTOR']}><ClassesPage /></RoleGuard>} />
          <Route path="employees" element={<RoleGuard allowedRoles={['GESTOR']}><Colaboradores /></RoleGuard>} />
          <Route path="finance" element={<RoleGuard allowedRoles={['GESTOR']}><Financeiro /></RoleGuard>} />
          
          {/* Módulo Escola (Visão Local) */}
          <Route path="escola/:id" element={<PainelEscolaLayout />}>
             <Route index element={<Navigate to="painel" replace />} />
             <Route path="painel" element={
               <RoleGuard allowedRoles={['GESTOR', 'FUNCIONARIO', 'ALUNO']}>
                  <RoleSpecificOverview />
               </RoleGuard>
             } />
             <Route path="alunos" element={
               <RoleGuard allowedRoles={['GESTOR']}>
                  <SchoolAlunos />
               </RoleGuard>
             } />
             <Route path="turmas" element={
               <RoleGuard allowedRoles={['GESTOR', 'FUNCIONARIO', 'ALUNO']}>
                  <SchoolTurmas />
               </RoleGuard>
             } />
             <Route path="cronograma" element={
               <RoleGuard allowedRoles={['GESTOR', 'FUNCIONARIO', 'ALUNO']}>
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
