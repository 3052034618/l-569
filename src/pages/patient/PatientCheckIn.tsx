import { useState, useMemo } from 'react';
import { QrCode, CheckCircle, Clock, Users, AlertCircle, ChevronDown } from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { Appointment } from '@/types';

const timeSlotLabel: Record<string, string> = {
  morning: '上午',
  afternoon: '下午',
  evening: '晚上',
};

const announcements = [
  '【公告】今日门诊正常开放，请提前30分钟签到',
  '【温馨提示】请佩戴口罩，保持一米安全距离',
  '【通知】体检中心6月15日设备维护，暂停营业一天',
];

export default function PatientCheckIn() {
  const currentUser = useHospitalStore((s) => s.currentUser);
  const appointments = useHospitalStore((s) => s.appointments);
  const currentCallingNumber = useHospitalStore((s) => s.currentCallingNumber);
  const checkIn = useHospitalStore((s) => s.checkIn);
  const callNextNumber = useHospitalStore((s) => s.callNextNumber);
  const getDoctorById = useHospitalStore((s) => s.getDoctorById);
  const getDepartmentById = useHospitalStore((s) => s.getDepartmentById);

  const [showSuccess, setShowSuccess] = useState<Appointment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [announcementIndex, setAnnouncementIndex] = useState(0);

  const pendingAppointments = useMemo(() => {
    if (!currentUser) return [];
    return appointments.filter(
      (a) => a.userId === currentUser.id && a.status === 'pending'
    );
  }, [appointments, currentUser]);

  const checkedInAppointments = useMemo(() => {
    if (!currentUser) return [];
    return appointments.filter(
      (a) => a.userId === currentUser.id && (a.status === 'checked_in' || a.status === 'in_progress')
    );
  }, [appointments, currentUser]);

  const waitingListByDept = useMemo(() => {
    const result: Record<string, Appointment[]> = {};
    appointments.forEach((a) => {
      if (a.status === 'checked_in') {
        if (!result[a.departmentId]) result[a.departmentId] = [];
        result[a.departmentId].push(a);
      }
    });
    Object.keys(result).forEach((deptId) => {
      result[deptId].sort((a, b) => (a.sequenceNo || 0) - (b.sequenceNo || 0));
    });
    return result;
  }, [appointments]);

  const displayDeptId = Object.keys(waitingListByDept)[0] || 'dep1';
  const waitingList = waitingListByDept[displayDeptId] || [];
  const currentNumber = currentCallingNumber[displayDeptId] || 0;
  const currentAppointment = waitingList.find((a) => a.sequenceNo === currentNumber);
  const myApt = checkedInAppointments.find((a) => a.departmentId === displayDeptId);

  const estimatedWaitTime = useMemo(() => {
    if (!myApt || !myApt.sequenceNo) return 0;
    const ahead = Math.max(0, myApt.sequenceNo - currentNumber - 1);
    return ahead * 15;
  }, [myApt, currentNumber]);

  const handleCheckIn = (aptId: string) => {
    try {
      const result = checkIn(aptId);
      setShowSuccess(result);
      setTimeout(() => setShowSuccess(null), 3000);
    } catch {
      setToast('签到失败，请稍后重试');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const simulateScan = () => {
    if (pendingAppointments.length > 0) {
      handleCheckIn(pendingAppointments[0].id);
    } else {
      setToast('暂无待签到的挂号单');
      setTimeout(() => setToast(null), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 animate-fade-in-up">
          签到叫号
        </h1>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-5 space-y-6">
            <div className="card p-6 animate-fade-in-up stagger-1">
              <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                <QrCode className="w-4 h-4" />
                扫码签到
              </h2>
              <div className="flex flex-col items-center">
                <div className="w-52 h-52 bg-slate-50 border-2 border-dashed border-medical-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                  <div className="w-40 h-40 relative">
                    <div className="absolute inset-0 border-2 border-medical-500 rounded-lg animate-pulse-slow" />
                    <QrCode className="w-full h-full text-medical-600 p-4" strokeWidth={1.5} />
                  </div>
                </div>
                <button
                  onClick={simulateScan}
                  className="btn-primary mt-5 w-full max-w-[208px]"
                >
                  模拟扫码签到
                </button>
                <p className="text-xs text-slate-400 mt-3 text-center">
                  请使用医院自助机扫描二维码，或点击上方按钮完成签到
                </p>
              </div>
            </div>

            <div className="card p-6 animate-fade-in-up stagger-2">
              <h2 className="font-semibold text-slate-700 mb-4">待签到挂号单</h2>
              {pendingAppointments.length === 0 ? (
                <div className="py-8 text-center text-slate-400">
                  <CheckCircle className="w-10 h-10 mx-auto mb-2 opacity-50 text-success" />
                  <p>暂无待签到的挂号单</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingAppointments.map((apt) => {
                    const doctor = getDoctorById(apt.doctorId);
                    const dept = getDepartmentById(apt.departmentId);
                    return (
                      <div
                        key={apt.id}
                        className="p-4 rounded-xl bg-slate-50 flex items-center gap-4"
                      >
                        <div className="w-1 h-14 rounded-full bg-warning" />
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-slate-800">
                            {dept?.name} · {doctor?.name}
                          </div>
                          <div className="text-sm text-slate-500 mt-1 flex items-center gap-3">
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {apt.date} {timeSlotLabel[apt.timeSlot]}
                            </span>
                          </div>
                          <p className="text-xs text-slate-400 mt-1">{apt.registrationNo}</p>
                        </div>
                        <button
                          onClick={() => handleCheckIn(apt.id)}
                          className="btn-success text-sm py-2 px-4"
                        >
                          签到
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {checkedInAppointments.length > 0 && (
              <div className="card p-6 animate-fade-in-up stagger-3">
                <h2 className="font-semibold text-slate-700 mb-4">我的排队信息</h2>
                {checkedInAppointments.map((apt) => {
                  const doctor = getDoctorById(apt.doctorId);
                  const dept = getDepartmentById(apt.departmentId);
                  const curNum = currentCallingNumber[apt.departmentId] || 0;
                  const ahead = apt.sequenceNo ? Math.max(0, apt.sequenceNo - curNum - 1) : 0;
                  return (
                    <div
                      key={apt.id}
                      className={`p-5 rounded-xl ${
                        apt.status === 'in_progress' ? 'bg-cyan-50 border border-cyan-200' : 'bg-slate-50'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <span className="font-semibold text-slate-800">{dept?.name}</span>
                          <span className="text-slate-500 mx-1">·</span>
                          <span className="text-slate-600">{doctor?.name}</span>
                        </div>
                        <span className={`badge ${apt.status === 'in_progress' ? 'text-cyan-600 bg-cyan-100' : 'text-medical-600 bg-medical-100'}`}>
                          {apt.status === 'in_progress' ? '就诊中' : '排队中'}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-medical-500">
                            {apt.sequenceNo || '-'}
                          </div>
                          <div className="text-xs text-slate-500 mt-1">我的号码</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-slate-700">{curNum}</div>
                          <div className="text-xs text-slate-500 mt-1">当前叫号</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-warning">{ahead}</div>
                          <div className="text-xs text-slate-500 mt-1">前方等待</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="col-span-7">
            <div className="rounded-2xl overflow-hidden h-full animate-fade-in-up stagger-2" style={{ minHeight: '600px' }}>
              <div className="h-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 p-8 text-white flex flex-col">
                <div className="relative -mx-8 -mt-8 mb-6 overflow-hidden">
                  <div className="bg-gradient-to-r from-warning via-amber-400 to-warning py-2.5 px-4">
                    <div className="flex whitespace-nowrap animate-[slideInRight_15s_linear_infinite]" style={{ animation: 'slideInRight 15s linear infinite' }}>
                      {[...announcements, ...announcements].map((msg, i) => (
                        <span key={i} className="text-slate-900 font-medium text-sm mx-8 flex items-center gap-2">
                          <AlertCircle className="w-4 h-4" />
                          {msg}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="text-center flex-1 flex flex-col justify-center">
                  <div className="text-slate-400 text-lg mb-2">当前叫号</div>
                  <div className="relative">
                    <div className="text-[120px] font-bold leading-none tracking-wider animate-pulse-slow"
                      style={{
                        color: '#22D3EE',
                        textShadow: '0 0 30px rgba(34, 211, 238, 0.6), 0 0 60px rgba(34, 211, 238, 0.3)',
                        fontFamily: '"Noto Serif SC", serif',
                      }}
                    >
                      {String(currentNumber).padStart(3, '0')}
                    </div>
                  </div>
                  <div className="mt-4 text-slate-400">
                    {getDepartmentById(displayDeptId)?.name}
                  </div>

                  {currentAppointment && (
                    <div className="mt-8 p-5 rounded-xl bg-white/5 backdrop-blur border border-white/10 max-w-md mx-auto w-full">
                      <div className="text-slate-400 text-sm mb-3">当前就诊患者</div>
                      <div className="flex items-center justify-between">
                        <div className="text-left">
                          <div className="text-xl font-semibold text-white">
                            {currentAppointment.userId === currentUser?.id ? currentUser?.name : '***'}
                          </div>
                          <div className="text-sm text-slate-400 mt-1">
                            {getDoctorById(currentAppointment.doctorId)?.name} · 诊室
                          </div>
                        </div>
                        <CheckCircle className="w-10 h-10 text-cyan-400" />
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-medium text-slate-300 flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      等待列表
                    </h3>
                    <span className="text-xs text-slate-500">共{waitingList.length}人</span>
                  </div>
                  <div className="space-y-2 max-h-48 overflow-y-auto scrollbar-thin pr-2">
                    {waitingList.slice(0, 8).map((apt) => {
                      const isMe = apt.userId === currentUser?.id;
                      const isCurrent = apt.sequenceNo === currentNumber;
                      return (
                        <div
                          key={apt.id}
                          className={`flex items-center justify-between px-4 py-2.5 rounded-lg transition-all ${
                            isCurrent
                              ? 'bg-cyan-500/20 border border-cyan-500/30'
                              : isMe
                              ? 'bg-warning/10 border border-warning/30'
                              : 'bg-white/5'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                              isCurrent ? 'bg-cyan-500 text-white' : isMe ? 'bg-warning text-slate-900' : 'bg-white/10 text-slate-300'
                            }`}>
                              {String(apt.sequenceNo).padStart(3, '0')}
                            </span>
                            <span className={`${isMe ? 'text-warning font-medium' : 'text-slate-300'}`}>
                              {isMe ? '我' : '***'}
                            </span>
                          </div>
                          <span className="text-xs text-slate-500">
                            {getDepartmentById(apt.departmentId)?.name}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {myApt && estimatedWaitTime > 0 && (
                  <div className="mt-6 p-4 rounded-xl bg-warning/10 border border-warning/20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Clock className="w-5 h-5 text-warning" />
                      <span className="text-slate-300">预计等待时间</span>
                    </div>
                    <span className="text-2xl font-bold text-warning">
                      约 {estimatedWaitTime} 分钟
                    </span>
                  </div>
                )}

                <button
                  onClick={() => callNextNumber(displayDeptId)}
                  className="mt-4 w-full py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:bg-white/10 hover:text-white transition-all text-sm"
                >
                  模拟叫号（测试）
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-white rounded-3xl p-10 text-center max-w-sm w-full mx-4 animate-fade-in-up">
            <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-14 h-14 text-success" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">签到成功！</h3>
            <p className="text-slate-500 mb-6">您的排队号码</p>
            <div className="text-7xl font-bold text-medical-500 mb-2" style={{ fontFamily: '"Noto Serif SC", serif' }}>
              {String(showSuccess.sequenceNo).padStart(3, '0')}
            </div>
            <p className="text-slate-400">请在候诊区耐心等待叫号</p>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-danger" />
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
