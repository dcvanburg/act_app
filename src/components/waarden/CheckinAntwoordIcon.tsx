import { CheckboxIcon } from '@/components/icons/CheckboxIcon';
import { CrossIcon } from '@/components/icons/CrossIcon';
import { NeutralIcon } from '@/components/icons/NeutralIcon';
import type { WaardeCheckinAntwoord } from '@/types/waarden';

interface Props {
  antwoord?: WaardeCheckinAntwoord;
  size?: number;
}

export function CheckinAntwoordIcon({ antwoord, size = 14 }: Props) {
  if (antwoord === 'ja') return <CheckboxIcon size={size} color="#3B6D11" checked />;
  if (antwoord === 'neutraal') return <NeutralIcon size={size} color="#888780" />;
  if (antwoord === 'nee') return <CrossIcon size={size} color="#D85A30" />;
  return null;
}
