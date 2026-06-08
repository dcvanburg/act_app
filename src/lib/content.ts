import type { ModuleContent, ModuleId } from '@/types/content';

import onboarding from '@/content/nl/modules/0-onboarding.json';
import recognition from '@/content/nl/modules/1-recognition.json';
import acceptance from '@/content/nl/modules/2-acceptance.json';
import defusion from '@/content/nl/modules/3-defusion.json';
import presence from '@/content/nl/modules/4-presence.json';
import selfAsContext from '@/content/nl/modules/5-self-as-context.json';
import values from '@/content/nl/modules/6-values.json';
import committedAction from '@/content/nl/modules/7-committed-action.json';

const MODULE_MAP: Record<ModuleId, unknown> = {
  onboarding,
  recognition,
  acceptance,
  defusion,
  presence,
  'self-as-context': selfAsContext,
  values,
  'committed-action': committedAction,
};

export function getModuleContent(moduleId: ModuleId): ModuleContent {
  return MODULE_MAP[moduleId] as ModuleContent;
}

export const MODULE_META: Record<ModuleId, { title: string; phase: string }> = {
  onboarding:         { title: 'Welkom & Intake',    phase: 'Start' },
  recognition:        { title: 'Herkennen',           phase: 'Fundament' },
  acceptance:         { title: 'Acceptatie',          phase: 'Fundament' },
  defusion:           { title: 'Defusie',             phase: 'Kern' },
  presence:           { title: 'Aanwezig zijn',       phase: 'Kern' },
  'self-as-context':  { title: 'Zelf-als-context',    phase: 'Kern' },
  values:             { title: 'Waarden',             phase: 'Kern' },
  'committed-action': { title: 'Toegewijd handelen',  phase: 'Leven' },
};
