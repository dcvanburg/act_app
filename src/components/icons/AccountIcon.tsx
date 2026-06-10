import Svg, { Circle, Path } from 'react-native-svg';

interface Props {
  size?: number;
  color?: string;
  background?: string;
}

/**
 * AccountIcon — person silhouette in a circle.
 *
 * Replaces the unicode bust glyph (U+1F464) which, like mood emojis, can
 * render as missing-glyph tofu inside RN Text on some iOS bundles.
 */
export function AccountIcon({ size = 24, color = '#3B6D11', background = '#E8F0E0' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Circle cx={12} cy={12} r={11} fill={background} />
      <Circle cx={12} cy={9.5} r={3.25} fill={color} />
      <Path d="M 5.5 19.5 Q 5.5 15.5 12 15.5 Q 18.5 15.5 18.5 19.5" fill={color} />
    </Svg>
  );
}
