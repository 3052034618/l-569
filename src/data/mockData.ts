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

export type PrescriptionType = 'examination' | 'medicine';

export interface PrescriptionItem {
  id: string;
  name: string;
  specification?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  insuranceRatio: number;
}

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

export interface MedicalRecord {
  id: string;
  userId: string;
  appointmentId: string;
  fileName: string;
  fileType: 'image' | 'pdf';
  fileSize: number;
  uploadedAt: string;
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
  doctorWorkload: Array<{ doctorId: string; doctorName: string; patientCount: number; avgScore: number }>;
  generatedAt: string;
}

export const departments: Department[] = [
  {
    id: 'dep1',
    name: '内科',
    directorId: 'u5',
    dailyQuota: 80,
    description: '内科是医院的核心科室之一，主要诊治呼吸系统、心血管系统、消化系统、内分泌系统等常见疾病，拥有经验丰富的专家团队和先进的诊疗设备。'
  },
  {
    id: 'dep2',
    name: '外科',
    directorId: 'u6',
    dailyQuota: 70,
    description: '外科涵盖普通外科、肝胆外科、胃肠外科等亚专业，可开展各类常规手术及复杂疑难手术，以微创手术为特色，注重患者术后康复。'
  },
  {
    id: 'dep3',
    name: '儿科',
    directorId: 'u7',
    dailyQuota: 100,
    description: '儿科专注于0-14岁儿童的健康成长与疾病诊疗，设有儿童呼吸、消化、神经、新生儿等专科，环境温馨，医护人员经验丰富。'
  },
  {
    id: 'dep4',
    name: '妇产科',
    directorId: 'u8',
    dailyQuota: 60,
    description: '妇产科提供妇科疾病诊治、孕期保健、分娩服务、产后康复等全周期医疗服务，设有温馨产房，配备专业助产士团队。'
  },
  {
    id: 'dep5',
    name: '骨科',
    directorId: 'u9',
    dailyQuota: 50,
    description: '骨科擅长四肢骨折、脊柱疾病、关节置换、运动损伤等诊疗，拥有先进的骨科手术设备和康复理疗中心，提供手术与康复一体化服务。'
  },
  {
    id: 'dep6',
    name: '眼科',
    directorId: 'u10',
    dailyQuota: 55,
    description: '眼科开展近视矫正、白内障手术、青光眼诊治、眼底病诊疗等业务，配备国际先进的眼科检查和手术设备，守护患者光明。'
  }
];

