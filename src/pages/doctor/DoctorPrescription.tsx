import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  UserCircle,
  Search,
  Plus,
  Minus,
  X,
  Pill,
  Stethoscope,
  ShoppingCart,
  Send,
  ArrowLeft,
  CheckCircle2,
  FileText,
} from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { Appointment, PrescriptionItem, PrescriptionType } from '@/types';

interface CatalogItem {
  id: string;
  name: string;
  unitPrice: number;
  insuranceRatio: number;
  specification?: string;
  category: string;
}

const examCatalog: CatalogItem[] = [
  { id: 'e1', name: '血常规检查', unitPrice: 35, insuranceRatio: 0.8, category: '检验' },
  { id: 'e2', name: '尿常规检查', unitPrice: 28, insuranceRatio: 0.8, category: '检验' },
  { id: 'e3', name: '肝功能检查', unitPrice: 120, insuranceRatio: 0.75, category: '检验' },
  { id: 'e4', name: '肾功能检查', unitPrice: 95, insuranceRatio: 0.75, category: '检验' },
  { id: 'e5', name: '心电图检查', unitPrice: 80, insuranceRatio: 0.85, category: '检查' },
  { id: 'e6', name: '心脏彩超', unitPrice: 280, insuranceRatio: 0.7, category: '影像' },
  { id: 'e7', name: '腹部B超', unitPrice: 150, insuranceRatio: 0.7, category: '影像' },
  { id: 'e8', name: '胸部X光片', unitPrice: 120, insuranceRatio: 0.75, category: '影像' },
  { id: 'e9', name: '头部CT平扫', unitPrice: 380, insuranceRatio: 0.65, category: '影像' },
  { id: 'e10', name: '腰椎MRI平扫', unitPrice: 680, insuranceRatio: 0.65, category: '影像' },
  { id: 'e11', name: 'C反应蛋白检测', unitPrice: 45, insuranceRatio: 0.8, category: '检验' },
  { id: 'e12', name: '血糖检测', unitPrice: 18, insuranceRatio: 0.9, category: '检验' },
];

const medicineCatalog: CatalogItem[] = [
  { id: 'm1', name: '硝苯地平缓释片', specification: '30mg*7片/盒', unitPrice: 45, insuranceRatio: 0.9, category: '心血管' },
  { id: 'm2', name: '阿托伐他汀钙片', specification: '20mg*7片/盒', unitPrice: 58, insuranceRatio: 0.85, category: '心血管' },
  { id: 'm3', name: '阿司匹林肠溶片', specification: '100mg*30片/盒', unitPrice: 28, insuranceRatio: 0.9, category: '心血管' },
  { id: 'm4', name: '小儿氨酚黄那敏颗粒', specification: '6g*10袋/盒', unitPrice: 25, insuranceRatio: 0.85, category: '感冒发烧' },
  { id: 'm5', name: '氨溴特罗口服溶液', specification: '60ml/瓶', unitPrice: 38, insuranceRatio: 0.8, category: '止咳化痰' },
  { id: 'm6', name: '布洛芬缓释胶囊', specification: '0.3g*20粒/盒', unitPrice: 22, insuranceRatio: 0.9, category: '解热镇痛' },
  { id: 'm7', name: '阿莫西林胶囊', specification: '0.25g*24粒/盒', unitPrice: 32, insuranceRatio: 0.9, category: '抗生素' },
  { id: 'm8', name: '头孢克肟分散片', specification: '0.1g*6片/盒', unitPrice: 48, insuranceRatio: 0.85, category: '抗生素' },
  { id: 'm9', name: '奥美拉唑肠溶胶囊', specification: '20mg*14粒/盒', unitPrice: 36, insuranceRatio: 0.9, category: '消化系统' },
  { id: 'm10', name: '蒙脱石散', specification: '3g*10袋/盒', unitPrice: 18, insuranceRatio: 0.95, category: '消化系统' },
  { id: 'm11', name: '氯雷他定片', specification: '10mg*6片/盒', unitPrice: 24, insuranceRatio: 0.9, category: '抗过敏' },
  { id: 'm12', name: '维生素C片', specification: '0.1g*100片/瓶', unitPrice: 12, insuranceRatio: 0.95, category: '维生素' },
];

const patientNameMap: Record<string, string> = {
  p1: '张明',
  p2: '李华',
};

