import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  User,
  Lock,
  LogIn,
  Stethoscope,
  UserCircle,
  BarChart3,
  Settings,
  Hospital,
} from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { UserRole } from '@/types';

const roleOptions: { key: UserRole; label: string; icon: typeof User; desc: string }[] = [
  { key: 'patient', label: '患者', icon: UserCircle, desc: '预约挂号、查看报告' },
  { key: 'doctor', label: '医生', icon: Stethoscope, desc: '接诊、开处方' },
  { key: 'director', label: '科室主任', icon: BarChart3, desc: '科室数据管理' },
  { key: 'admin', label: '管理员', icon: Settings, desc: '系统配置、报表' },
];

const accountMap: Record<UserRole, string> = {
  patient: 'p1',
  doctor: 'u1',
  director: 'u5',
  admin: 'admin1',
};

export default function Login() {
  const navigate = useNavigate();
  const { login } = useHospitalStore();

  const [selectedRole, setSelectedRole] = useState<UserRole>('patient');
  const [account, setAccount] = useState(accountMap['patient']);
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');

  const handleRoleChange = (role: UserRole) => {
    setSelectedRole(role);
    setAccount(accountMap[role]);
    setError('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const ok = login(selectedRole, account, password);
    if (ok) {
      if (selectedRole === 'patient') navigate('/patient');
      else if (selectedRole === 'doctor') navigate('/doctor');
      else if (selectedRole === 'director') navigate('/director');
      else navigate('/admin');
    } else {
      setError('账号或密码错误');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-medical-50 via-white to-cyan-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-medical-500 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-hover">
            <Hospital className="w-9 h-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-800">智慧医院管理系统</h1>
          <p className="text-slate-500 mt-1">请选择身份登录</p>
        </div>

        <div className="card p-6">
          <div className="grid grid-cols-2 gap-3 mb-6">
            {roleOptions.map((opt) => {
              const Icon = opt.icon;
              const active = selectedRole === opt.key;
              return (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleRoleChange(opt.key)}
                  className={`p-3 rounded-xl text-left transition-all border-2 ${
                    active
                      ? 'border-medical-400 bg-medical-50 shadow-sm'
                      : 'border-slate-100 bg-white hover:border-slate-200'
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center mb-2 ${
                      active ? 'bg-medical-500' : 'bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-5 h-5 ${active ? 'text-white' : 'text-slate-500'}`} />
                  </div>
                  <p
                    className={`font-medium text-sm ${
                      active ? 'text-medical-700' : 'text-slate-700'
                    }`}
                  >
                    {opt.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">{opt.desc}</p>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">账号</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={account}
                  onChange={(e) => setAccount(e.target.value)}
                  className="input-field pl-10"
                  placeholder="请输入账号"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">密码</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input-field pl-10"
                  placeholder="请输入密码"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-danger text-center">{error}</p>
            )}

            <button type="submit" className="w-full btn-primary flex items-center justify-center gap-2">
              <LogIn className="w-4 h-4" />
              登 录
            </button>

            <p className="text-xs text-center text-slate-400 pt-2">
              提示：默认密码均为 123456，可直接使用预设账号登录体验
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
