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

export interface Payment {
  id: string;
  appointmentId: string;
  items: PrescriptionItem[];
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

export type MessageType = 'appointment' | 'checkin' | 'payment' | 'report' | 'system';

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
