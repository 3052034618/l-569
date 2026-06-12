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
  FileText,
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
  availability: number;
}

const TIMES = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
const WEEK_DAYS = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];

const genId = () => Math.random().toString(36).slice(2, 11);

const generateDates = (): Array<{ date: string; dateLabel: string }> => {
  const dates: Array<{ date: string; dateLabel: string }> = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    const dateLabel = i === 0 ? '今天' : i === 1 ? '明天' : `${d.getMonth() + 1}月${d.getDate()}日 ${WEEK_DAYS[dayOfWeek]}`;
    dates.push({ date: dateStr, dateLabel });
  }
  return dates;
};

export default function PatientExamBooking() {
  const navigate = useNavigate();
  const currentUser = useHospitalStore((s) => s.currentUser);
  const getExamItemsByUser = useHospitalStore((s) => s.getExamItemsByUser);
  const bookExamTime = useHospitalStore((s) => s.bookExamTime);
  const completeExam = useHospitalStore((s) => s.completeExam);
  const releaseExamReport = useHospitalStore((s) => s.releaseExamReport);
  const getExamSlotAvailability = useHospitalStore((s) => s.getExamSlotAvailability);
  const checkExamTimeConflict = useHospitalStore((s) => s.checkExamTimeConflict);
  const getAppointmentsByUser = useHospitalStore((s) => s.getAppointmentsByUser);
  const getDoctorById = useHospitalStore((s) => s.getDoctorById);
  const getDepartmentById = useHospitalStore((s) => s.getDepartmentById);

  const [selectedItem, setSelectedItem] = useState<{ paymentId: string; itemDetail: PaymentItemDetail; payment: Payment } | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<ExamSlot | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const dates = useMemo(() => generateDates(), []);

  const dateLabels = useMemo(() => {
    const map: Record<string, string> = {};
    dates.forEach((d) => {
      map[d.date] = d.dateLabel;
    });
    return map;
  }, [dates]);

  const examItems = useMemo(() => {
    if (!currentUser) return [];
    const items = getExamItemsByUser(currentUser.id);
    if (!searchQuery.trim()) return items;
    const q = searchQuery.toLowerCase();
    return items.filter((i) => i.itemDetail.name.toLowerCase().includes(q));
  }, [currentUser, getExamItemsByUser, searchQuery]);

  const filteredSlots = useMemo(() => {
    if (!selectedDate || !selectedItem) return [];
    const examName = selectedItem.itemDetail.name;
    return TIMES.map((time) => {
      const availability = getExamSlotAvailability(examName, selectedDate, time);
      return {
        id: `${selectedDate}-${time}`,
        date: selectedDate,
        dateLabel: dateLabels[selectedDate] || '',
        time,
        available: availability > 0,
        availability,
      };
    });
  }, [selectedDate, selectedItem, getExamSlotAvailability, dateLabels]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleBookExam = () => {
    if (!selectedItem || !selectedSlot || !currentUser) {
      showToast('请选择检查时间');
      return;
    }

    const hasConflict = checkExamTimeConflict(currentUser.id, selectedSlot.date, selectedSlot.time, selectedItem.itemDetail.itemId);
    if (hasConflict) {
      showToast('该时段您已有其他检查预约，请选择其他时间');
      return;
    }

    const appointmentTime = `${selectedSlot.date} ${selectedSlot.time}`;
    const success = bookExamTime(selectedItem.paymentId, selectedItem.itemDetail.itemId, appointmentTime);

    if (success) {
      setShowSuccess(true);
      setSelectedSlot(null);
      setSelectedDate('');
      setTimeout(() => setShowSuccess(false), 2000);
    } else {
      const availability = getExamSlotAvailability(selectedItem.itemDetail.name, selectedSlot.date, selectedSlot.time);
      if (availability <= 0) {
        showToast('该时段已约满，请选择其他时间');
      } else {
        showToast('预约失败，请稍后重试');
      }
    }
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

  const handleReleaseReport = (paymentId: string, itemId: string) => {
    releaseExamReport(paymentId, itemId);
    showToast('报告已发布');
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

  const renderReportStatus = (itemDetail: PaymentItemDetail) => {
    if (!itemDetail.examReportStatus) return null;

    if (itemDetail.examReportStatus === 'pending') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <Clock className="w-3 h-3" />
          待出报告
        </span>
      );
    }

    if (itemDetail.examReportStatus === 'ready') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-success/10 text-success">
          <FileText className="w-3 h-3" />
          报告已出
        </span>
      );
    }

    return null;
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
                            <div className="flex flex-col gap-2">
                              <button
                                onClick={() => handleMarkCompleted(paymentId, itemDetail.itemId)}
                                className="btn-secondary text-sm px-3 py-1.5 flex items-center gap-1"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                                完成检查
                              </button>
                              <button
                                onClick={() => handleReleaseReport(paymentId, itemDetail.itemId)}
                                className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                发布报告
                              </button>
                            </div>
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
                    {completedItems.map(({ paymentId, itemDetail }) => (
                      <div
                        key={itemDetail.itemId}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-800">{itemDetail.name}</p>
                              {renderReportStatus(itemDetail)}
                            </div>
                            <p className="text-xs text-slate-400 mt-1">
                              检查时间：{itemDetail.examAppointmentTime} · 完成时间：{itemDetail.examCompletedAt ? new Date(itemDetail.examCompletedAt).toLocaleString('zh-CN') : ''}
                            </p>
                            {itemDetail.examReportStatus === 'ready' && itemDetail.examReportAvailableAt && (
                              <p className="text-xs text-success mt-1">
                                报告出具时间：{new Date(itemDetail.examReportAvailableAt).toLocaleString('zh-CN')}
                              </p>
                            )}
                            {itemDetail.examResult && (
                              <div className="mt-3 p-3 rounded-lg bg-white border border-slate-100">
                                <p className="text-xs text-slate-500 mb-1">检查结果：</p>
                                <p className="text-sm text-slate-700">{itemDetail.examResult}</p>
                              </div>
                            )}
                          </div>
                          {itemDetail.examReportStatus === 'pending' && (
                            <button
                              onClick={() => handleReleaseReport(paymentId, itemDetail.itemId)}
                              className="text-xs px-3 py-1.5 rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors flex items-center gap-1 flex-shrink-0"
                            >
                              <FileText className="w-3.5 h-3.5" />
                              模拟出报告
                            </button>
                          )}
                        </div>
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
                      {dates.map(({ date, dateLabel }) => (
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
                          <p className="text-sm font-medium">{dateLabel.split(' ')[1] || date.slice(5)}</p>
                          <p className="text-xs opacity-70 mt-0.5">{dateLabel.split(' ')[0] || ''}</p>
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
                            className={`py-3 rounded-xl text-center font-medium transition-all relative ${
                              !slot.available
                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                                : selectedSlot?.id === slot.id
                                ? 'bg-medical-500 text-white shadow-md'
                                : 'bg-slate-50 hover:bg-medical-50 hover:text-medical-600 text-slate-700'
                            }`}
                          >
                            <div>{slot.time}</div>
                            <div className={`text-xs mt-0.5 ${
                              !slot.available ? 'text-slate-400' : selectedSlot?.id === slot.id ? 'text-white/80' : 'text-slate-500'
                            }`}>
                              {slot.availability <= 0 ? '约满' : `剩${slot.availability}个`}
                            </div>
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
            {toast.includes('成功') || toast.includes('完成') || toast.includes('已发布') || toast.includes('已出') ? (
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
