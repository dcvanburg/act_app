import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Medium-term actions (middellange termijn). */
export function CalendarIcon({ size = 20, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Rect
        x={4}
        y={6}
        width={16}
        height={14}
        rx={2}
        fill="none"
        stroke={color}
        strokeWidth={1.8}
      />
      <Path d="M4 10h16M8 4v3M16 4v3" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
