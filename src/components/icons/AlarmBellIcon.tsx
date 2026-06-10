import Svg, { Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
}

/** Alarm bell for the collapsed Noodknop affordance. */
export function AlarmBellIcon({ size = 22, color = '#FFFFFF' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Path
        d="M12 3.5c-2.8 0-5 2.2-5 5v2.6l-1.4 2.8a1 1 0 0 0 .9 1.5h11a1 1 0 0 0 .9-1.5l-1.4-2.8V8.5c0-2.8-2.2-5-5-5z"
        fill={color}
      />
      <Path
        d="M10.2 18.8a1.8 1.8 0 0 0 3.6 0"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}
