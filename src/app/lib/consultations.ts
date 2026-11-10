import { ConsultationRecord } from '../types';
import { toLocalISODate } from './medications';

/** Chave de ordenação "AAAA-MM-DDTHH:MM" — comparável como texto. */
export function consultationSortKey(c: Pick<ConsultationRecord, 'date' | 'time'>): string {
  return `${c.date}T${c.time}`;
}

/** Consultas mais recentes primeiro. */
export function sortConsultations(consultations: ConsultationRecord[]): ConsultationRecord[] {
  return [...consultations].sort((a, b) => consultationSortKey(b).localeCompare(consultationSortKey(a)));
}

/** Consulta com data e horário ainda por vir (agendada). */
export function isUpcomingConsultation(c: Pick<ConsultationRecord, 'date' | 'time'>, now = new Date()): boolean {
  return consultationSortKey(c) > `${toLocalISODate(now)}T${now.toTimeString().slice(0, 5)}`;
}
