import { Redirect } from 'expo-router';

/** Legacy path — onboarding lives in the modules stack. */
export default function OnboardingRedirect() {
  return <Redirect href="/modules/onboarding" />;
}
