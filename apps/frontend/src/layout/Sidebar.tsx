import React from 'react';
import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  BookOpen, 
  School, 
  Users, 
  CreditCard
} from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MenuItem {
  name: string;
  icon: React.ElementType;
  href: string;
  roles: string[];
}

const Sidebar: React.FC = () => {
  const role = useAuthStore((state) => state.role);

  const menuItems: MenuItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, href: '/', roles: ['GESTOR'] },
    { name: 'Disciplina', icon: BookOpen, href: '/subjects', roles: ['GESTOR'] },
    { name: 'Alunos', icon: Users, href: '/students', roles: ['GESTOR'] },
    { name: 'Acadêmico', icon: School, href: '/academic', roles: ['GESTOR'] },
    { name: 'Colaboradores', icon: Users, href: '/employees', roles: ['GESTOR'] },
    { name: 'Financeiro', icon: CreditCard, href: '/finance', roles: ['GESTOR'] },
  ];

  const filteredItems = menuItems.filter(item => role && item.roles.includes(role));

  return (
    <aside className="w-72 bg-surface border-r border-border hidden lg:flex flex-col">
      <div className="p-8 flex flex-col h-full">
        <div className="flex items-center gap-3 mb-10">
          <div className="h-10 w-10 flex items-center justify-center rounded-xl bg-primary shadow-glow">
            <School className="text-white" size={24} />
          </div>
          <span className="font-bold text-xl tracking-tight text-white italic">
            Gestor<span className="text-primary not-italic">Escolar</span>
          </span>
        </div>

        <nav className="flex-1 space-y-2">
          {filteredItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              className={({ isActive }) => cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 group relative",
                isActive 
                  ? "bg-primary/10 text-primary" 
                  : "text-text-secondary hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon size={20} />
              <span className="font-semibold text-sm">{item.name}</span>
            </NavLink>
          ))}
        </nav>
      </div>
    </aside>
  );
};

export default Sidebar;
