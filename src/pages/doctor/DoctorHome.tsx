import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  UserCircle,
  Clock,
  CheckCircle2,
  Users,
  ChevronRight,
  AlertCircle,
  FileText,
  Volume2,
} from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { Appointment } from '@/types';

export default function DoctorHome() {
  const navigate = useNavigate();
  const {
    currentUser,
    appointments,
    currentCallingNumber,
    doctors,
    getAppointmentsByDoctor,
    updateAppointmentStatus,
    callNextNumber,
  } = useHospitalStore();

  const [today] = useState(() => new Date().toISOString().split('T')[0]);

  const doctorInfo = useMemo(() => {
    if (!currentUser?.doctorId) return null;
    return doctors.find((d) => d.id === currentUser.doctorId);
  }, [currentUser, doctors]);

  const doctorAppointments = useMemo(() => {
    if (!currentUser?.doctorId) return [];
    return getAppointmentsByDoctor(currentUser.doctorId).filter((a) => a.date === today);
  }, [currentUser, getAppointmentsByDoctor, today]);

  const waitingList = useMemo(
    () => doctorAppointments.filter((a) => a.status === 'checked_in'),
    [doctorAppointments]
  );
  const inProgressList = useMemo(
    () => doctorAppointments.filter((a) => a.status === 'in_progress'),
    [doctorAppointments]
  );
  const completedList = useMemo(
    () => doctorAppointments.filter((a) => a.status === 'completed'),
    [doctorAppointments]
  );

  const currentDeptCalling = currentUser?.departmentId
    ? currentCallingNumber[currentUser.departmentId] || 0
    : 0;

  const patientNameMap: Record<string, string> = {
    p1: '张明',
    p2: '李华',
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  const handleCallNext = (apt: Appointment) => {
    if (currentUser?.departmentId) {
      callNextNumber(currentUser.departmentId);
    }
    updateAppointmentStatus(apt.id, 'in_progress');
  };

  const handleComplete = (apt: Appointment) => {
    updateAppointmentStatus(apt.id, 'completed');
  };

  const todaySlots = useMemo(() => {
    const slots = new Set<string>();
    doctorAppointments.forEach((a) => {
      if (a.timeSlot === 'morning') slots.add('上午 08:00-12:00');
      if (a.timeSlot === 'afternoon') slots.add('下午 14:00-17:30');
      if (a.timeSlot === 'evening') slots.add('晚上 18:00-20:30');
    });
    return Array.from(slots);
  }, [doctorAppointments]);

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-medical-500" />
              医生工作台
            </h1>
            <p className="text-slate-500 mt-1">
              {doctorInfo?.name} · {doctorInfo?.title} · {today}
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/doctor/prescription')}
              className="btn-secondary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              开处方
            </button>
            <button
              onClick={() => navigate('/doctor/records')}
              className="btn-primary flex items-center gap-2"
            >
              <FileText className="w-4 h-4" />
              病历管理
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">今日排班</p>
                <p className="text-xl font-bold text-slate-800 mt-1">{todaySlots.length} 个时段</p>
              </div>
              <div className="w-12 h-12 bg-medical-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-medical-500" />
              </div>
            </div>
            <div className="mt-3 text-xs text-slate-400 space-y-1">
              {todaySlots.map((s, i) => (
                <div key={i}>· {s}</div>
              ))}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">已接诊</p>
                <p className="text-xl font-bold text-success mt-1">{completedList.length}</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-success" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">待接诊</p>
                <p className="text-xl font-bold text-warning mt-1">{waitingList.length}</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">当前叫号</p>
                <p className="text-3xl font-bold text-medical-600 mt-1">{currentDeptCalling}</p>
              </div>
              <div className="w-12 h-12 bg-medical-50 rounded-xl flex items-center justify-center">
                <Volume2 className="w-6 h-6 text-medical-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6">
          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning" />
                待叫号
                <span className="badge bg-amber-100 text-amber-700">{waitingList.length}</span>
              </h2>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
              {waitingList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无等待患者</p>
                </div>
              ) : (
                waitingList.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-medical-200 hover:bg-medical-50/30 transition-all"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <UserCircle className="w-5 h-5 text-slate-400" />
                          <span className="font-medium text-slate-800">
                            {patientNameMap[apt.userId] || '患者'}
                          </span>
                          <span className="badge bg-medical-100 text-medical-700">
                            #{apt.sequenceNo}
                          </span>
                        </div>
                        <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatTime(apt.createdAt)} 挂号
                        </p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          挂号单号：{apt.registrationNo}
                        </p>
                      </div>
                      <button
                        onClick={() => handleCallNext(apt)}
                        className="relative px-4 py-2 bg-medical-500 text-white text-sm rounded-lg font-medium
                          hover:bg-medical-600 transition-all flex items-center gap-1.5
                          before:absolute before:inset-0 before:rounded-lg before:bg-medical-400 before:animate-ping before:opacity-40"
                      >
                        <Volume2 className="w-4 h-4" />
                        叫号
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <Stethoscope className="w-5 h-5 text-medical-500" />
                就诊中
                <span className="badge bg-medical-100 text-medical-700">{inProgressList.length}</span>
              </h2>
            </div>
            <div className="space-y-3 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
              {inProgressList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <Stethoscope className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无就诊中患者</p>
                </div>
              ) : (
                inProgressList.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-5 rounded-lg bg-gradient-to-br from-medical-50 to-cyan-50 border-2 border-medical-200"
                  >
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-14 h-14 rounded-full bg-white shadow-sm flex items-center justify-center">
                        <UserCircle className="w-10 h-10 text-medical-400" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-lg text-slate-800">
                          {patientNameMap[apt.userId] || '患者'}
                        </h3>
                        <p className="text-sm text-slate-500">
                          序号 #{apt.sequenceNo} · {apt.registrationNo}
                        </p>
                      </div>
                      <span className="badge bg-medical-500 text-white ml-auto">就诊中</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 mb-4 text-sm">
                      <div className="p-3 bg-white/70 rounded-lg">
                        <p className="text-slate-400 text-xs">就诊时段</p>
                        <p className="text-slate-700 font-medium mt-0.5">
                          {apt.timeSlot === 'morning'
                            ? '上午'
                            : apt.timeSlot === 'afternoon'
                            ? '下午'
                            : '晚上'}
                        </p>
                      </div>
                      <div className="p-3 bg-white/70 rounded-lg">
                        <p className="text-slate-400 text-xs">挂号时间</p>
                        <p className="text-slate-700 font-medium mt-0.5">
                          {formatTime(apt.createdAt)}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => navigate('/doctor/prescription')}
                        className="flex-1 btn-secondary flex items-center justify-center gap-1.5 text-sm py-2"
                      >
                        <FileText className="w-4 h-4" />
                        开处方
                      </button>
                      <button
                        onClick={() => handleComplete(apt)}
                        className="flex-1 btn-success flex items-center justify-center gap-1.5 text-sm py-2"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        完成就诊
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-success" />
                已完成
                <span className="badge bg-emerald-100 text-emerald-700">{completedList.length}</span>
              </h2>
            </div>
            <div className="space-y-2 max-h-[600px] overflow-y-auto scrollbar-thin pr-2">
              {completedList.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>暂无已完成就诊</p>
                </div>
              ) : (
                completedList.map((apt) => (
                  <div
                    key={apt.id}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-all cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                          <UserCircle className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm text-slate-700">
                            {patientNameMap[apt.userId] || '患者'}
                          </p>
                          <p className="text-xs text-slate-400">
                            #{apt.sequenceNo} · {formatTime(apt.createdAt)}
                          </p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-medical-500 transition-colors" />
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
