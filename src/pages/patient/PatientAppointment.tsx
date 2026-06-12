import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Star, CalendarPlus, ChevronDown, ChevronUp, CheckCircle, Clock, Users, AlertCircle } from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { Doctor, Schedule, TimeSlot } from '@/types';

const timeSlotInfo: Record<TimeSlot, { label: string; icon: typeof Clock }> = {
  morning: { label: '上午', icon: Clock },
  afternoon: { label: '下午', icon: Clock },
  evening: { label: '晚上', icon: Clock },
};

const timeSlotPrice: Record<TimeSlot, number> = {
  morning: 30,
  afternoon: 30,
  evening: 50,
};

export default function PatientAppointment() {
  const navigate = useNavigate();
  const departments = useHospitalStore((s) => s.departments);
  const doctors = useHospitalStore((s) => s.doctors);
  const schedules = useHospitalStore((s) => s.schedules);
  const currentUser = useHospitalStore((s) => s.currentUser);
  const createAppointment = useHospitalStore((s) => s.createAppointment);
  const getDepartmentById = useHospitalStore((s) => s.getDepartmentById);

  const [selectedDept, setSelectedDept] = useState<string>(departments[0]?.id || '');
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedSchedule, setSelectedSchedule] = useState<Schedule | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const deptDoctors = useMemo(
    () => doctors.filter((d) => d.departmentId === selectedDept),
    [doctors, selectedDept]
  );

  const doctorSchedules = useMemo(() => {
    if (!selectedDoctor) return [];
    return schedules.filter((s) => s.doctorId === selectedDoctor.id);
  }, [schedules, selectedDoctor]);

  const schedulesByDate = useMemo(() => {
    const grouped: Record<string, Schedule[]> = {};
    doctorSchedules.forEach((s) => {
      if (!grouped[s.date]) grouped[s.date] = [];
      grouped[s.date].push(s);
    });
    return grouped;
  }, [doctorSchedules]);

  const next7Days = useMemo(() => {
    const days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      days.push(d.toISOString().split('T')[0]);
    }
    return days;
  }, []);

  const bestSchedule = useMemo(() => {
    if (doctorSchedules.length === 0) return null;
    return doctorSchedules.reduce((best, s) =>
      s.remainingQuota > best.remainingQuota ? s : best
    );
  }, [doctorSchedules]);

  const handleConfirm = () => {
    if (!currentUser || !selectedSchedule) return;
    try {
      createAppointment(
        currentUser.id,
        selectedSchedule.doctorId,
        selectedSchedule.departmentId,
        selectedSchedule.id,
        selectedSchedule.date,
        selectedSchedule.timeSlot
      );
      setToast('预约成功！');
      setShowConfirm(false);
      setTimeout(() => navigate('/patient/home'), 1500);
    } catch (e) {
      setToast('预约失败，请稍后重试');
      setTimeout(() => setToast(null), 2000);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
    return {
      day: d.getDate(),
      month: d.getMonth() + 1,
      weekday: weekdays[d.getDay()],
      isToday: d.toDateString() === new Date().toDateString(),
    };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 animate-fade-in-up">
          预约挂号
        </h1>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3 animate-fade-in-up stagger-1">
            <div className="card p-4 sticky top-6">
              <h2 className="font-semibold text-slate-700 mb-3 flex items-center gap-2">
                <Users className="w-4 h-4" />
                选择科室
              </h2>
              <div className="space-y-1">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => {
                      setSelectedDept(dept.id);
                      setSelectedDoctor(null);
                      setSelectedSchedule(null);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                      selectedDept === dept.id
                        ? 'bg-medical-50 text-medical-600 font-medium border-l-4 border-medical-500'
                        : 'hover:bg-slate-50 text-slate-600'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span>{dept.name}</span>
                      <span className="text-xs text-slate-400">
                        {doctors.filter((d) => d.departmentId === dept.id).length}位
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-9 space-y-6">
            <div className="card p-6 animate-fade-in-up stagger-2">
              <h2 className="font-semibold text-slate-700 mb-4">选择医生</h2>
              {deptDoctors.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Users className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>该科室暂无医生信息</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                  {deptDoctors.map((doc) => (
                    <button
                      key={doc.id}
                      onClick={() => {
                        setSelectedDoctor(doc);
                        setSelectedSchedule(null);
                      }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${
                        selectedDoctor?.id === doc.id
                          ? 'border-medical-500 bg-medical-50'
                          : 'border-transparent bg-slate-50 hover:border-medical-200'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <img
                          src={doc.avatar}
                          alt={doc.name}
                          className="w-12 h-12 rounded-full bg-slate-200"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-800">{doc.name}</span>
                            <span className="text-xs px-2 py-0.5 rounded-full bg-medical-100 text-medical-600">
                              {doc.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-1 mt-1">
                            <Star className="w-3.5 h-3.5 text-warning fill-warning" />
                            <span className="text-sm font-medium text-slate-700">{doc.rating}</span>
                            <span className="text-xs text-slate-400">({doc.reviewCount}条评价)</span>
                          </div>
                          <p className="text-xs text-slate-500 mt-2 line-clamp-2">{doc.specialty}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs px-2 py-1 rounded bg-success/10 text-success flex items-center gap-1">
                          <CheckCircle className="w-3 h-3" />
                          可预约
                        </span>
                        {selectedDoctor?.id === doc.id && (
                          <CheckCircle className="w-5 h-5 text-medical-500" />
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {selectedDoctor && (
              <div className="card p-6 animate-fade-in-up stagger-3">
                <h2 className="font-semibold text-slate-700 mb-4 flex items-center gap-2">
                  <CalendarPlus className="w-4 h-4" />
                  选择时间
                </h2>
                <div className="overflow-x-auto pb-2 scrollbar-thin">
                  <div className="grid grid-cols-7 gap-3 min-w-[800px]">
                    {next7Days.map((dateStr) => {
                      const dateInfo = formatDate(dateStr);
                      const daySchedules = schedulesByDate[dateStr] || [];
                      return (
                        <div
                          key={dateStr}
                          className={`rounded-xl p-3 text-center ${
                            dateInfo.isToday ? 'bg-medical-50' : 'bg-slate-50'
                          }`}
                        >
                          <div className="text-sm text-slate-500">{dateInfo.weekday}</div>
                          <div className="text-xl font-bold text-slate-800 mt-0.5">
                            {dateInfo.month}/{dateInfo.day}
                          </div>
                          {dateInfo.isToday && (
                            <div className="text-xs text-medical-500 font-medium mt-0.5">今天</div>
                          )}

                          <div className="mt-3 space-y-2">
                            {(['morning', 'afternoon', 'evening'] as TimeSlot[]).map((slot) => {
                              const schedule = daySchedules.find((s) => s.timeSlot === slot);
                              const isBest = schedule && bestSchedule?.id === schedule.id;
                              const isDisabled = !schedule || schedule.remainingQuota <= 0;
                              const isLow = schedule && schedule.remainingQuota < 5;
                              const isSelected = selectedSchedule?.id === schedule?.id;
                              return (
                                <button
                                  key={slot}
                                  disabled={isDisabled}
                                  onClick={() => schedule && setSelectedSchedule(schedule)}
                                  className={`w-full px-2 py-2 rounded-lg text-xs transition-all relative ${
                                    isDisabled
                                      ? 'bg-slate-100 text-slate-300 cursor-not-allowed'
                                      : isSelected
                                      ? 'bg-medical-500 text-white shadow-md'
                                      : isLow
                                      ? 'bg-red-50 text-danger hover:bg-red-100'
                                      : 'bg-white border border-slate-200 hover:border-medical-300 text-slate-700'
                                  }`}
                                >
                                  {isBest && !isDisabled && (
                                    <span className="absolute -top-1.5 left-1/2 -translate-x-1/2 px-1.5 py-0.5 rounded-full bg-gradient-to-r from-amber-400 to-warning text-white text-[10px] font-medium whitespace-nowrap animate-pulse-slow shadow-sm">
                                      智能推荐
                                    </span>
                                  )}
                                  <div className="font-medium">{timeSlotInfo[slot].label}</div>
                                  {schedule ? (
                                    <div className={`text-[10px] mt-0.5 ${isSelected ? 'text-white/80' : isLow ? 'text-danger/80' : 'text-slate-400'}`}>
                                      {schedule.remainingQuota}/{schedule.totalQuota}余号
                                    </div>
                                  ) : (
                                    <div className="text-[10px] mt-0.5">无排班</div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-white border border-slate-200" />充足
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-red-50" />紧张
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-slate-100" />已满
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-gradient-to-r from-amber-400 to-warning" />智能推荐
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {selectedSchedule && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg animate-slide-in-right">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div>
              <div className="font-semibold text-slate-800">
                {getDepartmentById(selectedSchedule.departmentId)?.name} · {selectedDoctor?.name}
              </div>
              <div className="text-sm text-slate-500 mt-0.5">
                {selectedSchedule.date} {timeSlotInfo[selectedSchedule.timeSlot].label}
                ({selectedSchedule.startTime}-{selectedSchedule.endTime})
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <div className="text-xs text-slate-400">挂号费</div>
                <div className="text-xl font-bold text-danger">
                  ¥{timeSlotPrice[selectedSchedule.timeSlot]}
                </div>
              </div>
              <button
                onClick={() => setShowConfirm(true)}
                className="btn-primary px-8"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}

      {showConfirm && selectedSchedule && selectedDoctor && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md animate-fade-in-up">
            <h3 className="text-lg font-bold text-slate-800 mb-5">确认预约信息</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-500">科室</span>
                <span className="font-medium text-slate-800">
                  {getDepartmentById(selectedSchedule.departmentId)?.name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">医生</span>
                <span className="font-medium text-slate-800">
                  {selectedDoctor.name} {selectedDoctor.title}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">时间</span>
                <span className="font-medium text-slate-800">
                  {selectedSchedule.date} {timeSlotInfo[selectedSchedule.timeSlot].label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">费用</span>
                <span className="font-bold text-danger text-lg">
                  ¥{timeSlotPrice[selectedSchedule.timeSlot]}
                </span>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowConfirm(false)}
                className="btn-secondary flex-1"
              >
                取消
              </button>
              <button
                onClick={handleConfirm}
                className="btn-primary flex-1"
              >
                确认预约
              </button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            {toast.includes('成功') ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-danger" />
            )}
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
