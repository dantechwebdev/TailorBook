// ─── TailorBook Design Tokens ─────────────────────────────────────────────────
// Warm, practical, modern — feels like a premium notebook, not a dashboard.

export const LightColors = {
  // Primary — deep indigo-purple, confident and premium
  primary: '#4B3FA0',
  primaryLight: '#6558B8',
  primaryDark: '#362D7A',
  primaryFaint: '#F0EEFF',

  // Accent — warm amber for highlights and CTAs
  accent: '#F5A623',
  accentLight: '#FFF3DC',

  // Semantic Status Colors
  overdue: '#E8443A',
  overdueLight: '#FFF0EF',
  dueSoon: '#F5A623',
  dueSoonLight: '#FFF8EC',
  ready: '#34A853',
  readyLight: '#EBF8EF',
  cutting: '#1A73E8',
  cuttingLight: '#E8F2FF',
  sewing: '#9C27B0',
  sewingLight: '#F5E9FF',
  finishing: '#FF7043',
  finishingLight: '#FFF1EE',
  delivered: '#78909C',
  deliveredLight: '#F2F5F6',
  pending: '#F5A623',
  pendingLight: '#FFF8EC',

  // Neutrals
  white: '#FFFFFF',
  background: '#F7F8FC',
  surface: '#FFFFFF',
  surfaceElevated: '#FFFFFF',
  border: '#EAEEF4',
  borderLight: '#F2F5F8',
  divider: '#EAEEF4',

  // Text
  textPrimary: '#1A1A2E',
  textSecondary: '#6B7280',
  textTertiary: '#9CA3AF',
  textInverse: '#FFFFFF',
  textLink: '#4B3FA0',

  // Drawer / Dark Surface
  drawerBg: '#1C1642',
  drawerActive: '#2D2468',
  drawerText: '#FFFFFF',
  drawerTextMuted: '#A5A3C2',
} as const;

export const DarkColors = {
  // Primary
  primary: '#7B6DC5',
  primaryLight: '#9585D4',
  primaryDark: '#5C50A8',
  primaryFaint: '#1E1B40',

  // Accent
  accent: '#F5A623',
  accentLight: '#2D2018',

  // Semantic Status Colors
  overdue: '#FF6B6B',
  overdueLight: '#2D1515',
  dueSoon: '#F5A623',
  dueSoonLight: '#2D2010',
  ready: '#4CAF72',
  readyLight: '#122018',
  cutting: '#4EA8E8',
  cuttingLight: '#112035',
  sewing: '#C07BD0',
  sewingLight: '#251535',
  finishing: '#FF8C66',
  finishingLight: '#2D1810',
  delivered: '#8A9EB0',
  deliveredLight: '#151C22',
  pending: '#F5A623',
  pendingLight: '#2D2010',

  // Neutrals
  white: '#FFFFFF',
  background: '#0E0C1C',
  surface: '#1A1730',
  surfaceElevated: '#221F3A',
  border: '#2D2860',
  borderLight: '#1E1B40',
  divider: '#2D2860',

  // Text
  textPrimary: '#F0EFF8',
  textSecondary: '#A5A3C2',
  textTertiary: '#6B6898',
  textInverse: '#1A1A2E',
  textLink: '#9585D4',

  // Drawer — stays dark in both themes
  drawerBg: '#0B0919',
  drawerActive: '#1E1B40',
  drawerText: '#FFFFFF',
  drawerTextMuted: '#A5A3C2',
} as const;

// Default export — light theme (used by screens not yet theme-aware)
export const Colors = LightColors;

export type ColorPalette = typeof LightColors;
export type AppearanceMode = 'system' | 'light' | 'dark';

export const Typography = {
  // Font sizes
  xs: 11,
  sm: 13,
  base: 15,
  md: 16,
  lg: 18,
  xl: 22,
  xxl: 26,
  display: 32,

  // Font weights (React Native uses string values)
  regular: '400' as const,
  medium: '500' as const,
  semibold: '600' as const,
  bold: '700' as const,
  extrabold: '800' as const,

  // Line heights
  tight: 1.2,
  normal: 1.5,
  relaxed: 1.7,
} as const;

export const Spacing = {
  xxs: 2,
  xs: 4,
  sm: 8,
  md: 12,
  base: 16,
  lg: 20,
  xl: 24,
  xxl: 32,
  xxxl: 48,
} as const;

export const Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  full: 9999,
} as const;

