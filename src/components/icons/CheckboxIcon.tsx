import Svg, { Path, Rect } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  checked?: boolean;
}

/** Green checkbox with checkmark for waarden check-in yes option. */
export function CheckboxIcon({ size = 32, color = '#3B6D11', checked = false }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Rect
        x={4}
        y={4}
        width={16}
        height={16}
        rx={4}
        fill={checked ? color : 'none'}
        stroke={color}
        strokeWidth={2}
      />
      {checked ? (
        <Path
          d="M8 12.2l2.6 2.6L16.2 9.2"
          stroke="#FFFFFF"
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        />
      ) : null}
    </Svg>
  );
}
