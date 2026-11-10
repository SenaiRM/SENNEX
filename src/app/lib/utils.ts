import { MedicalPreferences, NotificationItem } from '../types';

export function normalizeToArray<T>(value: T | T[] | null | undefined): T[] {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

export function normalizePreferences(prefs: Partial<MedicalPreferences> | undefined): MedicalPreferences {
  return {
    foodRestrictions: normalizeToArray(prefs?.foodRestrictions),
    medicalRestrictions: normalizeToArray(prefs?.medicalRestrictions),
    allergies: normalizeToArray(prefs?.allergies),
  };
}

export function createNotification(params: Omit<NotificationItem, 'id' | 'time'>): NotificationItem {
  return {
    id: Date.now().toString(),
    time: new Date().toLocaleString('pt-BR'),
    ...params,
  };
}