const formatTime = (iso: string) => {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

const genId = () => Math.random().toString(36).slice(2, 11);

export default function DoctorPrescription() {
  const navigate = useNavigate();
  const { currentUser, getAppointmentsByDoctor, createPrescription } = useHospitalStore();

  const [activeTab, setActiveTab] = useState<PrescriptionType>('examination');
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [selectedItems, setSelectedItems] = useState<PrescriptionItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);

  const today = useMemo(() => new Date().toISOString().split('T')[0], []);

  const candidateAppointments = useMemo(() => {
    if (!currentUser?.doctorId) return [];
    return getAppointmentsByDoctor(currentUser.doctorId).filter(
      (a) => (a.status === 'checked_in' || a.status === 'in_progress') && a.date === today
    );
  }, [currentUser, getAppointmentsByDoctor, today]);

  const catalog = activeTab === 'examination' ? examCatalog : medicineCatalog;

  const filteredCatalog = useMemo(() => {
    if (!searchQuery.trim()) return catalog;
    const q = searchQuery.toLowerCase();
    return catalog.filter(
      (item) =>
        item.name.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q) ||
        (item.specification || '').toLowerCase().includes(q)
    );
  }, [catalog, searchQuery]);

  const addItem = (catalogItem: CatalogItem) => {
    setSelectedItems((prev) => {
      const existing = prev.find((p) => p.name === catalogItem.name);
      if (existing) {
        return prev.map((p) =>
          p.name === catalogItem.name
            ? {
                ...p,
                quantity: p.quantity + 1,
                totalPrice: (p.quantity + 1) * p.unitPrice,
              }
            : p
        );
      }
      return [
        ...prev,
        {
          id: genId(),
          name: catalogItem.name,
          specification: catalogItem.specification,
          quantity: 1,
          unitPrice: catalogItem.unitPrice,
          totalPrice: catalogItem.unitPrice,
          insuranceRatio: catalogItem.insuranceRatio,
        },
      ];
    });
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setSelectedItems((prev) =>
      prev
        .map((p) =>
          p.id === itemId
            ? {
                ...p,
                quantity: Math.max(1, p.quantity + delta),
                totalPrice: Math.max(1, p.quantity + delta) * p.unitPrice,
              }
            : p
        )
    );
  };

  const removeItem = (itemId: string) => {
    setSelectedItems((prev) => prev.filter((p) => p.id !== itemId));
  };

  const totals = useMemo(() => {
    const totalAmount = selectedItems.reduce((sum, i) => sum + i.totalPrice, 0);
    const insuranceCoverage = selectedItems.reduce((sum, i) => sum + i.totalPrice * i.insuranceRatio, 0);
    const selfPay = totalAmount - insuranceCoverage;
    return { totalAmount, insuranceCoverage, selfPay };
  }, [selectedItems]);

  const handleCreatePrescription = () => {
    if (!selectedAppointment || !currentUser?.doctorId || selectedItems.length === 0) return;
    createPrescription(
      selectedAppointment.id,
      currentUser.doctorId,
      activeTab,
      selectedItems
    );
    setShowSuccess(true);
    setSelectedItems([]);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
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
                开单处方
              </h1>
              <p className="text-slate-500 mt-1">选择患者并开具检查或药品处方</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="card p-4">
              <h2 className="font-semibold text-slate-800 mb-3 flex items-center gap-2">
                <UserCircle className="w-5 h-5 text-medical-500" />
                选择患者
              </h2>
              <div className="space-y-2">
                {candidateAppointments.length === 0 ? (
                  <p className="text-sm text-slate-400 text-center py-8">暂无待诊患者</p>
                ) : (
                  candidateAppointments.map((apt) => (
                    <button
                      key={apt.id}
                      onClick={() => setSelectedAppointment(apt)}
                      className={`w-full p-3 rounded-lg text-left transition-all ${
                        selectedAppointment?.id === apt.id
                          ? 'bg-medical-50 border-2 border-medical-300'
                          : 'bg-slate-50 border border-slate-100 hover:border-medical-200'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-white flex items-center justify-center shadow-sm">
                          <UserCircle className="w-6 h-6 text-medical-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm text-slate-800">
                            {patientNameMap[apt.userId] || '患者'}
                          </p>
                          <p className="text-xs text-slate-400">
                            #{apt.sequenceNo} · {formatTime(apt.createdAt)}
                          </p>
                        </div>
                        <span
                          className={`badge text-xs ${
                            apt.status === 'in_progress'
                              ? 'bg-medical-100 text-medical-700'
                              : 'bg-amber-100 text-amber-700'
                          }`}
                        >
                          {apt.status === 'in_progress' ? '就诊中' : '待叫号'}
                        </span>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="col-span-6">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <div className="flex gap-1 bg-slate-100 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('examination')}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === 'examination'
                        ? 'bg-white text-medical-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Stethoscope className="w-4 h-4" />
                    检查项目
                  </button>
                  <button
                    onClick={() => setActiveTab('medicine')}
                    className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                      activeTab === 'medicine'
                        ? 'bg-white text-medical-600 shadow-sm'
                        : 'text-slate-500 hover:text-slate-700'
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    药品处方
                  </button>
                </div>
              </div>

              <div className="relative mb-4">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`搜索${activeTab === 'examination' ? '检查项目' : '药品'}...`}
                  className="input-field pl-10"
                />
              </div>

              <div className="grid grid-cols-2 gap-3 max-h-[520px] overflow-y-auto scrollbar-thin pr-1">
                {filteredCatalog.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => addItem(item)}
                    className="p-3 rounded-lg bg-slate-50 border border-slate-100 hover:border-medical-300 hover:bg-medical-50/50 transition-all text-left group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm text-slate-800 group-hover:text-medical-700">
                          {item.name}
                        </p>
                        {item.specification && (
                          <p className="text-xs text-slate-400 mt-0.5">{item.specification}</p>
                        )}
                        <p className="text-xs text-slate-400 mt-1">
                          分类：{item.category} · 医保{Math.round(item.insuranceRatio * 100)}%
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-medical-600">¥{item.unitPrice}</p>
                        <Plus className="w-4 h-4 text-slate-300 group-hover:text-medical-500 mt-1 ml-auto" />
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="col-span-3">
            <div className="card p-5 h-full flex flex-col">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <ShoppingCart className="w-5 h-5 text-medical-500" />
                已选项目
                <span className="badge bg-medical-100 text-medical-700 ml-auto">
                  {selectedItems.length}
                </span>
              </h2>

              {!selectedAppointment ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <UserCircle className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">请先选择就诊患者</p>
                </div>
              ) : selectedItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
                  <ShoppingCart className="w-12 h-12 mb-3 opacity-30" />
                  <p className="text-sm">暂无已选项目</p>
                </div>
              ) : (
                <>
                  <div className="flex-1 space-y-2 overflow-y-auto scrollbar-thin pr-1 max-h-[420px]">
                    {selectedItems.map((item) => (
                      <div
                        key={item.id}
                        className="p-3 rounded-lg bg-slate-50 border border-slate-100"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm text-slate-800">{item.name}</p>
                            {item.specification && (
                              <p className="text-xs text-slate-400">{item.specification}</p>
                            )}
                          </div>
                          <button
                            onClick={() => removeItem(item.id)}
                            className="p-1 text-slate-400 hover:text-danger transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateQuantity(item.id, -1)}
                              className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center hover:border-medical-300 text-slate-600"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <button
                              onClick={() => updateQuantity(item.id, 1)}
                              className="w-6 h-6 rounded bg-white border border-slate-200 flex items-center justify-center hover:border-medical-300 text-slate-600"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-medical-600 text-sm">
                              ¥{item.totalPrice.toFixed(2)}
                            </p>
                            <p className="text-xs text-slate-400">
                              医保 ¥{(item.totalPrice * item.insuranceRatio).toFixed(2)}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">项目数量</span>
                      <span className="text-slate-700 font-medium">
                        {selectedItems.reduce((s, i) => s + i.quantity, 0)} 项
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">医保报销</span>
                      <span className="text-success font-medium">
                        ¥{totals.insuranceCoverage.toFixed(2)}
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">自付金额</span>
                      <span className="text-warning font-medium">¥{totals.selfPay.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-slate-100">
                      <span className="text-slate-600 font-medium">总金额</span>
                      <span className="text-2xl font-bold text-medical-600">
                        ¥{totals.totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                </>
              )}

              <button
                onClick={handleCreatePrescription}
                disabled={!selectedAppointment || selectedItems.length === 0}
                className="mt-4 w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                <Send className="w-4 h-4" />
                开具处方
              </button>
            </div>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="card px-6 py-3 flex items-center gap-3 shadow-hover border-success/30">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-medium text-slate-700">处方开具成功！</span>
          </div>
        </div>
      )}
    </div>
  );
}