export const doctors: Doctor[] = [
  {
    id: 'doc1',
    name: '王建国',
    title: '主任医师',
    departmentId: 'dep1',
    specialty: '擅长高血压、冠心病、心律失常等心血管疾病的诊治，尤其在心力衰竭的综合管理方面经验丰富。',
    rating: 4.9,
    reviewCount: 428,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangjianguo'
  },
  {
    id: 'doc2',
    name: '陈玉梅',
    title: '副主任医师',
    departmentId: 'dep1',
    specialty: '擅长呼吸系统疾病，包括慢性支气管炎、哮喘、肺炎、肺结节等疾病的诊断与治疗。',
    rating: 4.7,
    reviewCount: 315,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenyumei'
  },
  {
    id: 'doc3',
    name: '李明辉',
    title: '主任医师',
    departmentId: 'dep2',
    specialty: '擅长腹腔镜微创手术，在肝胆胰脾疾病、胃肠肿瘤、甲状腺疾病等方面具有丰富的临床经验。',
    rating: 4.8,
    reviewCount: 386,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liminghui'
  },
  {
    id: 'doc4',
    name: '赵晓燕',
    title: '主治医师',
    departmentId: 'dep2',
    specialty: '擅长普外科常见疾病如阑尾炎、疝气、体表肿物等的手术治疗，以及伤口处理和术后康复指导。',
    rating: 4.5,
    reviewCount: 198,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhaoxiaoyan'
  },
  {
    id: 'doc5',
    name: '孙丽萍',
    title: '主任医师',
    departmentId: 'dep3',
    specialty: '擅长儿童呼吸系统疾病、过敏性疾病、儿童保健等，在儿童哮喘和慢性咳嗽诊治方面造诣较深。',
    rating: 4.9,
    reviewCount: 492,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunliping'
  },
  {
    id: 'doc6',
    name: '周伟强',
    title: '副主任医师',
    departmentId: 'dep3',
    specialty: '擅长小儿消化系统疾病、感染性疾病、新生儿疾病的诊治，对儿童生长发育评估有丰富经验。',
    rating: 4.6,
    reviewCount: 267,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhouweiqiang'
  },
  {
    id: 'doc7',
    name: '刘芳华',
    title: '主任医师',
    departmentId: 'dep4',
    specialty: '擅长妇科肿瘤、子宫内膜异位症、不孕不育等疾病诊治，在宫腔镜、腹腔镜微创手术方面经验丰富。',
    rating: 4.8,
    reviewCount: 374,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufanghua'
  },
  {
    id: 'doc8',
    name: '吴美玲',
    title: '主治医师',
    departmentId: 'dep4',
    specialty: '擅长正常分娩和异常分娩的处理、孕期保健指导、妇科炎症、月经不调等常见病诊治。',
    rating: 4.6,
    reviewCount: 231,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wumeiling'
  },
  {
    id: 'doc9',
    name: '郑志强',
    title: '主任医师',
    departmentId: 'dep5',
    specialty: '擅长脊柱外科、关节置换、运动损伤，在颈椎腰椎疾病、髋膝关节置换方面具有丰富经验。',
    rating: 4.9,
    reviewCount: 415,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengzhiqiang'
  },
  {
    id: 'doc10',
    name: '黄晓东',
    title: '副主任医师',
    departmentId: 'dep5',
    specialty: '擅长四肢骨折、骨质疏松、手足外科疾病诊治，在骨折微创治疗和康复训练方面经验丰富。',
    rating: 4.7,
    reviewCount: 289,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=huangxiaodong'
  },
  {
    id: 'doc11',
    name: '林静文',
    title: '主任医师',
    departmentId: 'dep6',
    specialty: '擅长白内障超声乳化手术、近视激光矫正、青光眼诊治，在复杂白内障手术方面造诣深厚。',
    rating: 4.9,
    reviewCount: 456,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linjingwen'
  },
  {
    id: 'doc12',
    name: '徐天翔',
    title: '主治医师',
    departmentId: 'dep6',
    specialty: '擅长屈光不正矫正、干眼症、结膜炎、眼底病等常见眼病诊治，医学验光配镜经验丰富。',
    rating: 4.5,
    reviewCount: 176,
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=xutianxiang'
  }
];

export const users: User[] = [
  {
    id: 'p1',
    role: 'patient',
    name: '张明',
    phone: '13800138001',
    idCard: '110101199001011234',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhangming'
  },
  {
    id: 'p2',
    role: 'patient',
    name: '李华',
    phone: '13800138002',
    idCard: '110101199203155678',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=lihua'
  },
  {
    id: 'u1',
    role: 'doctor',
    name: '王建国',
    phone: '13900139001',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangjianguo',
    departmentId: 'dep1',
    doctorId: 'doc1'
  },
  {
    id: 'u2',
    role: 'doctor',
    name: '陈玉梅',
    phone: '13900139002',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=chenyumei',
    departmentId: 'dep1',
    doctorId: 'doc2'
  },
  {
    id: 'u3',
    role: 'doctor',
    name: '李明辉',
    phone: '13900139003',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liminghui',
    departmentId: 'dep2',
    doctorId: 'doc3'
  },
  {
    id: 'u4',
    role: 'doctor',
    name: '孙丽萍',
    phone: '13900139004',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunliping',
    departmentId: 'dep3',
    doctorId: 'doc5'
  },
  {
    id: 'u5',
    role: 'director',
    name: '王建国',
    phone: '13900139011',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wangjianguo',
    departmentId: 'dep1',
    doctorId: 'doc1'
  },
  {
    id: 'u6',
    role: 'director',
    name: '李明辉',
    phone: '13900139012',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liminghui',
    departmentId: 'dep2',
    doctorId: 'doc3'
  },
  {
    id: 'u7',
    role: 'director',
    name: '孙丽萍',
    phone: '13900139013',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=sunliping',
    departmentId: 'dep3',
    doctorId: 'doc5'
  },
  {
    id: 'u8',
    role: 'director',
    name: '刘芳华',
    phone: '13900139014',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liufanghua',
    departmentId: 'dep4',
    doctorId: 'doc7'
  },
  {
    id: 'u9',
    role: 'director',
    name: '郑志强',
    phone: '13900139015',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhengzhiqiang',
    departmentId: 'dep5',
    doctorId: 'doc9'
  },
  {
    id: 'u10',
    role: 'director',
    name: '林静文',
    phone: '13900139016',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=linjingwen',
    departmentId: 'dep6',
    doctorId: 'doc11'
  },
  {
    id: 'admin1',
    role: 'admin',
    name: '系统管理员',
    phone: '13900139999',
    avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=admin'
  }
];

