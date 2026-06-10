import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Roadblock for the Barrières tab. */
export function BarrierTabIcon({ size = 18, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path
        d="M4 18h16M7 18V9l5-4 5 4v9"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path d="M10 13h4" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
