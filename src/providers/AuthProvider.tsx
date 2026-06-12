import type { Session, User } from '@supabase/supabase-js';
import * as Linking from 'expo-linking';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState } from 'react-native';

import { createSessionFromUrl } from '@/lib/auth-callback';
import {
  clearSessionPolicyStorage,
  ensureSessionAnchor,
  setLastActiveAt,
  setSessionAnchor,
} from '@/lib/session-storage';
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
  const linkingUrl = Linking.useLinkingURL();
  const handledLinkUrl = useRef<string | null>(null);

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
        await ensureSessionAnchor();
        await setLastActiveAt(new Date().toISOString());
        supabase.auth.startAutoRefresh();
        return;
      }

      const {
        data: { session: validatedSession },
      } = await supabase.auth.getSession();

      if (mounted) {
        setSession(validatedSession ?? localSession);
        setLoading(false);
      }

      await ensureSessionAnchor();
      await setLastActiveAt(new Date().toISOString());
      supabase.auth.startAutoRefresh();
    }

    bootstrapSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, nextSession) => {
      if (event === 'SIGNED_IN' && nextSession) {
        const now = new Date().toISOString();
        await setSessionAnchor(now);
        await setLastActiveAt(now);
        supabase.auth.startAutoRefresh();
      }

      if (event === 'SIGNED_OUT') {
        await clearSessionPolicyStorage();
      }

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
    if (!linkingUrl || handledLinkUrl.current === linkingUrl) return;

    handledLinkUrl.current = linkingUrl;
    createSessionFromUrl(linkingUrl).catch(() => {
      // Allow retry if the user returns to the app with the same link.
      handledLinkUrl.current = null;
    });
  }, [linkingUrl]);

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        loading,
        signOut: async () => {
          await clearSessionPolicyStorage();
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