function getDateOffsetString(offsetDays: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);
  return date.toISOString().split('T')[0];
}

function getNowString(): string {
  return new Date().toISOString();
}

const timeSlotConfig: Record<TimeSlot, { startTime: string; endTime: string }> = {
  morning: { startTime: '08:00', endTime: '12:00' },
  afternoon: { startTime: '14:00', endTime: '17:30' },
  evening: { startTime: '18:00', endTime: '20:30' }
};

function generateSchedules(): Schedule[] {
  const schedules: Schedule[] = [];
  let scheduleId = 1;
  const timeSlots: TimeSlot[] = ['morning', 'afternoon', 'evening'];

  for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
    const date = getDateOffsetString(dayOffset);
    for (const doctor of doctors) {
      const slotsForDoctor = dayOffset === 0
        ? timeSlots.slice(0, 2)
        : timeSlots.filter(() => Math.random() > 0.3);

      for (const slot of slotsForDoctor) {
        const totalQuota = 20 + Math.floor(Math.random() * 21);
        const remainingQuota = Math.min(totalQuota, 5 + Math.floor(Math.random() * 31));
        schedules.push({
          id: `sch${scheduleId++}`,
          doctorId: doctor.id,
          departmentId: doctor.departmentId,
          date,
          timeSlot: slot,
          startTime: timeSlotConfig[slot].startTime,
          endTime: timeSlotConfig[slot].endTime,
          totalQuota,
          remainingQuota
        });
      }
    }
  }

  return schedules;
}

export const schedules: Schedule[] = generateSchedules();

export const appointments: Appointment[] = [
  {
    id: 'apt1',
    userId: 'p1',
    doctorId: 'doc1',
    departmentId: 'dep1',
    scheduleId: 'sch1',
    date: getDateOffsetString(0),
    timeSlot: 'morning',
    status: 'completed',
    registrationNo: 'NM20260613001',
    sequenceNo: 3,
    createdAt: getNowString()
  },
  {
    id: 'apt2',
    userId: 'p2',
    doctorId: 'doc5',
    departmentId: 'dep3',
    scheduleId: 'sch100',
    date: getDateOffsetString(0),
    timeSlot: 'morning',
    status: 'in_progress',
    registrationNo: 'NM20260613002',
    sequenceNo: 5,
    createdAt: getNowString()
  },
  {
    id: 'apt3',
    userId: 'p1',
    doctorId: 'doc9',
    departmentId: 'dep5',
    scheduleId: 'sch150',
    date: getDateOffsetString(0),
    timeSlot: 'afternoon',
    status: 'checked_in',
    registrationNo: 'NM20260613003',
    sequenceNo: 2,
    createdAt: getNowString()
  },
  {
    id: 'apt4',
    userId: 'p2',
    doctorId: 'doc11',
    departmentId: 'dep6',
    scheduleId: 'sch200',
    date: getDateOffsetString(1),
    timeSlot: 'morning',
    status: 'pending',
    registrationNo: 'NM20260614001',
    createdAt: getNowString()
  },
  {
    id: 'apt5',
    userId: 'p1',
    doctorId: 'doc7',
    departmentId: 'dep4',
    scheduleId: 'sch220',
    date: getDateOffsetString(2),
    timeSlot: 'afternoon',
    status: 'pending',
    registrationNo: 'NM20260615001',
    createdAt: getNowString()
  }
];

