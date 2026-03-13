import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import LoginSuccess from './pages/LoginSuccess';
import TenantSelectionPage from './pages/TenantSelectionPage';
import DashboardLayout from './components/layout/DashboardLayout';
import { useAuthStore } from './stores/authStore';
import { useTenantStore } from './stores/tenantStore';

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
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Bem-vindo ao Dashboard</h2>
              <p className="text-gray-600">Selecione uma opção no menu lateral para começar.</p>
            </div>
          } />
          <Route path="academic" element={<div>Módulo Acadêmico (Em Breve)</div>} />
          <Route path="subjects" element={<div>Disciplinas (Em Breve)</div>} />
          <Route path="employees" element={<div>RH / Colaboradores (Em Breve)</div>} />
          <Route path="finance" element={<div>Financeiro (Em Breve)</div>} />
          <Route path="notifications" element={<div>Notificações (Em Breve)</div>} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
