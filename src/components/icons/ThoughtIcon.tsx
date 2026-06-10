import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Moeilijke gedachten barrier type. */
export function ThoughtIcon({ size = 16, color = '#3B6D11' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path
        d="M9.5 18a4.5 4.5 0 1 1 0-9 5.5 5.5 0 0 1 10.3 2.2A4.3 4.3 0 0 1 16.5 18H9.5z"
        fill="none"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
    </Svg>
  );
}
