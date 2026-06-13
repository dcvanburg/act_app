import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { supabase } from '@/lib/supabase/client';
import { useAuth } from '@/providers/AuthProvider';

export type PersistedChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  session_id: string;
};

const ACTIVE_SESSION_KEY = (userId: string | undefined) => ['chat_sessions', 'active', userId];
const CHAT_MESSAGES_KEY = (userId: string | undefined, sessionId: string | undefined) => [
  'chat_messages',
  userId,
  sessionId,
];

const MAX_LOADED_MESSAGES = 200;

async function getOrCreateActiveSession(userId: string): Promise<string> {
  const { data: active, error: activeError } = await supabase
    .from('chat_sessions')
    .select('id')
    .eq('user_id', userId)
    .is('ended_at', null)
    .maybeSingle();

  if (activeError) throw activeError;
  if (active?.id) return active.id as string;

  const { data: created, error: createError } = await supabase
    .from('chat_sessions')
    .insert({ user_id: userId })
    .select('id')
    .single();

  if (createError) throw createError;
  return created.id as string;
}

export function useActiveChatSession() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ACTIVE_SESSION_KEY(user?.id),
    enabled: !!user,
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
      const content = args.content.trim();
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
  void queryClient.invalidateQueries({ queryKey: ACTIVE_SESSION_KEY(userId) });
  void queryClient.invalidateQueries({ queryKey: ['chat_messages', userId] });
}

/** End the active session, delete its messages, and start a fresh session. */
export function useClearCurrentChat() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (activeSessionId: string) => {
      if (!user) throw new Error('Not authenticated');

      const { error: deleteError } = await supabase
        .from('chat_messages')
        .delete()
        .eq('user_id', user.id)
        .eq('session_id', activeSessionId);
      if (deleteError) throw deleteError;

      const { error: endError } = await supabase
        .from('chat_sessions')
        .update({ ended_at: new Date().toISOString(), updated_at: new Date().toISOString() })
        .eq('id', activeSessionId)
        .eq('user_id', user.id);
      if (endError) throw endError;

      const { error: createError } = await supabase
        .from('chat_sessions')
        .insert({ user_id: user.id });
      if (createError) throw createError;
    },
    onSuccess: () => {
      invalidateChatQueries(queryClient, user?.id);
    },
  });
}
