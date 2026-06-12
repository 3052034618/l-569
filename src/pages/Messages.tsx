import { useState, useMemo } from 'react';
import {
  Bell,
  CalendarCheck,
  MapPinCheck,
  CreditCard,
  BarChart3,
  Settings,
  Download,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import { useHospitalStore } from '@/store';
import type { MessageType } from '@/types';

interface TabItem {
  key: 'all' | MessageType;
  label: string;
  icon: typeof Bell;
}

const tabs: TabItem[] = [
  { key: 'all', label: '全部', icon: Inbox },
  { key: 'appointment', label: '预约', icon: CalendarCheck },
  { key: 'checkin', label: '签到', icon: MapPinCheck },
  { key: 'payment', label: '缴费', icon: CreditCard },
  { key: 'report', label: '报表', icon: BarChart3 },
  { key: 'system', label: '系统', icon: Settings },
];

const typeColorMap: Record<MessageType, { bg: string; text: string; iconBg: string }> = {
  appointment: { bg: 'bg-medical-50', text: 'text-medical-600', iconBg: 'bg-medical-100' },
  checkin: { bg: 'bg-cyan-50', text: 'text-cyan-600', iconBg: 'bg-cyan-100' },
  payment: { bg: 'bg-emerald-50', text: 'text-emerald-600', iconBg: 'bg-emerald-100' },
  report: { bg: 'bg-purple-50', text: 'text-purple-600', iconBg: 'bg-purple-100' },
  system: { bg: 'bg-slate-50', text: 'text-slate-600', iconBg: 'bg-slate-100' },
};

const formatDateTime = (iso: string) => {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return '刚刚';
  if (diffMin < 60) return `${diffMin}分钟前`;
  if (diffHr < 24) return `${diffHr}小时前`;
  if (diffDay < 7) return `${diffDay}天前`;
  return `${d.getMonth() + 1}-${d.getDate()}`;
};

export default function Messages() {
  const {
    currentUser,
    getMessagesByUser,
    getUnreadMessageCount,
    markMessageRead,
  } = useHospitalStore();

  const [activeTab, setActiveTab] = useState<'all' | MessageType>('all');

  const allMessages = useMemo(() => {
    if (!currentUser) return [];
    return getMessagesByUser(currentUser.id, currentUser.role).sort(
      (a, b) => b.createdAt.localeCompare(a.createdAt)
    );
  }, [currentUser, getMessagesByUser]);

  const filteredMessages = useMemo(() => {
    if (activeTab === 'all') return allMessages;
    return allMessages.filter((m) => m.type === activeTab);
  }, [allMessages, activeTab]);

  const unreadTotal = useMemo(() => {
    if (!currentUser) return 0;
    return getUnreadMessageCount(currentUser.id, currentUser.role);
  }, [currentUser, getUnreadMessageCount]);

  const unreadByType = useMemo(() => {
    const counts: Record<string, number> = {};
    allMessages.forEach((m) => {
      if (!m.isRead) {
        counts[m.type] = (counts[m.type] || 0) + 1;
      }
    });
    return counts;
  }, [allMessages]);

  const handleMarkRead = (messageId: string) => {
    markMessageRead(messageId);
  };

  const handleDownloadVoucher = (e: React.MouseEvent) => {
    e.stopPropagation();
    const blob = new Blob(['就诊凭证\n（模拟数据）'], { type: 'text/plain;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = '就诊凭证.txt';
    link.click();
  };

  const getTypeIcon = (type: MessageType) => {
    const tab = tabs.find((t) => t.key === type);
    return tab?.icon || Bell;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-[1200px] mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Bell className="w-7 h-7 text-medical-500" />
              消息中心
            </h1>
            <p className="text-slate-500 mt-1">查看系统通知与个人消息</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-9 w-9 items-center justify-center">
              <Bell className="w-5 h-5 text-slate-500" />
              {unreadTotal > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-danger px-1.5 text-xs font-medium text-white">
                  {unreadTotal}
                </span>
              )}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-3">
            <div className="card p-3">
              <nav className="space-y-1">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  const count = tab.key === 'all' ? unreadTotal : unreadByType[tab.key] || 0;
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all ${
                        isActive
                          ? 'bg-medical-50 text-medical-700'
                          : 'text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-medical-500' : 'text-slate-400'}`} />
                      <span className="flex-1 text-left text-sm font-medium">{tab.label}</span>
                      {count > 0 && (
                        <span className="min-w-[20px] h-5 px-1.5 rounded-full bg-danger text-white text-xs font-medium flex items-center justify-center">
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          <div className="col-span-9">
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-slate-800">
                  {tabs.find((t) => t.key === activeTab)?.label}消息
                  <span className="text-sm font-normal text-slate-400 ml-2">
                    共 {filteredMessages.length} 条
                  </span>
                </h2>
              </div>

              <div className="space-y-3">
                {filteredMessages.length === 0 ? (
                  <div className="text-center py-16 text-slate-400">
                    <Inbox className="w-16 h-16 mx-auto mb-4 opacity-30" />
                    <p className="text-lg">暂无消息</p>
                  </div>
                ) : (
                  filteredMessages.map((msg) => {
                    const Icon = getTypeIcon(msg.type);
                    const colorCfg = typeColorMap[msg.type];
                    return (
                      <div
                        key={msg.id}
                        onClick={() => !msg.isRead && handleMarkRead(msg.id)}
                        className={`relative p-4 rounded-lg border transition-all cursor-pointer group ${
                          msg.isRead
                            ? 'bg-white border-slate-100 hover:border-slate-200'
                            : 'bg-white border-l-4 border-l-medical-500 border-slate-100 hover:border-slate-200 shadow-sm'
                        }`}
                      >
                        {!msg.isRead && (
                          <span className="absolute top-4 right-4 w-2 h-2 rounded-full bg-danger" />
                        )}
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${colorCfg.iconBg}`}
                          >
                            <Icon className={`w-5 h-5 ${colorCfg.text}`} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h3
                                  className={`font-medium ${
                                    msg.isRead ? 'text-slate-700' : 'text-slate-900'
                                  }`}
                                >
                                  {msg.title}
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                  {formatDateTime(msg.createdAt)}
                                </p>
                              </div>
                              <span
                                className={`badge text-xs ${colorCfg.iconBg} ${colorCfg.text}`}
                              >
                                {tabs.find((t) => t.key === msg.type)?.label}
                              </span>
                            </div>
                            <p
                              className={`text-sm mt-2 leading-relaxed ${
                                msg.isRead ? 'text-slate-500' : 'text-slate-600'
                              }`}
                            >
                              {msg.content}
                            </p>
                            <div className="flex items-center gap-3 mt-3">
                              {msg.voucherAvailable && (
                                <button
                                  onClick={handleDownloadVoucher}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-medical-600 bg-medical-50 rounded-md hover:bg-medical-100 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  下载凭证
                                </button>
                              )}
                              {!msg.isRead && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMarkRead(msg.id);
                                  }}
                                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                                >
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                  标记已读
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
