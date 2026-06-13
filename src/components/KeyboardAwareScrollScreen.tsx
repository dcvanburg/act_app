import {
  createContext,
  useCallback,
  useContext,
  useRef,
  type ReactNode,
  type RefObject,
} from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  type ScrollViewProps,
  type TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

const KEYBOARD_GAP = 24;
const SCROLL_INTO_VIEW_DELAY_MS = Platform.OS === 'ios' ? 80 : 200;

type KeyboardAwareScrollContextValue = {
  scrollInputIntoView: (inputRef: RefObject<TextInput | null>) => void;
};

const KeyboardAwareScrollContext = createContext<KeyboardAwareScrollContextValue | null>(null);

export function useKeyboardAwareScroll(): KeyboardAwareScrollContextValue | null {
  return useContext(KeyboardAwareScrollContext);
}

type KeyboardAwareScrollScreenProps = {
  children: ReactNode;
  className?: string;
  contentContainerStyle?: ScrollViewProps['contentContainerStyle'];
} & Omit<ScrollViewProps, 'children' | 'contentContainerStyle'>;

/**
 * Scroll screen that keeps focused text inputs visible when the keyboard opens.
 */
export function KeyboardAwareScrollScreen({
  children,
  className = 'flex-1 bg-background',
  contentContainerStyle,
  ...scrollProps
}: KeyboardAwareScrollScreenProps) {
  const insets = useSafeAreaInsets();
  const scrollRef = useRef<ScrollView>(null);
  const scrollYRef = useRef(0);

  const scrollInputIntoView = useCallback((inputRef: RefObject<TextInput | null>) => {
    const input = inputRef.current;
    const scroll = scrollRef.current;
    if (!input || !scroll) return;

    const scrollByOverlap = (keyboardTop: number) => {
      input.measureInWindow((_x, y, _width, height) => {
        const inputBottom = y + height;
        const overlap = inputBottom + KEYBOARD_GAP - keyboardTop;
        if (overlap > 0) {
          scroll.scrollTo({
            y: Math.max(0, scrollYRef.current + overlap),
            animated: true,
          });
        }
      });
    };

    const run = () => {
      const metrics = Keyboard.metrics();
      if (metrics?.height) {
        scrollByOverlap(metrics.screenY);
        return;
      }

      const eventName = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
      const subscription = Keyboard.addListener(eventName, (event) => {
        subscription.remove();
        scrollByOverlap(event.endCoordinates.screenY);
      });
    };

    setTimeout(run, SCROLL_INTO_VIEW_DELAY_MS);
  }, []);

  return (
    <KeyboardAwareScrollContext.Provider value={{ scrollInputIntoView }}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={className}
        keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 0}
        style={{ flex: 1 }}
      >
        <ScrollView
          ref={scrollRef}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          automaticallyAdjustKeyboardInsets
          onScroll={(event) => {
            scrollYRef.current = event.nativeEvent.contentOffset.y;
            scrollProps.onScroll?.(event);
          }}
          scrollEventThrottle={scrollProps.scrollEventThrottle ?? 16}
          contentContainerStyle={contentContainerStyle}
          {...scrollProps}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </KeyboardAwareScrollContext.Provider>
  );
}
