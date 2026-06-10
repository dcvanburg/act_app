import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import content from '@/content/nl/onboarding.json';
import { useUpdateProfile } from '@/lib/profile-queries';

type Step = 1 | 2 | 3 | 4;

const inputClass =
  'rounded-lg border border-border bg-background px-3 py-3 text-base text-text mb-4';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerStyle={{
          flexGrow: 1,
          padding: 24,
          paddingTop: insets.top + 24,
          paddingBottom: insets.bottom + 32,
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="mx-auto w-full max-w-md">
          <StepIndicator current={step} />

          {step === 1 && <PersonalDataForm onDone={() => setStep(2)} />}
          {step === 2 && (
            <PromptCard
              title={content.step2.title}
              description={content.step2.description}
              startLabel={content.step2.startButton}
              skipLabel={content.step2.skipButton}
              onStart={() => router.replace('/mood')}
              onSkip={() => setStep(3)}
            />
          )}
          {step === 3 && (
            <PromptCard
              title={content.step3.title}
              description={content.step3.description}
              startLabel={content.step3.startButton}
              skipLabel={content.step3.skipButton}
              onStart={() => router.replace('/waarden')}
              onSkip={() => setStep(4)}
            />
          )}
          {step === 4 && (
            <PromptCard
              title={content.step4.title}
              description={content.step4.description}
              startLabel={content.step4.startButton}
              skipLabel={content.step4.skipButton}
              onStart={() => router.replace('/modules/onboarding')}
              onSkip={() => router.replace('/home')}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function StepIndicator({ current }: { current: Step }) {
  return (
    <View className="mb-8 flex-row items-center gap-2">
      {([1, 2, 3, 4] as Step[]).map((s) => (
        <View
          key={s}
          className={`h-1.5 flex-1 rounded-full ${s <= current ? 'bg-primary' : 'bg-border'}`}
        />
      ))}
    </View>
  );
}

const ANDERS = 'Anders';

function PersonalDataForm({ onDone }: { onDone: () => void }) {
  const updateProfile = useUpdateProfile();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [referralSource, setReferralSource] = useState('');
  const [customReferral, setCustomReferral] = useState('');
  const [error, setError] = useState<string | null>(null);

  const andersSelected = referralSource === ANDERS;
  const effectiveReferral = andersSelected ? customReferral.trim() : referralSource;

  const phoneInvalid = phone.length > 0 && !/^06\d{8}$/.test(phone.replace(/\s/g, ''));

  const canSave =
    firstName.trim().length > 0 &&
    lastName.trim().length > 0 &&
    referralSource.length > 0 &&
    (!andersSelected || customReferral.trim().length > 0) &&
    !phoneInvalid;

  function handleSave() {
    if (!canSave) return;
    setError(null);
    updateProfile.mutate(
      { first_name: firstName, last_name: lastName, phone, referral_source: effectiveReferral },
      {
        onSuccess: onDone,
        onError: () => setError('Opslaan mislukt. Controleer je verbinding en probeer opnieuw.'),
      },
    );
  }

  return (
    <View>
      <Text className="mb-1 font-serif text-2xl font-bold text-text">{content.step1.title}</Text>
      <Text className="mb-6 text-sm text-text-subtle">{content.step1.subtitle}</Text>

      <Text className="mb-1 text-sm font-medium text-text">{content.step1.fields.firstName}</Text>
      <TextInput
        value={firstName}
        onChangeText={setFirstName}
        autoComplete="given-name"
        autoCapitalize="words"
        placeholder={content.step1.fields.firstNamePlaceholder}
        placeholderTextColor="#888780"
        editable={!updateProfile.isPending}
        className={inputClass}
      />

      <Text className="mb-1 text-sm font-medium text-text">{content.step1.fields.lastName}</Text>
      <TextInput
        value={lastName}
        onChangeText={setLastName}
        autoComplete="family-name"
        autoCapitalize="words"
        placeholder={content.step1.fields.lastNamePlaceholder}
        placeholderTextColor="#888780"
        editable={!updateProfile.isPending}
        className={inputClass}
      />

      <Text className="mb-1 text-sm font-medium text-text">{content.step1.fields.phone}</Text>
      <TextInput
        value={phone}
        onChangeText={setPhone}
        autoComplete="tel"
        keyboardType="phone-pad"
        placeholder={content.step1.fields.phonePlaceholder}
        placeholderTextColor="#888780"
        editable={!updateProfile.isPending}
        className={`rounded-lg border px-3 py-3 text-base text-text mb-1 ${
          phoneInvalid ? 'border-crisis bg-background' : 'border-border bg-background'
        }`}
      />
      {phoneInvalid ? (
        <Text className="mb-4 text-xs text-crisis">{content.step1.fields.phoneError}</Text>
      ) : (
        <View className="mb-4" />
      )}

      <Text className="mb-3 text-sm font-medium text-text">
        {content.step1.fields.referralSource}
      </Text>
      <View className="mb-3 flex-row flex-wrap gap-2">
        {content.step1.referralOptions.map((option) => (
          <Pressable
            key={option}
            accessibilityRole="radio"
            accessibilityState={{ selected: referralSource === option }}
            onPress={() => setReferralSource(option)}
            disabled={updateProfile.isPending}
            className={`rounded-full border px-4 py-2 ${
              referralSource === option
                ? 'border-primary bg-primary-soft'
                : 'border-border bg-surface'
            }`}
          >
            <Text
              className={`text-sm font-medium ${
                referralSource === option ? 'text-primary' : 'text-text-subtle'
              }`}
            >
              {option}
            </Text>
          </Pressable>
        ))}
      </View>

      {andersSelected && (
        <TextInput
          value={customReferral}
          onChangeText={setCustomReferral}
          autoFocus
          autoCapitalize="sentences"
          placeholder="Vertel het ons..."
          placeholderTextColor="#888780"
          editable={!updateProfile.isPending}
          className={`${inputClass} mb-6`}
        />
      )}
      {!andersSelected && <View className="mb-3" />}

      {error ? <Text className="mb-3 text-sm text-crisis">{error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={handleSave}
        disabled={!canSave || updateProfile.isPending}
        className="rounded-lg bg-primary px-4 py-3 active:bg-primary-dark disabled:opacity-60"
      >
        {updateProfile.isPending ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-base font-semibold text-white">
            {content.step1.saveButton}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function PromptCard(props: {
  title: string;
  description: string;
  startLabel: string;
  skipLabel: string;
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <View>
      <Text className="mb-2 font-serif text-2xl font-bold text-text">{props.title}</Text>
      <Text className="mb-8 text-base text-text-subtle">{props.description}</Text>

      <Pressable
        accessibilityRole="button"
        onPress={props.onStart}
        className="mb-4 rounded-lg bg-primary px-4 py-3 active:bg-primary-dark"
      >
        <Text className="text-center text-base font-semibold text-white">{props.startLabel}</Text>
      </Pressable>

      <Pressable accessibilityRole="button" onPress={props.onSkip} className="items-center py-2">
        <Text className="text-sm text-text-muted">{props.skipLabel}</Text>
      </Pressable>
    </View>
  );
}
