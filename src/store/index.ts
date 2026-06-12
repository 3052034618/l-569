import { create } from 'zustand';
import type {
  User,
  UserRole,
  Department,
  Doctor,
  Schedule,
  Appointment,
  AppointmentStatus,
  Prescription,
  PrescriptionItem,
  Payment,
  Review,
  MedicalRecord,
  Message,
  MonthlyReport,
  TimeSlot,
} from '../types';
import {
  users as mockUsers,
  departments as mockDepartments,
  doctors as mockDoctors,
  schedules as mockSchedules,
  appointments as mockAppointments,
  prescriptions as mockPrescriptions,
  payments as mockPayments,
  reviews as mockReviews,
  medicalRecords as mockMedicalRecords,
  messages as mockMessages,
  monthlyReports as mockMonthlyReports,
} from '../data/mockData';

interface HospitalState {
  currentUser: User | null;
  departments: Department[];
  doctors: Doctor[];
  schedules: Schedule[];
  appointments: Appointment[];
  prescriptions: Prescription[];
  payments: Payment[];
  reviews: Review[];
  medicalRecords: MedicalRecord[];
  messages: Message[];
  monthlyReports: MonthlyReport[];
  currentCallingNumber: Record<string, number>;
  login: (role: UserRole, account: string, password: string) => boolean;
  logout: () => void;
  createAppointment: (
    userId: string,
    doctorId: string,
    departmentId: string,
    scheduleId: string,
    date: string,
    timeSlot: TimeSlot
  ) => Appointment;
  checkIn: (appointmentId: string) => Appointment;
  updateAppointmentStatus: (appointmentId: string, status: AppointmentStatus) => void;
  callNextNumber: (departmentId: string) => void;
  createPrescription: (
    appointmentId: string,
    doctorId: string,
    type: 'examination' | 'medicine',
    items: PrescriptionItem[]
  ) => Prescription;
  processPayment: (appointmentId: string) => Payment;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'uploadedAt'>) => MedicalRecord;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Review;
  markMessageRead: (messageId: string) => void;
  generateMonthlyReport: () => MonthlyReport[];
  getDoctorById: (id: string) => Doctor | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getAppointmentsByUser: (userId: string) => Appointment[];
  getAppointmentsByDoctor: (doctorId: string) => Appointment[];
  getMessagesByUser: (userId: string, role?: UserRole) => Message[];
  getUnreadMessageCount: (userId: string, role?: UserRole) => number;
}

const genId = () => Math.random().toString(36).slice(2, 11);

const initCallingNumbers: Record<string, number> = {};
mockDepartments.forEach((d) => {
  initCallingNumbers[d.id] = 0;
});

