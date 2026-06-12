## 1. 架构设计

```mermaid
graph TB
    subgraph "前端展示层"
        A1["React SPA 单页应用"]
        A2["角色路由与权限控制"]
        A3["组件库与页面视图"]
        A4["状态管理 (Context + useReducer)"]
        A5["图表可视化 (Recharts)"]
    end
    subgraph "业务逻辑层"
        B1["预约挂号服务"]
        B2["签到叫号服务"]
        B3["费用结算服务"]
        B4["评价排行服务"]
        B5["报表统计服务"]
        B6["消息通知服务"]
    end
    subgraph "数据层"
        C1["Mock 数据层 (localStorage 持久化)"]
        C2["数据模型定义 (TypeScript Types)"]
        C3["数据 Store (Context Provider)"]
    end
    subgraph "外部服务"
        D1["浏览器 Notification API"]
        D2["localStorage 本地存储"]
    end
    A1 --> A2
    A1 --> A3
    A3 --> A4
    A4 --> B1
    A4 --> B2
    A4 --> B3
    A4 --> B4
    A4 --> B5
    A4 --> B6
    B1 --> C3
    B2 --> C3
    B3 --> C3
    B4 --> C3
    B5 --> C3
    B6 --> C3
    C3 --> C1
    C3 --> C2
    B6 --> D1
    C1 --> D2
```

## 2. 技术描述

- **前端框架**：React@18 + TypeScript@5，函数式组件 + Hooks
- **构建工具**：Vite@5，HMR 热更新，开箱即用的 TS 支持
- **样式方案**：TailwindCSS@3.4 + PostCSS，配合 CSS 变量实现主题系统
- **路由管理**：React Router@6，嵌套路由 + 角色权限守卫
- **状态管理**：React Context + useReducer，分模块 Store（用户/挂号/消息/报表）
- **图表可视化**：Recharts@2，折线图/柱状图/条形图/饼图
- **图标方案**：Lucide React，线性风格图标库
- **数据持久化**：localStorage，模拟后端存储，支持刷新保留状态
- **后端**：无后端服务，全部使用 Mock 数据 + 前端模拟业务逻辑

## 3. 路由定义

| 路由路径 | 页面用途 | 访问角色 |
|----------|----------|----------|
| `/login` | 登录选择页（四种角色入口） | 公开 |
| `/patient` | 患者主页（快捷操作 + 挂号单列表） | 患者 |
| `/patient/appointment` | 预约挂号（科室/医生/时段选择） | 患者 |
| `/patient/checkin` | 扫码签到 + 叫号大屏 | 患者 |
| `/patient/payment` | 费用明细 + 在线支付 | 患者 |
| `/patient/records` | 病历上传 + 服务评价 | 患者 |
| `/doctor` | 医生工作台（排班 + 待诊队列） | 医生 |
| `/doctor/prescription` | 开单处方（检查/药品） | 医生 |
| `/doctor/records` | 患者病历查看 | 医生 |
| `/director` | 科室主任仪表盘（统计图表） | 科室主任 |
| `/admin` | 管理层控制台（号源 + 排班配置） | 管理层 |
| `/admin/reports` | 月度报表中心 | 管理层 |
| `/messages` | 消息中心（所有角色通用） | 所有登录用户 |

## 4. 数据模型

### 4.1 ER 图

```mermaid
erDiagram
    USER ||--o{ APPOINTMENT : "挂号"
    USER ||--o{ REVIEW : "评价"
    USER ||--o{ MEDICAL_RECORD : "上传"
    USER ||--o{ MESSAGE : "接收"
    DOCTOR ||--o{ APPOINTMENT : "接诊"
    DOCTOR ||--o{ SCHEDULE : "拥有"
    DOCTOR ||--o{ PRESCRIPTION : "开具"
    DOCTOR }o--|| DEPARTMENT : "所属"
    DEPARTMENT ||--o{ SCHEDULE : "排班"
    DEPARTMENT ||--o{ MONTHLY_REPORT : "生成"
    APPOINTMENT ||--o{ PAYMENT : "关联"
    APPOINTMENT ||--|| QUEUE : "关联"
    APPOINTMENT ||--o{ PRESCRIPTION : "包含"
    PRESCRIPTION ||--o{ PRESCRIPTION_ITEM : "包含"

    USER {
        string id PK
        string role
        string name
        string phone
        string idCard
        string avatar
    }
    DOCTOR {
        string id PK
        string name
        string title
        string departmentId FK
        string specialty
        number rating
        string avatar
    }
    DEPARTMENT {
        string id PK
        string name
        string directorId
        number dailyQuota
    }
    SCHEDULE {
        string id PK
        string doctorId FK
        string departmentId FK
        string date
        string timeSlot
        number totalQuota
        number remainingQuota
    }
    APPOINTMENT {
        string id PK
        string userId FK
        string doctorId FK
        string departmentId FK
        string scheduleId FK
        string date
        string timeSlot
        string status
        string registrationNo
        datetime createdAt
    }
    QUEUE {
        string id PK
        string appointmentId FK
        number sequenceNo
        string status
        datetime checkInTime
    }
    PRESCRIPTION {
        string id PK
        string appointmentId FK
        string doctorId FK
        string type
        datetime createdAt
    }
    PRESCRIPTION_ITEM {
        string id PK
        string prescriptionId FK
        string name
        string specification
        number quantity
        number unitPrice
        number totalPrice
    }
    PAYMENT {
        string id PK
        string appointmentId FK
        number totalAmount
        number insuranceCoverage
        number selfPayAmount
        string status
        datetime paidAt
    }
    MEDICAL_RECORD {
        string id PK
        string userId FK
        string appointmentId FK
        string fileName
        string fileUrl
        string fileType
        datetime uploadedAt
    }
    REVIEW {
        string id PK
        string userId FK
        string doctorId FK
        string appointmentId FK
        number attitudeScore
        number professionalScore
        number environmentScore
        string comment
        datetime createdAt
    }
    MESSAGE {
        string id PK
        string userId FK
        string type
        string title
        string content
        string voucherUrl
        boolean isRead
        datetime createdAt
    }
    MONTHLY_REPORT {
        string id PK
        string departmentId FK
        string month
        number revenue
        number patientCount
        number avgWaitTime
        number avgSatisfaction
        number doctorWorkload
        datetime generatedAt
    }
```

### 4.2 核心数据结构（TypeScript）

```typescript
export type UserRole = 'patient' | 'doctor' | 'director' | 'admin';

export interface User {
  id: string;
  role: UserRole;
  name: string;
  phone: string;
  idCard?: string;
  avatar?: string;
  departmentId?: string;
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

export interface Schedule {
  id: string;
  doctorId: string;
  departmentId: string;
  date: string;
  timeSlot: 'morning' | 'afternoon' | 'evening';
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
  timeSlot: string;
  status: AppointmentStatus;
  registrationNo: string;
  sequenceNo?: number;
  createdAt: string;
}

export interface Prescription {
  id: string;
  appointmentId: string;
  doctorId: string;
  type: 'examination' | 'medicine';
  items: PrescriptionItem[];
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

export interface Payment {
  id: string;
  appointmentId: string;
  items: PrescriptionItem[];
  totalAmount: number;
  insuranceCoverage: number;
  selfPayAmount: number;
  status: 'unpaid' | 'paid';
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
```
