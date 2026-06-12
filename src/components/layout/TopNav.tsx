import { Bell, LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useHospitalStore } from '@/store';

const roleLabels: Record<string, { label: string; color: string }> = {
  patient: { label: '患者', color: 'bg-blue-100 text-blue-700' },
  doctor: { label: '医生', color: 'bg-teal-100 text-teal-700' },
  director: { label: '主任', color: 'bg-purple-100 text-purple-700' },
  admin: { label: '管理员', color: 'bg-indigo-100 text-indigo-700' },
};

export default function TopNav() {
  const navigate = useNavigate();
  const { currentUser, getUnreadMessageCount, logout } = useHospitalStore();

  const unreadCount = currentUser ? getUnreadMessageCount(currentUser.id, currentUser.role) : 0;
  const roleInfo = currentUser ? roleLabels[currentUser.role] : null;

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6">
      <div className="flex items-center">
        <h1 className="text-base md:text-lg font-semibold text-slate-800 hidden md:block">
          欢迎回来，{currentUser?.name || '用户'}
        </h1>
      </div>

      <div className="flex items-center gap-2 md:gap-4">
        <button
          onClick={() => navigate('/messages')}
          className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors group"
        >
          <Bell className="w-5 h-5 text-slate-500 group-hover:text-medical-600 transition-colors" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-danger text-white text-[11px] font-medium flex items-center justify-center">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        <div className="h-6 w-px bg-slate-200 hidden md:block" />

        <div className="flex items-center gap-2 md:gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-medical-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
            {currentUser?.avatar ? (
              <img
                src={currentUser.avatar}
                alt={currentUser.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              <User className="w-5 h-5 text-white" />
            )}
          </div>
          <div className="hidden sm:block">
            <p className="text-sm font-medium text-slate-800 leading-tight">
              {currentUser?.name || '未登录'}
            </p>
            {roleInfo && (
              <span className={`badge ${roleInfo.color} mt-0.5`}>{roleInfo.label}</span>
            )}
          </div>
        </div>

        <div className="h-6 w-px bg-slate-200 hidden md:block" />

        <button
          onClick={handleLogout}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-slate-600 hover:bg-red-50 hover:text-danger transition-colors group"
          title="退出登录"
        >
          <LogOut className="w-5 h-5 group-hover:rotate-[-10deg] transition-transform" />
          <span className="hidden md:inline text-sm font-medium">退出</span>
        </button>
      </div>
    </header>
  );
}
