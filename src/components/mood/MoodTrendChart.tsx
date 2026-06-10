import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Text as SvgText } from 'react-native-svg';

import type { MoodPoint } from '@/lib/mood';
import type { MoodScore } from '@/types/content';

interface Props {
  series: MoodPoint[];
  width: number;
  height?: number;
}

const SCORE_COLOURS: Record<MoodScore, string> = {
  1: '#D85A30',
  2: '#E59663',
  3: '#888780',
  4: '#639922',
  5: '#3B6D11',
};

const AXIS_COLOUR = '#D3D1C7';
const LINE_COLOUR = '#3B6D11';
const DOT_RADIUS = 5;
const DOT_STROKE = '#F5F0E8';

/**
 * MoodTrendChart — line chart with dots per check-in day.
 *
 * - Line connects consecutive days with data; null days break the stroke.
 * - Each data point is a coloured dot (score hue) with a light ring.
 * - Y guide ticks at scores 1–5; sparse x-axis day-of-month labels.
 */
export function MoodTrendChart({ series, width, height = 140 }: Props) {
  const dim = useMemo(() => {
    const paddingLeft = 18;
    const paddingRight = 8;
    const paddingTop = 12;
    const paddingBottom = 18;
    const lineHeight = height - paddingTop - paddingBottom;
    const innerW = width - paddingLeft - paddingRight;
    const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;
    return { paddingLeft, paddingRight, paddingTop, paddingBottom, lineHeight, innerW, stepX };
  }, [series.length, width, height]);

  const yForScore = (score: MoodScore) =>
    dim.paddingTop + dim.lineHeight - ((score - 1) / 4) * dim.lineHeight;

  const points = useMemo(
    () =>
      series
        .map((p, i) => {
          if (p.score === null) return null;
          return {
            x: dim.paddingLeft + i * dim.stepX,
            y: yForScore(p.score),
            score: p.score,
            index: i,
          };
        })
        .filter((p): p is NonNullable<typeof p> => p !== null),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [series, dim],
  );

  type Segment = { points: string; dots: { x: number; y: number; score: MoodScore }[] };
  const segments: Segment[] = useMemo(() => {
    const out: Segment[] = [];
    let current: { x: number; y: number; score: MoodScore }[] = [];

    series.forEach((p, i) => {
      const x = dim.paddingLeft + i * dim.stepX;
      if (p.score !== null) {
        current.push({ x, y: yForScore(p.score), score: p.score });
      } else if (current.length) {
        out.push({
          points: current.map((q) => `${q.x},${q.y}`).join(' '),
          dots: [...current],
        });
        current = [];
      }
    });

    if (current.length) {
      out.push({
        points: current.map((q) => `${q.x},${q.y}`).join(' '),
        dots: [...current],
      });
    }

    return out;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, dim]);

  const tickStep = series.length <= 14 ? Math.max(1, Math.floor(series.length / 4)) : 7;

  return (
    <View>
      <Svg width={width} height={height} accessibilityRole="image">
        {[1, 2, 3, 4, 5].map((s) => (
          <Line
            key={s}
            x1={dim.paddingLeft}
            x2={dim.paddingLeft + dim.innerW}
            y1={yForScore(s as MoodScore)}
            y2={yForScore(s as MoodScore)}
            stroke={AXIS_COLOUR}
            strokeWidth={0.5}
            opacity={0.5}
          />
        ))}

        {segments.map((seg, i) =>
          seg.dots.length > 1 ? (
            <Polyline
              key={`line-${i}`}
              points={seg.points}
              stroke={LINE_COLOUR}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ) : null,
        )}

        {points.map((p) => (
          <Circle
            key={`dot-${p.index}`}
            cx={p.x}
            cy={p.y}
            r={DOT_RADIUS}
            fill={SCORE_COLOURS[p.score]}
            stroke={DOT_STROKE}
            strokeWidth={2}
          />
        ))}

        {series.map((p, i) => {
          if (i % tickStep !== 0 && i !== series.length - 1) return null;
          const x = dim.paddingLeft + i * dim.stepX;
          const day = p.date.slice(8);
          return (
            <SvgText
              key={`l${i}`}
              x={x}
              y={height - 2}
              fontSize="9"
              fill="#888780"
              textAnchor="middle"
            >
              {Number(day)}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}
