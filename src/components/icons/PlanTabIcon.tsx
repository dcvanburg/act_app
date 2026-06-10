import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Clipboard list for the Plan tab. */
export function PlanTabIcon({ size = 18, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Rect
        x={6}
        y={4}
        width={12}
        height={16}
        rx={2}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path d="M9 4.5V3.8a1.8 1.8 0 0 1 3.6 0V4.5" stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M9 10h6M9 14h6" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
