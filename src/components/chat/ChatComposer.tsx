import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import chat from '@/content/nl/chat.json';

const MAX_LENGTH = 2000;

export type ChatComposerHandle = {
  focus: () => void;
};

interface Props {
  disabled: boolean;
  onSend: (value: string) => void;
  /** Small print shown directly above the input row (e.g. disclaimer). */
  footerNote?: string;
}

/**
 * Bottom input bar: multi-line text input + send button. The parent owns
 * the disabled flag (mutation in flight, crisis mode active, etc.).
 */
export const ChatComposer = forwardRef<ChatComposerHandle, Props>(function ChatComposer(
  { disabled, onSend, footerNote },
  ref,
) {
  const inputRef = useRef<TextInput | null>(null);
  const [value, setValue] = useState('');

  useImperativeHandle(ref, () => ({
    focus: () => inputRef.current?.focus(),
  }));

  function handleSend() {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setValue('');
  }

  const canSend = !disabled && value.trim().length > 0;

  return (
    <View className="border-t border-border bg-surface">
      {footerNote ? (
        <Text className="px-4 pt-2 pb-1 text-xs text-text-muted">{footerNote}</Text>
      ) : null}
      <View className="flex-row items-end gap-2 px-4 pb-3">
        <TextInput
          ref={inputRef}
          className="max-h-32 min-h-[44px] flex-1 rounded-2xl border border-border bg-background px-4 py-2 text-base text-text"
          value={value}
          onChangeText={setValue}
          placeholder={chat.placeholder}
          placeholderTextColor="#888780"
          multiline
          maxLength={MAX_LENGTH}
          editable={!disabled}
          accessibilityLabel={chat.placeholder}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={chat.send}
          accessibilityState={{ disabled: !canSend }}
          disabled={!canSend}
          onPress={handleSend}
          className={`h-11 justify-center rounded-2xl px-4 ${canSend ? 'bg-primary active:bg-primary-dark' : 'bg-locked'}`}
        >
          <Text className="font-medium text-white">{chat.send}</Text>
        </Pressable>
      </View>
    </View>
  );
});
