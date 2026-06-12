import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart3,
  ArrowLeft,
  Calendar,
  FileDown,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  Users,
  Clock,
  Star,
  CheckCircle2,
} from 'lucide-react';
import { useHospitalStore } from '@/store';

export default function AdminReports() {
  const navigate = useNavigate();
  const { monthlyReports, generateMonthlyReport } = useHospitalStore();

  const availableMonths = useMemo(() => {
    const months = new Set(monthlyReports.map((r) => r.month));
    return Array.from(months).sort().reverse();
  }, [monthlyReports]);

  const [selectedMonth, setSelectedMonth] = useState<string>(
    availableMonths[0] || new Date().toISOString().slice(0, 7)
  );
  const [showSuccess, setShowSuccess] = useState(false);

  const currentReports = useMemo(() => {
    return monthlyReports.filter((r) => r.month === selectedMonth);
  }, [monthlyReports, selectedMonth]);

  const summary = useMemo(() => {
    if (currentReports.length === 0) {
      return { totalRevenue: 0, totalPatients: 0, avgWait: 0, avgSatisfaction: 0 };
    }
    const totalRevenue = currentReports.reduce((s, r) => s + r.revenue, 0);
    const totalPatients = currentReports.reduce((s, r) => s + r.patientCount, 0);
    const avgWait = currentReports.reduce((s, r) => s + r.avgWaitTime, 0) / currentReports.length;
    const avgSat = currentReports.reduce((s, r) => s + r.avgSatisfaction, 0) / currentReports.length;
    return { totalRevenue, totalPatients, avgWait, avgSatisfaction: avgSat };
  }, [currentReports]);

  const handleGenerate = () => {
    generateMonthlyReport();
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const handleExport = () => {
    const header = ['科室', '收入(元)', '环比增长(%)', '门诊量', '环比增长(%)', '平均候诊(分钟)', '满意度(%)'];
    const rows = currentReports.map((r) => [
      r.departmentName,
      r.revenue.toString(),
      r.revenueGrowth.toFixed(1),
      r.patientCount.toString(),
      r.patientGrowth.toFixed(1),
      r.avgWaitTime.toString(),
      r.avgSatisfaction.toFixed(1),
    ]);
    const csv = [header, ...rows].map((row) => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `月度报表_${selectedMonth}.csv`;
    link.click();
  };

  const GrowthCell = ({ value, suffix = '%' }: { value: number; suffix?: string }) => {
    const positive = value >= 0;
    return (
      <span
        className={`inline-flex items-center gap-1 font-medium ${
          positive ? 'text-success' : 'text-danger'
        }`}
      >
        {positive ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
        {positive ? '+' : ''}
        {value.toFixed(1)}{suffix}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin')}
              className="p-2 rounded-lg hover:bg-white border border-slate-200 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-7 h-7 text-medical-500" />
                月度报表中心
              </h1>
              <p className="text-slate-500 mt-1">全院各科室月度运营数据对比分析</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="card px-3 py-2 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-medical-500" />
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="bg-transparent text-sm font-medium text-slate-700 outline-none pr-2"
              >
                {availableMonths.map((m) => (
                  <option key={m} value={m}>
                    {m.replace('-', '年')}月
                  </option>
                ))}
              </select>
            </div>
            <button
              onClick={handleGenerate}
              className="btn-secondary flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              生成报表
            </button>
            <button
              onClick={handleExport}
              disabled={currentReports.length === 0}
              className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FileDown className="w-4 h-4" />
              导出 CSV
            </button>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">全院总收入</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  ¥{(summary.totalRevenue / 10000).toFixed(1)}
                  <span className="text-base font-normal text-slate-400"> 万</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">总门诊量</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {summary.totalPatients.toLocaleString()}
                  <span className="text-base font-normal text-slate-400"> 人次</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-medical-50 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-medical-500" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">平均候诊时长</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {summary.avgWait.toFixed(0)}
                  <span className="text-base font-normal text-slate-400"> 分钟</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-cyan-50 rounded-xl flex items-center justify-center">
                <Clock className="w-6 h-6 text-cyan-500" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">综合满意度</p>
                <p className="text-2xl font-bold text-slate-800 mt-1">
                  {summary.avgSatisfaction.toFixed(1)}
                  <span className="text-base font-normal text-warning"> ★</span>
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-medical-500" />
            各科室对比数据
            <span className="badge bg-medical-100 text-medical-700 ml-auto">
              {selectedMonth.replace('-', '年')}月 · 共 {currentReports.length} 个科室
            </span>
          </h2>
          <div className="overflow-hidden rounded-lg border border-slate-200">
            <table className="w-full">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-5 py-3 text-left text-sm font-medium text-slate-600">科室</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-slate-600">收入</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-slate-600">环比</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-slate-600">门诊量</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-slate-600">环比</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-slate-600">平均候诊</th>
                  <th className="px-5 py-3 text-right text-sm font-medium text-slate-600">满意度</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {currentReports.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-5 py-16 text-center text-slate-400">
                      <BarChart3 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>暂无该月份数据，请点击「生成报表」</p>
                    </td>
                  </tr>
                ) : (
                  currentReports.map((report, idx) => (
                    <tr key={report.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                              idx === 0
                                ? 'bg-amber-100 text-amber-700'
                                : idx === 1
                                ? 'bg-slate-200 text-slate-600'
                                : idx === 2
                                ? 'bg-orange-100 text-orange-700'
                                : 'bg-medical-50 text-medical-600'
                            }`}
                          >
                            {idx + 1}
                          </div>
                          <div className="flex items-center gap-2">
                            <Building2 className="w-4 h-4 text-slate-400" />
                            <span className="font-medium text-slate-800">{report.departmentName}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-semibold text-slate-800">
                          ¥{(report.revenue / 10000).toFixed(1)}万
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <GrowthCell value={report.revenueGrowth} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="font-medium text-slate-700">
                          {report.patientCount.toLocaleString()}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <GrowthCell value={report.patientGrowth} />
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-slate-700">{report.avgWaitTime} 分钟</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="inline-flex items-center gap-1 font-medium text-warning">
                          {report.avgSatisfaction.toFixed(1)} ★
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="card px-6 py-3 flex items-center gap-3 shadow-hover border-success/30">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-medium text-slate-700">月度报表已生成！</span>
          </div>
        </div>
      )}
    </div>
  );
}
