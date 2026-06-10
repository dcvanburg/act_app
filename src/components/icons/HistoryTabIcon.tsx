import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Timeline chart for the Historie tab. */
export function HistoryTabIcon({ size = 18, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path
        d="M4 19V5M4 19h16M8 15l3-4 3 2 4-6"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
