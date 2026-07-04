import React from 'react';
import Svg, { Path, Circle, Rect, SvgProps } from 'react-native-svg';

export interface IconProps extends SvgProps {
  size?: number;
  color?: string;
}

const DEFAULT_SIZE = 24;
const DEFAULT_COLOR = 'currentColor';

/**
 * Blouse — short sleeve top with rounded collar and button placket.
 */
export const BlouseIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M7,4 L4,6 L2,10 L4.2,11.3 L6,9 L6,19.5 C6,20.9 7.1,22 8.5,22 L15.5,22 C16.9,22 18,20.9 18,19.5 L18,9 L19.8,11.3 L22,10 L20,6 L17,4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9,4 C9.5,5.7 10.6,6.6 12,6.6 C13.4,6.6 14.5,5.7 15,4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={10.5} r={0.6} fill={color} />
    <Circle cx={12} cy={14} r={0.6} fill={color} />
    <Circle cx={12} cy={17.5} r={0.6} fill={color} />
  </Svg>
);

/**
 * Kaftan — long V-neck robe with long sleeves.
 */
export const KaftanIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M9,3 L12,7.5 L15,3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9,3 C7.5,3.5 6,4.5 6,6 L3,9.5 L4.5,11 L6,9.5 L6,21 L18,21 L18,9.5 L19.5,11 L21,9.5 L18,6 C18,4.5 16.5,3.5 15,3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Gown — fitted sweetheart bodice flowing into a wide skirt.
 */
export const GownIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M7,2 L8.5,5.5 C9.5,7 10.7,7.8 12,7.8 C13.3,7.8 14.5,7 15.5,5.5 L17,2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9,7.5 L8,12 C6,15 4,18 3,21 C6,20.3 9,21.5 12,20.7 C15,21.5 18,20.3 21,21 C20,18 18,15 16,12 L15,7.5"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Shirt — short sleeve collared shirt with placket and chest pocket.
 */
export const ShirtIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M7,4 L4,6 L2,10 L4.2,11.3 L6,9 L6,19.5 C6,20.9 7.1,22 8.5,22 L15.5,22 C16.9,22 18,20.9 18,19.5 L18,9 L19.8,11.3 L22,10 L20,6 L17,4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9,4 L12,7 L15,4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M12,7 L12,22"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect
      x={13.5}
      y={11}
      width={3}
      height={3}
      rx={0.4}
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Skirt — flared pleated skirt with waistband and buckle.
 */
export const SkirtIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Rect
      x={6}
      y={3}
      width={12}
      height={2.4}
      rx={1.2}
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={4.2} r={1} stroke={color} strokeWidth={2} />
    <Path
      d="M7,5.4 L4,21 L7.5,19.5 L9.5,21 L12,19.5 L14.5,21 L16.5,19.5 L20,21 L17,5.4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Suit — blazer with lapels, tie, and buttons.
 */
export const SuitIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M6,4 L3,7 L2,11 L4,12 L5,10 L5,21 L19,21 L19,10 L20,12 L22,11 L21,7 L18,4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9,3 L6,4 L8.5,10 L11,7 L9,3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M15,3 L18,4 L15.5,10 L13,7 L15,3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M11.3,3.3 L12.7,3.3 L12,9.5 Z"
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={14} r={0.6} fill={color} />
    <Circle cx={12} cy={17} r={0.6} fill={color} />
  </Svg>
);

/**
 * Senator — traditional senator wear tunic with round neckline, chest pocket, and side slits.
 */
export const SenatorIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Path
      d="M10,3.2 C10,4.3 10.9,5.2 12,5.2 C13.1,5.2 14,4.3 14,3.2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M9,3.2 L5,5 L3,9 L4.5,10.3 L6,8.5 L6,20 L18,20 L18,8.5 L19.5,10.3 L21,9 L19,5 L15,3.2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Rect
      x={13.5}
      y={8.5}
      width={3}
      height={3}
      rx={0.4}
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Path d="M7,16.5 L7,20" stroke={color} strokeWidth={2} strokeLinecap="round" />
    <Path d="M17,16.5 L17,20" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

/**
 * Trouser — pants with waistband and fly line.
 */
export const TrouserIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    <Rect
      x={6}
      y={3}
      width={12}
      height={2.2}
      rx={1}
      stroke={color}
      strokeWidth={2}
      strokeLinejoin="round"
    />
    <Path
      d="M7,5.2 L6.4,12 L5.5,21 L9.5,21 L11,12.5 L12,12.5 L13,12.5 L14.5,21 L18.5,21 L17.6,12 L17,5.2"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path d="M12,5.2 L12,11" stroke={color} strokeWidth={2} strokeLinecap="round" />
  </Svg>
);

/**
 * Agbada — traditional West African outer robe with signature wide batwing sleeves.
 */
export const AgbadaIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    {/* Wide outer robe body + batwing sleeves */}
    <Path
      d="M9,3 C8,3 6.5,4 5.5,5.5 L2,9.5 L2,13.5 L7,11.5 L7,21 L17,21 L17,11.5 L22,13.5 L22,9.5 L18.5,5.5 C17.5,4 16,3 15,3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Round neckline */}
    <Path
      d="M9,3 Q12,7.5 15,3"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    {/* Embroidery hint at collar */}
    <Path
      d="M11,7 L12,9 L13,7"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

/**
 * Other — open scissors representing custom / bespoke garments.
 */
export const OtherIcon: React.FC<IconProps> = ({
  size = DEFAULT_SIZE,
  color = DEFAULT_COLOR,
  ...props
}) => (
  <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" {...props}>
    {/* Thumb ring */}
    <Circle cx={6} cy={7} r={2.5} stroke={color} strokeWidth={2} />
    {/* Finger ring */}
    <Circle cx={6} cy={17} r={2.5} stroke={color} strokeWidth={2} />
    {/* Upper blade */}
    <Path
      d="M8,5.5 L21,4"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Lower blade (spread open) */}
    <Path
      d="M8,8.5 L21,20"
      stroke={color}
      strokeWidth={2}
      strokeLinecap="round"
    />
    {/* Pivot dot */}
    <Circle cx={12} cy={12} r={1} fill={color} />
  </Svg>
);

export const customIcons = {
  agbada: AgbadaIcon,
  blouse: BlouseIcon,
  gown: GownIcon,
  kaftan: KaftanIcon,
  other: OtherIcon,
  senator: SenatorIcon,
  shirt: ShirtIcon,
  skirt: SkirtIcon,
  suit: SuitIcon,
  trouser: TrouserIcon,
};

export default customIcons;
