import Svg, { Circle } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Long-term actions (lange termijn). */
export function TargetIcon({ size = 20, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={5.5} fill="none" stroke={color} strokeWidth={1.8} />
      <Circle cx={12} cy={12} r={2} fill={color} />
    </Svg>
  );
}
