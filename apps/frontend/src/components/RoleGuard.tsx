import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

interface RoleGuardProps {
  children: React.ReactNode;
  allowedRoles: ('GESTOR' | 'FUNCIONARIO' | 'ALUNO')[];
}

const RoleGuard: React.FC<RoleGuardProps> = ({ children, allowedRoles }) => {
  const role = useAuthStore((state) => state.role);

  if (!role || !allowedRoles.includes(role)) {
    // Se não tiver permissão, redireciona para a home (onde o layout tratará o pouso)
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
};

export default RoleGuard;
