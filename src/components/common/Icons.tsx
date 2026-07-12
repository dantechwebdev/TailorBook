import React from 'react';
import { Image, ImageStyle, StyleProp } from 'react-native';
import Svg, { Path, Circle, Rect, Line, Polyline, Polygon, G, Defs, ClipPath } from 'react-native-svg';

interface IconProps {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

interface LogoProps {
  size?: number;
  variant?: 'white' | 'blue';
  style?: StyleProp<ImageStyle>;
}

const LOGO_SOURCES = {
  white: require('../../../assets/brand/logo-mark-white.png'),
  blue: require('../../../assets/brand/logo-mark-blue.png'),
};

const LOGO_ASPECT_RATIO = 527 / 664;

export const Logo: React.FC<LogoProps> = ({ size = 40, variant = 'blue', style }) => (
  <Image
    source={LOGO_SOURCES[variant]}
    style={[{ width: size * LOGO_ASPECT_RATIO, height: size }, style]}
    resizeMode="contain"
    accessibilityLabel="TailorBook logo"
  />
);

// ─── Navigation Icons ─────────────────────────────────────────────────────────

export const HomeIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 9.5L12 3L21 9.5V20C21 20.5523 20.5523 21 20 21H15V15H9V21H4C3.44772 21 3 20.5523 3 20V9.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const CustomersIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="9" cy="7" r="4" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M3 21V19C3 16.7909 4.79086 15 7 15H11C13.2091 15 15 16.7909 15 19V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M16 3.13C17.7699 3.58438 19 5.17441 19 7C19 8.82559 17.7699 10.4156 16 10.87" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M21 21V19C20.9936 17.1857 19.7698 15.6022 18 15.13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const JobsIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M8 4V2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M16 4V2" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M3 9H21" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M8 13H12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M8 17H16" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const MeasurementsIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M7 21L17 3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M2 21H22" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M10 16.5L12.5 16.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M8 12.5L13 12.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M12 8.5L14.5 8.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const NotificationsIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 8C18 6.4087 17.3679 4.88258 16.2426 3.75736C15.1174 2.63214 13.5913 2 12 2C10.4087 2 8.88258 2.63214 7.75736 3.75736C6.63214 4.88258 6 6.4087 6 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M13.73 21C13.5542 21.3031 13.3018 21.5547 12.9982 21.7295C12.6946 21.9044 12.3504 21.9965 12 21.9965C11.6496 21.9965 11.3054 21.9044 11.0018 21.7295C10.6982 21.5547 10.4458 21.3031 10.27 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const PaymentsIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="5" width="20" height="14" rx="2" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M2 10H22" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M6 15H8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M11 15H13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const CalendarIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="4" width="18" height="17" rx="2" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M8 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M16 2V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M3 9H21" stroke={color} strokeWidth={strokeWidth}/>
    <Circle cx="12" cy="15" r="1.5" fill={color}/>
    <Circle cx="7" cy="15" r="1.5" fill={color}/>
    <Circle cx="17" cy="15" r="1.5" fill={color}/>
  </Svg>
);

