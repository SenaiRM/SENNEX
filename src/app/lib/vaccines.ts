import { VaccineRecord } from '../types';

/** Lote com validade anterior à data de aplicação: a dose pode não ser válida. */
export function isLotExpiredAtApplication(v: Pick<VaccineRecord, 'lotExpiry' | 'applicationDate'>): boolean {
  return !!v.lotExpiry && v.lotExpiry < v.applicationDate;
}

/** Local de aplicação no formato "Posto – Cidade/UF", omitindo as partes vazias. */
export function formatVaccineLocation(v: Pick<VaccineRecord, 'place' | 'city' | 'state'>): string {
  const cityState = [v.city, v.state].filter(Boolean).join('/');
  return [v.place, cityState].filter(Boolean).join(' – ');
}
