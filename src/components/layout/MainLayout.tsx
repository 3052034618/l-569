import { useState, type ReactNode } from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { useHospitalStore } from '@/store';
import Sidebar from './Sidebar';
import TopNav from './TopNav';

interface MainLayoutProps {
  children?: ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const { currentUser } = useHospitalStore();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="flex h-screen bg-[#F0F4F8] overflow-hidden">
      <Sidebar
        role={currentUser.role}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <TopNav />
        <main className="flex-1 overflow-y-auto scrollbar-thin p-4 md:p-6 lg:p-8">
          {children ?? <Outlet />}
        </main>
      </div>
    </div>
  );
}
