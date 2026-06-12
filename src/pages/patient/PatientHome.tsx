import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CalendarPlus,
  QrCode,
  Wallet,
  FileText,
  Clock,
  ChevronRight,
  AlertCircle,
  Stethoscope,
  CreditCard,
  FileUp,
  Star,
  ListTodo,
  CheckCircle2,
} from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { Appointment, AppointmentStatus, TodoItem } from '@/types';

const statusConfig: Record<AppointmentStatus, { label: string; bg: string; text: string; border: string; dot: string }> = {
  pending: { label: '待就诊', bg: 'bg-blue-50', text: 'text-medical-600', border: 'border-medical-200', dot: 'bg-medical-500' },
  checked_in: { label: '候诊中', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200', dot: 'bg-warning' },
  in_progress: { label: '就诊中', bg: 'bg-cyan-50', text: 'text-cyan-600', border: 'border-cyan-200', dot: 'bg-cyan-500' },
  completed: { label: '已完成', bg: 'bg-slate-50', text: 'text-slate-500', border: 'border-slate-200', dot: 'bg-slate-400' },
  cancelled: { label: '已取消', bg: 'bg-red-50', text: 'text-red-500', border: 'border-red-200', dot: 'bg-danger' },
};

const quickActions = [
  { key: 'appointment', label: '预约挂号', desc: '选择科室医生', icon: CalendarPlus, color: 'from-medical-500 to-medical-600', path: '/patient/appointment' },
  { key: 'checkin', label: '扫码签到', desc: '获取排队序号', icon: QrCode, color: 'from-cyan-500 to-cyan-600', path: '/patient/checkin' },
  { key: 'payment', label: '在线缴费', desc: '医保自动结算', icon: Wallet, color: 'from-emerald-500 to-emerald-600', path: '/patient/payment' },
  { key: 'records', label: '病历评价', desc: '上传评价服务', icon: FileText, color: 'from-violet-500 to-violet-600', path: '/patient/records' },
];

const timeSlotLabel: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
};

const todoTypeConfig: Record<TodoItem['type'], { label: string; icon: any; color: string; bg: string; path: string }> = {
  checkin: { label: '待签到', icon: QrCode, color: 'text-cyan-600', bg: 'bg-cyan-100', path: '/patient/checkin' },
  payment: { label: '待缴费', icon: Wallet, color: 'text-emerald-600', bg: 'bg-emerald-100', path: '/patient/payment' },
  examination: { label: '待预约检查', icon: CalendarPlus, color: 'text-violet-600', bg: 'bg-violet-100', path: '/patient/exam-booking' },
  medicine: { label: '待取药', icon: FileUp, color: 'text-amber-600', bg: 'bg-amber-100', path: '/patient/payment' },
  review: { label: '待评价', icon: Star, color: 'text-warning', bg: 'bg-warning/20', path: '/patient/records' },
};

