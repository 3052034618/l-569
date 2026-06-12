import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings,
  Building2,
  Calendar,
  Save,
  Plus,
  Trash2,
  CheckCircle2,
  Users,
  BarChart3,
  Sun,
  Sunset,
  Moon,
  PartyPopper,
} from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { TimeSlot } from '@/types';

const weekDays = [
  { key: 0, label: '周一' },
  { key: 1, label: '周二' },
  { key: 2, label: '周三' },
  { key: 3, label: '周四' },
  { key: 4, label: '周五' },
  { key: 5, label: '周六' },
  { key: 6, label: '周日' },
];

const timeSlots: Array<{ key: TimeSlot; label: string; icon: typeof Sun; time: string }> = [
  { key: 'morning', label: '上午', icon: Sun, time: '08:00-12:00' },
  { key: 'afternoon', label: '下午', icon: Sunset, time: '14:00-17:30' },
  { key: 'evening', label: '晚上', icon: Moon, time: '18:00-20:30' },
];

interface HolidayRule {
  id: string;
  name: string;
  date: string;
  enabled: boolean;
  quotaMultiplier: number;
}

const genId = () => Math.random().toString(36).slice(2, 11);

export default function AdminConsole() {
  const navigate = useNavigate();
  const { departments, schedules, updateDepartmentQuota, regenerateSchedules } = useHospitalStore();

  const [quotaMap, setQuotaMap] = useState<Record<string, number>>(() => {
    const map: Record<string, number> = {};
    departments.forEach((d) => {
      map[d.id] = d.dailyQuota;
    });
    return map;
  });

  const [scheduleMatrix, setScheduleMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    const matrix: Record<string, Record<string, boolean>> = {};

    const next7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() + i);
      next7Days.push(d.toISOString().split('T')[0]);
    }

    departments.forEach((dept) => {
      matrix[dept.id] = {};
      weekDays.forEach((day) => {
        timeSlots.forEach((slot) => {
          const key = `${day.key}-${slot.key}`;
          const hasSchedule = next7Days.some((date) => {
            const dayIdx = (new Date(date).getDay() + 6) % 7;
            if (dayIdx !== day.key) return false;
            return schedules.some(
              (s) =>
                s.departmentId === dept.id &&
                s.date === date &&
                s.timeSlot === slot.key
            );
          });
          matrix[dept.id][key] = hasSchedule;
        });
      });
    });
    return matrix;
  });

  const [selectedDeptId, setSelectedDeptId] = useState<string>(departments[0]?.id || '');
  const [holidays, setHolidays] = useState<HolidayRule[]>([
    { id: 'h1', name: '元旦', date: '2026-01-01', enabled: true, quotaMultiplier: 0.5 },
    { id: 'h2', name: '春节', date: '2026-02-17', enabled: true, quotaMultiplier: 0.3 },
    { id: 'h3', name: '劳动节', date: '2026-05-01', enabled: true, quotaMultiplier: 0.5 },
  ]);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'quota' | 'schedule' | 'holiday'>('quota');

  const selectedDept = useMemo(
    () => departments.find((d) => d.id === selectedDeptId),
    [departments, selectedDeptId]
  );

  const toggleSchedule = (deptId: string, dayKey: number, slotKey: string) => {
    const key = `${dayKey}-${slotKey}`;
    setScheduleMatrix((prev) => ({
      ...prev,
      [deptId]: {
        ...prev[deptId],
        [key]: !prev[deptId]?.[key],
      },
    }));
  };

  const updateQuota = (deptId: string, value: number) => {
    setQuotaMap((prev) => ({
      ...prev,
      [deptId]: Math.max(0, value),
    }));
  };

  const addHoliday = () => {
    setHolidays((prev) => [
      ...prev,
      {
        id: genId(),
        name: '新节假日',
        date: new Date().toISOString().split('T')[0],
        enabled: true,
        quotaMultiplier: 0.5,
      },
    ]);
  };

  const updateHoliday = (id: string, field: keyof HolidayRule, value: any) => {
    setHolidays((prev) =>
      prev.map((h) => (h.id === id ? { ...h, [field]: value } : h))
    );
  };

  const removeHoliday = (id: string) => {
    setHolidays((prev) => prev.filter((h) => h.id !== id));
  };

  const handleSave = () => {
    Object.entries(quotaMap).forEach(([deptId, quota]) => {
      updateDepartmentQuota(deptId, quota);
    });
    Object.keys(scheduleMatrix).forEach((deptId) => {
      regenerateSchedules(deptId, scheduleMatrix[deptId]);
    });
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1400px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Settings className="w-7 h-7 text-medical-500" />
              管理层控制台
            </h1>
            <p className="text-slate-500 mt-1">号源配置与排班规则管理</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => navigate('/admin/reports')}
              className="btn-secondary flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              月度报表
            </button>
            <button onClick={handleSave} className="btn-primary flex items-center gap-2">
              <Save className="w-4 h-4" />
              保存配置
            </button>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-100 rounded-lg p-1 w-fit">
          <button
            onClick={() => setActiveTab('quota')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'quota'
                ? 'bg-white text-medical-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Users className="w-4 h-4" />
            号源配置
          </button>
          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'schedule'
                ? 'bg-white text-medical-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <Calendar className="w-4 h-4" />
            排班规则
          </button>
          <button
            onClick={() => setActiveTab('holiday')}
            className={`px-5 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
              activeTab === 'holiday'
                ? 'bg-white text-medical-600 shadow-sm'
                : 'text-slate-500 hover:text-slate-700'
            }`}
          >
            <PartyPopper className="w-4 h-4" />
            节假日规则
          </button>
        </div>

        {activeTab === 'quota' && (
          <div className="card p-6">
            <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-medical-500" />
              各科室日号源上限配置
            </h2>
            <div className="overflow-hidden rounded-lg border border-slate-200">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-sm font-medium text-slate-600">科室名称</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-slate-600">科室主任</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-slate-600">当前号源上限</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-slate-600">号源调整</th>
                    <th className="px-5 py-3 text-left text-sm font-medium text-slate-600">科室简介</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {departments.map((dept) => (
                    <tr key={dept.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-medical-50 flex items-center justify-center">
                            <Building2 className="w-5 h-5 text-medical-500" />
                          </div>
                          <span className="font-medium text-slate-800">{dept.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-sm text-slate-600">
                        {dept.directorId === 'u5' ? '王建国' :
                         dept.directorId === 'u6' ? '李明辉' :
                         dept.directorId === 'u7' ? '孙丽萍' :
                         dept.directorId === 'u8' ? '刘芳华' :
                         dept.directorId === 'u9' ? '郑志强' : '林静文'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="badge bg-medical-100 text-medical-700 text-sm px-3 py-1">
                          {dept.dailyQuota} 号/日
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateQuota(dept.id, (quotaMap[dept.id] || 0) - 5)}
                            className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                          >
                            -
                          </button>
                          <input
                            type="number"
                            value={quotaMap[dept.id] || 0}
                            onChange={(e) => updateQuota(dept.id, parseInt(e.target.value) || 0)}
                            className="w-20 px-3 py-1.5 text-center border border-slate-200 rounded-lg focus:outline-none focus:border-medical-400 focus:ring-2 focus:ring-medical-100"
                          />
                          <button
                            onClick={() => updateQuota(dept.id, (quotaMap[dept.id] || 0) + 5)}
                            className="w-8 h-8 rounded bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors"
                          >
                            +
                          </button>
                          <span className="text-xs text-slate-400">号/日</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <p className="text-sm text-slate-500 max-w-md line-clamp-2">
                          {dept.description}
                        </p>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="space-y-4">
            <div className="card p-4 flex items-center gap-4">
              <span className="text-sm font-medium text-slate-600">选择科室：</span>
              <div className="flex flex-wrap gap-2">
                {departments.map((dept) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDeptId(dept.id)}
                    className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      selectedDeptId === dept.id
                        ? 'bg-medical-500 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {dept.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="card p-6">
              <h2 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-medical-500" />
                {selectedDept?.name} - 周排班模板
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-slate-600 w-28">时段</th>
                      {weekDays.map((day) => (
                        <th
                          key={day.key}
                          className={`px-4 py-3 text-center text-sm font-medium ${
                            day.key >= 5 ? 'text-warning' : 'text-slate-600'
                          }`}
                        >
                          {day.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {timeSlots.map((slot) => {
                      const Icon = slot.icon;
                      return (
                        <tr key={slot.key}>
                          <td className="px-4 py-4">
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4 text-medical-500" />
                              <div>
                                <p className="text-sm font-medium text-slate-700">{slot.label}</p>
                                <p className="text-xs text-slate-400">{slot.time}</p>
                              </div>
                            </div>
                          </td>
                          {weekDays.map((day) => {
                            const key = `${day.key}-${slot.key}`;
                            const active = scheduleMatrix[selectedDeptId]?.[key];
                            return (
                              <td key={day.key} className="px-4 py-4 text-center">
                                <button
                                  onClick={() => toggleSchedule(selectedDeptId, day.key, slot.key)}
                                  className={`w-12 h-7 rounded-full transition-all relative ${
                                    active
                                      ? 'bg-medical-500'
                                      : 'bg-slate-200'
                                  }`}
                                >
                                  <div
                                    className={`absolute top-0.5 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${
                                      active ? 'left-[22px]' : 'left-0.5'
                                    }`}
                                  />
                                </button>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 pt-4 border-t border-slate-100 flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <div className="w-10 h-5 rounded-full bg-medical-500 relative">
                    <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-white" />
                  </div>
                  <span>开诊</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-10 h-5 rounded-full bg-slate-200 relative">
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white" />
                  </div>
                  <span>停诊</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'holiday' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-slate-800 flex items-center gap-2">
                <PartyPopper className="w-5 h-5 text-medical-500" />
                节假日特殊规则
              </h2>
              <button
                onClick={addHoliday}
                className="btn-secondary text-sm py-1.5 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                添加节假日
              </button>
            </div>
            <div className="space-y-3">
              {holidays.map((holiday) => (
                <div
                  key={holiday.id}
                  className="p-4 rounded-lg bg-slate-50 border border-slate-100 flex items-center gap-4"
                >
                  <button
                    onClick={() => updateHoliday(holiday.id, 'enabled', !holiday.enabled)}
                    className={`w-11 h-6 rounded-full transition-all relative ${
                      holiday.enabled ? 'bg-medical-500' : 'bg-slate-300'
                    }`}
                  >
                    <div
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-sm transition-all ${
                        holiday.enabled ? 'left-[22px]' : 'left-0.5'
                      }`}
                    />
                  </button>
                  <input
                    type="text"
                    value={holiday.name}
                    onChange={(e) => updateHoliday(holiday.id, 'name', e.target.value)}
                    className="w-32 px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-medical-400"
                    placeholder="节假日名称"
                  />
                  <input
                    type="date"
                    value={holiday.date}
                    onChange={(e) => updateHoliday(holiday.id, 'date', e.target.value)}
                    className="px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-medical-400"
                  />
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">号源系数：</span>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="1"
                      value={holiday.quotaMultiplier}
                      onChange={(e) =>
                        updateHoliday(holiday.id, 'quotaMultiplier', parseFloat(e.target.value) || 0)
                      }
                      className="w-20 px-3 py-1.5 border border-slate-200 rounded-lg bg-white focus:outline-none focus:border-medical-400 text-center"
                    />
                    <span className="text-xs text-slate-400">({Math.round(holiday.quotaMultiplier * 100)}%)</span>
                  </div>
                  <button
                    onClick={() => removeHoliday(holiday.id)}
                    className="ml-auto p-2 text-slate-400 hover:text-danger hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {showSuccess && (
        <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 animate-fade-in-up">
          <div className="card px-6 py-3 flex items-center gap-3 shadow-hover border-success/30">
            <CheckCircle2 className="w-5 h-5 text-success" />
            <span className="font-medium text-slate-700">配置保存成功！</span>
          </div>
        </div>
      )}
    </div>
  );
}
