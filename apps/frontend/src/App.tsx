import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LoginSuccess from './pages/LoginSuccess';
import TenantSelectionPage from './pages/TenantSelectionPage';
import DashboardLayout from './components/layout/DashboardLayout';
import { useAuthStore } from './stores/authStore';
import { useTenantStore } from './stores/tenantStore';
import AcademicPage from './pages/AcademicPage';
import SubjectsPage from './pages/SubjectsPage';
import EmployeesPage from './pages/EmployeesPage';
import FinancePage from './pages/FinancePage';
import NotificationsPage from './pages/NotificationsPage';
import ClassesPage from './pages/ClassesPage';
import { School, Users, LayoutDashboard } from 'lucide-react';
import Card from './components/ui/Card';

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const token = useAuthStore((state) => state.token);
  if (!token) return <Navigate to="/login" replace />;
  return <>{children}</>;
};

const TenantProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const tenant = useTenantStore((state) => state.currentTenant);
  if (!tenant) return <Navigate to="/select-tenant" replace />;
  return <>{children}</>;
};

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
              <TenantSelectionPage />
            </ProtectedRoute>
          } 
        />

        <Route 
          path="/" 
          element={
            <ProtectedRoute>
              <TenantProtectedRoute>
                <DashboardLayout />
              </TenantProtectedRoute>
            </ProtectedRoute>
          } 
        >
          <Route index element={
            <div className="max-w-4xl mx-auto py-12 px-4 text-center animate-in fade-in slide-in-from-bottom-8 duration-700">
              <div className="h-20 w-20 bg-primary/10 rounded-2xl flex items-center justify-center text-primary mx-auto mb-8 shadow-glow">
                <LayoutDashboard size={40} />
              </div>
              <h2 className="text-4xl font-extrabold text-white mb-6 tracking-tight">Bem-vindo ao seu <span className="text-primary italic">Dashboard</span></h2>
              <p className="text-xl text-text-secondary mb-12 max-w-2xl mx-auto">
                Explore as ferramentas de gestão educacional através do menu lateral. 
                Estamos aqui para otimizar sua jornada acadêmica.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                <Card hover className="bg-white/5 border-white/10 p-8 group">
                  <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary mb-6 transition-transform group-hover:scale-110">
                    <School size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Visão Geral</h3>
                  <p className="text-text-secondary">Monitore o desempenho das suas unidades em tempo real com métricas detalhadas.</p>
                </Card>
                <Card hover className="bg-white/5 border-white/10 p-8 group">
                  <div className="h-12 w-12 rounded-xl bg-success/20 flex items-center justify-center text-success mb-6 transition-transform group-hover:scale-110">
                    <Users size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Comunidade</h3>
                  <p className="text-text-secondary">Gerencie professores, alunos e colaboradores de forma integrada e eficiente.</p>
                </Card>
              </div>
            </div>
          } />
          <Route path="academic" element={<AcademicPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="classes" element={<ClassesPage />} />
          <Route path="employees" element={<EmployeesPage />} />
          <Route path="finance" element={<FinancePage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
