import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Text, View } from 'react-native';

interface Props {
  children: ReactNode;
  /** Shown when the child tree throws during render. */
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
}

/** Catches render errors in a feature subtree so one card cannot blank the screen. */
export class FeatureErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(_error: Error, _info: ErrorInfo): void {
    // Intentionally silent — Expo dev overlay still surfaces the stack trace.
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        this.props.fallback ?? (
          <View className="mb-4 rounded-2xl bg-surface p-4 shadow-sm">
            <Text className="text-sm text-text-muted">Dit onderdeel kon niet worden geladen.</Text>
          </View>
        )
      );
    }

    return this.props.children;
  }
}
