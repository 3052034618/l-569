import { create } from 'zustand';
import { persist } from 'zustand/middleware';
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
  PaymentItemDetail,
  Review,
  MedicalRecord,
  Message,
  MonthlyReport,
  TimeSlot,
  TodoItem,
  MedicineStatus,
  PaymentStatus,
} from '../types';
import { EXAM_LOCATIONS, EXAM_NOTES, EXAM_DEPARTMENTS, EXAM_ITEM_DEPARTMENT_MAP, PICKUP_WINDOW_COUNT } from '../types';
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
  todos: TodoItem[];
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
  processPayment: (paymentId: string) => Payment;
  addMedicalRecord: (record: Omit<MedicalRecord, 'id' | 'uploadedAt'>) => MedicalRecord;
  deleteMedicalRecord: (recordId: string) => void;
  addReview: (review: Omit<Review, 'id' | 'createdAt'>) => Review;
  markMessageRead: (messageId: string) => void;
  generateMonthlyReport: () => MonthlyReport[];
  updateDepartmentQuota: (departmentId: string, dailyQuota: number) => void;
  regenerateSchedules: (departmentId: string, rules: Record<string, boolean>) => void;
  bookExamTime: (paymentId: string, itemId: string, appointmentTime: string) => boolean;
  completeExam: (paymentId: string, itemId: string, result: string) => void;
  releaseExamReport: (paymentId: string, itemId: string) => void;
  updateMedicineStatus: (paymentId: string, itemId: string, status: MedicineStatus) => void;
  dispenseMedicine: (paymentId: string, itemId: string) => void;
  getExamSlotAvailability: (examName: string, date: string, time: string) => number;
  checkExamTimeConflict: (userId: string, date: string, time: string, excludeItemId?: string) => boolean;
  addTodo: (todo: Omit<TodoItem, 'id' | 'createdAt'>) => void;
  markTodoCompleted: (todoId: string) => void;
  getDoctorById: (id: string) => Doctor | undefined;
  getDepartmentById: (id: string) => Department | undefined;
  getAppointmentsByUser: (userId: string) => Appointment[];
  getAppointmentsByDoctor: (doctorId: string) => Appointment[];
  getPaymentsByUser: (userId: string) => Payment[];
  getMessagesByUser: (userId: string, role?: UserRole) => Message[];
  getUnreadMessageCount: (userId: string, role?: UserRole) => number;
  getTodosByUser: (userId: string) => TodoItem[];
  getExamItemsByUser: (userId: string) => Array<{ paymentId: string; itemDetail: PaymentItemDetail; payment: Payment }>;
  resetStore: () => void;
}

const genId = () => Math.random().toString(36).slice(2, 11);

const initCallingNumbers: Record<string, number> = {};
mockDepartments.forEach((d) => {
  initCallingNumbers[d.id] = 0;
});

const buildItemDetails = (
  items: PrescriptionItem[],
  existingPrescriptions: Prescription[],
  appointmentId: string,
  pickupWindow?: string,
  includePickupCode = false,
): PaymentItemDetail[] => {
  const examPrescriptions = existingPrescriptions.filter(
    (p) => p.appointmentId === appointmentId && p.type === 'examination'
  );
  const medPrescriptions = existingPrescriptions.filter(
    (p) => p.appointmentId === appointmentId && p.type === 'medicine'
  );

  return items.map((item, idx) => {
    const isExam = examPrescriptions.some((p) => p.items.some((i) => i.id === item.id));
    const isMed = medPrescriptions.some((p) => p.items.some((i) => i.id === item.id));
    const type: 'examination' | 'medicine' = isExam ? 'examination' : isMed ? 'medicine' : 'medicine';

    const detail: PaymentItemDetail = {
      itemId: item.id,
      type,
      name: item.name,
      amount: item.totalPrice,
    };

    if (type === 'medicine') {
      detail.medicineStatus = pickupWindow ? 'pending' : 'pending';
      detail.pickupWindow = pickupWindow;
      if (includePickupCode && pickupWindow) {
        detail.medicinePickupCode = String(100000 + Math.floor(Math.random() * 900000));
        detail.medicineQueuePosition = idx + 1 + Math.floor(Math.random() * 10);
      }
    } else {
      detail.examLocation = EXAM_LOCATIONS[item.name] || '门诊楼1层';
      detail.examNotes = EXAM_NOTES[item.name] || '请按医嘱进行检查';
      detail.examReportStatus = 'pending';
    }

    return detail;
  });
};