export const prescriptions: Prescription[] = [
  {
    id: 'pre1',
    appointmentId: 'apt1',
    doctorId: 'doc1',
    type: 'examination',
    items: [
      {
        id: 'preitem1',
        name: '血常规检查',
        quantity: 1,
        unitPrice: 35,
        totalPrice: 35,
        insuranceRatio: 0.8
      },
      {
        id: 'preitem2',
        name: '心电图检查',
        quantity: 1,
        unitPrice: 80,
        totalPrice: 80,
        insuranceRatio: 0.85
      },
      {
        id: 'preitem3',
        name: '心脏彩超',
        quantity: 1,
        unitPrice: 280,
        totalPrice: 280,
        insuranceRatio: 0.7
      }
    ],
    createdAt: getNowString()
  },
  {
    id: 'pre2',
    appointmentId: 'apt1',
    doctorId: 'doc1',
    type: 'medicine',
    items: [
      {
        id: 'preitem4',
        name: '硝苯地平缓释片',
        specification: '30mg*7片/盒',
        quantity: 2,
        unitPrice: 45,
        totalPrice: 90,
        insuranceRatio: 0.9
      },
      {
        id: 'preitem5',
        name: '阿托伐他汀钙片',
        specification: '20mg*7片/盒',
        quantity: 1,
        unitPrice: 58,
        totalPrice: 58,
        insuranceRatio: 0.85
      },
      {
        id: 'preitem6',
        name: '阿司匹林肠溶片',
        specification: '100mg*30片/盒',
        quantity: 1,
        unitPrice: 28,
        totalPrice: 28,
        insuranceRatio: 0.9
      }
    ],
    createdAt: getNowString()
  },
  {
    id: 'pre3',
    appointmentId: 'apt2',
    doctorId: 'doc5',
    type: 'examination',
    items: [
      {
        id: 'preitem7',
        name: 'C反应蛋白检测',
        quantity: 1,
        unitPrice: 45,
        totalPrice: 45,
        insuranceRatio: 0.8
      },
      {
        id: 'preitem8',
        name: '胸部X光片',
        quantity: 1,
        unitPrice: 120,
        totalPrice: 120,
        insuranceRatio: 0.75
      }
    ],
    createdAt: getNowString()
  },
  {
    id: 'pre4',
    appointmentId: 'apt2',
    doctorId: 'doc5',
    type: 'medicine',
    items: [
      {
        id: 'preitem9',
        name: '小儿氨酚黄那敏颗粒',
        specification: '6g*10袋/盒',
        quantity: 2,
        unitPrice: 25,
        totalPrice: 50,
        insuranceRatio: 0.85
      },
      {
        id: 'preitem10',
        name: '氨溴特罗口服溶液',
        specification: '60ml/瓶',
        quantity: 1,
        unitPrice: 38,
        totalPrice: 38,
        insuranceRatio: 0.8
      }
    ],
    createdAt: getNowString()
  },
  {
    id: 'pre5',
    appointmentId: 'apt3',
    doctorId: 'doc9',
    type: 'examination',
    items: [
      {
        id: 'preitem11',
        name: '腰椎MRI平扫',
        quantity: 1,
        unitPrice: 680,
        totalPrice: 680,
        insuranceRatio: 0.65
      }
    ],
    createdAt: getNowString()
  }
];

export const payments: Payment[] = [
  {
    id: 'pay1',
    appointmentId: 'apt1',
    items: prescriptions[0].items.concat(prescriptions[1].items),
    totalAmount: 571,
    insuranceCoverage: 415.35,
    selfPayAmount: 155.65,
    status: 'paid',
    paidAt: getNowString(),
    pickupWindow: '3号取药窗口'
  },
  {
    id: 'pay2',
    appointmentId: 'apt2',
    items: prescriptions[2].items.concat(prescriptions[3].items),
    totalAmount: 253,
    insuranceCoverage: 179.15,
    selfPayAmount: 73.85,
    status: 'unpaid'
  },
  {
    id: 'pay3',
    appointmentId: 'apt3',
    items: prescriptions[4].items,
    totalAmount: 680,
    insuranceCoverage: 442,
    selfPayAmount: 238,
    status: 'paid',
    paidAt: getNowString()
  },
  {
    id: 'pay4',
    appointmentId: 'apt4',
    items: [],
    totalAmount: 30,
    insuranceCoverage: 0,
    selfPayAmount: 30,
    status: 'unpaid'
  }
];

