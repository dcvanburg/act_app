import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';

type UnsavedChangesGuard = {
  hasUnsavedChanges: boolean;
  allowLeaveRef: MutableRefObject<boolean>;
  confirmLeave: (onLeave: () => void) => void;
};

interface UnsavedChangesGuardContextValue {
  registerGuard: (guard: UnsavedChangesGuard | null) => void;
  handleTabPress: (event: { preventDefault: () => void }, navigate: () => void) => void;
}

const UnsavedChangesGuardContext = createContext<UnsavedChangesGuardContextValue | undefined>(
  undefined,
);

export function UnsavedChangesGuardProvider({ children }: { children: ReactNode }) {
  const guardRef = useRef<UnsavedChangesGuard | null>(null);

  const registerGuard = useCallback((guard: UnsavedChangesGuard | null) => {
    guardRef.current = guard;
  }, []);

  const handleTabPress = useCallback(
    (event: { preventDefault: () => void }, navigate: () => void) => {
      const guard = guardRef.current;
      if (!guard?.hasUnsavedChanges || guard.allowLeaveRef.current) return;

      event.preventDefault();
      guard.confirmLeave(() => {
        guard.allowLeaveRef.current = true;
        navigate();
      });
    },
    [],
  );

  return (
    <UnsavedChangesGuardContext.Provider value={{ registerGuard, handleTabPress }}>
      {children}
    </UnsavedChangesGuardContext.Provider>
  );
}

export function useUnsavedChangesGuard() {
  const context = useContext(UnsavedChangesGuardContext);
  if (!context) {
    throw new Error('useUnsavedChangesGuard must be used within UnsavedChangesGuardProvider');
  }
  return context;
}

export function useRegisterUnsavedChangesGuard(
  hasUnsavedChanges: boolean,
  confirmLeave: (onLeave: () => void) => void,
  allowLeaveRef: MutableRefObject<boolean>,
) {
  const { registerGuard } = useUnsavedChangesGuard();

  useEffect(() => {
    registerGuard({ hasUnsavedChanges, confirmLeave, allowLeaveRef });
    return () => registerGuard(null);
  }, [hasUnsavedChanges, confirmLeave, allowLeaveRef, registerGuard]);
}
