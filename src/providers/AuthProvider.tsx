import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/lib/supabase/client';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

/** True when Supabase rejected the stored session (expired/revoked), not transient network. */
function isInvalidSessionError(error: { message?: string; status?: number | undefined }): boolean {
  const message = error.message?.toLowerCase() ?? '';
  return (
    error.status === 401 ||
    error.status === 403 ||
    message.includes('invalid') ||
    message.includes('expired') ||
    message.includes('session') ||
    message.includes('jwt') ||
    message.includes('refresh token')
  );
}

/**
 * AuthProvider — owns the session lifecycle for the entire app.
 *
 * Cold start validates the stored session with `getUser()` so expired magic-link
 * sessions do not skip login and land on profile setup.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function bootstrapSession() {
      const {
        data: { session: localSession },
      } = await supabase.auth.getSession();

      if (!localSession) {
        if (mounted) {
          setSession(null);
          setLoading(false);
        }
        return;
      }

      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();

      if (error || !user) {
        if (!error || isInvalidSessionError(error)) {
          await supabase.auth.signOut();
          if (mounted) {
            setSession(null);
            setLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(localSession);
          setLoading(false);
        }
        return;
      }

      const {
        data: { session: validatedSession },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(validatedSession ?? localSession);
        setLoading(false);
      }
    }

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    function handleAppStateChange(state: string) {
      if (state === 'active') {
        supabase.auth.startAutoRefresh();
      } else {
        supabase.auth.stopAutoRefresh();
      }
    }
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    async function handleDeepLink(url: string | null) {
      if (!url) return;

      // PKCE flow (Supabase v2 default): actapp://auth/callback?code=xxxx
      const { queryParams } = Linking.parse(url);
      if (queryParams?.code && typeof queryParams.code === 'string') {
        await supabase.auth.exchangeCodeForSession(url);
        return;
      }

      // Implicit flow fallback: actapp://auth/callback#access_token=...&refresh_token=...
      const fragment = url.includes('#') ? url.slice(url.indexOf('#') + 1) : '';
      if (!fragment) return;
      const params = new URLSearchParams(fragment);
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      if (access_token && refresh_token) {
        await supabase.auth.setSession({ access_token, refresh_token });
      }
    }

    Linking.getInitialURL().then(handleDeepLink);
    const subscription = Linking.addEventListener('url', ({ url }) => handleDeepLink(url));
    return () => subscription.remove();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut: async () => {
          await supabase.auth.signOut();
        },
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
