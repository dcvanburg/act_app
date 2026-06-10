import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Flame symbol, used for streak badges. */
export function FlameIcon({ size = 24, color = '#E8A800' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path
        d="M12 3c1.2 2.1 3.4 3.4 3.4 6.2 0 1.1-.4 2.1-1 2.9.6-.2 1.1-.6 1.5-1.1.3 1.5-.2 3.1-1.4 4.2C13.7 16.8 13 17.5 12 18c-1 0-2.2-.8-2.5-1.8-1.2-1.1-1.7-2.7-1.4-4.2.4.5.9.9 1.5 1.1-.6-.8-1-1.8-1-2.9C8.6 6.4 10.8 5.1 12 3z"
        fill={color}
      />
    </Svg>
  );
}
