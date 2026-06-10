import { Link } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import common from '@/content/nl/common.json';
import { countCompletedModules, MODULE_ORDER } from '@/lib/progress';
import type { UserProgress } from '@/types/content';

interface Props {
  progress: UserProgress;
}

/** Home-screen teaser linking to the Modules tab. */
export function ProgramHomeCard({ progress }: Props) {
  const completed = countCompletedModules(progress);
  const total = MODULE_ORDER.length;

  return (
    <Link href="/modules" asChild>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={common.program.openModules}
        className="mb-4 flex-row items-center gap-4 rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft"
      >
        <View className="h-12 w-12 items-center justify-center rounded-full bg-primary-soft">
          <Text className="font-serif text-lg font-bold text-primary-dark">
            {completed}/{total}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="font-semibold text-text">{common.program.title}</Text>
          <Text className="text-sm text-text-subtle">{common.program.homeTeaser}</Text>
        </View>
        <Text className="text-text-muted">›</Text>
      </Pressable>
    </Link>
  );
}
