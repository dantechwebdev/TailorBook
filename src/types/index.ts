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
  outfitType: string;
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
  workDays: string;
  defaultApparel: string;
  onboardingComplete: string;
  profilePhotoUri?: string;
  appearance?: string;
  notificationsEnabled?: string;
  // Cloud sync settings (stored as strings for SQLite key-value compatibility)
  syncEnabled?: string;       // '1' | '0'
  syncMode?: string;          // 'wifi_only' | 'wifi_and_data'
  autoSync?: string;          // '1' | '0'
  syncTime?: string;          // HH:MM e.g. '02:00'
  lastBackupAt?: string;      // ISO timestamp
  lastSyncAt?: string;        // ISO timestamp
}

// ─── Today Task ───────────────────────────────────────────────────────────────

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

// ─── Reminder Types ───────────────────────────────────────────────────────────

export interface JobReminder {
  id: string;
  jobId: string;
  scheduledAt: string;
  label: string;
  minutesBeforeDelivery?: number;
  daysBefore?: number;
  repeatEvery?: number;
  isRecurringOverdue?: boolean;
  notifIdentifier?: string;
  createdAt: string;
}

export interface ReminderPreset {
  key: string;
  label: string;
  minutesBefore: number;
}

// ─── Scratch Note Types ───────────────────────────────────────────────────────

export interface ScratchNote {
  id: string;
  text: string;
  reminderAt?: string;
  notifIdentifier?: string;
  isDone: boolean;
  createdAt: string;
  updatedAt: string;
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

// ─── Authentication Types ─────────────────────────────────────────────────────

export type AuthProvider = 'email' | 'google' | 'apple';

export type AuthStatus =
  | 'idle'
  | 'unauthenticated'
  | 'authenticated'
  | 'loading';

export interface AuthUser {
  id: string;
  email: string;
  displayName?: string;
  avatarUrl?: string;
  provider: AuthProvider;
  createdAt: string;
  plan?: 'free' | 'pro' | 'enterprise';
  planExpiresAt?: string;
}

export interface AuthSession {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
}

export interface AuthState {
  status: AuthStatus;
  user: AuthUser | null;
  session: AuthSession | null;
  error: string | null;
}

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpCredentials {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResult {
  success: boolean;
  user?: AuthUser;
  error?: string;
}

// ─── Cloud Sync Types ─────────────────────────────────────────────────────────

export type SyncStatus =
  | 'idle'
  | 'syncing'
  | 'success'
  | 'error'
  | 'offline';

export interface CloudSyncState {
  status: SyncStatus;
  lastSyncAt: string | null;
  lastBackupAt: string | null;
  errorMessage: string | null;
  isEnabled: boolean;
  autoSync: boolean;
  syncMode: 'wifi_only' | 'wifi_and_data';
  syncTime: string;
}

export interface SyncResult {
  success: boolean;
  itemsSynced: number;
  conflicts: number;
  timestamp: string;
  error?: string;
}

// ─── Workshop Health Types ────────────────────────────────────────────────────

export type HealthStatus = 'excellent' | 'good' | 'attention' | 'critical';

export interface WorkshopHealth {
  status: HealthStatus;
  score: number;
  headline: string;
  items: HealthItem[];
}

export interface HealthItem {
  type: 'positive' | 'warning' | 'critical' | 'neutral';
  message: string;
}

// ─── AI Types ─────────────────────────────────────────────────────────────────

export type AIProvider = 'gemini' | 'openai' | 'claude' | 'mock';

export interface AIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIContext {
  screen: string;
  jobId?: string;
  customerId?: string;
  data?: Record<string, unknown>;
}

export interface AIConversation {
  id: string;
  messages: AIMessage[];
  context: AIContext;
  createdAt: string;
  updatedAt: string;
}

export interface AICompletionRequest {
  messages: AIMessage[];
  context?: AIContext;
  maxTokens?: number;
  temperature?: number;
}

export interface AICompletionResponse {
  content: string;
  provider: AIProvider;
  tokensUsed?: number;
}

// ─── Business Insights Types ──────────────────────────────────────────────────

export interface BusinessInsight {
  period: 'week' | 'month' | 'all';
  totalRevenue: number;
  totalDeposits: number;
  totalOutstanding: number;
  totalJobs: number;
  completedJobs: number;
  overdueJobs: number;
  totalCustomers: number;
  newCustomers: number;
  topOutfitType: string | null;
  completionRate: number;
  averageJobValue: number;
  narratives: BusinessNarrative[];
}

export interface BusinessNarrative {
  type: 'positive' | 'warning' | 'neutral';
  message: string;
}
