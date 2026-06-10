import { useMemo } from 'react';
import { View } from 'react-native';
import Svg, { Circle, Line, Polyline, Rect, Text as SvgText } from 'react-native-svg';

import type { MoodPoint } from '@/lib/mood';
import type { MoodScore } from '@/types/content';

interface Props {
  series: MoodPoint[];
  width: number;
  height?: number;
}

const SCORE_COLOURS: Record<MoodScore, string> = {
  1: '#D85A30', // crisis warm tone — worst mood
  2: '#E59663',
  3: '#888780', // text muted — neutral
  4: '#639922', // secondary
  5: '#3B6D11', // primary
};

const EMPTY_FILL = '#E5DFD2';
const AXIS_COLOUR = '#D3D1C7';
const LINE_COLOUR = '#3B6D11';

/**
 * MoodTrendChart — line over heatmap.
 *
 * - Bottom row: one square per day, filled with the day's mood colour
 *   (or a muted "no data" tint).
 * - Line above: connects only the days that have data; null days break the
 *   stroke into separate segments.
 * - Y axis (left): four faint guide ticks at scores 1 / 2.5 / 3.5 / 5 so the
 *   user can read the line without a numeric scale.
 *
 * Hand-rolled SVG to keep the dep budget down — see γ-1 plan in the latest
 * conversation thread. If we add more chart types later (e.g. weekly check-in
 * radar) consider victory-native.
 */
export function MoodTrendChart({ series, width, height = 160 }: Props) {
  const dim = useMemo(() => {
    const paddingLeft = 18;
    const paddingRight = 8;
    const paddingTop = 12;
    const cellSize = 14;
    const cellGap = 4;
    const heatmapHeight = cellSize + 12; // square + label
    const lineHeight = height - heatmapHeight - paddingTop;
    const innerW = width - paddingLeft - paddingRight;
    const stepX = series.length > 1 ? innerW / (series.length - 1) : 0;
    return {
      paddingLeft,
      paddingRight,
      paddingTop,
      cellSize,
      cellGap,
      heatmapHeight,
      lineHeight,
      innerW,
      stepX,
    };
  }, [series.length, width, height]);

  const yForScore = (score: MoodScore) =>
    dim.paddingTop + dim.lineHeight - ((score - 1) / 4) * dim.lineHeight;

  // Group consecutive non-null points into polyline segments. A single non-null
  // point gets rendered as a Circle (otherwise a polyline of one is invisible).
  type Segment = { points: string; singletonAt: { x: number; y: number } | null };
  const segments: Segment[] = useMemo(() => {
    const out: Segment[] = [];
    let pts: { x: number; y: number }[] = [];
    series.forEach((p, i) => {
      const x = dim.paddingLeft + i * dim.stepX;
      if (p.score !== null) {
        pts.push({ x, y: yForScore(p.score) });
      } else if (pts.length) {
        out.push({
          points: pts.map((q) => `${q.x},${q.y}`).join(' '),
          singletonAt: pts.length === 1 ? pts[0]! : null,
        });
        pts = [];
      }
    });
    if (pts.length) {
      out.push({
        points: pts.map((q) => `${q.x},${q.y}`).join(' '),
        singletonAt: pts.length === 1 ? pts[0]! : null,
      });
    }
    return out;
    // We intentionally exclude yForScore / dim methods from deps to keep this
    // pure-of-series rendering. Recompute on series / width / height change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [series, dim]);

  // Sparse x-axis labels: every 7 days (= weekly tick on a 7d view, ~4 ticks
  // on a 30d view). Tail end always shown if it falls between ticks.
  const tickStep = series.length <= 14 ? Math.max(1, Math.floor(series.length / 4)) : 7;

  return (
    <View>
      <Svg width={width} height={height} accessibilityRole="image">
        {/* Y guide lines (faint, no numeric labels) */}
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

        {/* Line segments */}
        {segments.map((seg, i) =>
          seg.singletonAt ? (
            <Circle
              key={`s${i}`}
              cx={seg.singletonAt.x}
              cy={seg.singletonAt.y}
              r={3}
              fill={LINE_COLOUR}
            />
          ) : (
            <Polyline
              key={`s${i}`}
              points={seg.points}
              stroke={LINE_COLOUR}
              strokeWidth={2}
              fill="none"
              strokeLinejoin="round"
              strokeLinecap="round"
            />
          ),
        )}

        {/* Heatmap row (one square per day) */}
        {series.map((p, i) => {
          const x = dim.paddingLeft + i * dim.stepX - dim.cellSize / 2;
          const y = dim.paddingTop + dim.lineHeight + 6;
          const fill = p.score === null ? EMPTY_FILL : SCORE_COLOURS[p.score];
          return (
            <Rect
              key={`c${i}`}
              x={x}
              y={y}
              width={dim.cellSize}
              height={dim.cellSize}
              rx={3}
              fill={fill}
              opacity={p.score === null ? 0.6 : 0.85}
            />
          );
        })}

        {/* X axis tick labels (day-of-month) */}
        {series.map((p, i) => {
          if (i % tickStep !== 0 && i !== series.length - 1) return null;
          const x = dim.paddingLeft + i * dim.stepX;
          const day = p.date.slice(8); // "YYYY-MM-DD".slice(8) = "DD"
          return (
            <SvgText
              key={`l${i}`}
              x={x}
              y={height - 1}
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
