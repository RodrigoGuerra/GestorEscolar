import React from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';

const MainLayout: React.FC = () => {
  return (
    <div className="min-h-screen bg-secondary flex overflow-hidden font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0 relative">
        <Header />
        <section className="flex-1 p-6 lg:p-10 overflow-y-auto custom-scrollbar">
          <Outlet />
        </section>
      </div>
    </div>
  );
};

export default MainLayout;
