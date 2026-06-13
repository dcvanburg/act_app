import { describe, expect, it } from 'vitest';

import {
  buildCollectionPlanSetupItems,
  getCollectionPlanSetupGaps,
  needsCollectionPlanSetup,
} from '@/lib/waarden';
import type { WaardeActie, WaardeBarriere, WaardeTermijn } from '@/types/waarden';

const termijnLabels: Record<WaardeTermijn, string> = {
  kort: 'Korte termijn',
  middel: 'Middellange termijn',
  lang: 'Lange termijn',
};

const actie = (termijn: WaardeActie['termijn']): WaardeActie => ({
  id: `a-${termijn}`,
  waarde_id: null,
  termijn,
  actie: `Actie ${termijn}`,
  aangemaakt_op: '2026-06-01',
});

const barriere: WaardeBarriere = {
  id: 'b1',
  waarde_id: null,
  type: 'gedachte',
  omschrijving: 'Geen tijd',
  aangemaakt_op: '2026-06-01',
};

describe('needsCollectionPlanSetup', () => {
  it('returns true when any termijn or barriers are missing', () => {
    expect(needsCollectionPlanSetup([], [])).toBe(true);
    expect(needsCollectionPlanSetup([actie('kort')], [barriere])).toBe(true);
    expect(
      needsCollectionPlanSetup([actie('kort'), actie('middel'), actie('lang')], []),
    ).toBe(true);
  });

  it('returns false when all termijnen and at least one barrier exist', () => {
    expect(
      needsCollectionPlanSetup(
        [actie('kort'), actie('middel'), actie('lang')],
        [barriere],
      ),
    ).toBe(false);
  });
});

describe('getCollectionPlanSetupGaps', () => {
  it('lists missing termijnen and barriers separately', () => {
    expect(getCollectionPlanSetupGaps([actie('kort')], [])).toEqual({
      missingTermijnen: ['middel', 'lang'],
      missingBarriers: true,
    });
  });
});

describe('buildCollectionPlanSetupItems', () => {
  it('builds Dutch labels for each missing part', () => {
    const items = buildCollectionPlanSetupItems(
      { missingTermijnen: ['kort', 'lang'], missingBarriers: true },
      termijnLabels,
      {
        action: 'een actie voor {termijn}',
        barriers: 'minstens één barrière',
      },
    );
    expect(items).toEqual([
      'een actie voor korte termijn',
      'een actie voor lange termijn',
      'minstens één barrière',
    ]);
  });
});
