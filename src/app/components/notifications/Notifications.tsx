import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bell, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS } from '../../lib/storage';
import { createNotification } from '../../lib/utils';
import { getDueDoses } from '../../lib/medications';
import { Medication, NotificationItem } from '../../types';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    checkOverdueMedications();
    loadNotifications();
    const interval = setInterval(loadNotifications, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const loadNotifications = () => {
    const storedNotifications: NotificationItem[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]'
    );
    const userNotifications = storedNotifications.filter((n) => n.userId === user?.id);
    setNotifications(userNotifications);
  };

  const checkOverdueMedications = () => {
    const medications: Medication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICATIONS) || '[]');
    const userMeds = medications.filter((m) => m.userId === user?.id);
    const overdueDoses = getDueDoses(userMeds);
    const today = new Date().toISOString().split('T')[0];

    const allNotifications: NotificationItem[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]'
    );

    let didAdd = false;
    overdueDoses.forEach(({ med, doseTime }) => {
      const existingNotif = allNotifications.find(
        (n) =>
          n.medicationId === med.id &&
          n.type === 'overdue' &&
          (!med.intervalHours || (n.doseTime === doseTime && n.date === today))
      );

      if (!existingNotif) {
        allNotifications.push(
          createNotification({
            userId: user?.id || '',
            type: 'overdue',
            medicationId: med.id,
            ...(med.intervalHours
              ? { doseTime, date: today, message: `Medicamento em atraso: ${med.name} (dose das ${doseTime})` }
              : { message: `Medicamento em atraso: ${med.name}` })
          })
        );
        didAdd = true;
      }
    });

    if (didAdd) {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(allNotifications));
    }
  };

  const markAsTaken = (notificationId: string) => {
    const allNotifications: NotificationItem[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]'
    );
    const updatedNotifications = allNotifications.map((n) =>
      n.id === notificationId ? { ...n, type: 'taken' } : n
    );

    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
    loadNotifications();
    toast.success('Medicamento confirmado como tomado');
  };

  const clearNotifications = () => {
    const allNotifications: NotificationItem[] = JSON.parse(
      localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]'
    );
    const updatedNotifications = allNotifications.filter((n) => n.userId !== user?.id);

    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(updatedNotifications));
    setNotifications([]);
    toast.success('Todas as notificações foram limpas');
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Notificações</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">Acompanhe seus alertas de medicação</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" className="self-start sm:self-auto -ml-4 sm:ml-0" onClick={clearNotifications}>
              Limpar Tudo
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-500 dark:text-gray-400">Nenhuma notificação</p>
            </div>
          </Card>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={
                  notification.type === 'overdue'
                    ? 'border-l-4 border-red-500'
                    : notification.type === 'taken'
                    ? 'border-l-4 border-green-500'
                    : 'border-l-4 border-blue-500'
                }
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div className="flex items-start space-x-3 sm:space-x-4 min-w-0">
                    <div
                      className={`p-3 rounded-lg ${
                        notification.type === 'overdue'
                          ? 'bg-red-100 dark:bg-red-900/40'
                          : notification.type === 'taken'
                          ? 'bg-green-100 dark:bg-green-900/40'
                          : 'bg-blue-100 dark:bg-blue-900/40'
                      }`}
                    >
                      {notification.type === 'overdue' ? (
                        <AlertCircle
                          size={24}
                          className="text-red-600 dark:text-red-400"
                        />
                      ) : notification.type === 'taken' ? (
                        <CheckCircle
                          size={24}
                          className="text-green-600 dark:text-green-400"
                        />
                      ) : (
                        <Clock size={24} className="text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100 break-words">
                        {notification.message}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>

                  {notification.type === 'overdue' && (
                    <Button
                      size="sm"
                      className="w-full sm:w-auto shrink-0"
                      onClick={() => markAsTaken(notification.id)}
                    >
                      Marcar como Tomado
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
