export type WaardeTermijn = 'kort' | 'middel' | 'lang';

export type BarriereType = 'vermijding' | 'gedachte' | 'zelfkritiek' | 'eigen';

export interface Waarde {
  id: string;
  naam: string;
  beschrijving: string;
  kleur: string;
}

export interface WaardeActieBeoordeling {
  behaald: boolean;
  beschrijving: string;
  beoordeeld_op: string;
}

export interface WaardeActie {
  id: string;
  waarde_id: string;
  termijn: WaardeTermijn;
  actie: string;
  /** ISO date when the action was created — used to compute the termijn deadline. */
  aangemaakt_op: string;
  beoordeling?: WaardeActieBeoordeling;
}

export interface WaardeBarriere {
  id: string;
  waarde_id: string;
  type: BarriereType;
  /** User-defined label when type is `eigen`. */
  eigenLabel?: string;
  omschrijving: string;
  /** ISO date when the barrier was created — same-day edit only. */
  aangemaakt_op: string;
}

export type WaardeCheckinAntwoord = 'ja' | 'neutraal' | 'nee';

export interface WaardeCheckin {
  id: string;
  waarde_id: string;
  datum: string;
  antwoord: WaardeCheckinAntwoord;
  notitie: string;
}

export interface WaardenData {
  waarden: Waarde[];
  acties: WaardeActie[];
  barriers: WaardeBarriere[];
  checkins: WaardeCheckin[];
}

export const WAARDEN_KLEUREN = [
  '#e8855a',
  '#5a9be8',
  '#6ec97a',
  '#d07bd0',
  '#e8c95a',
  '#7b6ee8',
  '#5ac8c8',
  '#e85a5a',
  '#5ae8a0',
  '#9be85a',
] as const;
