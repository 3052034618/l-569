export type UserRole = 'patient' | 'doctor' | 'director' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  idCard?: string;
  avatar?: string;
  departmentId?: string;
  doctorId?: string;
}

export interface Department {
  id: string;
  name: string;
  directorId: string;
  dailyQuota: number;
  description: string;
}

export interface Doctor {
  id: string;
  name: string;
  title: string;
  departmentId: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  avatar: string;
}

export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface Schedule {
  id: string;
  doctorId: string;
  departmentId: string;
  date: string;
  timeSlot: TimeSlot;
  startTime: string;
  endTime: string;
  totalQuota: number;
  remainingQuota: number;
}

export type AppointmentStatus = 'pending' | 'checked_in' | 'in_progress' | 'completed' | 'cancelled';

export interface Appointment {
  id: string;
  userId: string;
  doctorId: string;
  departmentId: string;
  scheduleId: string;
  date: string;
  timeSlot: TimeSlot;
  status: AppointmentStatus;
  registrationNo: string;
  sequenceNo?: number;
  createdAt: string;
}

export interface PrescriptionItem {
  id: string;
  name: string;
  specification?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  insuranceRatio: number;
}

export type PrescriptionType = 'examination' | 'medicine';

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  type: PrescriptionType;
  items: PrescriptionItem[];
  createdAt: string;
}

export type PaymentStatus = 'unpaid' | 'paid';
export type MedicineStatus = 'pending' | 'dispensed' | 'picked_up';
export type ExamReportStatus = 'pending' | 'ready';

export interface PaymentItemDetail {
  itemId: string;
  type: 'examination' | 'medicine';
  name: string;
  amount: number;
  medicineStatus?: MedicineStatus;
  pickupWindow?: string;
  medicinePickupCode?: string;
  medicineQueuePosition?: number;
  examLocation?: string;
  examAppointmentTime?: string;
  examNotes?: string;
  examResult?: string;
  examCompletedAt?: string;
  examReportStatus?: ExamReportStatus;
  examReportAvailableAt?: string;
}

export interface Payment {
  id: string;
  appointmentId: string;
  items: PrescriptionItem[];
  itemDetails: PaymentItemDetail[];
  totalAmount: number;
  insuranceCoverage: number;
  selfPayAmount: number;
  status: PaymentStatus;
  paidAt?: string;
  pickupWindow?: string;
}

export type MedicalRecordFileType = 'image' | 'pdf';

export interface MedicalRecord {
  id: string;
  userId: string;
  appointmentId: string;
  fileName: string;
  fileType: MedicalRecordFileType;
  fileSize: number;
  uploadedAt: string;
}

export interface Review {
  id: string;
  userId: string;
  doctorId: string;
  appointmentId: string;
  attitudeScore: number;
  professionalScore: number;
  environmentScore: number;
  comment?: string;
  createdAt: string;
}

export type MessageType = 'appointment' | 'checkin' | 'payment' | 'report' | 'system' | 'examination';

export interface Message {
  id: string;
  userId: string;
  role: UserRole;
  type: MessageType;
  title: string;
  content: string;
  voucherAvailable: boolean;
  isRead: boolean;
  createdAt: string;
}

export interface DoctorWorkloadItem {
  doctorId: string;
  doctorName: string;
  patientCount: number;
  avgScore: number;
}

export interface MonthlyReport {
  id: string;
  departmentId: string;
  departmentName: string;
  month: string;
  revenue: number;
  revenueGrowth: number;
  patientCount: number;
  patientGrowth: number;
  avgWaitTime: number;
  avgSatisfaction: number;
  doctorWorkload: DoctorWorkloadItem[];
  generatedAt: string;
}

export interface TodoItem {
  id: string;
  userId: string;
  type: 'checkin' | 'payment' | 'examination' | 'medicine' | 'review';
  title: string;
  description: string;
  status: 'pending' | 'completed';
  relatedId?: string;
  createdAt: string;
}

export interface ExamTimeSlot {
  id: string;
  date: string;
  time: string;
  available: boolean;
}

export const EXAM_LOCATIONS: Record<string, string> = {
  '血常规检查': '门诊楼1层 检验科',
  '尿常规检查': '门诊楼1层 检验科',
  '肝功能检查': '门诊楼1层 检验科',
  '肾功能检查': '门诊楼1层 检验科',
  '心电图检查': '门诊楼2层 心电图室',
  '心脏彩超': '门诊楼2层 超声科',
  '腹部B超': '门诊楼2层 超声科',
  '胸部X光片': '门诊楼B1层 放射科',
  '头部CT平扫': '门诊楼B1层 放射科',
  '腰椎MRI平扫': '门诊楼B1层 放射科',
  'C反应蛋白检测': '门诊楼1层 检验科',
  '血糖检测': '门诊楼1层 检验科',
};

export const EXAM_NOTES: Record<string, string> = {
  '血常规检查': '无需空腹，随时可检',
  '尿常规检查': '请采集晨尿或中段尿',
  '肝功能检查': '检查前需空腹8-12小时',
  '肾功能检查': '建议空腹，检查前避免剧烈运动',
  '心电图检查': '检查前请安静休息5分钟',
  '心脏彩超': '无需特殊准备，穿着宽松衣物',
  '腹部B超': '检查前需空腹8小时，憋尿',
  '胸部X光片': '需摘除颈部金属饰品，孕妇慎做',
  '头部CT平扫': '去除头部金属物品，孕妇慎做',
  '腰椎MRI平扫': '严禁携带金属物品，有起搏器者禁做',
  'C反应蛋白检测': '无需空腹',
  '血糖检测': '空腹血糖需禁食8小时',
};

export const MEDICINE_NOTES = '请凭取药码到指定窗口排队取药，药品请按医嘱服用';

export interface ExamDepartment {
  id: string;
  name: string;
  location: string;
  capacityPerSlot: number;
}

export const EXAM_DEPARTMENTS: ExamDepartment[] = [
  { id: 'lab', name: '检验科', location: '门诊楼1层', capacityPerSlot: 20 },
  { id: 'ecg', name: '心电图室', location: '门诊楼2层', capacityPerSlot: 8 },
  { id: 'ultrasound', name: '超声科', location: '门诊楼2层', capacityPerSlot: 12 },
  { id: 'radiology', name: '放射科', location: '门诊楼B1层', capacityPerSlot: 6 },
];

export const EXAM_ITEM_DEPARTMENT_MAP: Record<string, string> = {
  '血常规检查': 'lab',
  '尿常规检查': 'lab',
  '肝功能检查': 'lab',
  '肾功能检查': 'lab',
  'C反应蛋白检测': 'lab',
  '血糖检测': 'lab',
  '心电图检查': 'ecg',
  '心脏彩超': 'ultrasound',
  '腹部B超': 'ultrasound',
  '胸部X光片': 'radiology',
  '头部CT平扫': 'radiology',
  '腰椎MRI平扫': 'radiology',
};

export const PICKUP_WINDOW_COUNT = 5;

