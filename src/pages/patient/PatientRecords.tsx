import { useState, useMemo, useRef } from 'react';
import { FileUp, Star, Download, Trash2, CheckCircle, AlertCircle, ChevronDown, ChevronUp, Clock } from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { MedicalRecordFileType } from '@/types';

type TabType = 'records' | 'reviews';

export default function PatientRecords() {
  const currentUser = useHospitalStore((s) => s.currentUser);
  const appointments = useHospitalStore((s) => s.appointments);
  const medicalRecords = useHospitalStore((s) => s.medicalRecords);
  const reviews = useHospitalStore((s) => s.reviews);
  const addMedicalRecord = useHospitalStore((s) => s.addMedicalRecord);
  const deleteMedicalRecord = useHospitalStore((s) => s.deleteMedicalRecord);
  const addReview = useHospitalStore((s) => s.addReview);
  const getDoctorById = useHospitalStore((s) => s.getDoctorById);
  const getDepartmentById = useHospitalStore((s) => s.getDepartmentById);

  const [activeTab, setActiveTab] = useState<TabType>('records');
  const [toast, setToast] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [selectedReviewApt, setSelectedReviewApt] = useState<string | null>(null);
  const [attitudeScore, setAttitudeScore] = useState(0);
  const [professionalScore, setProfessionalScore] = useState(0);
  const [environmentScore, setEnvironmentScore] = useState(0);
  const [comment, setComment] = useState('');
  const [hoveredStar, setHoveredStar] = useState<{ field: string; score: number } | null>(null);

  const userRecords = useMemo(
    () => (currentUser ? medicalRecords.filter((r) => r.userId === currentUser.id) : []),
    [medicalRecords, currentUser]
  );

  const userAppointments = useMemo(
    () => (currentUser ? appointments.filter((a) => a.userId === currentUser.id) : []),
    [appointments, currentUser]
  );

  const reviewedAptIds = useMemo(
    () => (currentUser ? reviews.filter((r) => r.userId === currentUser.id).map((r) => r.appointmentId) : []),
    [reviews, currentUser]
  );

  const pendingReviewAppointments = useMemo(
    () => userAppointments.filter((a) => a.status === 'completed' && !reviewedAptIds.includes(a.id)),
    [userAppointments, reviewedAptIds]
  );

  const reviewedAppointments = useMemo(
    () => userAppointments.filter((a) => reviewedAptIds.includes(a.id)),
    [userAppointments, reviewedAptIds]
  );

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !currentUser) return;
    Array.from(files).forEach((file) => {
      const isImage = file.type.startsWith('image/');
      const isPdf = file.type === 'application/pdf';
      if (!isImage && !isPdf) {
        showToast(`${file.name} 不支持的文件格式`);
        return;
      }
      const fileType: MedicalRecordFileType = isImage ? 'image' : 'pdf';
      addMedicalRecord({
        userId: currentUser.id,
        appointmentId: userAppointments[0]?.id || '',
        fileName: file.name,
        fileType,
        fileSize: file.size,
      });
    });
    showToast('上传成功！');
  };

  const handleDeleteRecord = (recordId: string) => {
    deleteMedicalRecord(recordId);
    showToast('病历已删除');
  };

  const handleDownloadRecord = (record: { fileName: string; fileType: string }) => {
    const content = record.fileType === 'pdf'
      ? '%PDF-1.4\n%模拟病历文件内容\n仁和医院病历附件\n文件名：' + record.fileName
      : '仁和医院病历附件\n文件名：' + record.fileName + '\n上传时间：' + new Date().toLocaleString('zh-CN');
    const blob = new Blob([content], {
      type: record.fileType === 'pdf' ? 'application/pdf' : 'text/plain',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = record.fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('下载已开始');
  };

  const handleSubmitReview = () => {
    if (!currentUser || !selectedReviewApt) return;
    if (attitudeScore === 0 || professionalScore === 0 || environmentScore === 0) {
      showToast('请完成所有评分项');
      return;
    }
    const apt = userAppointments.find((a) => a.id === selectedReviewApt);
    if (!apt) return;

    addReview({
      userId: currentUser.id,
      doctorId: apt.doctorId,
      appointmentId: apt.id,
      attitudeScore,
      professionalScore,
      environmentScore,
      comment: comment || undefined,
    });

    setSelectedReviewApt(null);
    setAttitudeScore(0);
    setProfessionalScore(0);
    setEnvironmentScore(0);
    setComment('');
    showToast('评价提交成功，感谢您的反馈！');
  };

  const formatSize = (bytes: number) => {
    if (bytes >= 1048576) return (bytes / 1048576).toFixed(1) + ' MB';
    if (bytes >= 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return bytes + ' B';
  };

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const StarRating = ({
    field,
    value,
    onChange,
  }: {
    field: string;
    value: number;
    onChange: (v: number) => void;
  }) => {
    const displayScore = hoveredStar?.field === field ? hoveredStar.score : value;
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            onMouseEnter={() => setHoveredStar({ field, score: s })}
            onMouseLeave={() => setHoveredStar(null)}
            onClick={() => onChange(s)}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-7 h-7 transition-colors ${
                s <= displayScore
                  ? 'text-warning fill-warning'
                  : 'text-slate-300'
              }`}
            />
          </button>
        ))}
        {value > 0 && (
          <span className="ml-2 text-sm text-slate-500">
            {hoveredStar?.field === field ? hoveredStar.score : value} / 5
          </span>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 animate-fade-in-up">
          病历评价
        </h1>

        <div className="card p-1.5 inline-flex animate-fade-in-up stagger-1">
          <button
            onClick={() => setActiveTab('records')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'records'
                ? 'bg-medical-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <FileUp className="w-4 h-4" />
            病历管理
          </button>
          <button
            onClick={() => setActiveTab('reviews')}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all flex items-center gap-2 ${
              activeTab === 'reviews'
                ? 'bg-medical-500 text-white shadow-md'
                : 'text-slate-600 hover:bg-slate-100'
            }`}
          >
            <Star className="w-4 h-4" />
            服务评价
            {pendingReviewAppointments.length > 0 && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-danger text-white">
                {pendingReviewAppointments.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'records' && (
          <div className="space-y-6 animate-fade-in-up stagger-2">
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                handleFileUpload(e.dataTransfer.files);
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`card p-12 text-center cursor-pointer transition-all border-2 border-dashed ${
                isDragging
                  ? 'border-medical-500 bg-medical-50'
                  : 'border-slate-200 hover:border-medical-300 hover:bg-medical-50/30'
              }`}
            >
              <div className={`w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center transition-colors ${
                isDragging ? 'bg-medical-500' : 'bg-medical-100'
              }`}>
                <FileUp className={`w-8 h-8 transition-colors ${isDragging ? 'text-white' : 'text-medical-600'}`} />
              </div>
              <p className="font-medium text-slate-700 mb-1">
                拖拽文件到此处，或点击上传
              </p>
              <p className="text-sm text-slate-400">
                支持图片格式（JPG、PNG）和 PDF 文件
              </p>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => handleFileUpload(e.target.files)}
              />
            </div>

            <div className="card p-6">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-bold text-lg text-slate-800">
                  已上传病历 <span className="text-sm font-normal text-slate-400">({userRecords.length})</span>
                </h2>
              </div>

              {userRecords.length === 0 ? (
                <div className="py-10 text-center text-slate-400">
                  <FileUp className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p>暂无上传的病历文件</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {userRecords.map((record) => (
                    <div
                      key={record.id}
                      className="flex items-center gap-4 p-4 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors"
                    >
                      <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${
                        record.fileType === 'pdf'
                          ? 'bg-red-100 text-red-500'
                          : 'bg-medical-100 text-medical-600'
                      }`}>
                        <FileUp className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-800 truncate">{record.fileName}</div>
                        <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                          <span>{record.fileType === 'pdf' ? 'PDF' : '图片'}</span>
                          <span>·</span>
                          <span>{formatSize(record.fileSize)}</span>
                          <span>·</span>
                          <span>{formatDate(record.uploadedAt)}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDownloadRecord(record)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-white hover:text-medical-600 transition-colors"
                          title="下载"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteRecord(record.id)}
                          className="p-2 rounded-lg text-slate-500 hover:bg-white hover:text-danger transition-colors"
                          title="删除"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div className="space-y-6 animate-fade-in-up stagger-2">
            {pendingReviewAppointments.length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold text-lg text-slate-800 mb-5 flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-warning" />
                  待评价就诊
                </h2>
                <div className="space-y-4">
                  {pendingReviewAppointments.map((apt) => {
                    const doctor = getDoctorById(apt.doctorId);
                    const dept = getDepartmentById(apt.departmentId);
                    const isExpanded = selectedReviewApt === apt.id;
                    return (
                      <div
                        key={apt.id}
                        className={`rounded-xl border transition-all overflow-hidden ${
                          isExpanded ? 'border-medical-300 bg-medical-50/30' : 'border-slate-200 bg-white'
                        }`}
                      >
                        <div
                          onClick={() => setSelectedReviewApt(isExpanded ? null : apt.id)}
                          className="flex items-center gap-4 p-4 cursor-pointer"
                        >
                          <img
                            src={doctor?.avatar}
                            alt={doctor?.name}
                            className="w-12 h-12 rounded-full bg-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-slate-800">{doctor?.name}</span>
                              <span className="text-xs px-2 py-0.5 rounded-full bg-medical-100 text-medical-600">
                                {doctor?.title}
                              </span>
                            </div>
                            <div className="text-sm text-slate-500 mt-0.5 flex items-center gap-2">
                              <span>{dept?.name}</span>
                              <span>·</span>
                              <span className="flex items-center gap-1">
                                <Clock className="w-3.5 h-3.5" />
                                {apt.date}
                              </span>
                            </div>
                          </div>
                          <span className="badge text-warning bg-warning/10">待评价</span>
                          {isExpanded ? (
                            <ChevronUp className="w-5 h-5 text-slate-400" />
                          ) : (
                            <ChevronDown className="w-5 h-5 text-slate-400" />
                          )}
                        </div>

                        {isExpanded && (
                          <div className="border-t border-slate-200 p-5 bg-white animate-fade-in-up">
                            <div className="space-y-5">
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  医生态度
                                </label>
                                <StarRating
                                  field="attitude"
                                  value={attitudeScore}
                                  onChange={setAttitudeScore}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  专业水平
                                </label>
                                <StarRating
                                  field="professional"
                                  value={professionalScore}
                                  onChange={setProfessionalScore}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  就诊环境
                                </label>
                                <StarRating
                                  field="environment"
                                  value={environmentScore}
                                  onChange={setEnvironmentScore}
                                />
                              </div>
                              <div>
                                <label className="block text-sm font-medium text-slate-700 mb-2">
                                  文字评价（选填）
                                </label>
                                <textarea
                                  value={comment}
                                  onChange={(e) => setComment(e.target.value)}
                                  rows={4}
                                  placeholder="分享您的就诊体验，帮助其他患者了解..."
                                  className="input-field resize-none"
                                />
                              </div>
                              <div className="flex justify-end">
                                <button
                                  onClick={handleSubmitReview}
                                  className="btn-primary px-8"
                                >
                                  提交评价
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {reviewedAppointments.length > 0 && (
              <div className="card p-6">
                <h2 className="font-bold text-lg text-slate-800 mb-5 flex items-center gap-2">
                  <CheckCircle className="w-5 h-5 text-success" />
                  已提交评价
                </h2>
                <div className="space-y-4">
                  {reviewedAppointments.map((apt) => {
                    const doctor = getDoctorById(apt.doctorId);
                    const dept = getDepartmentById(apt.departmentId);
                    const review = reviews.find((r) => r.appointmentId === apt.id);
                    if (!review) return null;
                    const avgScore = ((review.attitudeScore + review.professionalScore + review.environmentScore) / 3).toFixed(1);
                    return (
                      <div key={apt.id} className="p-5 rounded-xl bg-slate-50">
                        <div className="flex items-start gap-4">
                          <img
                            src={doctor?.avatar}
                            alt={doctor?.name}
                            className="w-11 h-11 rounded-full bg-slate-200"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-slate-800">{doctor?.name}</span>
                              <span className="text-xs text-slate-400">{doctor?.title}</span>
                              <span className="text-xs text-slate-400">·</span>
                              <span className="text-xs text-slate-400">{dept?.name}</span>
                            </div>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map((s) => (
                                  <Star
                                    key={s}
                                    className={`w-4 h-4 ${
                                      s <= Math.round(Number(avgScore))
                                        ? 'text-warning fill-warning'
                                        : 'text-slate-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-warning">{avgScore}</span>
                              <span className="text-xs text-slate-400">
                                {formatDate(review.createdAt)}
                              </span>
                            </div>
                            <div className="flex gap-4 text-xs text-slate-500 mb-3">
                              <span>态度 {review.attitudeScore}分</span>
                              <span>专业 {review.professionalScore}分</span>
                              <span>环境 {review.environmentScore}分</span>
                            </div>
                            {review.comment && (
                              <p className="text-sm text-slate-600 leading-relaxed bg-white p-3 rounded-lg">
                                {review.comment}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {pendingReviewAppointments.length === 0 && reviewedAppointments.length === 0 && (
              <div className="card p-12 text-center">
                <Star className="w-16 h-16 mx-auto text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-600 mb-1">暂无评价内容</h3>
                <p className="text-slate-400">完成就诊后可以对医生服务进行评价</p>
              </div>
            )}
          </div>
        )}
      </div>

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
