import type { AuthError } from '@supabase/supabase-js';
import { Redirect, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import auth from '@/content/nl/auth.json';
import common from '@/content/nl/common.json';
import { AppTextInput } from '@/components/AppTextInput';
import { getAuthRedirectUrl } from '@/lib/auth-redirect';
import { formatRateLimitMessage, mapSignInOtpError } from '@/lib/auth-login';
import { supabase, SUPABASE_CONFIGURED } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

// Compass / hexaflex mark — source SVG lives at assets/src/icon.svg.
// Regenerate the PNG via assets/src/EXPORT_INSTRUCTIONS.md.
const logo = require('../../assets/icon.png');

/**
 * Where Supabase redirects after verifying the magic link.
 *
 * `makeRedirectUri` resolves to the right scheme automatically:
 *   - Expo Go dev: `exp://<lan-ip>:8081/--/auth/callback`
 *   - Standalone / dev-client build: `actapp://auth/callback`
 *
 * Both must be in Supabase → Authentication → URL Configuration → Redirect URLs.
 * Allowlist with wildcards: `actapp://**` and `exp://**`.
 */
const REDIRECT_URL = getAuthRedirectUrl();

type Step = 'email' | 'sent';

/**
 * Login screen — magic-link only.
 *
 * The user enters their email; Supabase sends a clickable link.
 * Tapping the link triggers the `actapp://auth/callback` deep link,
 * which AuthProvider intercepts to set the session. This screen then
 * redirects to /home via the `if (session)` guard below.
 */
export default function LoginScreen() {
  const { session } = useAuth();
  const insets = useSafeAreaInsets();
  const { error: errorParam, reason: reasonParam } = useLocalSearchParams<{
    error?: string;
    reason?: string;
  }>();

  const [email, setEmail] = useState('');
  const [step, setStep] = useState<Step>('email');
  const [loading, setLoading] = useState(false);
  const [retryUntil, setRetryUntil] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(() => {
    if (reasonParam === 'session_expired') return auth.sessionExpired;
    if (errorParam === 'auth') return auth.errors.authFailed;
    return null;
  });

  const cooldownActive = retryUntil !== null && Date.now() < retryUntil;

  useEffect(() => {
    if (retryUntil === null) return;

    const tick = () => {
      const remainingMs = retryUntil - Date.now();
      if (remainingMs <= 0) {
        setRetryUntil(null);
        setError(null);
        return;
      }
      setError(formatRateLimitMessage(Math.ceil(remainingMs / 1000)));
    };

    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [retryUntil]);

  function applyOtpSendError(signInError: AuthError) {
    const mapped = mapSignInOtpError(signInError);
    if (mapped.kind === 'rate_limit') {
      setRetryUntil(Date.now() + mapped.retryAfterSeconds * 1000);
    }
    setError(mapped.message);
  }

  if (session) {
    return <Redirect href="/home" />;
  }

  async function handleSubmitEmail() {
    if (!email.trim()) return;

    if (!SUPABASE_CONFIGURED) {
      setError(auth.errors.notConfigured);
      return;
    }

    if (cooldownActive) return;

    setError(null);
    setRetryUntil(null);
    setLoading(true);

    const { error: signInError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: REDIRECT_URL },
    });

    setLoading(false);

    if (signInError) {
      // eslint-disable-next-line no-console
      console.error('[Login] signInWithOtp failed:', signInError.message, signInError.status);
      applyOtpSendError(signInError);
      return;
    }

    setStep('sent');
  }

  async function handleResend() {
    if (cooldownActive) return;

    setError(null);
    setRetryUntil(null);
    setLoading(true);

    const { error: resendError } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: REDIRECT_URL },
    });

    setLoading(false);

    if (resendError) {
      applyOtpSendError(resendError);
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

          {step === 'sent' ? (
            <SentConfirmation
              email={email}
              loading={loading}
              cooldownActive={cooldownActive}
              error={error}
              onResend={handleResend}
              onChangeEmail={() => {
                setStep('email');
                setError(null);
                setRetryUntil(null);
              }}
            />
          ) : (
            <EmailForm
              email={email}
              loading={loading}
              cooldownActive={cooldownActive}
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
  cooldownActive: boolean;
  error: string | null;
  onChangeEmail: (v: string) => void;
  onSubmit: () => void;
}) {
  return (
    <View className="rounded-2xl bg-surface p-6 shadow-sm">
      <Text className="mb-1 text-sm font-medium text-text">E-mailadres</Text>
      <AppTextInput
        value={props.email}
        onChangeText={props.onChangeEmail}
        autoComplete="email"
        autoCapitalize="none"
        keyboardType="email-address"
        editable={!props.loading}
        placeholder="jouw@email.nl"
        className="mb-4"
      />

      {props.error ? <Text className="mb-3 text-sm text-crisis">{props.error}</Text> : null}

      <Pressable
        accessibilityRole="button"
        onPress={props.onSubmit}
        disabled={props.loading || props.cooldownActive || props.email.trim().length === 0}
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

function SentConfirmation(props: {
  email: string;
  loading: boolean;
  cooldownActive: boolean;
  error: string | null;
  onResend: () => void;
  onChangeEmail: () => void;
}) {
  return (
    <View className="rounded-2xl bg-surface p-6 shadow-sm">
      <Text className="mb-2 font-serif text-xl font-semibold text-text">{auth.sent.title}</Text>
      <Text className="mb-3 text-sm text-text-subtle">
        {auth.sent.body.replace('{email}', props.email)}
      </Text>
      <Text className="mb-5 whitespace-pre-line text-sm text-text-subtle">{auth.sent.steps}</Text>

      {props.error ? <Text className="mb-5 text-sm text-crisis">{props.error}</Text> : null}

      <View className="flex-row items-center justify-between">
        <Pressable
          accessibilityRole="button"
          onPress={props.onChangeEmail}
          disabled={props.loading}
        >
          <Text className="text-sm text-text-muted">{auth.sent.changeEmail}</Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          onPress={props.onResend}
          disabled={props.loading || props.cooldownActive}
        >
          {props.loading ? (
            <ActivityIndicator color="#3B6D11" size="small" />
          ) : (
            <Text className="text-sm text-primary">{auth.sent.resend}</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}