export default function PatientHome() {
  const navigate = useNavigate();
  const currentUser = useHospitalStore((s) => s.currentUser);
  const appointments = useHospitalStore((s) => s.appointments);
  const payments = useHospitalStore((s) => s.payments);
  const getDoctorById = useHospitalStore((s) => s.getDoctorById);
  const getDepartmentById = useHospitalStore((s) => s.getDepartmentById);
  const getTodosByUser = useHospitalStore((s) => s.getTodosByUser);

  const myAppointments = useMemo(() => {
    if (!currentUser) return [];
    return appointments
      .filter((a) => a.userId === currentUser.id)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [appointments, currentUser]);

  const unpaidPayments = useMemo(() => {
    if (!currentUser) return [];
    const myAptIds = myAppointments.map((a) => a.id);
    return payments.filter((p) => myAptIds.includes(p.appointmentId) && p.status === 'unpaid');
  }, [payments, myAppointments, currentUser]);

  const myTodos = useMemo(() => {
    if (!currentUser) return [];
    return getTodosByUser(currentUser.id);
  }, [getTodosByUser, currentUser]);

  const todoProgress = useMemo(() => {
    const total = myTodos.length;
    const completed = myTodos.filter((t) => t.status === 'completed').length;
    const pending = total - completed;
    return { total, completed, pending, percentage: total > 0 ? Math.round((completed / total) * 100) : 0 };
  }, [myTodos]);

  const today = new Date();
  const dateStr = `${today.getFullYear()}年${today.getMonth() + 1}月${today.getDate()}日`;
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  const weekStr = weekDays[today.getDay()];

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 stagger-1">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-800">
            你好，{currentUser?.name || '用户'} 👋
          </h1>
          <p className="text-slate-500 mt-1 text-sm">{dateStr} {weekStr} · 祝您身体健康</p>
        </div>
      </div>

      {unpaidPayments.length > 0 && (
        <div className="card card-hover p-5 border-l-4 border-l-danger bg-gradient-to-r from-red-50 to-white stagger-2 animate-fade-in-up">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center flex-shrink-0">
              <AlertCircle className="w-6 h-6 text-danger" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-slate-800">您有 {unpaidPayments.length} 笔待缴费订单</h3>
              <p className="text-sm text-slate-500 mt-1">
                合计待支付金额 ¥{unpaidPayments.reduce((sum, p) => sum + p.selfPayAmount, 0).toFixed(2)}
              </p>
            </div>
            <button
              onClick={() => navigate('/patient/payment')}
              className="btn-danger px-5 py-2 text-sm flex items-center gap-2 flex-shrink-0"
            >
              <CreditCard className="w-4 h-4" />
              立即缴费
            </button>
          </div>
        </div>
      )}

      {myTodos.length > 0 && (
        <div className="card overflow-hidden stagger-2 animate-fade-in-up">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                <ListTodo className="w-5 h-5 text-indigo-500" />
              </div>
              <div>
                <h2 className="font-semibold text-slate-800">待办事项</h2>
                <p className="text-xs text-slate-500">
                  {todoProgress.total}项待办，已完成{todoProgress.completed}项
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-full transition-all duration-500"
                  style={{ width: `${todoProgress.percentage}%` }}
                />
              </div>
              <span className="text-sm font-medium text-slate-600">{todoProgress.percentage}%</span>
            </div>
          </div>

          <div className="divide-y divide-slate-100">
            {myTodos.map((todo: TodoItem, idx: number) => {
              const config = todoTypeConfig[todo.type];
              const Icon = config.icon;
              const isCompleted = todo.status === 'completed';
              return (
                <button
                  key={todo.id}
                  onClick={() => navigate(config.path)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors text-left animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`w-10 h-10 rounded-xl ${config.bg} flex items-center justify-center flex-shrink-0 transition-all ${isCompleted ? 'opacity-50' : ''}`}>
                    {isCompleted ? (
                      <CheckCircle2 className={`w-5 h-5 ${config.color}`} />
                    ) : (
                      <Icon className={`w-5 h-5 ${config.color}`} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className={`font-medium ${isCompleted ? 'text-slate-400 line-through' : 'text-slate-800'}`}>
                        {todo.title}
                      </h3>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${config.bg} ${config.color}`}>
                        {config.label}
                      </span>
                    </div>
                    <p className={`text-sm ${isCompleted ? 'text-slate-300' : 'text-slate-500'}`}>
                      {todo.description}
                    </p>
                  </div>
                  <ChevronRight className={`w-5 h-5 flex-shrink-0 ${isCompleted ? 'text-slate-300' : 'text-slate-400'}`} />
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 stagger-2">
        {quickActions.map((action, idx) => {
          const Icon = action.icon;
          return (
            <button
              key={action.key}
              onClick={() => navigate(action.path)}
              className={`card card-hover p-5 text-left group animate-fade-in-up stagger-${idx + 1}`}
              style={{ animationDelay: `${(idx + 1) * 60}ms` }}
            >
              <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${action.color} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                <Icon className="w-7 h-7 text-white" />
              </div>
              <h3 className="font-semibold text-slate-800 text-base">{action.label}</h3>
              <p className="text-sm text-slate-500 mt-1 flex items-center">
                {action.desc}
                <ChevronRight className="w-4 h-4 ml-auto opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
              </p>
            </button>
          );
        })}
      </div>

      <div className="card overflow-hidden stagger-3 animate-fade-in-up">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-medical-50 flex items-center justify-center">
              <Stethoscope className="w-5 h-5 text-medical-500" />
            </div>
            <div>
              <h2 className="font-semibold text-slate-800">我的挂号单</h2>
              <p className="text-xs text-slate-500">共 {myAppointments.length} 条记录</p>
            </div>
          </div>
        </div>

        <div className="divide-y divide-slate-100">
          {myAppointments.length === 0 ? (
            <div className="py-16 text-center">
              <div className="w-20 h-20 mx-auto rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <CalendarPlus className="w-10 h-10 text-slate-300" />
              </div>
              <p className="text-slate-400">暂无挂号记录</p>
              <button
                onClick={() => navigate('/patient/appointment')}
                className="btn-primary mt-4 text-sm"
              >
                立即预约挂号
              </button>
            </div>
          ) : (
            myAppointments.map((apt: Appointment, idx: number) => {
              const doctor = getDoctorById(apt.doctorId);
              const dept = getDepartmentById(apt.departmentId);
              const status = statusConfig[apt.status];
              return (
                <div
                  key={apt.id}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-slate-50 transition-colors animate-fade-in-up"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className={`w-1 self-stretch rounded-full ${status.dot} flex-shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-medium text-slate-800">{dept?.name || '未知科室'}</h3>
                      <span className={`badge ${status.bg} ${status.text} border ${status.border}`}>
                        {status.label}
                      </span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-slate-500">
                      <span className="flex items-center gap-1">
                        <Stethoscope className="w-3.5 h-3.5" />
                        {doctor?.name || '未知医生'} · {doctor?.title}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {apt.date} {timeSlotLabel[apt.timeSlot] || apt.timeSlot}
                      </span>
                      {apt.sequenceNo && (
                        <span className="text-medical-600 font-medium">
                          排队序号 #{apt.sequenceNo}
                        </span>
                      )}
                    </div>
                  </div>
                  {(apt.status === 'pending' || apt.status === 'checked_in') && (
                    <button
                      onClick={() => {
                        if (apt.status === 'pending') navigate('/patient/checkin');
                        else navigate('/patient/checkin');
                      }}
                      className="btn-secondary text-sm px-4 py-1.5 flex items-center gap-1.5"
                    >
                      {apt.status === 'pending' ? (
                        <>
                          <QrCode className="w-4 h-4" />
                          去签到
                        </>
                      ) : (
                        <>
                          <Clock className="w-4 h-4" />
                          查看叫号
                        </>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  )}
                  {apt.status === 'completed' && (
                    <button
                      onClick={() => navigate('/patient/records')}
                      className="btn-secondary text-sm px-4 py-1.5"
                    >
                      查看详情
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
