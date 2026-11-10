export const STORAGE_KEYS = {
  USER: 'sennex_user',
  USERS: 'sennex_users',
  MEDICATIONS: 'sennex_medications',
  NOTIFICATIONS: 'sennex_notifications',
  TAKEN_MEDS: 'sennex_taken_meds',
  NOTIFIED_TODAY: 'sennex_notified_today',
  MEDICAL_PREFERENCES: 'sennex_medical_preferences',
  FICHAS: 'sennex_fichas',
  VACCINES: 'sennex_vaccines',
  CONSULTATIONS: 'sennex_consultations',
  THEME: 'sennex_theme',
} as const;

export const RESET_EMAIL_SESSION_KEY = 'sennex_reset_email';

export const DEFAULT_ADMIN = {
  name: 'Administrador',
  email: 'admin@sennex.com',
  password: 'admin123',
} as const;
