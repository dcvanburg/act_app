import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import crisis from '@/content/nl/crisis.json';
import groundingRaw from '@/content/nl/exercises/emergency-grounding.json';
import type { GroundingExercise } from '@/types/content';

const grounding = groundingRaw as GroundingExercise;

/**
 * /noodhulp — crisis screen.
 *
 * Hard rules (CLAUDE.md non-negotiables):
 *   - Always accessible — no auth check, no route guard
 *   - Crisis line, huisarts, GGZ visible
 *   - Disclaimer never weakened
 *   - The crisis line phone number is tappable: tel:08000113
 *
 * Content lives in src/content/nl/crisis.json + emergency-grounding.json.
 * The grounding steps are still [PLACEHOLDER] until the therapist signs off
 * (validate-content.ts flags this as a build-time guard).
 */
export default function NoodhulpScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 16,
        paddingBottom: insets.bottom + 96, // leave room for the Noodknop overlay
        paddingHorizontal: 16,
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="w-full max-w-md self-center">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Terug"
          onPress={() => router.back()}
          className="mb-4 self-start"
        >
          <Text className="text-sm text-text-muted">← Terug</Text>
        </Pressable>

        {/* Disclaimer */}
        <View className="mb-6 rounded-2xl border border-crisis-border bg-crisis-soft p-4">
          <Text className="mb-1 font-semibold text-crisis-dark">{crisis.disclaimer.title}</Text>
          <Text className="text-sm text-text-subtle">{crisis.disclaimer.body}</Text>
        </View>

        {/* Grounding exercise */}
        <Text className="mb-1 font-serif text-2xl font-bold text-text">{grounding.title}</Text>
        <Text className="mb-5 text-sm text-text-subtle">{grounding.description}</Text>

        <View className="gap-3">
          {grounding.steps.map((step, i) => (
            <View key={step.id} className="rounded-2xl bg-surface p-4 shadow-sm">
              <Text className="mb-1 text-xs font-semibold uppercase tracking-wide text-primary">
                Stap {i + 1}
              </Text>
              <Text className="text-base text-text">{step.instruction}</Text>
            </View>
          ))}
        </View>

        {/* Crisis resources */}
        <Text className="mb-3 mt-8 font-semibold text-text">{crisis.resources.title}</Text>
        <View className="gap-3">
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Bel ${crisis.resources.crisisLine.name} op ${crisis.resources.crisisLine.phone}`}
            onPress={async () => {
              // tel: URLs fail on the iOS Simulator (no Phone app) and on
              // devices without a SIM. Swallow the rejection — the user can
              // still read the number and dial manually.
              try {
                const supported = await Linking.canOpenURL(crisis.resources.crisisLine.phoneUri);
                if (supported) {
                  await Linking.openURL(crisis.resources.crisisLine.phoneUri);
                }
              } catch {
                /* no-op: user falls back to reading the number visually */
              }
            }}
            className="flex-row items-center justify-between rounded-2xl bg-surface p-4 shadow-sm active:bg-primary-soft"
          >
            <View className="mr-3 flex-shrink">
              <Text className="font-semibold text-text">{crisis.resources.crisisLine.name}</Text>
              <Text className="text-sm text-text-subtle">
                {crisis.resources.crisisLine.description}
              </Text>
            </View>
            <Text className="font-serif text-base font-bold text-primary">
              {crisis.resources.crisisLine.phone}
            </Text>
          </Pressable>

          <View className="rounded-2xl bg-surface p-4 shadow-sm">
            <Text className="font-semibold text-text">{crisis.resources.huisarts.name}</Text>
            <Text className="text-sm text-text-subtle">
              {crisis.resources.huisarts.description}
            </Text>
          </View>

          <View className="rounded-2xl bg-surface p-4 shadow-sm">
            <Text className="font-semibold text-text">{crisis.resources.ggz.name}</Text>
            <Text className="text-sm text-text-subtle">{crisis.resources.ggz.description}</Text>
          </View>
        </View>

        {/* The `safetyBlock` card from crisis.json belongs on the intake
            safety-screening screen (lands in α5), not on /noodhulp. Showing
            "We maken ons zorgen om je" here is redundant — the user already
            came TO the crisis page for help. */}
      </View>
    </ScrollView>
  );
}