const generateExamSlots = (): Array<{ date: string; time: string; available: boolean }> => {
  const slots: Array<{ date: string; time: string; available: boolean }> = [];
  const times = ['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '14:00', '14:30', '15:00', '15:30', '16:00'];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const dateStr = d.toISOString().split('T')[0];
    times.forEach((time) => {
      slots.push({
        date: dateStr,
        time,
        available: Math.random() > 0.3,
      });
    });
  }
  return slots;
};

export const useHospitalStore = create<HospitalState>()(
  persist(
    (set, get) => ({
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
      todos: [],
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
        const { schedules, messages, doctors, departments, appointments } = get();
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
        const timeSlotLabel: Record<string, string> = {
          morning: '上午', afternoon: '下午', evening: '晚上',
        };
        const msg: Message = {
          id: genId(),
          userId,
          role: 'patient',
          type: 'appointment',
          title: '预约成功',
          content: `您已成功预约${dept?.name || ''}${doctor?.name || ''} ${date} ${timeSlotLabel[timeSlot] || timeSlot}门诊，挂号单号：${registrationNo}`,
          voucherAvailable: true,
          isRead: false,
          createdAt: new Date().toISOString(),
        };
        set((state) => ({ messages: [...state.messages, msg] }));

        const todo: Omit<TodoItem, 'id' | 'createdAt'> = {
          userId,
          type: 'checkin',
          title: '待签到',
          description: `${dept?.name || ''}${doctor?.name || ''} ${date} ${timeSlotLabel[timeSlot] || timeSlot}`,
          status: 'pending',
          relatedId: appointment.id,
        };
        get().addTodo(todo);

        return appointment;
      },

      checkIn: (appointmentId) => {
        const { appointments, messages, doctors, departments, todos } = get();
        const apt = appointments.find((a) => a.id === appointmentId);
        if (!apt) throw new Error('预约不存在');
        const checkedInCount = appointments.filter(
          (a) => a.departmentId === apt.departmentId && a.status === 'checked_in' && a.date === apt.date
        ).length;
        const sequenceNo = checkedInCount + 1;
        const updated: Appointment = { ...apt, status: 'checked_in', sequenceNo };
        set((state) => ({
          appointments: state.appointments.map((a) => (a.id === appointmentId ? updated : a)),
          todos: state.todos.map((t) =>
            t.relatedId === appointmentId && t.type === 'checkin' ? { ...t, status: 'completed' } : t
          ),
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

        const { prescriptions, appointments, messages, doctors, departments, payments } = get();
        const aptPrescriptions = prescriptions.filter((p) => p.appointmentId === appointmentId);
        const allItems: PrescriptionItem[] = aptPrescriptions.flatMap((p) => p.items);
        const totalAmount = allItems.reduce((sum, it) => sum + it.totalPrice, 0);
        const insuranceCoverage = allItems.reduce(
          (sum, it) => sum + it.totalPrice * it.insuranceRatio,
          0
        );
        const selfPayAmount = totalAmount - insuranceCoverage;

        const apt = appointments.find((a) => a.id === appointmentId);
        const existingUnpaid = payments.find(
          (p) => p.appointmentId === appointmentId && p.status === 'unpaid'
        );
        const itemDetails = buildItemDetails(allItems, aptPrescriptions, appointmentId);

        if (existingUnpaid) {
          set((state) => ({
            payments: state.payments.map((p) =>
              p.id === existingUnpaid.id
                ? {
                    ...p,
                    items: allItems,
                    itemDetails,
                    totalAmount,
                    insuranceCoverage,
                    selfPayAmount,
                  }
                : p
            ),
          }));
        } else {
          const payment: Payment = {
            id: genId(),
            appointmentId,
            items: allItems,
            itemDetails,
            totalAmount,
            insuranceCoverage,
            selfPayAmount,
            status: 'unpaid',
          };
          set((state) => ({
            payments: [...state.payments, payment],
          }));
        }

        if (apt) {
          const doctor = doctors.find((d) => d.id === doctorId);
          const dept = departments.find((d) => d.id === apt.departmentId);
          const msg: Message = {
            id: genId(),
            userId: apt.userId,
            role: 'patient',
            type: 'payment',
            title: '待缴费提醒',
            content: `${dept?.name || ''}${doctor?.name || ''}已为您开具${type === 'examination' ? '检查' : '药品'}处方，待支付金额：¥${selfPayAmount.toFixed(2)}（医保报销¥${insuranceCoverage.toFixed(2)}），请前往缴费页面完成支付`,
            voucherAvailable: false,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ messages: [...state.messages, msg] }));

          const todo: Omit<TodoItem, 'id' | 'createdAt'> = {
            userId: apt.userId,
            type: 'payment',
            title: '待缴费',
            description: `${dept?.name || ''}${type === 'examination' ? '检查' : '药品'}费用 ¥${selfPayAmount.toFixed(2)}`,
            status: 'pending',
            relatedId: existingUnpaid?.id || apt.id,
          };
          get().addTodo(todo);
        }

        return prescription;
      },

      processPayment: (paymentId) => {
        const { payments, appointments, messages, prescriptions, todos } = get();
        const payment = payments.find((p) => p.id === paymentId);
        if (!payment) throw new Error('支付单不存在');
        if (payment.status === 'paid') throw new Error('该订单已支付');

        const pickupWindow = String(Math.floor(Math.random() * PICKUP_WINDOW_COUNT) + 1);
        const aptPrescriptions = prescriptions.filter((p) => p.appointmentId === payment.appointmentId);
        const itemDetails = buildItemDetails(payment.items, aptPrescriptions, payment.appointmentId, pickupWindow, true);

        const updated: Payment = {
          ...payment,
          status: 'paid',
          paidAt: new Date().toISOString(),
          pickupWindow,
          itemDetails,
        };
        set((state) => ({
          payments: state.payments.map((p) => (p.id === paymentId ? updated : p)),
          appointments: state.appointments.map((a) =>
            a.id === payment.appointmentId ? { ...a, status: 'completed' } : a
          ),
          todos: state.todos.map((t) =>
            (t.relatedId === paymentId || t.relatedId === payment.appointmentId) && t.type === 'payment'
              ? { ...t, status: 'completed' }
              : t
          ),
        }));
        const apt = appointments.find((a) => a.id === payment.appointmentId);
        if (apt) {
          const msg: Message = {
            id: genId(),
            userId: apt.userId,
            role: 'patient',
            type: 'payment',
            title: '缴费成功',
            content: `缴费成功！总金额：¥${payment.totalAmount.toFixed(2)}，医保报销：¥${payment.insuranceCoverage.toFixed(2)}，自付：¥${payment.selfPayAmount.toFixed(2)}。`,
            voucherAvailable: true,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ messages: [...state.messages, msg] }));

          const hasExam = itemDetails.some((d) => d.type === 'examination');
          const hasMed = itemDetails.some((d) => d.type === 'medicine');

          if (hasExam) {
            const examTodo: Omit<TodoItem, 'id' | 'createdAt'> = {
              userId: apt.userId,
              type: 'examination',
              title: '待预约检查',
              description: '请选择检查时间并按时前往',
              status: 'pending',
              relatedId: paymentId,
            };
            get().addTodo(examTodo);

            const examMsg: Message = {
              id: genId(),
              userId: apt.userId,
              role: 'patient',
              type: 'examination',
              title: '检查待预约',
              content: '您有检查项目需要预约，请前往检查预约页面选择时间',
              voucherAvailable: false,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            set((state) => ({ messages: [...state.messages, examMsg] }));
          }

          if (hasMed) {
            const medTodo: Omit<TodoItem, 'id' | 'createdAt'> = {
              userId: apt.userId,
              type: 'medicine',
              title: '待取药',
              description: `请前往${pickupWindow}号窗口取药`,
              status: 'pending',
              relatedId: paymentId,
            };
            get().addTodo(medTodo);

            const medMsg: Message = {
              id: genId(),
              userId: apt.userId,
              role: 'patient',
              type: 'system',
              title: '待取药提醒',
              content: `您的药品正在调配中，请前往${pickupWindow}号窗口排队取药`,
              voucherAvailable: false,
              isRead: false,
              createdAt: new Date().toISOString(),
            };
            set((state) => ({ messages: [...state.messages, medMsg] }));
          }

          const reviewTodo: Omit<TodoItem, 'id' | 'createdAt'> = {
            userId: apt.userId,
            type: 'review',
            title: '待评价',
            description: '请对本次就诊服务进行评价',
            status: 'pending',
            relatedId: apt.id,
          };
          get().addTodo(reviewTodo);
        }
        return updated;
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

      deleteMedicalRecord: (recordId) => {
        set((state) => ({
          medicalRecords: state.medicalRecords.filter((r) => r.id !== recordId),
        }));
      },

      addReview: (review) => {
        const newReview: Review = {
          ...review,
          id: genId(),
          createdAt: new Date().toISOString(),
        };
        set((state) => ({
          reviews: [...state.reviews, newReview],
          todos: state.todos.map((t) =>
            t.relatedId === review.appointmentId && t.type === 'review' ? { ...t, status: 'completed' } : t
          ),
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
        set((state) => ({ messages: [...state.messages, ...newMessages] }));
        return reports;
      },

      updateDepartmentQuota: (departmentId, dailyQuota) => {
        set((state) => ({
          departments: state.departments.map((d) =>
            d.id === departmentId ? { ...d, dailyQuota } : d
          ),
        }));
      },

      regenerateSchedules: (departmentId, rules) => {
        const { schedules, doctors, departments, appointments } = get();
        const deptDoctors = doctors.filter((d) => d.departmentId === departmentId);
        const dept = departments.find((d) => d.id === departmentId);
        if (!dept) return;

        const next7Days: string[] = [];
        for (let i = 0; i < 7; i++) {
          const d = new Date();
          d.setDate(d.getDate() + i);
          next7Days.push(d.toISOString().split('T')[0]);
        }

        const newSchedules: Schedule[] = [];
        deptDoctors.forEach((doc) => {
          next7Days.forEach((date) => {
            const dayIdx = (new Date(date).getDay() + 6) % 7;
            const slotsOfDay = (['morning', 'afternoon', 'evening'] as TimeSlot[]).filter((slot) => rules[`${dayIdx}-${slot}`]);
            const slotCountToday = slotsOfDay.length || 1;
            const perSlotQuota = Math.max(10, Math.floor(dept.dailyQuota / (deptDoctors.length * slotCountToday)));

            (['morning', 'afternoon', 'evening'] as TimeSlot[]).forEach((slot) => {
              const key = `${dayIdx}-${slot}`;
              if (rules[key]) {
                const existing = schedules.find(
                  (s) => s.doctorId === doc.id && s.date === date && s.timeSlot === slot
                );
                const bookedCount = appointments.filter(
                  (a) => a.doctorId === doc.id && a.date === date && a.timeSlot === slot && a.status !== 'cancelled'
                ).length;
                const remaining = Math.max(0, perSlotQuota - bookedCount);

                const timeRange: Record<TimeSlot, [string, string]> = {
                  morning: ['08:00', '12:00'],
                  afternoon: ['14:00', '17:30'],
                  evening: ['18:00', '20:30'],
                };

                newSchedules.push({
                  id: existing?.id || genId(),
                  doctorId: doc.id,
                  departmentId,
                  date,
                  timeSlot: slot,
                  startTime: timeRange[slot][0],
                  endTime: timeRange[slot][1],
                  totalQuota: perSlotQuota,
                  remainingQuota: existing ? remaining : perSlotQuota - Math.floor(Math.random() * Math.min(perSlotQuota, 10)),
                });
              }
            });
          });
        });

        set((state) => {
          const otherSchedules = state.schedules.filter(
            (s) => s.departmentId !== departmentId
          );
          return {
            schedules: [...otherSchedules, ...newSchedules],
          };
        });
      },

      bookExamTime: (paymentId, itemId, appointmentTime) => {
        const { payments, messages, todos, appointments } = get();
        const payment = payments.find((p) => p.id === paymentId);
        if (!payment) return false;

        const item = payment.itemDetails.find((d) => d.itemId === itemId);
        if (!item) return false;

        const [date, time] = appointmentTime.split(' ');

        const deptId = EXAM_ITEM_DEPARTMENT_MAP[item.name] || 'lab';
        const availability = get().getExamSlotAvailability(item.name, date, time);
        if (availability <= 0) {
          return false;
        }

        const apt = appointments.find((a) => a.id === payment.appointmentId);
        if (apt) {
          const hasConflict = get().checkExamTimeConflict(apt.userId, date, time, itemId);
          if (hasConflict) {
            return false;
          }
        }

        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  itemDetails: p.itemDetails.map((d) =>
                    d.itemId === itemId ? { ...d, examAppointmentTime: appointmentTime } : d
                  ),
                }
              : p
          ),
        }));

        const updatedPayment = get().payments.find((p) => p.id === paymentId);
        if (updatedPayment && apt) {
          const examItems = updatedPayment.itemDetails.filter((d) => d.type === 'examination');
          const allBooked = examItems.every((d) => d.examAppointmentTime);
          if (allBooked) {
            set((state) => ({
              todos: state.todos.map((t) =>
                t.relatedId === paymentId && t.type === 'examination' ? { ...t, status: 'completed' } : t
              ),
            }));
          }

          const msg: Message = {
            id: genId(),
            userId: apt.userId,
            role: 'patient',
            type: 'examination',
            title: '检查预约成功',
            content: `${item.name} 已预约成功，时间：${appointmentTime}，地点：${item.examLocation}`,
            voucherAvailable: true,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ messages: [...state.messages, msg] }));
        }

        return true;
      },

      completeExam: (paymentId, itemId, result) => {
        const { payments, messages, appointments } = get();
        const payment = payments.find((p) => p.id === paymentId);
        if (!payment) return;

        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  itemDetails: p.itemDetails.map((d) =>
                    d.itemId === itemId
                      ? { ...d, examResult: result, examCompletedAt: new Date().toISOString(), examReportStatus: 'pending' }
                      : d
                  ),
                }
              : p
          ),
        }));

        const item = payment.itemDetails.find((d) => d.itemId === itemId);
        const apt = appointments.find((a) => a.id === payment.appointmentId);
        if (item && apt) {
          const msg: Message = {
            id: genId(),
            userId: apt.userId,
            role: 'patient',
            type: 'report',
            title: '检查完成，报告待出',
            content: `${item.name} 检查已完成，报告正在出具中，请耐心等待`,
            voucherAvailable: false,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ messages: [...state.messages, msg] }));
        }
      },

      releaseExamReport: (paymentId, itemId) => {
        const { payments, messages, appointments } = get();
        const payment = payments.find((p) => p.id === paymentId);
        if (!payment) return;

        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  itemDetails: p.itemDetails.map((d) =>
                    d.itemId === itemId
                      ? { ...d, examReportStatus: 'ready', examReportAvailableAt: new Date().toISOString() }
                      : d
                  ),
                }
              : p
          ),
        }));

        const item = payment.itemDetails.find((d) => d.itemId === itemId);
        const apt = appointments.find((a) => a.id === payment.appointmentId);
        if (item && apt) {
          const msg: Message = {
            id: genId(),
            userId: apt.userId,
            role: 'patient',
            type: 'report',
            title: '检查报告已出',
            content: `您的${item.name}报告已出具，可在检查预约或病历评价页面查看`,
            voucherAvailable: false,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ messages: [...state.messages, msg] }));
        }
      },

      dispenseMedicine: (paymentId, itemId) => {
        const { payments, messages, appointments } = get();
        const payment = payments.find((p) => p.id === paymentId);
        if (!payment) return;

        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  itemDetails: p.itemDetails.map((d) =>
                    d.itemId === itemId ? { ...d, medicineStatus: 'dispensed' as MedicineStatus } : d
                  ),
                }
              : p
          ),
        }));

        const item = payment.itemDetails.find((d) => d.itemId === itemId);
        const apt = appointments.find((a) => a.id === payment.appointmentId);
        if (item && apt) {
          const msg: Message = {
            id: genId(),
            userId: apt.userId,
            role: 'patient',
            type: 'system',
            title: '药品已配好',
            content: `您的${item.name}已调配完成，请前往${item.pickupWindow}号窗口取药`,
            voucherAvailable: false,
            isRead: false,
            createdAt: new Date().toISOString(),
          };
          set((state) => ({ messages: [...state.messages, msg] }));
        }
      },

      updateMedicineStatus: (paymentId, itemId, status) => {
        const { payments, todos } = get();
        const payment = payments.find((p) => p.id === paymentId);
        if (!payment) return;

        set((state) => ({
          payments: state.payments.map((p) =>
            p.id === paymentId
              ? {
                  ...p,
                  itemDetails: p.itemDetails.map((d) =>
                    d.itemId === itemId ? { ...d, medicineStatus: status } : d
                  ),
                }
              : p
          ),
        }));

        if (status === 'picked_up') {
          const updatedPayment = get().payments.find((p) => p.id === paymentId);
          if (updatedPayment) {
            const medItems = updatedPayment.itemDetails.filter((d) => d.type === 'medicine');
            const allPicked = medItems.every((d) => d.medicineStatus === 'picked_up');
            if (allPicked) {
              set((state) => ({
                todos: state.todos.map((t) =>
                  t.relatedId === paymentId && t.type === 'medicine' ? { ...t, status: 'completed' } : t
                ),
              }));
            }
          }
        }
      },

      getExamSlotAvailability: (examName, date, time) => {
        const deptId = EXAM_ITEM_DEPARTMENT_MAP[examName] || 'lab';
        const dept = EXAM_DEPARTMENTS.find((d) => d.id === deptId);
        if (!dept) return 0;
        const capacity = dept.capacityPerSlot;

        const { payments } = get();
        let booked = 0;
        payments.forEach((p) => {
          if (p.status !== 'paid') return;
          p.itemDetails.forEach((d) => {
            if (d.type !== 'examination' || !d.examAppointmentTime) return;
            const itemDeptId = EXAM_ITEM_DEPARTMENT_MAP[d.name] || 'lab';
            if (itemDeptId !== deptId) return;
            const [aptDate, aptTime] = d.examAppointmentTime.split(' ');
            if (aptDate === date && aptTime === time) {
              booked++;
            }
          });
        });

        return Math.max(0, capacity - booked);
      },

      checkExamTimeConflict: (userId, date, time, excludeItemId?) => {
        const { payments, appointments } = get();
        const userAptIds = appointments.filter((a) => a.userId === userId).map((a) => a.id);
        const userPayments = payments.filter((p) => userAptIds.includes(p.appointmentId) && p.status === 'paid');

        for (const p of userPayments) {
          for (const d of p.itemDetails) {
            if (d.type !== 'examination' || !d.examAppointmentTime) continue;
            if (excludeItemId && d.itemId === excludeItemId) continue;
            const [aptDate, aptTime] = d.examAppointmentTime.split(' ');
            if (aptDate === date && aptTime === time) {
              return true;
            }
          }
        }
        return false;
      },

      addTodo: (todo) => {
        set((state) => ({
          todos: [
            ...state.todos,
            { ...todo, id: genId(), createdAt: new Date().toISOString() },
          ],
        }));
      },

      markTodoCompleted: (todoId) => {
        set((state) => ({
          todos: state.todos.map((t) => (t.id === todoId ? { ...t, status: 'completed' } : t)),
        }));
      },

      getDoctorById: (id) => get().doctors.find((d) => d.id === id),
      getDepartmentById: (id) => get().departments.find((d) => d.id === id),
      getAppointmentsByUser: (userId) => get().appointments.filter((a) => a.userId === userId),
      getAppointmentsByDoctor: (doctorId) => get().appointments.filter((a) => a.doctorId === doctorId),
      getPaymentsByUser: (userId) => {
        const aptIds = get().appointments.filter((a) => a.userId === userId).map((a) => a.id);
        return get().payments.filter((p) => aptIds.includes(p.appointmentId));
      },
      getMessagesByUser: (userId, role) =>
        get().messages.filter((m) => m.userId === userId && (!role || m.role === role)),
      getUnreadMessageCount: (userId, role) =>
        get().messages.filter(
          (m) => m.userId === userId && (!role || m.role === role) && !m.isRead
        ).length,
      getTodosByUser: (userId) =>
        get().todos
          .filter((t) => t.userId === userId)
          .sort((a, b) => (a.status === 'pending' ? -1 : 1) || b.createdAt.localeCompare(a.createdAt)),
      getExamItemsByUser: (userId) => {
        const userPayments = get().getPaymentsByUser(userId);
        const result: Array<{ paymentId: string; itemDetail: PaymentItemDetail; payment: Payment }> = [];
        userPayments.forEach((p) => {
          if (p.status === 'paid') {
            p.itemDetails.forEach((d) => {
              if (d.type === 'examination' && !d.examCompletedAt) {
                result.push({ paymentId: p.id, itemDetail: d, payment: p });
              }
            });
          }
        });
        return result;
      },

      resetStore: () => {
        set({
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
          todos: [],
          currentCallingNumber: initCallingNumbers,
        });
      },
    }),
    {
      name: 'hospital-store',
      partialize: (state) => ({
        departments: state.departments,
        schedules: state.schedules,
        appointments: state.appointments,
        prescriptions: state.prescriptions,
        payments: state.payments,
        reviews: state.reviews,
        medicalRecords: state.medicalRecords,
        messages: state.messages,
        monthlyReports: state.monthlyReports,
        todos: state.todos,
        currentCallingNumber: state.currentCallingNumber,
      }),
    }
  )
);
