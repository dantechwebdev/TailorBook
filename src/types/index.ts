// ─── Customer Types ───────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  whatsappPhone?: string;
  notes?: string;
  avatar?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Measurement Types ────────────────────────────────────────────────────────

export type MeasurementTemplate =
  | 'mens_senator'
  | 'agbada'
  | 'suit'
  | 'womens_gown'
  | 'shirt'
  | 'trouser'
  | 'custom';

export interface Measurements {
  id: string;
  customerId: string;
  template: MeasurementTemplate;
  data: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  label?: string;
}

// ─── Job Types ────────────────────────────────────────────────────────────────

export type OutfitType =
  | 'Agbada'
  | 'Senator'
  | 'Suit'
  | 'Shirt'
  | 'Trouser'
  | 'Gown'
  | 'Kaftan'
  | 'Skirt'
  | 'Blouse'
  | 'Other';

export type JobStatus =
  | 'Pending'
  | 'Cutting'
  | 'Sewing'
  | 'Finishing'
  | 'Ready'
  | 'Delivered';

export type DeliveryType = 'pickup' | 'waybill';

export interface Job {
  id: string;
  customerId: string;
  customerName: string;
  customerPhone?: string;
  outfitType: OutfitType;
  style?: string;
  fabric?: string;
  deliveryDate: string;
  deliveryType: DeliveryType;
  deliveryAddress?: string;
  price: number;
  deposit: number;
  balance: number;
  status: JobStatus;
  measurementId?: string;
  photoUris?: string[];
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// ─── Notification Types ───────────────────────────────────────────────────────

export type NotificationType =
  | 'overdue'
  | 'due_today'
  | 'due_soon'
  | 'completed'
  | 'payment'
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  jobId?: string;
  customerId?: string;
  read: boolean;
  createdAt: string;
}

// ─── Settings Types ───────────────────────────────────────────────────────────

export interface TailorSettings {
  tailorName: string;
  shopName: string;
  phone: string;
  location: string;
  currency: string;
  workDays: string;       // JSON array e.g. '["Mon","Tue","Wed","Thu","Fri","Sat"]'
  defaultApparel: string; // e.g. 'Senator'
  onboardingComplete: string; // '0' or '1'
  profilePhotoUri?: string; // optional tailor/storefront photo URI
}

// ─── Today Task (derived from jobs for Home screen) ────────────────────────

export type TaskType =
  | 'pickup_today'
  | 'waybill_today'
  | 'overdue'
  | 'balance_due'
  | 'ready_notify'
  | 'in_progress';

export interface TodayTask {
  id: string;
  type: TaskType;
  label: string;
  subLabel?: string;
  job: Job;
}

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type DrawerParamList = {
  HomeTab: undefined;
  CustomersStack: undefined;
  JobsStack: undefined;
  NotificationsScreen: undefined;
  AccountScreen: undefined;
  SubscriptionScreen: undefined;
  HelpScreen: undefined;
};

export type HomeStackParamList = {
  Home: undefined;
};

export type CustomerStackParamList = {
  CustomerList: undefined;
  CustomerDetail: { customerId: string };
  CustomerCreate: undefined;
  CustomerEdit: { customerId: string };
};

export type JobStackParamList = {
  JobList: undefined;
  JobDetail: { jobId: string };
  NewOrderFlow: { customerId?: string; step?: number };
  JobEdit: { jobId: string };
  CustomerDetail: { customerId: string };
  MeasurementForm: {
    customerId: string;
    jobId?: string;
    template?: MeasurementTemplate;
    existingMeasurementId?: string;
  };
};