export const reviews: Review[] = [
  {
    id: 'rev1',
    userId: 'p1',
    doctorId: 'doc1',
    appointmentId: 'apt1',
    attitudeScore: 5,
    professionalScore: 5,
    environmentScore: 4,
    comment: '王主任非常专业，耐心解答了我所有疑问，检查细致，给出的治疗方案也很合理。医院环境整体不错，就是候诊时间稍长。',
    createdAt: getNowString()
  },
  {
    id: 'rev2',
    userId: 'p2',
    doctorId: 'doc5',
    appointmentId: 'apt2',
    attitudeScore: 5,
    professionalScore: 5,
    environmentScore: 5,
    comment: '孙主任对孩子特别有耐心，医术精湛，准确判断了病情。儿科诊室布置得很温馨，孩子一点都不害怕，强烈推荐！',
    createdAt: getNowString()
  },
  {
    id: 'rev3',
    userId: 'p1',
    doctorId: 'doc2',
    appointmentId: 'apt99',
    attitudeScore: 4,
    professionalScore: 5,
    environmentScore: 4,
    comment: '陈医生看病很仔细，专业水平很高，就是说话稍微快了一点，整体还是非常满意的。',
    createdAt: getNowString()
  },
  {
    id: 'rev4',
    userId: 'p2',
    doctorId: 'doc3',
    appointmentId: 'apt98',
    attitudeScore: 5,
    professionalScore: 5,
    environmentScore: 4,
    comment: '李主任手术做得非常成功，术后恢复也很好。查房时每次都很认真地询问恢复情况，非常负责任的好医生。',
    createdAt: getNowString()
  },
  {
    id: 'rev5',
    userId: 'p1',
    doctorId: 'doc7',
    appointmentId: 'apt97',
    attitudeScore: 5,
    professionalScore: 5,
    environmentScore: 5,
    comment: '刘主任技术好态度更好，整个孕期都是找她做的产检，每次都很安心。生产过程也很顺利，非常感谢！',
    createdAt: getNowString()
  },
  {
    id: 'rev6',
    userId: 'p2',
    doctorId: 'doc9',
    appointmentId: 'apt96',
    attitudeScore: 4,
    professionalScore: 5,
    environmentScore: 3,
    comment: '郑主任医术很高明，腰椎问题困扰我很久，手术后明显好转。就是骨科门诊人太多，候诊区比较拥挤。',
    createdAt: getNowString()
  },
  {
    id: 'rev7',
    userId: 'p1',
    doctorId: 'doc11',
    appointmentId: 'apt95',
    attitudeScore: 5,
    professionalScore: 5,
    environmentScore: 5,
    comment: '林主任做的白内障手术效果非常好，第二天就能看清了！整个过程很顺利，林主任也特别温柔耐心。',
    createdAt: getNowString()
  },
  {
    id: 'rev8',
    userId: 'p2',
    doctorId: 'doc6',
    appointmentId: 'apt94',
    attitudeScore: 4,
    professionalScore: 4,
    environmentScore: 4,
    comment: '周医生态度不错，给孩子开的药效果也可以，希望下次可以多说一些注意事项。',
    createdAt: getNowString()
  },
  {
    id: 'rev9',
    userId: 'p1',
    doctorId: 'doc10',
    appointmentId: 'apt93',
    attitudeScore: 5,
    professionalScore: 4,
    environmentScore: 4,
    comment: '黄医生很负责，骨折后帮我做了详细的康复计划，恢复效果不错。',
    createdAt: getNowString()
  },
  {
    id: 'rev10',
    userId: 'p2',
    doctorId: 'doc8',
    appointmentId: 'apt92',
    attitudeScore: 5,
    professionalScore: 5,
    environmentScore: 4,
    comment: '吴医生接生经验丰富，整个产程都在鼓励我，让我非常安心。感谢吴医生和助产士们！',
    createdAt: getNowString()
  },
  {
    id: 'rev11',
    userId: 'p1',
    doctorId: 'doc4',
    appointmentId: 'apt91',
    attitudeScore: 4,
    professionalScore: 4,
    environmentScore: 4,
    comment: '赵医生做的小手术很成功，换药也很仔细，恢复得挺好的。',
    createdAt: getNowString()
  },
  {
    id: 'rev12',
    userId: 'p2',
    doctorId: 'doc12',
    appointmentId: 'apt90',
    attitudeScore: 4,
    professionalScore: 4,
    environmentScore: 5,
    comment: '徐医生验光很专业，配的眼镜戴着很舒服。眼科门诊环境不错，设备先进。',
    createdAt: getNowString()
  }
];

