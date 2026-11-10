export interface UserRecord {
  id: string;
  name: string;
  email: string;
  password: string;
  profile: string;
  active: boolean;
}

export interface Ficha {
  userId: string;
  name: string;
  surname: string;
  email: string;
}

export interface Medication {
  id: string;
  userId: string;
  name: string;
  dosage: string;
  type: string;
  time: string;
  recurrence: string[];
  startDate?: string;
  /** Se definido, o medicamento é tomado de X em X horas a partir de `time`. */
  intervalHours?: number;
  /** Duração do tratamento em dias, contada a partir de `startDate`. Vazio = uso contínuo. */
  treatmentDays?: number;
}

export interface NotificationItem {
  id: string;
  userId: string;
  type: string;
  message: string;
  time: string;
  date?: string;
  medicationId?: string;
  doseTime?: string;
}

export interface MedicalPreferences {
  foodRestrictions: string[];
  medicalRestrictions: string[];
  allergies: string[];
}

export interface TakenMed {
  id: string;
  userId: string;
  medId: string;
  medName: string;
  date: string;
  time: string;
  doseTime?: string;
}

export interface VaccineRecord {
  id: string;
  userId: string;
  /** Nome da vacina (ex.: Influenza, Hepatite B). */
  vaccine: string;
  /** Nome comercial e/ou fabricante (ex.: Vaxigrip / Sanofi). */
  manufacturer?: string;
  dose: string;
  /** Data de aplicação no formato ISO (AAAA-MM-DD). */
  applicationDate: string;
  lot?: string;
  /** Validade do lote no formato ISO (AAAA-MM-DD). */
  lotExpiry?: string;
  /** Posto de saúde ou clínica onde a vacina foi aplicada. */
  place?: string;
  city?: string;
  state?: string;
  adverseReaction?: string;
}

export interface ConsultationRecord {
  id: string;
  userId: string;
  /** Data da consulta no formato ISO (AAAA-MM-DD). */
  date: string;
  /** Horário da consulta no formato HH:MM. */
  time: string;
  doctor: string;
  /** Especialidade do médico (ex.: Cardiologia, Clínico Geral). */
  specialty: string;
}
