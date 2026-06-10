import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Short-term actions (korte termijn). */
export function BoltIcon({ size = 20, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path d="M13 2L5 14h6l-1 8 8-12h-6l1-8z" fill={color} />
    </Svg>
  );
}