export const medicalRecords: MedicalRecord[] = [
  {
    id: 'mr1',
    userId: 'p1',
    appointmentId: 'apt1',
    fileName: '心电图报告.pdf',
    fileType: 'pdf',
    fileSize: 256000,
    uploadedAt: getNowString()
  },
  {
    id: 'mr2',
    userId: 'p1',
    appointmentId: 'apt1',
    fileName: '血常规化验单.jpg',
    fileType: 'image',
    fileSize: 128000,
    uploadedAt: getNowString()
  },
  {
    id: 'mr3',
    userId: 'p2',
    appointmentId: 'apt2',
    fileName: '胸部X光片.jpg',
    fileType: 'image',
    fileSize: 384000,
    uploadedAt: getNowString()
  }
];

export const messages: Message[] = [
  {
    id: 'msg1',
    userId: 'p1',
    role: 'patient',
    type: 'appointment',
    title: '预约成功通知',
    content: '您已成功预约内科王建国主任医师 2026年06月13日 上午门诊，挂号单号：NM20260613001。请提前30分钟到院签到。',
    voucherAvailable: true,
    isRead: true,
    createdAt: getNowString()
  },
  {
    id: 'msg2',
    userId: 'p1',
    role: 'patient',
    type: 'checkin',
    title: '签到提醒',
    content: '您预约的今日上午内科门诊即将开始，请前往自助签到机或扫码签到，以免错过就诊时间。',
    voucherAvailable: false,
    isRead: true,
    createdAt: getNowString()
  },
  {
    id: 'msg3',
    userId: 'p1',
    role: 'patient',
    type: 'payment',
    title: '缴费通知',
    content: '您有一笔待支付费用，共计155.65元（医保报销415.35元）。请点击消息详情前往支付。',
    voucherAvailable: true,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg4',
    userId: 'p2',
    role: 'patient',
    type: 'appointment',
    title: '预约成功通知',
    content: '您已成功预约儿科孙丽萍主任医师 2026年06月13日 上午门诊，挂号单号：NM20260613002。',
    voucherAvailable: true,
    isRead: true,
    createdAt: getNowString()
  },
  {
    id: 'msg5',
    userId: 'p2',
    role: 'patient',
    type: 'payment',
    title: '待缴费提醒',
    content: '您的处方已开具，包含检查费和药品费共计253.00元，其中医保可报销179.15元，请及时缴费。',
    voucherAvailable: true,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg6',
    userId: 'p2',
    role: 'patient',
    type: 'appointment',
    title: '预约成功通知',
    content: '您已成功预约眼科林静文主任医师 2026年06月14日 上午门诊，挂号单号：NM20260614001。',
    voucherAvailable: true,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg7',
    userId: 'p1',
    role: 'patient',
    type: 'appointment',
    title: '预约成功通知',
    content: '您已成功预约妇产科刘芳华主任医师 2026年06月15日 下午门诊，挂号单号：NM20260615001。',
    voucherAvailable: true,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg8',
    userId: 'u1',
    role: 'doctor',
    type: 'system',
    title: '排班提醒',
    content: '王主任您好，您今日上午有30个号源，已签到25人，请按时到诊室接诊。',
    voucherAvailable: false,
    isRead: true,
    createdAt: getNowString()
  },
  {
    id: 'msg9',
    userId: 'u3',
    role: 'doctor',
    type: 'system',
    title: '新评价通知',
    content: '您收到一条新的患者评价，评分：5星。点击查看详情。',
    voucherAvailable: false,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg10',
    userId: 'u5',
    role: 'director',
    type: 'report',
    title: '科室月度报表已生成',
    content: '内科2026年5月月度统计报表已生成，本月门诊量2380人次，满意度96.2%，收入156.8万元。点击查看详情。',
    voucherAvailable: true,
    isRead: true,
    createdAt: getNowString()
  },
  {
    id: 'msg11',
    userId: 'u6',
    role: 'director',
    type: 'report',
    title: '科室月度报表已生成',
    content: '外科2026年5月月度统计报表已生成，本月门诊量1650人次，满意度94.8%，收入245.6万元。点击查看详情。',
    voucherAvailable: true,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg12',
    userId: 'u7',
    role: 'director',
    type: 'report',
    title: '科室月度报表已生成',
    content: '儿科2026年5月月度统计报表已生成，本月门诊量2850人次，满意度97.1%，收入98.5万元。点击查看详情。',
    voucherAvailable: true,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg13',
    userId: 'admin1',
    role: 'admin',
    type: 'report',
    title: '全院月度报表已生成',
    content: '全院2026年5月综合报表已生成，总门诊量12580人次，平均满意度95.6%，总收入892.5万元，环比增长8.3%。',
    voucherAvailable: true,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg14',
    userId: 'admin1',
    role: 'admin',
    type: 'system',
    title: '排班规则更新提醒',
    content: '系统检测到部分科室下周排班号源超过上限，请及时调整配置。',
    voucherAvailable: false,
    isRead: false,
    createdAt: getNowString()
  },
  {
    id: 'msg15',
    userId: 'p1',
    role: 'patient',
    type: 'system',
    title: '就诊完成邀请评价',
    content: '您已完成本次就诊，诚邀您对王建国主任的服务进行评价，您的反馈将帮助我们提升服务质量。',
    voucherAvailable: false,
    isRead: true,
    createdAt: getNowString()
  }
];

