import Svg, { Circle, Path } from 'react-native-svg';

import type { MoodScore } from '@/types/content';

interface Props {
  score: MoodScore;
  size?: number;
  color?: string;
  background?: string;
}

/**
 * MoodFace — SVG facial expression keyed to a MoodScore.
 *
 * Replaces the unicode emoji (😞/🙁/😐/🙂/😄) which iOS does not always fall
 * back to AppleColorEmoji for inside RN Text — some bundles render them as
 * the missing-glyph tofu. Drawing the faces ourselves keeps the affective
 * signal intact across devices, and inherits the program's earthy palette.
 */
export function MoodFace({ score, size = 32, color = '#3B6D11', background = 'transparent' }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityRole="image">
      <Circle cx={12} cy={12} r={10.5} fill={background} stroke={color} strokeWidth={1.5} />
      <Circle cx={8.5} cy={10} r={1} fill={color} />
      <Circle cx={15.5} cy={10} r={1} fill={color} />
      <Path
        d={mouthPath(score)}
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        fill="none"
      />
    </Svg>
  );
}

function mouthPath(score: MoodScore): string {
  switch (score) {
    case 1:
      return 'M 7.5 16.5 Q 12 13 16.5 16.5'; // strong downturn (sad)
    case 2:
      return 'M 8 16 Q 12 14.5 16 16'; // slight downturn
    case 3:
      return 'M 8.5 15.5 L 15.5 15.5'; // flat (neutral)
    case 4:
      return 'M 8 14.5 Q 12 16.5 16 14.5'; // slight smile
    case 5:
      return 'M 7 13.5 Q 12 18 17 13.5'; // wide smile
  }
}
