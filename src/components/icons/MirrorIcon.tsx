import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Zelfkritiek barrier type. */
export function MirrorIcon({ size = 16, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Circle cx={10} cy={10} r={5.5} fill="none" stroke={color} strokeWidth={1.8} />
      <Path
        d="M14.5 14.5L20 20"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Circle cx={10} cy={9} r={1.6} fill={color} />
    </Svg>
  );
}
