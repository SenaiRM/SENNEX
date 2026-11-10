import type { Medication, TakenMed } from '../types';

export const DAY_KEYS = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'] as const;

export const DAY_LABELS: Record<string, string> = {
  dom: 'D',
  seg: 'S',
  ter: 'T',
  qua: 'Q',
  qui: 'Q',
  sex: 'S',
  sab: 'S',
};

export function getDayKey(date: Date = new Date()): string {
  return DAY_KEYS[date.getDay()];
}

export function isTimeReached(medTime: string, now: Date = new Date()): boolean {
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
  return currentTime >= medTime;
}

export function shouldShowToday(med: Pick<Medication, 'recurrence'>, dayKey: string = getDayKey()): boolean {
  return !med.recurrence || med.recurrence.length === 0 || med.recurrence.includes(dayKey);
}

export const INTERVAL_OPTIONS = [1, 2, 3, 4, 6, 8, 12] as const;

export interface Dose {
  med: Medication;
  doseTime: string;
}

function minutesToTime(minutes: number): string {
  return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}

export function getDoseTimes(med: Pick<Medication, 'time' | 'intervalHours'>): string[] {
  if (!med.intervalHours || !med.time) return [med.time];

  const [h, m] = med.time.split(':').map(Number);
  const start = h * 60 + m;
  const step = med.intervalHours * 60;
  const times: string[] = [];
  for (let offset = 0; offset < 24 * 60; offset += step) {
    times.push(minutesToTime((start + offset) % (24 * 60)));
  }
  return times.sort();
}

/** Chave usada para controlar notificações já enviadas de uma dose. */
export function getDoseKey(med: Pick<Medication, 'id' | 'intervalHours'>, doseTime: string): string {
  return med.intervalHours ? `${med.id}@${doseTime}` : med.id;
}

export function isDoseTaken(
  taken: Pick<TakenMed, 'medId' | 'doseTime'>[],
  med: Pick<Medication, 'id' | 'time'>,
  doseTime: string
): boolean {
  return taken.some((t) => t.medId === med.id && (t.doseTime ?? med.time) === doseTime);
}

/**
 * Doses cujo horário já chegou hoje. Para medicamentos com intervalo,
 * retorna apenas a dose mais recente (a atual), substituindo as anteriores.
 */
export function toLocalISODate(date: Date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** Último dia (YYYY-MM-DD) do tratamento, ou `undefined` para uso contínuo. */
export function getTreatmentEndDate(med: Pick<Medication, 'startDate' | 'treatmentDays'>): string | undefined {
  if (!med.treatmentDays || !med.startDate) return undefined;
  const end = new Date(med.startDate + 'T00:00:00');
  end.setDate(end.getDate() + med.treatmentDays - 1);
  return toLocalISODate(end);
}

/** Se a data está dentro do tratamento (entre o início e o término, quando há duração definida). */
export function isTreatmentActive(med: Pick<Medication, 'startDate' | 'treatmentDays'>, date: Date = new Date()): boolean {
  if (!med.treatmentDays) return true;
  const day = toLocalISODate(date);
  const end = getTreatmentEndDate(med);
  return (!med.startDate || day >= med.startDate) && (!end || day <= end);
}

/** Dias restantes de tratamento contando hoje; `undefined` para uso contínuo. */
export function getRemainingTreatmentDays(
  med: Pick<Medication, 'startDate' | 'treatmentDays'>,
  now: Date = new Date()
): number | undefined {
  const end = getTreatmentEndDate(med);
  if (!end) return undefined;
  const today = new Date(toLocalISODate(now) + 'T00:00:00');
  const diff = Math.round((new Date(end + 'T00:00:00').getTime() - today.getTime()) / 86400000) + 1;
  return Math.max(0, diff);
}

export function getDueDoses(meds: Medication[], dayKey: string = getDayKey(), now: Date = new Date()): Dose[] {
  const doses: Dose[] = [];
  meds.forEach((med) => {
    if (!shouldShowToday(med, dayKey) || !isTreatmentActive(med, now)) return;
    const reached = getDoseTimes(med).filter((t) => isTimeReached(t, now));
    if (reached.length > 0) doses.push({ med, doseTime: reached[reached.length - 1] });
  });
  return doses.sort((a, b) => a.doseTime.localeCompare(b.doseTime));
}

export function formatSchedule(med: Pick<Medication, 'time' | 'intervalHours'>): string {
  return med.intervalHours ? `A cada ${med.intervalHours}h (${getDoseTimes(med).join(', ')})` : med.time;
}
