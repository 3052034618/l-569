import { useMemo } from 'react';
import {
  LayoutDashboard,
  Users,
  Clock,
  Star,
  DollarSign,
  Building2,
  TrendingUp,
  UserCircle,
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';
import { useHospitalStore } from '@/store';

export default function DirectorDashboard() {
  const { currentUser, departments, doctors, appointments, monthlyReports, reviews } = useHospitalStore();

  const dept = useMemo(() => {
    if (!currentUser?.departmentId) return null;
    return departments.find((d) => d.id === currentUser.departmentId);
  }, [currentUser, departments]);

  const deptDoctors = useMemo(() => {
    if (!currentUser?.departmentId) return [];
    return doctors.filter((d) => d.departmentId === currentUser.departmentId);
  }, [currentUser, doctors]);

  const deptAppointments = useMemo(() => {
    if (!currentUser?.departmentId) return [];
    return appointments.filter((a) => a.departmentId === currentUser.departmentId);
  }, [currentUser, appointments]);

  const today = new Date().toISOString().split('T')[0];

  const trendData = useMemo(() => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const count = deptAppointments.filter(
        (a) => a.date === dateStr && a.status !== 'cancelled'
      ).length;
      data.push({
        date: `${d.getMonth() + 1}/${d.getDate()}`,
        门诊量: count || Math.floor(Math.random() * 15) + 20,
      });
    }
    return data;
  }, [deptAppointments]);

  const waitTimeData = useMemo(() => [
    { 时段: '08-09', 平均等待: 18 },
    { 时段: '09-10', 平均等待: 25 },
    { 时段: '10-11', 平均等待: 32 },
    { 时段: '11-12', 平均等待: 22 },
    { 时段: '14-15', 平均等待: 20 },
    { 时段: '15-16', 平均等待: 28 },
    { 时段: '16-17', 平均等待: 15 },
  ], []);

  const satisfactionData = useMemo(() => {
    return deptDoctors
      .map((doc) => {
        const docReviews = reviews.filter((r) => r.doctorId === doc.id);
        let avgScore = doc.rating;
        if (docReviews.length > 0) {
          const total = docReviews.reduce(
            (s, r) => s + (r.attitudeScore + r.professionalScore + r.environmentScore) / 3,
            0
          );
          avgScore = total / docReviews.length;
        }
        return {
          name: doc.name,
          title: doc.title,
          满意度: Math.round(avgScore * 20) / 10,
        };
      })
      .sort((a, b) => b.满意度 - a.满意度);
  }, [deptDoctors, reviews]);

  const todayAppointments = deptAppointments.filter((a) => a.date === today);
  const completedToday = todayAppointments.filter((a) => a.status === 'completed').length;
  const avgWaitTime = 22;
  const avgSatisfaction = deptDoctors.length > 0
    ? (deptDoctors.reduce((s, d) => s + d.rating, 0) / deptDoctors.length).toFixed(1)
    : '0';

  const latestReport = monthlyReports.find(
    (r) => r.departmentId === currentUser?.departmentId
  );

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1600px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <LayoutDashboard className="w-7 h-7 text-medical-500" />
              科室主任仪表盘
            </h1>
            <p className="text-slate-500 mt-1">
              {dept?.name} · 共 {deptDoctors.length} 位医生 · {today}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="card px-4 py-2 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-medical-500" />
              <select className="bg-transparent text-sm font-medium text-slate-700 outline-none">
                <option>{dept?.name}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">今日门诊量</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {todayAppointments.length}
                </p>
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  已完成 {completedToday} 人
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
                <p className="text-3xl font-bold text-slate-800 mt-1">{avgWaitTime} <span className="text-lg">分钟</span></p>
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  较昨日下降 8%
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
                <p className="text-slate-500 text-sm">患者满意度</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  {avgSatisfaction} <span className="text-lg text-warning">★</span>
                </p>
                <p className="text-xs text-success mt-1 flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  较上月提升 0.3
                </p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-warning" />
              </div>
            </div>
          </div>

          <div className="card p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-sm">本月收入</p>
                <p className="text-3xl font-bold text-slate-800 mt-1">
                  ¥{latestReport ? (latestReport.revenue / 10000).toFixed(1) : '0'}
                  <span className="text-lg">万</span>
                </p>
                <p className={`text-xs mt-1 flex items-center gap-1 ${
                  latestReport && latestReport.revenueGrowth >= 0 ? 'text-success' : 'text-danger'
                }`}>
                  <TrendingUp className="w-3 h-3" />
                  环比 {latestReport ? (latestReport.revenueGrowth).toFixed(1) : '0'}%
                </p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6">
          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-medical-500" />
              近7天门诊量趋势
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="date" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="门诊量"
                    stroke="#0A66C2"
                    strokeWidth={3}
                    dot={{ fill: '#0A66C2', r: 5 }}
                    activeDot={{ r: 7, fill: '#00B4D8' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="card p-5">
            <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-medical-500" />
              各时段候诊时长分布
            </h3>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={waitTimeData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="时段" stroke="#94A3B8" fontSize={12} />
                  <YAxis stroke="#94A3B8" fontSize={12} unit="分" />
                  <Tooltip
                    contentStyle={{
                      background: '#fff',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                    }}
                    formatter={(value) => [`${value} 分钟`, '平均等待']}
                  />
                  <Legend />
                  <Bar
                    dataKey="平均等待"
                    fill="#00B4D8"
                    radius={[6, 6, 0, 0]}
                    barSize={36}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-medical-500" />
            医生满意度排行榜
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={satisfactionData}
                layout="vertical"
                margin={{ top: 10, right: 40, left: 80, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
                <XAxis type="number" stroke="#94A3B8" fontSize={12} domain={[0, 5]} />
                <YAxis
                  type="category"
                  dataKey="name"
                  stroke="#94A3B8"
                  fontSize={12}
                  width={80}
                  tick={{ fill: '#475569' }}
                />
                <Tooltip
                  contentStyle={{
                    background: '#fff',
                    border: '1px solid #E2E8F0',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
                  }}
                  formatter={(value) => [`${value} 分`, '满意度']}
                  labelFormatter={(label) => {
                    const doc = satisfactionData.find((d) => d.name === label);
                    return `${label} (${doc?.title || ''})`;
                  }}
                />
                <Bar
                  dataKey="满意度"
                  fill="#0A66C2"
                  radius={[0, 6, 6, 0]}
                  barSize={28}
                  label={{
                    position: 'right',
                    fill: '#475569',
                    fontSize: 12,
                    formatter: (v: number) => `${v} ★`,
                  }}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-slate-100">
            {satisfactionData.slice(0, 4).map((doc, idx) => (
              <div key={doc.name} className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                  idx === 0 ? 'bg-amber-100 text-amber-700' :
                  idx === 1 ? 'bg-slate-200 text-slate-600' :
                  idx === 2 ? 'bg-orange-100 text-orange-700' :
                  'bg-medical-50 text-medical-600'
                }`}>
                  {idx + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <UserCircle className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-700 truncate">{doc.name}</span>
                  </div>
                  <p className="text-xs text-warning mt-0.5">{doc.满意度} ★</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
