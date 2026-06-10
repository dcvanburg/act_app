import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppTextInput } from '@/components/AppTextInput';
import content from '@/content/nl/onboarding.json';
import { useUpdateProfile } from '@/lib/profile-queries';
import { useAuth } from '@/providers/AuthProvider';

const ANDERS = 'Anders';

/**
 * /wizard — first-login profile setup (step 1 of onboarding).
 *
 * After saving personal data the user goes straight to the mood check-in with
 * the onboarding intro modal (`/mood?from=onboarding`), then Welkom & Intake
 * (`/modules/onboarding?from=onboarding`).
 */
export default function WizardScreen() {
  const insets = useSafeAreaInsets();

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
          <PersonalDataForm />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function PersonalDataForm() {
  const router = useRouter();
  const { user, signOut } = useAuth();
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
    <View>
      {user?.email ? (
        <View className="mb-6 rounded-xl border border-border bg-surface-muted px-4 py-3">
          <Text className="text-sm text-text-subtle">
            {content.step1.loggedInAs.replace('{email}', user.email)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={async () => {
              await signOut();
              router.replace('/login');
            }}
            className="mt-2 self-start"
          >
            <Text className="text-sm font-medium text-primary">{content.step1.logout}</Text>
          </Pressable>
        </View>
      ) : null}

      <Text className="mb-1 font-serif text-2xl font-bold text-text">{content.step1.title}</Text>
      <Text className="mb-6 text-sm text-text-subtle">{content.step1.subtitle}</Text>

      <Text className="mb-1 text-sm font-medium text-text">{content.step1.fields.firstName}</Text>
      <AppTextInput
        value={firstName}
        onChangeText={setFirstName}
        autoComplete="given-name"
        autoCapitalize="words"
        placeholder={content.step1.fields.firstNamePlaceholder}
        editable={!updateProfile.isPending}
        className="mb-4"
      />

      <Text className="mb-1 text-sm font-medium text-text">{content.step1.fields.lastName}</Text>
      <AppTextInput
        value={lastName}
        onChangeText={setLastName}
        autoComplete="family-name"
        autoCapitalize="words"
        placeholder={content.step1.fields.lastNamePlaceholder}
        editable={!updateProfile.isPending}
        className="mb-4"
      />

      <Text className="mb-1 text-sm font-medium text-text">{content.step1.fields.phone}</Text>
      <AppTextInput
        value={phone}
        onChangeText={setPhone}
        autoComplete="tel"
        keyboardType="phone-pad"
        placeholder={content.step1.fields.phonePlaceholder}
        editable={!updateProfile.isPending}
        invalid={phoneInvalid}
        className="mb-1"
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
        <AppTextInput
          value={customReferral}
          onChangeText={setCustomReferral}
          autoFocus
          autoCapitalize="sentences"
          placeholder="Vertel het ons..."
          editable={!updateProfile.isPending}
          className="mb-6"
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
