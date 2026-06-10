import { Text, View } from 'react-native';

import waarden from '@/content/nl/waarden.json';
import type { WaardeCheckinSummary } from '@/lib/waarden';
import type { BarriereType, WaardeTermijn } from '@/types/waarden';

const TERMIJN_ORDER: WaardeTermijn[] = ['kort', 'middel', 'lang'];
const termijnLabels = waarden.checkin.termijnLabels;
const termijnHeadings = waarden.checkin.termijnHeadings;
const barrierTypeLabels = waarden.barrierTypes;

function barrierLabel(type: BarriereType, eigenLabel?: string): string {
  if (type === 'eigen' && eigenLabel) return eigenLabel;
  return barrierTypeLabels[type];
}

interface Props {
  summary: WaardeCheckinSummary;
}

/** Structured overview of plan actions and barriers shown before the daily check-in. */
export function WaardenCheckinSummaryCard({ summary }: Props) {
  const hasActies = TERMIJN_ORDER.some((termijn) => summary.actiesByTermijn[termijn].length > 0);

  return (
    <View>
      {summary.dailyFocus ? (
        <View className="mb-4 rounded-xl border border-primary-border-soft bg-primary-soft px-4 py-3.5">
          <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
            {waarden.checkin.summaryDailyFocus}
          </Text>
          <Text className="text-sm leading-6 text-primary-dark">{summary.dailyFocus}</Text>
        </View>
      ) : null}

      {hasActies ? (
        <View className="mb-4">
          <Text className="mb-2.5 text-sm font-semibold text-text">
            {waarden.checkin.summaryActiesHeading}
          </Text>
          {TERMIJN_ORDER.map((termijn) => {
            const items = summary.actiesByTermijn[termijn];
            if (items.length === 0) return null;

            return (
              <View key={termijn} className="mb-3">
                <Text className="mb-1.5 text-xs font-medium text-text-muted">
                  {termijnHeadings[termijn]} · {termijnLabels[termijn]}
                </Text>
                {items.map((item) => (
                  <View
                    key={item.id}
                    className="mb-1.5 flex-row items-start gap-2 rounded-xl bg-surface-muted px-3 py-2.5"
                  >
                    <View className="mt-2 h-1.5 w-1.5 rounded-full bg-primary" />
                    <Text className="flex-1 text-sm leading-5 text-text">{item.actie}</Text>
                  </View>
                ))}
              </View>
            );
          })}
        </View>
      ) : null}

      {summary.barriers.length > 0 ? (
        <View>
          <Text className="mb-2.5 text-sm font-semibold text-text">
            {waarden.checkin.summaryBarriersHeading}
          </Text>
          {summary.barriers.map((item) => (
            <View
              key={item.id}
              className="mb-2 rounded-xl border border-border bg-surface-muted px-3 py-2.5"
            >
              <Text className="mb-1 text-xs font-semibold text-text-muted">
                {barrierLabel(item.type, item.eigenLabel)}
              </Text>
              <Text className="text-sm italic leading-5 text-text-subtle">
                &ldquo;{item.omschrijving}&rdquo;
              </Text>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}
