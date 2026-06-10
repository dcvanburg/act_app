import {
  Platform,
  TextInput,
  View,
  type TextInputProps,
  type StyleProp,
  type TextStyle,
  type ViewStyle,
} from 'react-native';

type AppTextInputProps = TextInputProps & {
  className?: string;
  invalid?: boolean;
  /** Smaller single-line fields (e.g. inline add rows). */
  compact?: boolean;
};

const FONT_SIZE = { normal: 16, compact: 14 } as const;
const BOX_HEIGHT = { normal: 52, compact: 44 } as const;

/**
 * Text field with a wrapper View for the box chrome and an inner TextInput for text.
 *
 * Applying border/minHeight/NativeWind typography directly on TextInput clips descenders
 * (g, j, p, y). The wrapper owns the box; the input only renders glyphs.
 */
export function AppTextInput({
  className,
  invalid = false,
  compact = false,
  multiline,
  style,
  placeholderTextColor = '#888780',
  ...props
}: AppTextInputProps) {
  const fontSize = compact ? FONT_SIZE.compact : FONT_SIZE.normal;
  const boxClass = [
    'rounded-lg border border-border bg-background px-3',
    invalid ? 'border-crisis' : '',
    className ?? '',
  ]
    .filter(Boolean)
    .join(' ');

  if (multiline) {
    const boxStyle = extractBoxStyle(style);

    return (
      <View className={boxClass} style={[multilineBoxStyle, boxStyle]}>
        <TextInput
          {...props}
          multiline
          placeholderTextColor={placeholderTextColor}
          textAlignVertical="top"
          className="flex-1 bg-transparent p-0 text-text"
          style={multilineInputStyle(fontSize)}
        />
      </View>
    );
  }

  return (
    <View
      className={boxClass}
      style={{ minHeight: compact ? BOX_HEIGHT.compact : BOX_HEIGHT.normal, justifyContent: 'center' }}
    >
      <TextInput
        {...props}
        placeholderTextColor={placeholderTextColor}
        textAlignVertical="center"
        className="bg-transparent p-0 text-text"
        style={[
          singleInputStyle(fontSize),
          Platform.OS === 'android' ? { includeFontPadding: true } : null,
        ]}
      />
    </View>
  );
}

function singleInputStyle(fontSize: number): TextStyle {
  return {
    fontSize,
    lineHeight: Math.round(fontSize * 1.375),
    paddingVertical: 0,
    margin: 0,
    width: '100%',
  };
}

function multilineInputStyle(fontSize: number): TextStyle {
  const lineHeight = Math.round(fontSize * 1.5);
  return {
    fontSize,
    lineHeight,
    paddingVertical: 0,
    margin: 0,
    width: '100%',
    minHeight: 72,
  };
}

const multilineBoxStyle: ViewStyle = {
  minHeight: 96,
  paddingTop: 12,
  paddingBottom: 14,
};

function extractBoxStyle(style: StyleProp<TextStyle>): ViewStyle | undefined {
  if (!style) return undefined;
  const flat = (Array.isArray(style) ? Object.assign({}, ...style) : style) as TextStyle;
  const { minHeight, height, flex } = flat;
  if (minHeight === undefined && height === undefined && flex === undefined) return undefined;
  return { minHeight, height, flex };
}
