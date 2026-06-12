import { useState, useMemo } from 'react';
import { Wallet, CreditCard, Smartphone, ShieldCheck, ChevronDown, ChevronUp, CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { Payment, PrescriptionItem } from '@/types';

const paymentMethods = [
  { id: 'wechat', name: '微信支付', icon: Smartphone, color: 'from-green-500 to-emerald-500', desc: '推荐使用' },
  { id: 'alipay', name: '支付宝', icon: CreditCard, color: 'from-blue-500 to-cyan-500', desc: '快捷支付' },
  { id: 'insurance', name: '医保电子凭证', icon: ShieldCheck, color: 'from-medical-500 to-blue-600', desc: '医保结算' },
];

export default function PatientPayment() {
  const currentUser = useHospitalStore((s) => s.currentUser);
  const appointments = useHospitalStore((s) => s.appointments);
  const payments = useHospitalStore((s) => s.payments);
  const prescriptions = useHospitalStore((s) => s.prescriptions);
  const processPayment = useHospitalStore((s) => s.processPayment);
  const getDoctorById = useHospitalStore((s) => s.getDoctorById);
  const getDepartmentById = useHospitalStore((s) => s.getDepartmentById);

  const [expandedPayment, setExpandedPayment] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<string | null>(null);
  const [selectedMethod, setSelectedMethod] = useState('wechat');
  const [showSuccess, setShowSuccess] = useState<Payment | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const userAppointments = useMemo(
    () => (currentUser ? appointments.filter((a) => a.userId === currentUser.id) : []),
    [appointments, currentUser]
  );

  const userPayments = useMemo(() => {
    const aptIds = userAppointments.map((a) => a.id);
    return payments.filter((p) => aptIds.includes(p.appointmentId));
  }, [payments, userAppointments]);

  const unpaidPayments = useMemo(
    () => userPayments.filter((p) => p.status === 'unpaid'),
    [userPayments]
  );

  const paidPayments = useMemo(
    () => userPayments.filter((p) => p.status === 'paid'),
    [userPayments]
  );

  const getItemsByType = (items: PrescriptionItem[]) => {
    const examItems = items.filter((item) => {
      const aptId = userPayments.find((p) => p.items.includes(item))?.appointmentId;
      const aptPrescriptions = prescriptions.filter((p) => p.appointmentId === aptId && p.type === 'examination');
      return aptPrescriptions.some((p) => p.items.some((i) => i.id === item.id));
    });
    const medItems = items.filter((item) => {
      const aptId = userPayments.find((p) => p.items.includes(item))?.appointmentId;
      const aptPrescriptions = prescriptions.filter((p) => p.appointmentId === aptId && p.type === 'medicine');
      return aptPrescriptions.some((p) => p.items.some((i) => i.id === item.id));
    });
    return { examItems, medItems };
  };

  const handlePay = () => {
    if (!selectedPayment) {
      setToast('请选择要支付的订单');
      setTimeout(() => setToast(null), 2000);
      return;
    }
    const payment = userPayments.find((p) => p.id === selectedPayment);
    if (!payment) return;

    const apt = appointments.find((a) => a.id === payment.appointmentId);
    if (!apt) return;

    setIsProcessing(true);
    setTimeout(() => {
      try {
        const result = processPayment(apt.id);
        setIsProcessing(false);
        setShowSuccess(result);
        setSelectedPayment(null);
      } catch {
        setIsProcessing(false);
        setToast('支付失败，请稍后重试');
        setTimeout(() => setToast(null), 2000);
      }
    }, 1500);
  };

  const formatSize = (kb: number) => {
    if (kb >= 1024) return (kb / 1024).toFixed(1) + 'MB';
    return kb + 'KB';
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-slate-800 animate-fade-in-up">
          就诊缴费
        </h1>

        {unpaidPayments.length > 0 && (
          <div className="card p-6 border-2 border-danger/20 animate-fade-in-up stagger-1">
            <div className="flex items-center justify-between mb-5">
              <h2 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-danger" />
                待缴费 ({unpaidPayments.length})
              </h2>
              <span className="text-sm text-slate-500">
                合计 <span className="text-danger font-bold text-xl ml-1">¥{unpaidPayments.reduce((s, p) => s + p.selfPayAmount, 0).toFixed(2)}</span>
              </span>
            </div>

            <div className="space-y-4">
              {unpaidPayments.map((payment) => {
                const apt = appointments.find((a) => a.id === payment.appointmentId);
                const doctor = apt ? getDoctorById(apt.doctorId) : null;
                const dept = apt ? getDepartmentById(apt.departmentId) : null;
                const isExpanded = expandedPayment === payment.id;
                const isSelected = selectedPayment === payment.id;
                const { examItems, medItems } = getItemsByType(payment.items);

                return (
                  <div
                    key={payment.id}
                    className={`rounded-xl border-2 transition-all overflow-hidden ${
                      isSelected ? 'border-medical-500 bg-medical-50/30' : 'border-slate-200 bg-white'
                    }`}
                  >
                    <label className="flex items-start gap-4 p-5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => setSelectedPayment(isSelected ? null : payment.id)}
                        className="mt-1.5 w-5 h-5 rounded border-slate-300 text-medical-500 focus:ring-medical-400"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-slate-800">{dept?.name}</span>
                          <span className="text-slate-400">·</span>
                          <span className="text-slate-600">{doctor?.name}</span>
                          <span className="text-xs text-slate-400">{doctor?.title}</span>
                        </div>
                        <div className="text-sm text-slate-500 flex items-center gap-3">
                          {apt && (
                            <span className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              {apt.date}
                            </span>
                          )}
                          <span>共{payment.items.length}项</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400">自付金额</div>
                        <div className="text-2xl font-bold text-danger">¥{payment.selfPayAmount.toFixed(2)}</div>
                      </div>
                    </label>

                    <button
                      onClick={() => setExpandedPayment(isExpanded ? null : payment.id)}
                      className="w-full px-5 py-2.5 border-t border-slate-100 flex items-center justify-center gap-1 text-sm text-slate-500 hover:bg-slate-50 transition-colors"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      {isExpanded ? '收起明细' : '展开明细'}
                    </button>

                    {isExpanded && payment.items.length > 0 && (
                      <div className="border-t border-slate-100 bg-slate-50 p-5 animate-fade-in-up">
                        {examItems.length > 0 && (
                          <div className="mb-5">
                            <h4 className="text-sm font-medium text-slate-700 mb-3">检查项目</h4>
                            <div className="bg-white rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100">
                                  <tr>
                                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">名称</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">单价</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">数量</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">小计</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">医保</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {examItems.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                      <td className="px-4 py-3 text-slate-700">{item.name}</td>
                                      <td className="px-4 py-3 text-right text-slate-600">¥{item.unitPrice.toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                                      <td className="px-4 py-3 text-right font-medium text-slate-800">¥{item.totalPrice.toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right text-medical-500">{Math.round(item.insuranceRatio * 100)}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        {medItems.length > 0 && (
                          <div>
                            <h4 className="text-sm font-medium text-slate-700 mb-3">药品费用</h4>
                            <div className="bg-white rounded-lg overflow-hidden">
                              <table className="w-full text-sm">
                                <thead className="bg-slate-100">
                                  <tr>
                                    <th className="text-left px-4 py-2.5 font-medium text-slate-600">名称</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">单价</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">数量</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">小计</th>
                                    <th className="text-right px-4 py-2.5 font-medium text-slate-600">医保</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {medItems.map((item) => (
                                    <tr key={item.id} className="border-t border-slate-100">
                                      <td className="px-4 py-3 text-slate-700">
                                        {item.name}
                                        {item.specification && <span className="text-xs text-slate-400 ml-1">({item.specification})</span>}
                                      </td>
                                      <td className="px-4 py-3 text-right text-slate-600">¥{item.unitPrice.toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right text-slate-600">{item.quantity}</td>
                                      <td className="px-4 py-3 text-right font-medium text-slate-800">¥{item.totalPrice.toFixed(2)}</td>
                                      <td className="px-4 py-3 text-right text-medical-500">{Math.round(item.insuranceRatio * 100)}%</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}

                        <div className="mt-5 p-5 rounded-xl bg-gradient-to-r from-medical-50 to-cyan-50 border border-medical-100">
                          <div className="grid grid-cols-3 gap-6">
                            <div>
                              <div className="text-sm text-slate-500 mb-1">总金额</div>
                              <div className="text-xl font-semibold text-slate-700">¥{payment.totalAmount.toFixed(2)}</div>
                            </div>
                            <div>
                              <div className="text-sm text-slate-500 mb-2">医保报销</div>
                              <div className="relative h-3 bg-slate-200 rounded-full overflow-hidden">
                                <div
                                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-medical-500 to-cyan-500 rounded-full"
                                  style={{ width: `${(payment.insuranceCoverage / payment.totalAmount) * 100}%` }}
                                />
                              </div>
                              <div className="text-medical-600 font-semibold mt-1">¥{payment.insuranceCoverage.toFixed(2)}</div>
                            </div>
                            <div className="text-right">
                              <div className="text-sm text-slate-500 mb-1">自付金额</div>
                              <div className="text-2xl font-bold text-danger">¥{payment.selfPayAmount.toFixed(2)}</div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="font-semibold text-slate-700 mb-4">选择支付方式</h3>
              <div className="grid grid-cols-3 gap-4">
                {paymentMethods.map((method) => (
                  <button
                    key={method.id}
                    onClick={() => setSelectedMethod(method.id)}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedMethod === method.id
                        ? 'border-medical-500 bg-medical-50'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${method.color} flex items-center justify-center`}>
                        <method.icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="font-medium text-slate-800">{method.name}</div>
                        <div className="text-xs text-slate-400">{method.desc}</div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handlePay}
              disabled={!selectedPayment || isProcessing}
              className="w-full mt-6 py-4 rounded-xl bg-gradient-to-r from-medical-500 to-medical-600 text-white font-semibold text-lg shadow-lg hover:shadow-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isProcessing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  处理中...
                </>
              ) : (
                <>
                  <Wallet className="w-5 h-5" />
                  确认支付 ¥{selectedPayment ? userPayments.find((p) => p.id === selectedPayment)?.selfPayAmount.toFixed(2) : '0.00'}
                </>
              )}
            </button>
          </div>
        )}

        {unpaidPayments.length === 0 && (
          <div className="card p-12 text-center animate-fade-in-up stagger-1">
            <CheckCircle className="w-16 h-16 mx-auto text-success opacity-60 mb-4" />
            <h3 className="text-lg font-semibold text-slate-700 mb-1">暂无待缴费订单</h3>
            <p className="text-slate-400">您的所有费用都已结清</p>
          </div>
        )}

        {paidPayments.length > 0 && (
          <div className="card p-6 animate-fade-in-up stagger-2">
            <h2 className="font-bold text-lg text-slate-800 mb-5 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-success" />
              已缴费记录 ({paidPayments.length})
            </h2>
            <div className="space-y-3">
              {paidPayments.map((payment) => {
                const apt = appointments.find((a) => a.id === payment.appointmentId);
                const doctor = apt ? getDoctorById(apt.doctorId) : null;
                const dept = apt ? getDepartmentById(apt.departmentId) : null;
                return (
                  <div
                    key={payment.id}
                    className="p-4 rounded-xl bg-slate-50 flex items-center gap-4"
                  >
                    <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-success" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-semibold text-slate-800">
                        {dept?.name} · {doctor?.name}
                      </div>
                      <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-3">
                        <span>{apt?.date}</span>
                        <span>共{payment.items.length}项</span>
                        {payment.paidAt && <span>支付于 {new Date(payment.paidAt).toLocaleString('zh-CN')}</span>}
                      </div>
                      {payment.pickupWindow && (
                        <div className="text-xs text-medical-600 mt-1 flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3" />
                          取药窗口：{payment.pickupWindow}
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-slate-700">¥{payment.selfPayAmount.toFixed(2)}</div>
                      <div className="text-xs text-slate-400">医保报销 ¥{payment.insuranceCoverage.toFixed(2)}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-8 text-center max-w-md w-full animate-fade-in-up">
            <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center mx-auto mb-5">
              <CheckCircle className="w-12 h-12 text-success" strokeWidth={2} />
            </div>
            <h3 className="text-2xl font-bold text-slate-800 mb-2">支付成功！</h3>
            <p className="text-slate-500 mb-4">您已完成缴费</p>
            <div className="p-5 rounded-xl bg-gradient-to-r from-medical-50 to-cyan-50 border border-medical-100 text-left mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">总金额</span>
                <span className="text-slate-700">¥{showSuccess.totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-slate-500">医保报销</span>
                <span className="text-medical-600">-¥{showSuccess.insuranceCoverage.toFixed(2)}</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-medical-100">
                <span className="text-slate-700 font-medium">实付金额</span>
                <span className="text-danger font-bold text-lg">¥{showSuccess.selfPayAmount.toFixed(2)}</span>
              </div>
            </div>
            {showSuccess.pickupWindow && (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-left mb-6">
                <div className="text-amber-700 font-medium flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5" />
                  取药指引
                </div>
                <p className="text-amber-600 text-sm mt-1">请前往 <span className="font-bold">{showSuccess.pickupWindow}</span> 取药</p>
              </div>
            )}
            <button
              onClick={() => setShowSuccess(null)}
              className="btn-primary w-full py-3"
            >
              完成
            </button>
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
