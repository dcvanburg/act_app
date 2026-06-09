import { Redirect, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import common from '@/content/nl/common.json';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

// Compass / hexaflex mark — source SVG lives at assets/src/icon.svg.
// Regenerate the PNG via assets/src/EXPORT_INSTRUCTIONS.md.
const logo = require('../../assets/icon.png');

const REDIRECT_URL = 'actapp://auth/callback';

type Step = 'email' | 'code';

/**
 * Login screen — email magic-link + 6-digit OTP fallback.
 *
 * Supabase sends both a clickable magic link AND a 6-digit code in the same
 * email. The link uses the `actapp://auth/callback` deep link, but if the user
 * opens their email on a different device (or in a desktop browser that
 * doesn't know the `actapp://` scheme), the deep link never reaches the app.
 *
 * To handle that, we show a code input on the same screen. The user can either
 * click the link OR type the code from the email — whichever path works first
 * sets the session via Supabase auth and AuthProvider redirects to /home.
 */
export default function LoginScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { error: errorParam } = useLocalSearchParams<{ error?: string }>();

  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(
    errorParam === 'auth' ? 'Inloggen mislukt. Probeer het opnieuw.' : null,
  );

  // Already signed in — bounce home. Handled here (not in the layout) so the
  // screen mounts cleanly and the redirect fires once the deep link is parsed.
  if (session) {
    return <Redirect href="/home" />;
  }

  async function handleSubmitEmail() {
    if (!email.trim()) return;
    setError(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: REDIRECT_URL },
    });

    setLoading(false);

    if (signInError) {
      setError('Er is iets misgegaan. Controleer het e-mailadres en probeer opnieuw.');
      return;
    }

    setStep('code');
  }

  async function handleVerifyCode() {
    const trimmed = code.trim();
    if (trimmed.length < 6) return;
    setError(null);
    setLoading(true);

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: trimmed,
      type: 'email',
    });

    setLoading(false);

    if (verifyError) {
      setError('Code klopt niet of is verlopen. Vraag een nieuwe code aan.');
      return;
    }

    // Success — AuthProvider's onAuthStateChange fires and the Redirect above
    // sends us to /home.
  }

  async function handleResendCode() {
    setError(null);
    setLoading(true);

    const { error: resendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: REDIRECT_URL },
    });

    setLoading(false);

    if (resendError) {
      setError('Verzenden mislukt. Probeer het later opnieuw.');
    }
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
          paddingBottom: insets.bottom + 96,
          justifyContent: 'center',
        }}
        keyboardShouldPersistTaps="handled"
      >
        <View className="w-full max-w-md self-center">
          <View className="mb-8 items-center">
            <Image
              source={logo}
              accessibilityLabel={common.app.name}
              resizeMode="contain"
              style={{ width: 96, height: 96, marginBottom: 12 }}
            />
            <Text className="text-center font-serif text-3xl font-bold leading-tight text-text">
              {common.app.nameDisplay}
            </Text>
            <Text className="mt-2 text-base text-text-subtle">{common.app.tagline}</Text>
          </View>

          {step === 'code' ? (
            <CodeForm
              email={email}
              code={code}
              loading={loading}
              error={error}
              onChangeCode={setCode}
              onSubmit={handleVerifyCode}
              onResend={handleResendCode}
              onChangeEmail={() => {
                setStep('email');
                setCode('');
                setError(null);
              }}
            />
          ) : (
            <EmailForm
              email={email}
              loading={loading}
              error={error}
              onChangeEmail={setEmail}
              onSubmit={handleSubmitEmail}
            />
          )}

          <Text className="mt-8 text-center text-xs text-text-muted">
            Dit programma is geen vervanging voor professionele hulp.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function EmailForm(props: {
  email: string;
  loading: boolean;
  error: string | null;
  onChangeEmail: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View className="rounded-2xl bg-surface p-6 shadow-sm">
      <Text className="mb-1 text-sm font-medium text-text">E-mailadres</Text>
      <TextInput
        value={props.email}
        onChangeText={props.onChangeEmail}
        autoComplete="email"
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!props.loading}
        placeholder="jouw@email.nl"
        placeholderTextColor="#888780"
        className="mb-4 rounded-lg border border-border bg-background px-3 py-3 text-base text-text"
      />

      {props.error ? <Text className="mb-3 text-sm text-crisis">{props.error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={props.onSubmit}
        disabled={props.loading || props.email.trim().length === 0}
        className="rounded-lg bg-primary px-4 py-3 active:bg-primary-dark disabled:opacity-60"
      >
        {props.loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-base font-semibold text-white">
            {common.actions.continue}
          </Text>
        )}
      </Pressable>
    </View>
  );
}

function CodeForm(props: {
  email: string;
  code: string;
  loading: boolean;
  error: string | null;
  onChangeCode: (v: string) => void;
  onSubmit: () => void;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  const canSubmit = props.code.trim().length === 6 && !props.loading;

  return (
    <View className="rounded-2xl bg-surface p-6 shadow-sm">
      <Text className="mb-2 font-serif text-xl font-semibold text-text">Controleer je e-mail</Text>
      <Text className="mb-5 text-sm text-text-subtle">
        We hebben een inlogcode gestuurd naar{' '}
        <Text className="font-semibold text-text">{props.email}</Text>. Klik op de link in de
        e-mail, of voer hieronder de 6-cijferige code in.
      </Text>

      <Text className="mb-1 text-sm font-medium text-text">Code</Text>
      <TextInput
        value={props.code}
        onChangeText={(v) => props.onChangeCode(v.replace(/[^0-9]/g, '').slice(0, 6))}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
        keyboardType="number-pad"
        editable={!props.loading}
        placeholder="000000"
        placeholderTextColor="#888780"
        maxLength={6}
        className="mb-4 rounded-lg border border-border bg-background px-3 py-3 text-center font-serif text-xl tracking-widest text-text"
      />

      {props.error ? <Text className="mb-3 text-sm text-crisis">{props.error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={props.onSubmit}
        disabled={!canSubmit}
        className="rounded-lg bg-primary px-4 py-3 active:bg-primary-dark disabled:opacity-60"
      >
        {props.loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text className="text-center text-base font-semibold text-white">Verifieer</Text>
        )}
      </Pressable>

      <View className="mt-4 flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={props.onChangeEmail}
          disabled={props.loading}
        >
          <Text className="text-sm text-text-muted">← Ander e-mailadres</Text>
        </Pressable>
        <Pressable accessibilityRole="button" onPress={props.onResend} disabled={props.loading}>
          <Text className="text-sm text-primary">Stuur opnieuw</Text>
        </Pressable>
      </View>
    </View>
  );
}
