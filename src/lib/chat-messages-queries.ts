import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { truncateChatMessage } from '@/lib/chat-message-limits';
import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export type PersistedChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  session_id: string;
};

export const ACTIVE_CHAT_SESSION_KEY = (userId: string | undefined) => [
  'chat_sessions',
  'active',
  userId,
];

const CHAT_MESSAGES_KEY = (userId: string | undefined, sessionId: string | undefined) => [
  'chat_messages',
  userId,
  sessionId,
];

const MAX_LOADED_MESSAGES = 200;

async function fetchLatestActiveSessionId(userId: string): Promise<string | null> {
  let result = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .is('ended_at', null)
    .order('started_at', { ascending: false })
    .limit(1);

  const missingStartedAt =
    result.error?.code === '42703' || result.error?.message?.includes('started_at');
  if (missingStartedAt) {
    result = await supabase
      .from('chat_sessions')
      .select('id')
      .eq('user_id', userId)
      .is('ended_at', null)
      .order('created_at', { ascending: false })
      .limit(1);
  }

  if (result.error) throw result.error;
  return result.data?.[0]?.id ?? null;
}

async function endChatSessions(userId: string, sessionIds: string[]): Promise<void> {
  const endedAt = new Date().toISOString();
  const { error } = await supabase
    .from('chat_sessions')
    .update({ ended_at: endedAt })
    .eq('user_id', userId)
    .in('id', sessionIds);

  if (!error) return;

  const { error: legacyError } = await supabase
    .from('chat_sessions')
    .update({ ended_at: endedAt, updated_at: endedAt })
    .eq('user_id', userId)
    .in('id', sessionIds);
  if (legacyError) throw legacyError;
}

async function listActiveSessionIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .is('ended_at', null);

  if (error) throw error;
  return (data ?? []).map((row) => row.id as string);
}

async function getOrCreateActiveSession(userId: string): Promise<string> {
  const activeId = await fetchLatestActiveSessionId(userId);
  if (activeId) return activeId;

  const { data: created, error: createError } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (createError) {
    if (createError.code === '23505') {
      const retryId = await fetchLatestActiveSessionId(userId);
      if (retryId) return retryId;
    }
    throw createError;
  }
  return created.id as string;
}

/** Client fallback when clear_current_chat_session RPC is not deployed yet. */
async function clearCurrentChatFallback(userId: string, activeSessionId: string): Promise<string> {
  const activeIds = await listActiveSessionIds(userId);
  const sessionIds = [...new Set([activeSessionId, ...activeIds])];

  if (sessionIds.length > 0) {
    const { error: deleteMessagesError } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId)
      .in('session_id', sessionIds);
    if (deleteMessagesError) throw deleteMessagesError;

    const { error: deleteSessionsError } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('user_id', userId)
      .in('id', sessionIds);

    if (deleteSessionsError) {
      await endChatSessions(userId, sessionIds);
    }
  }

  return getOrCreateActiveSession(userId);
}

async function clearCurrentChatSession(userId: string, activeSessionId: string): Promise<string> {
  const { data, error } = await supabase.rpc('clear_current_chat_session');
  if (!error && typeof data === 'string') {
    return data;
  }

  const missingRpc =
    error?.code === 'PGRST202' ||
    error?.message?.toLowerCase().includes('clear_current_chat_session') ||
    error?.message?.toLowerCase().includes('function') ||
    error?.code === '42883';

  if (missingRpc) {
    return clearCurrentChatFallback(userId, activeSessionId);
  }

  if (error) throw error;
  return clearCurrentChatFallback(userId, activeSessionId);
}

export function useActiveChatSession() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ACTIVE_CHAT_SESSION_KEY(user?.id),
    enabled: !!user,
    retry: 2,
    placeholderData: (previousData) => previousData,
    queryFn: async (): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      return getOrCreateActiveSession(user.id);
    },
  });
}

export function useChatMessages(sessionId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: CHAT_MESSAGES_KEY(user?.id, sessionId),
    enabled: !!user && !!sessionId,
    queryFn: async (): Promise<PersistedChatMessage[]> => {
      if (!user || !sessionId) return [];
      const { data, error } = await supabase
        .from('chat_messages')
        .select('id, role, content, created_at, session_id')
        .eq('user_id', user.id)
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true })
        .limit(MAX_LOADED_MESSAGES);
      if (error) throw error;
      return (data ?? []) as PersistedChatMessage[];
    },
  });
}

export function useInsertChatMessage(sessionId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (args: { role: 'user' | 'assistant'; content: string }) => {
      if (!user || !sessionId) throw new Error('Not authenticated');
      const content = truncateChatMessage(args.content);
      if (!content) return;
      const { error } = await supabase.from('chat_messages').insert({
        user_id: user.id,
        session_id: sessionId,
        role: args.role,
        content,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: CHAT_MESSAGES_KEY(user?.id, sessionId) });
    },
  });
}

function invalidateChatQueries(
  queryClient: ReturnType<typeof useQueryClient>,
  userId: string | undefined,
) {
  void queryClient.invalidateQueries({ queryKey: ACTIVE_CHAT_SESSION_KEY(userId) });
  void queryClient.invalidateQueries({ queryKey: ['chat_messages', userId] });
}

/** End the active session, delete its messages, and start a fresh session. */
export function useClearCurrentChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activeSessionId: string): Promise<string> => {
      if (!user) throw new Error('Not authenticated');
      return clearCurrentChatSession(user.id, activeSessionId);
    },
    onSuccess: async () => {
      invalidateChatQueries(queryClient, user?.id);
      await queryClient.refetchQueries({ queryKey: ACTIVE_CHAT_SESSION_KEY(user?.id) });
    },
  });
}
