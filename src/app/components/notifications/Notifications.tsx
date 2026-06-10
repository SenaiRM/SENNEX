import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Bell, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const Notifications: React.FC = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<any[]>([]);

  useEffect(() => {
    loadNotifications();
    checkOverdueMedications();
  }, [user]);

  const loadNotifications = () => {
    const storedNotifications = JSON.parse(
      localStorage.getItem('sennex_notifications') || '[]'
    );
    const userNotifications = storedNotifications.filter(
      (n: any) => n.userId === user?.id
    );
    setNotifications(userNotifications);
  };

  const checkOverdueMedications = () => {
    const medications = JSON.parse(localStorage.getItem('sennex_medications') || '[]');
    const userMeds = medications.filter((m: any) => m.userId === user?.id);
    const currentTime = new Date().toTimeString().slice(0, 5);

    userMeds.forEach((med: any) => {
      if (med.time < currentTime) {
        const existingNotif = notifications.find(
          (n) => n.medicationId === med.id && n.type === 'overdue'
        );

        if (!existingNotif) {
          addNotification({
            type: 'overdue',
            medicationId: med.id,
            message: `Medicamento em atraso: ${med.name}`,
            time: new Date().toLocaleString('pt-BR')
          });
        }
      }
    });
  };

  const addNotification = (notification: any) => {
    const allNotifications = JSON.parse(
      localStorage.getItem('sennex_notifications') || '[]'
    );
    const newNotification = {
      id: Date.now().toString(),
      userId: user?.id,
      ...notification
    };

    allNotifications.push(newNotification);
    localStorage.setItem('sennex_notifications', JSON.stringify(allNotifications));
    loadNotifications();
  };

  const markAsTaken = (notificationId: string) => {
    const allNotifications = JSON.parse(
      localStorage.getItem('sennex_notifications') || '[]'
    );
    const updatedNotifications = allNotifications.map((n: any) =>
      n.id === notificationId ? { ...n, type: 'taken' } : n
    );

    localStorage.setItem('sennex_notifications', JSON.stringify(updatedNotifications));
    loadNotifications();
    toast.success('Medicamento confirmado como tomado');
  };

  const clearNotifications = () => {
    const allNotifications = JSON.parse(
      localStorage.getItem('sennex_notifications') || '[]'
    );
    const updatedNotifications = allNotifications.filter(
      (n: any) => n.userId !== user?.id
    );

    localStorage.setItem('sennex_notifications', JSON.stringify(updatedNotifications));
    setNotifications([]);
    toast.success('Todas as notificações foram limpas');
  };

  return (
    <div className="p-8">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Notificações</h1>
            <p className="text-gray-600 mt-1">Acompanhe seus alertas de medicação</p>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" onClick={clearNotifications}>
              Limpar Tudo
            </Button>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card>
            <div className="text-center py-12">
              <Bell size={48} className="mx-auto text-gray-400 mb-4" />
              <p className="text-gray-500">Nenhuma notificação</p>
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
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-4">
                    <div
                      className={`p-3 rounded-lg ${
                        notification.type === 'overdue'
                          ? 'bg-red-100'
                          : notification.type === 'taken'
                          ? 'bg-green-100'
                          : 'bg-blue-100'
                      }`}
                    >
                      {notification.type === 'overdue' ? (
                        <AlertCircle
                          size={24}
                          className="text-red-600"
                        />
                      ) : notification.type === 'taken' ? (
                        <CheckCircle
                          size={24}
                          className="text-green-600"
                        />
                      ) : (
                        <Clock size={24} className="text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">
                        {notification.message}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">
                        {notification.time}
                      </p>
                    </div>
                  </div>

                  {notification.type === 'overdue' && (
                    <Button
                      size="sm"
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