const monthLabels = ['2026-06', '2026-05', '2026-04'];

function generateMonthlyReports(): MonthlyReport[] {
  const reports: MonthlyReport[] = [];
  let reportId = 1;

  for (let i = 0; i < monthLabels.length; i++) {
    const month = monthLabels[i];
    const growthFactor = i === 0 ? 1 : (i === 1 ? 0.95 : 0.9);

    for (const dept of departments) {
      const deptDoctors = doctors.filter(d => d.departmentId === dept.id);
      const baseRevenue = dept.id === 'dep2' ? 2450000 : dept.id === 'dep1' ? 1560000 : dept.id === 'dep6' ? 820000 : dept.id === 'dep4' ? 760000 : dept.id === 'dep3' ? 980000 : 1350000;
      const basePatients = dept.id === 'dep3' ? 2850 : dept.id === 'dep1' ? 2380 : dept.id === 'dep2' ? 1650 : dept.id === 'dep6' ? 1420 : dept.id === 'dep4' ? 1150 : 1130;

      const revenue = Math.round(baseRevenue * growthFactor);
      const patientCount = Math.round(basePatients * growthFactor);
      const revenueGrowth = i === 0 ? (8.2 + Math.random() * 2) : i === 1 ? (3.5 + Math.random() * 2) : (-2.5 + Math.random() * 1);
      const patientGrowth = i === 0 ? (6.5 + Math.random() * 2) : i === 1 ? (2.8 + Math.random() * 2) : (-1.8 + Math.random() * 1);

      reports.push({
        id: `rpt${reportId++}`,
        departmentId: dept.id,
        departmentName: dept.name,
        month,
        revenue,
        revenueGrowth: Math.round(revenueGrowth * 10) / 10,
        patientCount,
        patientGrowth: Math.round(patientGrowth * 10) / 10,
        avgWaitTime: 15 + Math.floor(Math.random() * 20),
        avgSatisfaction: Math.round((93 + Math.random() * 5) * 10) / 10,
        doctorWorkload: deptDoctors.map(doc => ({
          doctorId: doc.id,
          doctorName: doc.name,
          patientCount: Math.round((patientCount / deptDoctors.length) * (0.8 + Math.random() * 0.4)),
          avgScore: Math.round((4.3 + Math.random() * 0.7) * 10) / 10
        })),
        generatedAt: getNowString()
      });
    }
  }

  return reports;
}

export const monthlyReports: MonthlyReport[] = generateMonthlyReports();

const mockData = {
  users,
  departments,
  doctors,
  schedules,
  appointments,
  prescriptions,
  payments,
  reviews,
  medicalRecords,
  messages,
  monthlyReports,
};

export default mockData;