export const ReportsIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 20V10" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M12 20V4" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M6 20V14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const SubscriptionIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const SettingsIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="3" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M19.4 15C19.1 15.8 19.3 16.7 19.9 17.3L20 17.4C20.4 17.8 20.6 18.3 20.6 18.8C20.6 19.3 20.4 19.8 20 20.2C19.6 20.6 19.1 20.8 18.6 20.8C18.1 20.8 17.6 20.6 17.2 20.2L17.1 20.1C16.5 19.5 15.6 19.3 14.8 19.6C14 19.9 13.5 20.6 13.5 21.4V21.6C13.5 22.3 13.2 22.9 12.7 23.3C12.2 23.7 11.5 23.9 10.9 23.7C10.3 23.5 9.8 23.1 9.5 22.5C9.2 21.9 9.2 21.2 9.5 20.6V20.5C9.8 19.7 9.6 18.8 9 18.2C8.4 17.6 7.5 17.4 6.7 17.7H6.6C6 18 5.3 17.9 4.7 17.6C4.1 17.3 3.7 16.8 3.5 16.2C3.3 15.6 3.5 14.9 3.9 14.4L4 14.3C4.6 13.7 4.8 12.8 4.5 12C4.2 11.2 3.5 10.7 2.7 10.7H2.5C1.8 10.7 1.2 10.4 0.8 9.9C0.4 9.4 0.2 8.7 0.4 8.1C0.6 7.5 1 7 1.6 6.7C2.2 6.4 2.9 6.4 3.5 6.7H3.6C4.4 7 5.3 6.8 5.9 6.2C6.5 5.6 6.7 4.7 6.4 3.9V3.8C6.1 3.2 6.2 2.5 6.5 1.9C6.8 1.3 7.3 0.9 7.9 0.7C8.5 0.5 9.2 0.7 9.7 1.1L9.8 1.2C10.4 1.8 11.3 2 12.1 1.7C12.9 1.4 13.4 0.7 13.4 -0.1V-0.3" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const HelpIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M9.09 9C9.3251 8.33167 9.78915 7.76811 10.4 7.40913C11.0108 7.05016 11.7289 6.91894 12.4272 7.03871C13.1255 7.15849 13.7588 7.52152 14.2151 8.06353C14.6713 8.60553 14.9211 9.29152 14.92 10C14.92 12 11.92 13 11.92 13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Circle cx="12" cy="17" r="0.5" fill={color} stroke={color} strokeWidth={strokeWidth}/>
  </Svg>
);

