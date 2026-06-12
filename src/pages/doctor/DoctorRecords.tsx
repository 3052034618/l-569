import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle,
  FileText,
  Calendar,
  Clock,
  Image,
  File,
  Eye,
  ArrowLeft,
  Search,
  ChevronRight,
  Stethoscope,
  Pill,
} from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { Appointment } from '@/types';

const patientNameMap: Record<string, { name: string; phone: string; idCard?: string; gender?: string; age?: number }> = {
  p1: { name: '张明', phone: '13800138001', idCard: '110101199001011234', gender: '男', age: 36 },
  p2: { name: '李华', phone: '13800138002', idCard: '110101199203155678', gender: '女', age: 34 },
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const formatSize = (bytes: number) => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

export default function DoctorRecords() {
  const navigate = useNavigate();
  const { currentUser, getAppointmentsByDoctor, medicalRecords, prescriptions, payments, doctors } = useHospitalStore();

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewRecord, setPreviewRecord] = useState<string | null>(null);

  const doctorInfo = useMemo(() => {
    if (!currentUser?.doctorId) return null;
    return doctors.find((d) => d.id === currentUser.doctorId);
  }, [currentUser, doctors]);

  const myAppointments = useMemo(() => {
    if (!currentUser?.doctorId) return [];
    return getAppointmentsByDoctor(currentUser.doctorId).filter((a) => a.status === 'completed');
  }, [currentUser, getAppointmentsByDoctor]);

  const uniquePatients = useMemo(() => {
    const map = new Map<string, { userId: string; lastVisit: string; visitCount: number }>();
    myAppointments.forEach((apt) => {
      if (!map.has(apt.userId)) {
        map.set(apt.userId, { userId: apt.userId, lastVisit: apt.createdAt, visitCount: 1 });
      } else {
        const existing = map.get(apt.userId)!;
        existing.visitCount++;
        if (apt.createdAt > existing.lastVisit) existing.lastVisit = apt.createdAt;
      }
    });
    return Array.from(map.values()).sort((a, b) => b.lastVisit.localeCompare(a.lastVisit));
  }, [myAppointments]);

  const filteredPatients = useMemo(() => {
    if (!searchQuery.trim()) return uniquePatients;
    const q = searchQuery.toLowerCase();
    return uniquePatients.filter((p) => {
      const info = patientNameMap[p.userId];
      return info?.name.toLowerCase().includes(q);
    });
  }, [uniquePatients, searchQuery]);

  const patientAppointments = useMemo(() => {
    if (!selectedUserId) return [];
    return myAppointments
      .filter((a) => a.userId === selectedUserId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }, [selectedUserId, myAppointments]);

  const patientRecords = useMemo(() => {
    if (!selectedUserId) return [];
    return medicalRecords.filter((r) => r.userId === selectedUserId);
  }, [selectedUserId, medicalRecords]);

  const getPrescriptionsForAppointment = (aptId: string) => {
    return prescriptions.filter((p) => p.appointmentId === aptId);
  };

  const getExamResultForItem = (aptId: string, itemId: string) => {
    const payment = payments.find((p) => p.appointmentId === aptId);
    if (!payment) return null;
    return payment.itemDetails.find((d) => d.itemId === itemId && d.type === 'examination');
  };

  const selectedPatientInfo = selectedUserId ? patientNameMap[selectedUserId] : null;

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/doctor')}
            className="p-2 rounded-lg hover:bg-white border border-slate-200 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="w-7 h-7 text-medical-500" />
              患者病历
            </h1>
            <p className="text-slate-500 mt-1">
              {doctorInfo?.name} · {doctorInfo?.title} · 接诊患者病历管理
            </p>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-4">
            <div className="card p-4">
              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索患者姓名..."
                  className="input-field pl-10"
                />
              </div>
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-medical-500" />
                接诊患者
                <span className="badge bg-medical-100 text-medical-700 ml-auto">
                  {uniquePatients.length}
                </span>
              </h2>
              <div className="space-y-2 max-h-[680px] overflow-y-auto scrollbar-thin pr-1">
                {filteredPatients.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">暂无患者记录</p>
                ) : (
                  filteredPatients.map((p) => {
                    const info = patientNameMap[p.userId];
                    return (
                      <button
                        key={p.userId}
                        onClick={() => setSelectedUserId(p.userId)}
                        className={`w-full p-3 rounded-lg text-left transition-all ${
                          selectedUserId === p.userId
                            ? 'bg-medical-50 border-2 border-medical-300'
                            : 'bg-slate-50 border border-slate-100 hover:border-medical-200'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-full bg-white flex items-center justify-center shadow-sm">
                            <UserCircle className="w-7 h-7 text-medical-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-slate-800">{info?.name || '患者'}</p>
                              {info?.gender && (
                                <span className="text-xs text-slate-400">
                                  {info.gender} · {info.age}岁
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              就诊 {p.visitCount} 次 · 最近 {formatDateTime(p.lastVisit).slice(0, 10)}
                            </p>
                          </div>
                          <ChevronRight
                            className={`w-4 h-4 transition-colors ${
                              selectedUserId === p.userId ? 'text-medical-500' : 'text-slate-300'
                            }`}
                          />
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          <div className="col-span-8">
            {!selectedUserId || !selectedPatientInfo ? (
              <div className="card p-12 flex flex-col items-center justify-center text-slate-400 min-h-[600px]">
                <FileText className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-lg">请从左侧选择患者查看病历</p>
              </div>
            ) : (
              <div className="space-y-6">
                <div className="card p-6">
                  <div className="flex items-start gap-5">
                    <div className="w-20 h-20 rounded-full bg-medical-50 flex items-center justify-center">
                      <UserCircle className="w-14 h-14 text-medical-400" />
                    </div>
                    <div className="flex-1">
                      <h2 className="text-xl font-bold text-slate-800">{selectedPatientInfo.name}</h2>
                      <div className="grid grid-cols-4 gap-4 mt-3">
                        <div>
                          <p className="text-xs text-slate-400">性别</p>
                          <p className="text-sm font-medium text-slate-700 mt-0.5">
                            {selectedPatientInfo.gender}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">年龄</p>
                          <p className="text-sm font-medium text-slate-700 mt-0.5">
                            {selectedPatientInfo.age} 岁
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">联系电话</p>
                          <p className="text-sm font-medium text-slate-700 mt-0.5">
                            {selectedPatientInfo.phone}
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-400">身份证号</p>
                          <p className="text-sm font-medium text-slate-700 mt-0.5">
                            {selectedPatientInfo.idCard}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-medical-500" />
                    历史就诊记录
                    <span className="badge bg-medical-100 text-medical-700 ml-auto">
                      {patientAppointments.length} 次
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {patientAppointments.length === 0 ? (
                      <p className="text-sm text-slate-400 text-center py-6">暂无就诊记录</p>
                    ) : (
                      patientAppointments.map((apt: Appointment) => {
                        const aptPrescriptions = getPrescriptionsForAppointment(apt.id);
                        return (
                          <div
                            key={apt.id}
                            className="p-4 rounded-lg bg-slate-50 border border-slate-100"
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg bg-medical-100 flex items-center justify-center">
                                  <Stethoscope className="w-5 h-5 text-medical-600" />
                                </div>
                                <div>
                                  <p className="font-medium text-slate-800 flex items-center gap-2">
                                    {doctorInfo?.name}
                                    <span className="badge bg-emerald-100 text-emerald-700">已完成</span>
                                  </p>
                                  <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                                    <Clock className="w-3 h-3" />
                                    {formatDateTime(apt.createdAt)}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <p className="text-sm text-slate-500">挂号单号</p>
                                <p className="text-sm font-medium text-slate-700">{apt.registrationNo}</p>
                              </div>
                            </div>
                            {aptPrescriptions.length > 0 && (
                              <div className="mt-3 pt-3 border-t border-slate-200">
                                <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1">
                                  <Pill className="w-3 h-3" />
                                  开具处方
                                </p>
                                <div className="space-y-2">
                                  {aptPrescriptions.map((pre) => (
                                    <div key={pre.id}>
                                      <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <span
                                          className={`badge ${
                                            pre.type === 'examination'
                                              ? 'bg-cyan-100 text-cyan-700'
                                              : 'bg-purple-100 text-purple-700'
                                          }`}
                                        >
                                          {pre.type === 'examination' ? '检查' : '药品'}
                                        </span>
                                        <span>
                                          {pre.items.map((i) => i.name).join('、')}
                                        </span>
                                        <span className="text-slate-400 ml-auto">
                                          ¥{pre.items.reduce((s, i) => s + i.totalPrice, 0).toFixed(2)}
                                        </span>
                                      </div>
                                      {pre.type === 'examination' && (
                                        <div className="mt-1.5 space-y-1.5">
                                          {pre.items.map((item) => {
                                            const examDetail = getExamResultForItem(apt.id, item.id);
                                            const hasResult = !!examDetail?.examResult;
                                            return (
                                              <div
                                                key={item.id}
                                                className={`p-2.5 rounded-md text-xs ${
                                                  hasResult
                                                    ? 'bg-emerald-50 border border-emerald-200'
                                                    : 'bg-slate-50 border border-slate-200'
                                                }`}
                                              >
                                                <div className="flex items-center justify-between mb-1">
                                                  <span className="font-medium text-slate-700">
                                                    {item.name}
                                                  </span>
                                                  <span
                                                    className={`badge text-[10px] ${
                                                      hasResult
                                                        ? 'bg-emerald-100 text-emerald-700'
                                                        : 'bg-slate-100 text-slate-500'
                                                    }`}
                                                  >
                                                    {hasResult ? '已完成' : '待检查'}
                                                  </span>
                                                </div>
                                                {hasResult && examDetail ? (
                                                  <>
                                                    <p className="text-slate-600 mb-1">
                                                      {examDetail.examResult}
                                                    </p>
                                                    <p className="text-[10px] text-slate-400 flex items-center gap-1">
                                                      <Clock className="w-2.5 h-2.5" />
                                                      {formatDateTime(examDetail.examCompletedAt!)}
                                                    </p>
                                                  </>
                                                ) : (
                                                  <p className="text-slate-400 text-[11px]">
                                                    等待患者完成检查
                                                  </p>
                                                )}
                                              </div>
                                            );
                                          })}
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                <div className="card p-5">
                  <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                    <File className="w-5 h-5 text-medical-500" />
                    病历附件
                    <span className="badge bg-medical-100 text-medical-700 ml-auto">
                      {patientRecords.length} 份
                    </span>
                  </h3>
                  {patientRecords.length === 0 ? (
                    <p className="text-sm text-slate-400 text-center py-6">暂无上传附件</p>
                  ) : (
                    <div className="grid grid-cols-3 gap-3">
                      {patientRecords.map((record) => (
                        <div
                          key={record.id}
                          className="p-4 rounded-lg bg-slate-50 border border-slate-100 hover:border-medical-200 transition-all group cursor-pointer"
                          onClick={() => setPreviewRecord(record.id)}
                        >
                          <div className="w-full h-28 rounded-md bg-white flex items-center justify-center mb-3 overflow-hidden">
                            {record.fileType === 'image' ? (
                              <Image className="w-10 h-10 text-cyan-400" />
                            ) : (
                              <File className="w-10 h-10 text-red-400" />
                            )}
                          </div>
                          <p className="text-sm font-medium text-slate-700 truncate group-hover:text-medical-600">
                            {record.fileName}
                          </p>
                          <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                            <span>{formatSize(record.fileSize)}</span>
                            <span className="flex items-center gap-1 group-hover:text-medical-500">
                              <Eye className="w-3 h-3" />
                              预览
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {previewRecord && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-8"
          onClick={() => setPreviewRecord(null)}
        >
          <div
            className="card p-6 max-w-3xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800">病历附件预览</h3>
              <button
                onClick={() => setPreviewRecord(null)}
                className="p-1 hover:bg-slate-100 rounded"
              >
                <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex items-center justify-center py-16 bg-slate-50 rounded-lg">
              <div className="text-center text-slate-400">
                {patientRecords.find((r) => r.id === previewRecord)?.fileType === 'image' ? (
                  <Image className="w-20 h-20 mx-auto mb-4 text-cyan-400 opacity-60" />
                ) : (
                  <File className="w-20 h-20 mx-auto mb-4 text-red-400 opacity-60" />
                )}
                <p className="font-medium text-slate-600">
                  {patientRecords.find((r) => r.id === previewRecord)?.fileName}
                </p>
                <p className="text-sm mt-1">附件预览（模拟数据）</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