export const Shadow = {
  sm: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  lg: {
    shadowColor: '#1A1A2E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// ─── Job Status Config ─────────────────────────────────────────────────────────

export const JOB_STATUS_CONFIG = {
  Pending: {
    color: LightColors.pending,
    bgColor: LightColors.pendingLight,
    label: 'Pending',
  },
  Cutting: {
    color: LightColors.cutting,
    bgColor: LightColors.cuttingLight,
    label: 'Cutting',
  },
  Sewing: {
    color: LightColors.sewing,
    bgColor: LightColors.sewingLight,
    label: 'Sewing',
  },
  Finishing: {
    color: LightColors.finishing,
    bgColor: LightColors.finishingLight,
    label: 'Finishing',
  },
  Ready: {
    color: LightColors.ready,
    bgColor: LightColors.readyLight,
    label: 'Ready',
  },
  Delivered: {
    color: LightColors.delivered,
    bgColor: LightColors.deliveredLight,
    label: 'Delivered',
  },
} as const;

export const OUTFIT_TYPES = [
  'Agbada',
  'Senator',
  'Suit',
  'Shirt',
  'Trouser',
  'Gown',
  'Kaftan',
  'Skirt',
  'Blouse',
  'Other',
] as const;

export const JOB_STATUSES = [
  'Pending',
  'Cutting',
  'Sewing',
  'Finishing',
  'Ready',
  'Delivered',
] as const;

// ─── Measurement Templates ─────────────────────────────────────────────────────

export const MEASUREMENT_FIELDS = {
  mens_senator: [
    { key: 'chest', label: 'Chest', unit: '"' },
    { key: 'shoulder', label: 'Shoulder', unit: '"' },
    { key: 'sleeveLength', label: 'Sleeve Length', unit: '"' },
    { key: 'topLength', label: 'Top Length', unit: '"' },
    { key: 'trouserWaist', label: 'Trouser Waist', unit: '"' },
    { key: 'hip', label: 'Hip', unit: '"' },
    { key: 'trouserLength', label: 'Trouser Length', unit: '"' },
    { key: 'thigh', label: 'Thigh', unit: '"' },
    { key: 'knee', label: 'Knee', unit: '"' },
    { key: 'ankle', label: 'Ankle', unit: '"' },
  ],
  agbada: [
    { key: 'chest', label: 'Chest', unit: '"' },
    { key: 'shoulder', label: 'Shoulder', unit: '"' },
    { key: 'agbadaLength', label: 'Agbada Length', unit: '"' },
    { key: 'agbadaSleeve', label: 'Agbada Sleeve', unit: '"' },
    { key: 'innerwearLength', label: 'Inner Wear Length', unit: '"' },
    { key: 'trouserWaist', label: 'Trouser Waist', unit: '"' },
    { key: 'hip', label: 'Hip', unit: '"' },
    { key: 'trouserLength', label: 'Trouser Length', unit: '"' },
    { key: 'thigh', label: 'Thigh', unit: '"' },
    { key: 'ankle', label: 'Ankle', unit: '"' },
  ],
  suit: [
    { key: 'chest', label: 'Chest', unit: '"' },
    { key: 'shoulder', label: 'Shoulder', unit: '"' },
    { key: 'sleeveLength', label: 'Sleeve Length', unit: '"' },
    { key: 'jacketLength', label: 'Jacket Length', unit: '"' },
    { key: 'trouserWaist', label: 'Trouser Waist', unit: '"' },
    { key: 'hip', label: 'Hip', unit: '"' },
    { key: 'trouserLength', label: 'Trouser Length', unit: '"' },
    { key: 'thigh', label: 'Thigh', unit: '"' },
    { key: 'knee', label: 'Knee', unit: '"' },
  ],
  womens_gown: [
    { key: 'bust', label: 'Bust', unit: '"' },
    { key: 'waist', label: 'Waist', unit: '"' },
    { key: 'hip', label: 'Hip', unit: '"' },
    { key: 'shoulderWidth', label: 'Shoulder Width', unit: '"' },
    { key: 'sleeveLength', label: 'Sleeve Length', unit: '"' },
    { key: 'gownLength', label: 'Gown Length', unit: '"' },
    { key: 'neckSize', label: 'Neck Size', unit: '"' },
    { key: 'armhole', label: 'Arm Hole', unit: '"' },
  ],
  shirt: [
    { key: 'chest', label: 'Chest', unit: '"' },
    { key: 'shoulder', label: 'Shoulder', unit: '"' },
    { key: 'sleeveLength', label: 'Sleeve Length', unit: '"' },
    { key: 'shirtLength', label: 'Shirt Length', unit: '"' },
    { key: 'collar', label: 'Collar', unit: '"' },
  ],
  trouser: [
    { key: 'trouserWaist', label: 'Waist', unit: '"' },
    { key: 'hip', label: 'Hip', unit: '"' },
    { key: 'trouserLength', label: 'Length', unit: '"' },
    { key: 'thigh', label: 'Thigh', unit: '"' },
    { key: 'knee', label: 'Knee', unit: '"' },
    { key: 'ankle', label: 'Ankle', unit: '"' },
  ],
  custom: [],
};

export const TEMPLATE_LABELS: Record<string, string> = {
  mens_senator: "Men's Senator",
  agbada: 'Agbada',
  suit: 'Suit',
  womens_gown: "Women's Gown",
  shirt: 'Shirt',
  trouser: 'Trouser',
  custom: 'Custom',
};

// ─── Avatar Colors ─────────────────────────────────────────────────────────────

export const AVATAR_COLORS = [
  '#4B3FA0',
  '#E8443A',
  '#34A853',
  '#F5A623',
  '#1A73E8',
  '#9C27B0',
  '#FF7043',
  '#00897B',
  '#546E7A',
  '#8D6E63',
];