export const useHospitalStore = create<HospitalState>((set, get) => ({
  currentUser: null,
  departments: mockDepartments,
  doctors: mockDoctors,
  schedules: mockSchedules,
  appointments: mockAppointments,
  prescriptions: mockPrescriptions,
  payments: mockPayments,
  reviews: mockReviews,
  medicalRecords: mockMedicalRecords,
  messages: mockMessages,
  monthlyReports: mockMonthlyReports,
  currentCallingNumber: initCallingNumbers,

  login: (role, account, _password) => {
    const users = mockUsers;
    let user: User | undefined;
    if (role === 'patient') {
      user = users.find(
        (u) => u.role === 'patient' && (u.phone === account || u.idCard === account || u.id === account)
      );
    } else if (role === 'doctor' || role === 'director') {
      user = users.find((u) => u.role === role && u.id === account);
    } else if (role === 'admin') {
      user = users.find((u) => u.role === 'admin' && u.id === account);
    }
    if (user) {
      set({ currentUser: user });
      return true;
    }
    return false;
  },

  logout: () => set({ currentUser: null }),

  createAppointment: (userId, doctorId, departmentId, scheduleId, date, timeSlot) => {
    const { schedules, messages, doctors, departments } = get();
    const schedule = schedules.find((s) => s.id === scheduleId);
    if (!schedule || schedule.remainingQuota <= 0) {
      throw new Error('号源不足');
    }
    const registrationNo = 'REG' + Date.now();
    const appointment: Appointment = {
      id: genId(),
      userId,
      doctorId,
      departmentId,
      scheduleId,
      date,
      timeSlot,
      status: 'pending',
      registrationNo,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      appointments: [...state.appointments, appointment],
      schedules: state.schedules.map((s) =>
        s.id === scheduleId ? { ...s, remainingQuota: s.remainingQuota - 1 } : s
      ),
    }));
    const doctor = doctors.find((d) => d.id === doctorId);
    const dept = departments.find((d) => d.id === departmentId);
    const msg: Message = {
      id: genId(),
      userId,
      role: 'patient',
      type: 'appointment',
      title: '预约成功',
      content: `您已成功预约${dept?.name || ''}${doctor?.name || ''} ${date} ${timeSlot}门诊，挂号单号：${registrationNo}`,
      voucherAvailable: true,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set({ messages: [...messages, msg] });
    return appointment;
  },

  checkIn: (appointmentId) => {
    const { appointments, messages, doctors, departments } = get();
    const apt = appointments.find((a) => a.id === appointmentId);
    if (!apt) throw new Error('预约不存在');
    const checkedInCount = appointments.filter(
      (a) => a.departmentId === apt.departmentId && a.status === 'checked_in' && a.date === apt.date
    ).length;
    const sequenceNo = checkedInCount + 1;
    const updated: Appointment = { ...apt, status: 'checked_in', sequenceNo };
    set((state) => ({
      appointments: state.appointments.map((a) => (a.id === appointmentId ? updated : a)),
    }));
    const doctor = doctors.find((d) => d.id === apt.doctorId);
    const dept = departments.find((d) => d.id === apt.departmentId);
    const msg: Message = {
      id: genId(),
      userId: apt.userId,
      role: 'patient',
      type: 'checkin',
      title: '签到成功',
      content: `您已签到${dept?.name || ''}${doctor?.name || ''}门诊，排队序号：${sequenceNo}，请耐心等待叫号`,
      voucherAvailable: false,
      isRead: false,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({ messages: [...state.messages, msg] }));
    return updated;
  },

  updateAppointmentStatus: (appointmentId, status) => {
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status } : a
      ),
    }));
  },

  callNextNumber: (departmentId) => {
    set((state) => {
      const next = (state.currentCallingNumber[departmentId] || 0) + 1;
      return {
        currentCallingNumber: {
          ...state.currentCallingNumber,
          [departmentId]: next,
        },
      };
    });
  },

  createPrescription: (appointmentId, doctorId, type, items) => {
    const prescription: Prescription = {
      id: genId(),
      appointmentId,
      doctorId,
      type,
      items,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      prescriptions: [...state.prescriptions, prescription],
    }));
    return prescription;
  },

  processPayment: (appointmentId) => {
    const { prescriptions, appointments, messages } = get();
    const aptPrescriptions = prescriptions.filter((p) => p.appointmentId === appointmentId);
    const items: PrescriptionItem[] = aptPrescriptions.flatMap((p) => p.items);
    const totalAmount = items.reduce((sum, it) => sum + it.totalPrice, 0);
    const insuranceCoverage = items.reduce(
      (sum, it) => sum + it.totalPrice * it.insuranceRatio,
      0
    );
    const selfPayAmount = totalAmount - insuranceCoverage;
    const pickupWindow = String(Math.floor(Math.random() * 5) + 1);
    const payment: Payment = {
      id: genId(),
      appointmentId,
      items,
      totalAmount,
      insuranceCoverage,
      selfPayAmount,
      status: 'paid',
      paidAt: new Date().toISOString(),
      pickupWindow,
    };
    set((state) => ({
      payments: [...state.payments, payment],
      appointments: state.appointments.map((a) =>
        a.id === appointmentId ? { ...a, status: 'completed' } : a
      ),
    }));
    const apt = appointments.find((a) => a.id === appointmentId);
    if (apt) {
      const msg: Message = {
        id: genId(),
        userId: apt.userId,
        role: 'patient',
        type: 'payment',
        title: '缴费成功',
        content: `缴费成功！总金额：¥${totalAmount.toFixed(2)}，医保报销：¥${insuranceCoverage.toFixed(2)}，自付：¥${selfPayAmount.toFixed(2)}。请到${pickupWindow}号窗口取药`,
        voucherAvailable: true,
        isRead: false,
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ messages: [...state.messages, msg] }));
    }
    return payment;
  },

  addMedicalRecord: (record) => {
    const newRecord: MedicalRecord = {
      ...record,
      id: genId(),
      uploadedAt: new Date().toISOString(),
    };
    set((state) => ({
      medicalRecords: [...state.medicalRecords, newRecord],
    }));
    return newRecord;
  },

  addReview: (review) => {
    const newReview: Review = {
      ...review,
      id: genId(),
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      reviews: [...state.reviews, newReview],
    }));
    return newReview;
  },

  markMessageRead: (messageId) => {
    set((state) => ({
      messages: state.messages.map((m) =>
        m.id === messageId ? { ...m, isRead: true } : m
      ),
    }));
  },

  generateMonthlyReport: () => {
    const { departments, doctors, messages } = get();
    const month = new Date().toISOString().slice(0, 7);
    const reports: MonthlyReport[] = departments.map((dept) => {
      const deptDoctors = doctors.filter((d) => d.departmentId === dept.id);
      return {
        id: genId(),
        departmentId: dept.id,
        departmentName: dept.name,
        month,
        revenue: Math.floor(Math.random() * 500000) + 100000,
        revenueGrowth: Math.random() * 0.3 - 0.1,
        patientCount: Math.floor(Math.random() * 500) + 100,
        patientGrowth: Math.random() * 0.2 - 0.05,
        avgWaitTime: Math.floor(Math.random() * 30) + 10,
        avgSatisfaction: +(Math.random() * 1 + 4).toFixed(2),
        doctorWorkload: deptDoctors.map((doc) => ({
          doctorId: doc.id,
          doctorName: doc.name,
          patientCount: Math.floor(Math.random() * 100) + 20,
          avgScore: +(Math.random() * 1 + 4).toFixed(2),
        })),
        generatedAt: new Date().toISOString(),
      };
    });
    set((state) => ({ monthlyReports: [...state.monthlyReports, ...reports] }));
    const adminUsers = mockUsers.filter((u) => u.role === 'admin');
    const newMessages: Message[] = adminUsers.map((admin) => ({
      id: genId(),
      userId: admin.id,
      role: 'admin',
      type: 'report',
      title: '月度报表已生成',
      content: `${month} 月度统计报表已生成，请前往报表中心查看`,
      voucherAvailable: false,
      isRead: false,
      createdAt: new Date().toISOString(),
    }));
    set({ messages: [...messages, ...newMessages] });
    return reports;
  },

  getDoctorById: (id) => get().doctors.find((d) => d.id === id),

  getDepartmentById: (id) => get().departments.find((d) => d.id === id),

  getAppointmentsByUser: (userId) =>
    get().appointments.filter((a) => a.userId === userId),

  getAppointmentsByDoctor: (doctorId) =>
    get().appointments.filter((a) => a.doctorId === doctorId),

  getMessagesByUser: (userId, role) =>
    get().messages.filter((m) => m.userId === userId && (!role || m.role === role)),

  getUnreadMessageCount: (userId, role) =>
    get().messages.filter(
      (m) => m.userId === userId && (!role || m.role === role) && !m.isRead
    ).length,
}));
