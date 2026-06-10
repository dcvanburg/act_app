import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Red cross for waarden check-in no option. */
export function CrossIcon({ size = 32, color = '#D85A30' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path
        d="M8.2 8.2l7.6 7.6M15.8 8.2l-7.6 7.6"
        stroke={color}
        strokeWidth={2.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
