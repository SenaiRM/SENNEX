import { useEffect } from 'react';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '../lib/storage';
import { getDayKey, getDueDoses, getDoseKey, isDoseTaken } from '../lib/medications';
import { createNotification } from '../lib/utils';
import { Medication, NotificationItem, TakenMed } from '../types';

const CHECK_INTERVAL_MS = 1000;

export function useMedicationReminders(userId: string | undefined) {
  useEffect(() => {
    if (!userId) return;

    if (typeof Notification !== 'undefined' && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    const checkDueMedications = () => {
      const today = new Date().toISOString().split('T')[0];
      const dayKey = getDayKey();

      const medications: Medication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICATIONS) || '[]');
      const userMeds = medications.filter((m) => m.userId === userId);
      if (userMeds.length === 0) return;

      const takenMeds: TakenMed[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAKEN_MEDS) || '[]');
      const todayTaken = takenMeds.filter((t) => t.userId === userId && t.date === today);

      const notifiedToday = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFIED_TODAY) || '{}');
      const todayNotified: string[] = notifiedToday[today] || [];

      const storedNotifications: NotificationItem[] = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]'
      );

      let didAdd = false;

      getDueDoses(userMeds, dayKey).forEach(({ med, doseTime }) => {
        const doseKey = getDoseKey(med, doseTime);
        const alreadyTaken = isDoseTaken(todayTaken, med, doseTime);
        const alreadyNotified = todayNotified.includes(doseKey);
        if (alreadyTaken || alreadyNotified) return;

        const message = med.intervalHours
          ? `Hora de tomar ${med.name} (${med.dosage}) - dose das ${doseTime}`
          : `Hora de tomar ${med.name} (${med.dosage})`;

        storedNotifications.push(
          createNotification({
            userId,
            type: 'reminder',
            message,
            date: today
          })
        );
        todayNotified.push(doseKey);
        didAdd = true;

        toast.info(message, { duration: 8000 });

        if (typeof Notification !== 'undefined' && Notification.permission === 'granted') {
          new Notification('SENNEX - Lembrete de Medicamento', { body: message });
        }
      });

      if (didAdd) {
        localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(storedNotifications));
        notifiedToday[today] = todayNotified;
        localStorage.setItem(STORAGE_KEYS.NOTIFIED_TODAY, JSON.stringify(notifiedToday));
      }
    };

    checkDueMedications();
    const interval = setInterval(checkDueMedications, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [userId]);
}
