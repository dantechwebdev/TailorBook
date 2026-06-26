// ─── Customer Types ───────────────────────────────────────────────────────────

export interface Customer {
  id: string;
  name: string;
  phone: string;
  notes?: string;
  avatar?: string; // initials-based color stored
  createdAt: string; // ISO date string
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

export interface MensSenatorMeasurements {
  chest?: string;
  shoulder?: string;
  sleeveLength?: string;
  topLength?: string;
  trouserWaist?: string;
  hip?: string;
  trouserLength?: string;
  thigh?: string;
  knee?: string;
  ankle?: string;
}

export interface AgbadaMeasurements extends MensSenatorMeasurements {
  agbadaLength?: string;
  agbadaSleeve?: string;
  innerwearLength?: string;
}

export interface WomensGownMeasurements {
  bust?: string;
  waist?: string;
  hip?: string;
  shoulderWidth?: string;
  sleeveLength?: string;
  gownLength?: string;
  neckSize?: string;
  armhole?: string;
}

export interface Measurements {
  id: string;
  customerId: string;
  template: MeasurementTemplate;
  data: Record<string, string>;
  createdAt: string;
  updatedAt: string;
  label?: string; // e.g. "Last taken May 2024"
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

export interface Job {
  id: string;
  customerId: string;
  customerName: string; // denormalized for fast display
  outfitType: OutfitType;
  style?: string;
  fabric?: string;
  deliveryDate: string; // ISO date string
  price: number;
  deposit: number;
  balance: number;
  status: JobStatus;
  measurementId?: string;
  samplePhotoUri?: string;
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

// ─── Navigation Types ─────────────────────────────────────────────────────────

export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Main: undefined;
};

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
  JobCreate: { customerId?: string };
  JobEdit: { jobId: string };
  MeasurementForm: {
    customerId: string;
    jobId?: string;
    template?: MeasurementTemplate;
    existingMeasurementId?: string;
  };
};
