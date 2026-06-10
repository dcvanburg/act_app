import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Vermijding barrier type. */
export function AvoidIcon({ size = 16, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Circle cx={12} cy={12} r={9} fill="none" stroke={color} strokeWidth={1.8} />
      <Path d="M7.5 7.5l9 9" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
    </Svg>
  );
}