export const LogoutIcon = ({ size = 24, color = '#E8443A', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V5C3 4.46957 3.21071 3.96086 3.58579 3.58579C3.96086 3.21071 4.46957 3 5 3H9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <Polyline points="16 17 21 12 16 7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <Line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const MenuIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 12H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M3 6H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M3 18H15" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const BackIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M19 12H5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M12 19L5 12L12 5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const ChevronRightIcon = ({ size = 24, color = '#9CA3AF', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M9 18L15 12L9 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const ChevronDownIcon = ({ size = 24, color = '#9CA3AF', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M6 9L12 15L18 9" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const PlusIcon = ({ size = 24, color = '#FFFFFF', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M12 5V19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M5 12H19" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const SearchIcon = ({ size = 24, color = '#9CA3AF', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M21 21L16.65 16.65" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const CloseIcon = ({ size = 24, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M18 6L6 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M6 6L18 18" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const CheckIcon = ({ size = 24, color = '#34A853', strokeWidth = 2 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M20 6L9 17L4 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const EditIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M18.5 2.5C18.8978 2.10217 19.4374 1.87868 20 1.87868C20.5626 1.87868 21.1022 2.10217 21.5 2.5C21.8978 2.89782 22.1213 3.43739 22.1213 4C22.1213 4.56261 21.8978 5.10217 21.5 5.5L12 15L8 16L9 12L18.5 2.5Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const TrashIcon = ({ size = 24, color = '#E8443A', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M3 6H21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M19 6L18.1245 19.133C18.0544 20.1836 17.1871 21 16.1338 21H7.86624C6.81289 21 5.94563 20.1836 5.87549 19.133L5 6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M8 6V4C8 3.44772 8.44772 3 9 3H15C15.5523 3 16 3.44772 16 4V6" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const CameraIcon = ({ size = 24, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M23 19C23 19.5304 22.7893 20.0391 22.4142 20.4142C22.0391 20.7893 21.5304 21 21 21H3C2.46957 21 1.96086 20.7893 1.58579 20.4142C1.21071 20.0391 1 19.5304 1 19V8C1 7.46957 1.21071 6.96086 1.58579 6.58579C1.96086 6.21071 2.46957 6 3 6H7L9 3H15L17 6H21C21.5304 6 22.0391 6.21071 22.4142 6.58579C22.7893 6.96086 23 7.46957 23 8V19Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="12" cy="13" r="4" stroke={color} strokeWidth={strokeWidth}/>
  </Svg>
);

export const ClockIcon = ({ size = 24, color = '#E8443A', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M12 6V12L16 14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const PhoneIcon = ({ size = 24, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M22 16.92V19.92C22.0011 20.4815 21.7669 21.017 21.3518 21.3953C20.9368 21.7736 20.3852 21.9621 19.826 21.917C16.7428 21.5856 13.787 20.5341 11.19 18.85C8.77383 17.3147 6.72534 15.2662 5.19 12.85C3.49998 10.2412 2.44824 7.27099 2.123 4.17C2.078 3.61223 2.26524 3.06281 2.64212 2.64823C3.01901 2.23364 3.55202 1.99934 4.11 2H7.11C8.1165 1.98964 8.97901 2.67988 9.15 3.67C9.32196 4.65025 9.60534 5.60784 10 6.52C10.2721 7.18007 10.1 7.93979 9.57 8.41L8.09 9.89C9.51356 12.3726 11.6274 14.4864 14.11 15.91L15.59 14.43C16.0602 13.9 16.8199 13.7279 17.48 14C18.3922 14.3947 19.3498 14.678 20.33 14.85C21.3398 15.0225 22.0412 15.9012 22 16.92Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const UserPlusIcon = ({ size = 24, color = '#4B3FA0', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M16 21V19C16 17.9391 15.5786 16.9217 14.8284 16.1716C14.0783 15.4214 13.0609 15 12 15H5C3.93913 15 2.92172 15.4214 2.17157 16.1716C1.42143 16.9217 1 17.9391 1 19V21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <Circle cx="8.5" cy="7" r="4" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M20 8V14" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M23 11H17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const BriefcasePlusIcon = ({ size = 24, color = '#4B3FA0', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="2" y="7" width="20" height="14" rx="2" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M16 7V5C16 4.46957 15.7893 3.96086 15.4142 3.58579C15.0391 3.21071 14.5304 3 14 3H10C9.46957 3 8.96086 3.21071 8.58579 3.58579C8.21071 3.96086 8 4.46957 8 5V7" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M12 12V17" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M9.5 14.5H14.5" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const ScissorsIcon = ({ size = 24, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="6" cy="6" r="3" stroke={color} strokeWidth={strokeWidth}/>
    <Circle cx="6" cy="18" r="3" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M20 4L8.12 15.88" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M14.47 14.48L20 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M8.12 8.12L12 12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const AccountIcon = ({ size = 24, color = '#1A1A2E', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="8" r="4" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M4 20C4 17.7909 7.58172 16 12 16C16.4183 16 20 17.7909 20 20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const AlertCircleIcon = ({ size = 24, color = '#E8443A', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Circle cx="12" cy="12" r="10" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M12 8V12" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Circle cx="12" cy="16" r="0.5" fill={color} stroke={color} strokeWidth={strokeWidth}/>
  </Svg>
);

export const NotepadIcon = ({ size = 24, color = '#4B3FA0', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M14 2V8H20" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M16 13H8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M16 17H8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
    <Path d="M10 9H9H8" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"/>
  </Svg>
);

export const ImageIcon = ({ size = 24, color = '#6B7280', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Rect x="3" y="3" width="18" height="18" rx="2" stroke={color} strokeWidth={strokeWidth}/>
    <Circle cx="8.5" cy="8.5" r="1.5" stroke={color} strokeWidth={strokeWidth}/>
    <Path d="M21 15L16 10L5 21" stroke={color} strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

export const SparkleIcon = ({ size = 24, color = '#4B3FA0', strokeWidth = 1.8 }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3L13.6 9.2C13.9 10.4 14.9 11.3 16 11.6L21 13L16 14.4C14.9 14.7 13.9 15.6 13.6 16.8L12 23L10.4 16.8C10.1 15.6 9.1 14.7 8 14.4L3 13L8 11.6C9.1 11.3 10.1 10.4 10.4 9.2L12 3Z"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export const TailorIcon = ({ size = 40, color = '#4B3FA0' }: IconProps) => (
  <Svg width={size} height={size} viewBox="0 0 40 40" fill="none">
    <Circle cx="20" cy="10" r="6" fill={color} opacity="0.15"/>
    <Path d="M14 22C14 22 12 24 12 28H28C28 24 26 22 26 22L22 16H18L14 22Z" fill={color} opacity="0.15"/>
    <Path d="M20 4C22.2 4 24 5.8 24 8C24 10.2 22.2 12 20 12C17.8 12 16 10.2 16 8C16 5.8 17.8 4 20 4Z" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M14 22L18 16H22L26 22" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    <Path d="M20 16V12" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M12 28H28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M14 22C14 22 12 24 12 28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M26 22C26 22 28 24 28 28" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    <Path d="M9 36C11 32 15 30 20 30C25 30 29 32 31 36" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.4"/>
  </Svg>
);
