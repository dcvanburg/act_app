import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Five-point star for the waarden home card affordance. */
export function StarIcon({ size = 24, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path
        d="M12 3.2l2.45 4.96 5.48.8-3.96 3.86.93 5.46L12 15.9l-4.9 2.58.93-5.46-3.96-3.86 5.48-.8L12 3.2z"
        fill={color}
      />
    </Svg>
  );
}
