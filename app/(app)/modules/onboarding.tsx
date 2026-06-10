import { useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ModuleReadOnlyView } from '@/components/modules/ModuleReadOnlyView';
import common from '@/content/nl/common.json';
import crisis from '@/content/nl/crisis.json';
import intake from '@/content/nl/intake.json';
import { getModuleContent } from '@/lib/content';
import { getModuleStatus } from '@/lib/progress';
import { useSaveIntake, useUserProgress } from '@/lib/progress-queries';
import { isComplete, isProgramAllowed, worstOutcome } from '@/lib/safety';
import type { ComplaintType, SafetyOutcome, SafetyQuestion } from '@/types/content';

const COMPLAINT_KEYS: ComplaintType[] = ['pain', 'mental', 'alcohol', 'combination'];

type Step = 'welcome' | 'complaint' | 'safety' | 'blocked' | 'complete';

/**
 * /modules/onboarding — module 0 intake flow (α5), inside the modules stack.
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { data: progress, isLoading } = useUserProgress();
  const saveIntake = useSaveIntake();
  const { from } = useLocalSearchParams<{ from?: string }>();
  const inOnboarding = from === 'onboarding';

  useEffect(() => {
    if (!inOnboarding) return;
    // Hide the tab bar — this screen is inside a nested stack so we need the parent tab navigator
    const tabNav = navigation.getParent();
    tabNav?.setOptions({ tabBarStyle: { display: 'none' } });
    return () => tabNav?.setOptions({ tabBarStyle: undefined });
  }, [inOnboarding, navigation]);

  const questions = intake.safetyCheck.questions as SafetyQuestion[];

  const [step, setStep] = useState<Step>('welcome');
  const [complaint, setComplaint] = useState<ComplaintType | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [questionIndex, setQuestionIndex] = useState(0);
  const [resolvedOutcome, setResolvedOutcome] = useState<SafetyOutcome | null>(null);

  const currentQuestion = questions[questionIndex];

  const blockedCopy = useMemo(() => {
    if (resolvedOutcome === 'block-medical') return intake.blocked.medical;
    return intake.blocked.strong;
  }, [resolvedOutcome]);

  if (isLoading || !progress) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#3B6D11" />
      </View>
    );
  }

  const onboardingStatus = getModuleStatus('onboarding', progress);
  if (onboardingStatus === 'completed') {
    const content = getModuleContent('onboarding');
    return <ModuleReadOnlyView content={content} complaintTypes={progress.intake.complaintTypes} />;
  }

  function finishSafetyCheck(finalAnswers: Record<string, string>) {
    if (!isComplete(questions, finalAnswers) || !complaint) return;
    const outcome = worstOutcome(questions, finalAnswers);
    setResolvedOutcome(outcome);

    if (isProgramAllowed(outcome)) {
      saveIntake.mutate(
        {
          complaintTypes: [complaint],
          safetyOutcome: outcome ?? 'pass',
          safetyPassed: true,
        },
        { onSuccess: () => setStep('complete') },
      );
    } else {
      saveIntake.mutate({
        complaintTypes: [complaint],
        safetyOutcome: outcome ?? 'block-strong',
        safetyPassed: false,
      });
      setStep('blocked');
    }
  }

  return (
    <ScrollView
      className="flex-1 bg-background"
      contentContainerStyle={{
        paddingTop: insets.top + 24,
        paddingBottom: insets.bottom + 112,
        paddingHorizontal: 16,
        flexGrow: 1,
        justifyContent: 'center',
      }}
      keyboardShouldPersistTaps="handled"
    >
      <View className="mx-auto w-full max-w-md">
        {step === 'welcome' && (
          <WelcomeStep
            onContinue={() => setStep('complaint')}
            onBack={() =>
              inOnboarding ? router.replace('/mood?from=onboarding') : router.back()
            }
            onSkip={() => router.replace('/home')}
            inOnboarding={inOnboarding}
          />
        )}
        {step === 'complaint' && (
          <ComplaintStep
            value={complaint}
            onChange={setComplaint}
            onContinue={() => setStep('safety')}
            onBack={() => setStep('welcome')}
          />
        )}
        {step === 'safety' && currentQuestion && (
          <SafetyStep
            question={currentQuestion}
            index={questionIndex}
            total={questions.length}
            answer={answers[currentQuestion.id] ?? null}
            onAnswer={(value) => {
              const nextAnswers = { ...answers, [currentQuestion.id]: value };
              setAnswers(nextAnswers);
              if (questionIndex < questions.length - 1) {
                setQuestionIndex((i) => i + 1);
              } else {
                finishSafetyCheck(nextAnswers);
              }
            }}
            onBack={() => {
              if (questionIndex > 0) setQuestionIndex((i) => i - 1);
              else setStep('complaint');
            }}
            isSaving={saveIntake.isPending}
          />
        )}
        {step === 'blocked' && (
          <BlockedStep
            title={blockedCopy.title}
            body={blockedCopy.body}
            action={blockedCopy.action}
            onAction={() => router.push('/noodhulp')}
            onHome={() => router.replace('/home')}
          />
        )}
        {step === 'complete' && <CompleteStep onContinue={() => router.replace('/home')} />}
      </View>
    </ScrollView>
  );
}

function WelcomeStep({
  onContinue,
  onBack,
  onSkip,
  inOnboarding,
}: {
  onContinue: () => void;
  onBack: () => void;
  onSkip: () => void;
  inOnboarding: boolean;
}) {
  return (
    <View>
      <View className="mb-4 flex-row items-center justify-between">
        <Pressable accessibilityRole="button" onPress={onBack} className="self-start">
          <Text className="text-sm text-text-muted">{`‹ ${common.actions.back}`}</Text>
        </Pressable>
        {inOnboarding && (
          <Pressable accessibilityRole="button" onPress={onSkip}>
            <Text className="text-sm text-text-muted">Overslaan</Text>
          </Pressable>
        )}
      </View>
      <Text className="mb-2 font-serif text-3xl font-bold text-text">{intake.welcome.title}</Text>
      <Text className="mb-8 text-base leading-relaxed text-text-subtle">{intake.welcome.body}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={onContinue}
        className="rounded-lg bg-primary px-4 py-3 active:bg-primary-dark"
      >
        <Text className="text-center text-base font-semibold text-white">
          {common.actions.start}
        </Text>
      </Pressable>
    </View>
  );
}

function ComplaintStep({
  value,
  onChange,
  onContinue,
  onBack,
}: {
  value: ComplaintType | null;
  onChange: (v: ComplaintType) => void;
  onContinue: () => void;
  onBack: () => void;
}) {
  return (
    <View>
      <Pressable accessibilityRole="button" onPress={onBack} className="mb-4 self-start">
        <Text className="text-sm text-text-muted">{`‹ ${common.actions.back}`}</Text>
      </Pressable>
      <Text className="mb-1 font-serif text-2xl font-bold text-text">
        {intake.complaintTypes.title}
      </Text>
      <Text className="mb-6 text-sm text-text-subtle">{intake.complaintTypes.subtitle}</Text>
      <View className="gap-3">
        {COMPLAINT_KEYS.map((key) => {
          const opt = intake.complaintTypes.options[key];
          const selected = value === key;
          return (
            <Pressable
              key={key}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              onPress={() => onChange(key)}
              className={
                'rounded-2xl border p-4 shadow-sm ' +
                (selected
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-surface active:bg-primary-soft')
              }
            >
              <Text
                className={selected ? 'font-semibold text-primary-dark' : 'font-semibold text-text'}
              >
                {opt.label}
              </Text>
              <Text className="mt-1 text-sm text-text-subtle">{opt.description}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable
        accessibilityRole="button"
        onPress={onContinue}
        disabled={!value}
        className="mt-8 rounded-lg bg-primary px-4 py-3 active:bg-primary-dark disabled:opacity-60"
      >
        <Text className="text-center text-base font-semibold text-white">
          {common.actions.continue}
        </Text>
      </Pressable>
    </View>
  );
}

function SafetyStep({
  question,
  index,
  total,
  answer,
  onAnswer,
  onBack,
  isSaving,
}: {
  question: SafetyQuestion;
  index: number;
  total: number;
  answer: string | null;
  onAnswer: (value: string) => void;
  onBack: () => void;
  isSaving: boolean;
}) {
  return (
    <View>
      <Pressable
        accessibilityRole="button"
        onPress={onBack}
        disabled={isSaving}
        className="mb-4 self-start"
      >
        <Text className="text-sm text-text-muted">{`‹ ${common.actions.back}`}</Text>
      </Pressable>
      <Text className="mb-1 text-xs font-medium uppercase tracking-wide text-text-muted">
        {intake.safetyCheck.title} · {index + 1} / {total}
      </Text>
      <Text className="mb-6 font-serif text-xl font-bold text-text">{question.title}</Text>

      <View className="gap-3">
        {question.options.map((opt) => {
          const selected = answer === opt.value;
          return (
            <Pressable
              key={opt.value}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: isSaving }}
              onPress={() => {
                if (!isSaving) onAnswer(opt.value);
              }}
              className={
                'rounded-2xl border p-4 shadow-sm ' +
                (selected
                  ? 'border-primary bg-primary-soft'
                  : 'border-border bg-surface active:bg-primary-soft')
              }
            >
              <Text className={selected ? 'font-semibold text-primary-dark' : 'text-text'}>
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {question.helpText ? (
        <Text className="mt-6 text-xs text-text-muted">{question.helpText}</Text>
      ) : null}

      {isSaving ? (
        <View className="mt-6 items-center">
          <ActivityIndicator color="#3B6D11" />
        </View>
      ) : null}
    </View>
  );
}

function BlockedStep({
  title,
  body,
  action,
  onAction,
  onHome,
}: {
  title: string;
  body: string;
  action: string;
  onAction: () => void;
  onHome: () => void;
}) {
  return (
    <View>
      <View className="mb-6 rounded-2xl border border-crisis-border bg-crisis-soft p-5">
        <Text className="mb-2 font-serif text-xl font-bold text-crisis-dark">{title}</Text>
        <Text className="text-base text-text-subtle">{body}</Text>
      </View>

      <View className="mb-3 rounded-2xl bg-surface p-4 shadow-sm">
        <Text className="font-semibold text-text">{crisis.resources.crisisLine.name}</Text>
        <Text className="text-sm text-text-subtle">{crisis.resources.crisisLine.description}</Text>
        <Text className="mt-2 font-serif text-lg font-bold text-primary">
          {crisis.resources.crisisLine.phone}
        </Text>
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={onAction}
        className="rounded-lg bg-primary px-4 py-3 active:bg-primary-dark"
      >
        <Text className="text-center text-base font-semibold text-white">{action}</Text>
      </Pressable>

      <Pressable
        accessibilityRole="button"
        onPress={onHome}
        className="mt-3 rounded-lg border border-border px-4 py-3 active:bg-surface-muted"
      >
        <Text className="text-center text-sm font-medium text-text-muted">Naar startscherm</Text>
      </Pressable>
    </View>
  );
}

function CompleteStep({ onContinue }: { onContinue: () => void }) {
  return (
    <View>
      <Text className="mb-2 font-serif text-3xl font-bold text-text">{intake.complete.title}</Text>
      <Text className="mb-8 text-base leading-relaxed text-text-subtle">
        {intake.complete.body}
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={onContinue}
        className="rounded-lg bg-primary px-4 py-3 active:bg-primary-dark"
      >
        <Text className="text-center text-base font-semibold text-white">
          {common.actions.continue}
        </Text>
      </Pressable>
    </View>
  );
}
