import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  MapPin,
  AlertCircle,
  CheckCircle,
  Stethoscope,
  CheckCircle2,
  Search,
} from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { PaymentItemDetail, Payment } from '@/types';
import { EXAM_NOTES } from '@/types';

interface ExamSlot {
  id: string;
  date: string;
  dateLabel: string;
  time: string;
  available: boolean;
}

const genId = () => Math.random().toString(36).slice(2, 11);

const generateSlots = (): ExamSlot[] => {
  const slots: ExamSlot[] = [];
  const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
  const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const dateLabel = i === 0 ? '今天' : i === 1 ? '明天' : `${d.getMonth() + 1}月${d.getDate()}日 ${weekDays[dayOfWeek]}`;
    times.forEach((time) => {
      slots.push({
        id: genId(),
        date: dateStr,
        dateLabel,
        time,
        available: Math.random() > 0.3,
      });
    });
  }
  return slots;
};

export default function PatientExamBooking() {
  const navigate = useNavigate();
  const currentUser = useHospitalStore((s) => s.currentUser);
  const getExamItemsByUser = useHospitalStore((s) => s.getExamItemsByUser);
  const bookExamTime = useHospitalStore((s) => s.bookExamTime);
  const completeExam = useHospitalStore((s) => s.completeExam);
  const getAppointmentsByUser = useHospitalStore((s) => s.getAppointmentsByUser);
  const getDoctorById = useHospitalStore((s) => s.getDoctorById);
  const getDepartmentById = useHospitalStore((s) => s.getDepartmentById);

  const [selectedItem, setSelectedItem] = useState<{ paymentId: string; itemDetail: PaymentItemDetail; payment: Payment } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<ExamSlot | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const examItems = useMemo(() => {
    if (!currentUser) return [];
    const items = getExamItemsByUser(currentUser.id);
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i) => i.itemDetail.name.toLowerCase().includes(q));
  }, [currentUser, getExamItemsByUser, searchQuery]);

  const allSlots = useMemo(() => generateSlots(), []);

  const dates = useMemo(() => {
    const set = new Set<string>();
    allSlots.forEach((s) => set.add(s.date));
    return Array.from(set);
  }, [allSlots]);

  const dateLabels = useMemo(() => {
    const map: Record<string, string> = {};
    allSlots.forEach((s) => {
      map[s.date] = s.dateLabel;
    });
    return map;
  }, [allSlots]);

  const filteredSlots = useMemo(() => {
    if (!selectedDate) return [];
    return allSlots.filter((s) => s.date === selectedDate);
  }, [allSlots, selectedDate]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleBookExam = () => {
    if (!selectedItem || !selectedSlot) {
      showToast('请选择检查时间');
      return;
    }
    const appointmentTime = `${selectedSlot.date} ${selectedSlot.time}`;
    bookExamTime(selectedItem.paymentId, selectedItem.itemDetail.itemId, appointmentTime);
    setShowSuccess(true);
    setSelectedSlot(null);
    setSelectedDate('');
    setTimeout(() => setShowSuccess(false), 2000);
  };

  const handleMarkCompleted = (paymentId: string, itemId: string) => {
    const results = [
      '各项指标均在正常范围内，建议定期复查。',
      '检查结果未见明显异常，保持良好生活习惯。',
      '检测结果正常，继续当前治疗方案。',
      '影像检查未见明显异常，如有不适请随诊。',
    ];
    const result = results[Math.floor(Math.random() * results.length)];
    completeExam(paymentId, itemId, result);
    showToast('检查已完成，结果已记录');
  };

  const pendingItems = examItems.filter((i) => !i.itemDetail.examAppointmentTime);
  const bookedItems = examItems.filter((i) => i.itemDetail.examAppointmentTime && !i.itemDetail.examCompletedAt);
  const completedItems = useMemo(() => {
    if (!currentUser) return [];
    const userPayments = useHospitalStore.getState().getPaymentsByUser(currentUser.id);
    const result: Array<{ paymentId: string; itemDetail: PaymentItemDetail; payment: Payment }> = [];
    userPayments.forEach((p) => {
      if (p.status === 'paid') {
        p.itemDetails.forEach((d) => {
          if (d.type === 'examination' && d.examCompletedAt) {
            result.push({ paymentId: p.id, itemDetail: d, payment: p });
          }
        });
      }
    });
    return result;
  }, [currentUser]);

  const getAptInfo = (payment: Payment) => {
    const apt = getAppointmentsByUser(currentUser?.id || '').find((a) => a.id === payment.appointmentId);
    if (!apt) return null;
    const doctor = getDoctorById(apt.doctorId);
    const dept = getDepartmentById(apt.departmentId);
    return { apt, doctor, dept };
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/patient')}
            className="p-2 rounded-lg hover:bg-white border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Stethoscope className="w-7 h-7 text-medical-500" />
              检查预约
            </h1>
            <p className="text-slate-500 mt-1">选择检查时间，查看检查结果</p>
          </div>
        </div>

        {examItems.length === 0 && completedItems.length === 0 ? (
          <div className="card p-12 text-center animate-fade-in-up">
            <CheckCircle className="w-16 h-16 mx-auto text-success opacity-60 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">暂无检查项目</h3>
            <p className="text-slate-400">医生开具检查单并完成支付后，可在此预约检查时间</p>
          </div>
        ) : (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-5 space-y-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索检查项目..."
                  className="input-field pl-10"
                />
              </div>

              {pendingItems.length > 0 && (
                <div className="card p-5 animate-fade-in-up">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <AlertCircle className="w-5 h-5 text-warning" />
                    待预约 ({pendingItems.length})
                  </h2>
                  <div className="space-y-3">
                    {pendingItems.map(({ paymentId, itemDetail, payment }) => {
                      const info = getAptInfo(payment);
                      const isSelected = selectedItem?.itemDetail.itemId === itemDetail.itemId;
                      return (
                        <button
                          key={itemDetail.itemId}
                          onClick={() => {
                            setSelectedItem({ paymentId, itemDetail, payment });
                            setSelectedDate('');
                            setSelectedSlot(null);
                          }}
                          className={`w-full p-4 rounded-xl text-left transition-all ${
                            isSelected
                              ? 'bg-medical-50 border-2 border-medical-300'
                              : 'bg-white border border-slate-200 hover:border-medical-200'
                          }`}
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-medical-100 flex items-center justify-center flex-shrink-0">
                              <Stethoscope className="w-5 h-5 text-medical-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800">{itemDetail.name}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {info?.dept?.name} · {info?.doctor?.name}
                              </p>
                              <div className="mt-2 space-y-1">
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {itemDetail.examLocation}
                                </p>
                                <p className="text-xs text-amber-600 flex items-center gap-1">
                                  <AlertCircle className="w-3 h-3" />
                                  {itemDetail.examNotes}
                                </p>
                              </div>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {bookedItems.length > 0 && (
                <div className="card p-5 animate-fade-in-up stagger-1">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Clock className="w-5 h-5 text-medical-500" />
                    已预约 ({bookedItems.length})
                  </h2>
                  <div className="space-y-3">
                    {bookedItems.map(({ paymentId, itemDetail, payment }) => {
                      const info = getAptInfo(payment);
                      return (
                        <div
                          key={itemDetail.itemId}
                          className="p-4 rounded-xl bg-medical-50 border border-medical-200"
                        >
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-lg bg-medical-200 flex items-center justify-center flex-shrink-0">
                              <Calendar className="w-5 h-5 text-medical-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-slate-800">{itemDetail.name}</p>
                              <p className="text-xs text-slate-400 mt-1">
                                {info?.dept?.name} · {info?.doctor?.name}
                              </p>
                              <div className="mt-2 space-y-1">
                                <p className="text-sm text-medical-700 font-medium flex items-center gap-1">
                                  <Calendar className="w-3.5 h-3.5" />
                                  {itemDetail.examAppointmentTime}
                                </p>
                                <p className="text-xs text-slate-500 flex items-center gap-1">
                                  <MapPin className="w-3 h-3" />
                                  {itemDetail.examLocation}
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => handleMarkCompleted(paymentId, itemDetail.itemId)}
                              className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                              完成检查
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {completedItems.length > 0 && (
                <div className="card p-5 animate-fade-in-up stagger-2">
                  <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-success" />
                    已完成 ({completedItems.length})
                  </h2>
                  <div className="space-y-3">
                    {completedItems.map(({ itemDetail }) => (
                      <div
                        key={itemDetail.itemId}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <p className="font-medium text-slate-800">{itemDetail.name}</p>
                        <p className="text-xs text-slate-400 mt-1">
                          检查时间：{itemDetail.examAppointmentTime} · 完成时间：{itemDetail.examCompletedAt ? new Date(itemDetail.examCompletedAt).toLocaleString('zh-CN') : ''}
                        </p>
                        {itemDetail.examResult && (
                          <div className="mt-3 p-3 rounded-lg bg-white border border-slate-100">
                            <p className="text-xs text-slate-500 mb-1">检查结果：</p>
                            <p className="text-sm text-slate-700">{itemDetail.examResult}</p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="col-span-7">
              {!selectedItem ? (
                <div className="card p-12 text-center min-h-[500px] flex flex-col items-center justify-center">
                  <Calendar className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                  <h3 className="text-lg font-semibold text-slate-500 mb-1">请选择检查项目</h3>
                  <p className="text-slate-400">从左侧列表中选择需要预约的检查项目</p>
                </div>
              ) : (
                <div className="space-y-6">
                  <div className="card p-5 animate-fade-in-up">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Stethoscope className="w-5 h-5 text-medical-500" />
                      检查详情
                    </h3>
                    <div className="p-4 rounded-xl bg-medical-50 border border-medical-200">
                      <p className="text-lg font-bold text-slate-800 mb-2">{selectedItem.itemDetail.name}</p>
                      <div className="grid grid-cols-2 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-slate-500 mb-1">检查地点</p>
                          <p className="text-sm font-medium text-slate-700 flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5 text-medical-500" />
                            {selectedItem.itemDetail.examLocation}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 mb-1">费用</p>
                          <p className="text-sm font-medium text-slate-700">¥{selectedItem.itemDetail.amount.toFixed(2)}</p>
                        </div>
                      </div>
                      {selectedItem.itemDetail.examNotes && (
                        <div className="mt-4 p-3 rounded-lg bg-amber-50 border border-amber-200">
                          <p className="text-xs font-medium text-amber-700 mb-1 flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            注意事项
                          </p>
                          <p className="text-sm text-amber-600">{selectedItem.itemDetail.examNotes}</p>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="card p-5 animate-fade-in-up stagger-1">
                    <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-medical-500" />
                      选择日期
                    </h3>
                    <div className="grid grid-cols-7 gap-2">
                      {dates.map((date) => (
                        <button
                          key={date}
                          onClick={() => {
                            setSelectedDate(date);
                            setSelectedSlot(null);
                          }}
                          className={`p-3 rounded-xl text-center transition-all ${
                            selectedDate === date
                              ? 'bg-medical-500 text-white shadow-md'
                              : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <p className="text-sm font-medium">{dateLabels[date]?.split(' ')[1] || date.slice(5)}</p>
                          <p className="text-xs opacity-70 mt-0.5">{dateLabels[date]?.split(' ')[0] || ''}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedDate && (
                    <div className="card p-5 animate-fade-in-up stagger-2">
                      <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                        <Clock className="w-5 h-5 text-medical-500" />
                        选择时段
                      </h3>
                      <div className="grid grid-cols-4 gap-3">
                        {filteredSlots.map((slot) => (
                          <button
                            key={slot.id}
                            disabled={!slot.available}
                            onClick={() => setSelectedSlot(slot)}
                            className={`py-3 rounded-xl text-center font-medium transition-all ${
                              !slot.available
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed line-through'
                                : selectedSlot?.id === slot.id
                                ? 'bg-medical-500 text-white shadow-md'
                                : 'bg-slate-50 hover:bg-medical-50 hover:text-medical-600 text-slate-700'
                            }`}
                          >
                            {slot.time}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedSlot && (
                    <div className="card p-5 animate-fade-in-up stagger-3 bg-gradient-to-r from-medical-50 to-cyan-50 border-2 border-medical-200">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-slate-500 mb-1">已选择</p>
                          <p className="text-lg font-bold text-slate-800">
                            {dateLabels[selectedSlot.date]} {selectedSlot.time}
                          </p>
                        </div>
                        <button
                          onClick={handleBookExam}
                          className="btn-primary px-8 py-3 flex items-center gap-2"
                        >
                          <CheckCircle2 className="w-5 h-5" />
                          确认预约
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="card px-6 py-3 flex items-center gap-3 shadow-hover border-success/30">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-medium text-slate-700">检查预约成功！</span>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="bg-slate-800 text-white px-6 py-3 rounded-xl shadow-lg flex items-center gap-2">
            {toast.includes('成功') || toast.includes('完成') ? (
              <CheckCircle2 className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-warning" />
            )}
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}
