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

const ANDERS = 'Anders';

const inputClass =
  'rounded-lg border border-border bg-background px-3 py-3 text-base text-text mb-1';

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
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
        onSuccess: () => router.replace('/mood?from=onboarding'),
        onError: () => setError('Opslaan mislukt. Controleer je verbinding en probeer opnieuw.'),
      },
    );
  }

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
          <Text className="mb-1 font-serif text-2xl font-bold text-text">
            {content.step1.title}
          </Text>
          <Text className="mb-6 text-sm text-text-subtle">{content.step1.subtitle}</Text>

          <Text className="mb-1 text-sm font-medium text-text">
            {content.step1.fields.firstName}
          </Text>
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            autoComplete="given-name"
            autoCapitalize="words"
            placeholder={content.step1.fields.firstNamePlaceholder}
            placeholderTextColor="#888780"
            editable={!updateProfile.isPending}
            className={`${inputClass} mb-4`}
          />

          <Text className="mb-1 text-sm font-medium text-text">
            {content.step1.fields.lastName}
          </Text>
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            autoComplete="family-name"
            autoCapitalize="words"
            placeholder={content.step1.fields.lastNamePlaceholder}
            placeholderTextColor="#888780"
            editable={!updateProfile.isPending}
            className={`${inputClass} mb-4`}
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
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
