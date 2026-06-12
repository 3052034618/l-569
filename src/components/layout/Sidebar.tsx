import {
  Home,
  CalendarDays,
  QrCode,
  CreditCard,
  FileText,
  Stethoscope,
  ClipboardList,
  BarChart3,
  Settings,
  FileBarChart,
  Bell,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import type { UserRole } from '@/types';
import type { LucideIcon } from 'lucide-react';

interface NavItem {
  path: string;
  label: string;
  icon: LucideIcon;
}

const navConfig: Record<UserRole, NavItem[]> = {
  patient: [
    { path: '/patient', label: '首页', icon: Home },
    { path: '/patient/appointment', label: '预约挂号', icon: CalendarDays },
    { path: '/patient/checkin', label: '签到叫号', icon: QrCode },
    { path: '/patient/payment', label: '就诊缴费', icon: CreditCard },
    { path: '/patient/records', label: '病历评价', icon: FileText },
  ],
  doctor: [
    { path: '/doctor', label: '工作台', icon: Stethoscope },
    { path: '/doctor/prescription', label: '开单处方', icon: ClipboardList },
    { path: '/doctor/records', label: '患者病历', icon: FileText },
  ],
  director: [
    { path: '/director', label: '科室仪表盘', icon: BarChart3 },
  ],
  admin: [
    { path: '/admin', label: '系统控制台', icon: Settings },
    { path: '/admin/reports', label: '月度报表', icon: FileBarChart },
  ],
};

const commonNav: NavItem[] = [
  { path: '/messages', label: '消息中心', icon: Bell },
];

interface SidebarProps {
  role: UserRole;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

export default function Sidebar({ role, collapsed, onToggleCollapse }: SidebarProps) {
  const location = useLocation();
  const navItems = navConfig[role];
  const allNavItems = [...navItems, ...commonNav];

  const isActive = (path: string) => {
    if (path === '/messages') {
      return location.pathname === '/messages';
    }
    return location.pathname === path || location.pathname.startsWith(path + '/');
  };

  return (
    <aside
      className={`flex flex-col bg-white border-r border-slate-200 shadow-card transition-all duration-300 ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-100">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-medical-500 to-cyan-500 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg gradient-text">仁和医院</span>
          </div>
        )}
        {collapsed && (
          <div className="w-full flex justify-center">
            <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-medical-500 to-cyan-500 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-white" />
            </div>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="hidden md:flex items-center justify-center w-7 h-7 rounded-md hover:bg-slate-100 transition-colors text-slate-500 hover:text-medical-600"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      <nav className="flex-1 py-4 overflow-y-auto scrollbar-thin">
        <div className="px-3 space-y-1">
          {allNavItems.map((item) => {
            const active = isActive(item.path);
            const Icon = item.icon;
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  active
                    ? 'bg-medical-50 text-medical-600 font-medium shadow-sm'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-medical-600'
                }`}
                title={collapsed ? item.label : undefined}
              >
                <Icon
                  className={`w-5 h-5 flex-shrink-0 transition-transform duration-200 ${
                    active ? 'text-medical-600' : 'text-slate-400 group-hover:text-medical-500'
                  }`}
                />
                {!collapsed && <span className="text-sm">{item.label}</span>}
                {active && !collapsed && (
                  <span className="ml-auto w-1.5 h-1.5 rounded-full bg-medical-500" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>

      {!collapsed && (
        <div className="p-4 border-t border-slate-100">
          <div className="bg-gradient-to-br from-medical-50 to-cyan-50 rounded-lg p-3">
            <p className="text-xs text-slate-500 mb-1">医疗服务热线</p>
            <p className="text-sm font-semibold text-medical-600">400-888-6666</p>
          </div>
        </div>
      )}
    </aside>
  );
}
