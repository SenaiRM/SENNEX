import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Pill, Clock, CheckCircle, AlertCircle, Bell, Settings } from 'lucide-react';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '../../lib/storage';
import { normalizePreferences, createNotification } from '../../lib/utils';
import { getDueDoses, isDoseTaken } from '../../lib/medications';
import { Medication, NotificationItem, MedicalPreferences, TakenMed } from '../../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [takenMeds, setTakenMeds] = useState<TakenMed[]>([]);
  const [preferences, setPreferences] = useState<MedicalPreferences | null>(null);

  const loadData = () => {
    const storedMeds: Medication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICATIONS) || '[]');
    const userMeds = storedMeds.filter((m) => m.userId === user?.id);
    setMedications(userMeds);

    const storedNotifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    const userNotifications = storedNotifications.filter((n) => n.userId === user?.id);
    setNotifications(userNotifications.reverse().slice(0, 5));

    const today = new Date().toISOString().split('T')[0];
    const storedTaken: TakenMed[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAKEN_MEDS) || '[]');
    const todayTaken = storedTaken.filter((t) => t.userId === user?.id && t.date === today);
    setTakenMeds(todayTaken);

    const storedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICAL_PREFERENCES) || '{}');
    const userPrefs = storedPrefs[user?.id || ''];
    setPreferences(userPrefs ? normalizePreferences(userPrefs) : null);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const todayDoses = getDueDoses(medications);

  const isMedTaken = (med: Medication, doseTime: string) => isDoseTaken(takenMeds, med, doseTime);

  const handleMarkAsTaken = (med: Medication, doseTime: string) => {
    const today = new Date().toISOString().split('T')[0];
    const storedTaken: TakenMed[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAKEN_MEDS) || '[]');

    const newTaken: TakenMed = {
      id: Date.now().toString(),
      userId: user?.id || '',
      medId: med.id,
      medName: med.name,
      date: today,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
      doseTime
    };

    storedTaken.push(newTaken);
    localStorage.setItem(STORAGE_KEYS.TAKEN_MEDS, JSON.stringify(storedTaken));

    const storedNotifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    storedNotifications.push(
      createNotification({
        userId: user?.id || '',
        type: 'taken',
        message: `${med.name} tomado às ${newTaken.time}`,
        date: today
      })
    );
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(storedNotifications));

    toast.success(`${med.name} marcado como tomado`);
    loadData();
  };

  const handleUnmarkAsTaken = (med: Medication, doseTime: string) => {
    const today = new Date().toISOString().split('T')[0];
    const storedTaken: TakenMed[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAKEN_MEDS) || '[]');
    const updatedTaken = storedTaken.filter(
      (t) =>
        !(t.userId === user?.id && t.date === today && isDoseTaken([t], med, doseTime))
    );
    localStorage.setItem(STORAGE_KEYS.TAKEN_MEDS, JSON.stringify(updatedTaken));

    toast.success(`${med.name} desmarcado`);
    loadData();
  };

  const foodRestrictions = preferences?.foodRestrictions || [];
  const medicalRestrictions = preferences?.medicalRestrictions || [];
  const allergies = preferences?.allergies || [];
  const hasPreferencesData = foodRestrictions.length > 0 || medicalRestrictions.length > 0 || allergies.length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">Aqui está um resumo da sua saúde hoje</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 dark:from-blue-950/40 dark:to-blue-900/30 dark:border-blue-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-600 dark:text-blue-400 text-sm font-medium mb-1">Total de Medicamentos</p>
              <p className="text-3xl font-bold text-blue-900 dark:text-blue-200">{medications.length}</p>
            </div>
            <div className="bg-blue-200 dark:bg-blue-900/50 p-3 rounded-lg">
              <Pill size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 dark:from-green-950/40 dark:to-green-900/30 dark:border-green-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-600 dark:text-green-400 text-sm font-medium mb-1">Tomados Hoje</p>
              <p className="text-3xl font-bold text-green-900 dark:text-green-200">{takenMeds.length}</p>
            </div>
            <div className="bg-green-200 dark:bg-green-900/50 p-3 rounded-lg">
              <CheckCircle size={24} className="text-green-600 dark:text-green-400" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 dark:from-orange-950/40 dark:to-orange-900/30 dark:border-orange-800">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-600 dark:text-orange-400 text-sm font-medium mb-1">Pendentes Agora</p>
              <p className="text-3xl font-bold text-orange-900 dark:text-orange-200">
                {todayDoses.filter(({ med, doseTime }) => !isMedTaken(med, doseTime)).length}
              </p>
            </div>
            <div className="bg-orange-200 dark:bg-orange-900/50 p-3 rounded-lg">
              <Clock size={24} className="text-orange-600 dark:text-orange-400" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <AlertCircle size={20} className="mr-2 text-orange-600 dark:text-orange-400" />
            Medicamentos para Tomar Agora
          </h2>

          {todayDoses.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nenhum medicamento no momento
            </p>
          ) : (
            <div className="space-y-3">
              {todayDoses.map(({ med, doseTime }) => {
                const taken = isMedTaken(med, doseTime);
                return (
                  <div
                    key={`${med.id}@${doseTime}`}
                    className={`flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 rounded-lg border-2 transition-all ${
                      taken
                        ? 'bg-green-50 border-green-200 dark:bg-green-950/30 dark:border-green-800'
                        : 'bg-orange-50 border-orange-200 dark:bg-orange-950/30 dark:border-orange-800'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1 min-w-0">
                      <div className={`p-2 rounded-lg shrink-0 ${taken ? 'bg-green-200 dark:bg-green-900/50' : 'bg-orange-200 dark:bg-orange-900/50'}`}>
                        <Pill size={20} className={taken ? 'text-green-600 dark:text-green-400' : 'text-orange-600 dark:text-orange-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`font-medium break-words ${taken ? 'text-green-900 dark:text-green-200' : 'text-gray-900 dark:text-gray-100'}`}>
                          {med.name}
                        </p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {med.dosage} - {med.type} - {doseTime}
                          {med.intervalHours ? ` (a cada ${med.intervalHours}h)` : ''}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={taken ? 'secondary' : 'primary'}
                      size="sm"
                      className="w-full sm:w-auto shrink-0"
                      onClick={() => taken ? handleUnmarkAsTaken(med, doseTime) : handleMarkAsTaken(med, doseTime)}
                    >
                      {taken ? (
                        <>
                          <CheckCircle size={16} className="mr-1" />
                          Tomado
                        </>
                      ) : (
                        'Confirmar'
                      )}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </Card>

        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Settings size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            Preferências Médicas
          </h2>

          {!hasPreferencesData ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nenhuma preferência cadastrada
            </p>
          ) : (
            <div className="space-y-4">
              {foodRestrictions.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Restrições Alimentares:</p>
                  <div className="space-y-1">
                    {foodRestrictions.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-blue-50 dark:bg-blue-950/30 px-3 py-2 rounded">
                        <AlertCircle size={14} className="mr-2 text-blue-600 dark:text-blue-400 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                    {foodRestrictions.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        +{foodRestrictions.length - 3} mais
                      </p>
                    )}
                  </div>
                </div>
              )}
              {medicalRestrictions.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Restrições Médicas:</p>
                  <div className="space-y-1">
                    {medicalRestrictions.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-red-50 dark:bg-red-950/30 px-3 py-2 rounded">
                        <AlertCircle size={14} className="mr-2 text-red-600 dark:text-red-400 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                    {medicalRestrictions.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        +{medicalRestrictions.length - 3} mais
                      </p>
                    )}
                  </div>
                </div>
              )}
              {allergies.length > 0 && (
                <div>
                  <p className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Alergias:</p>
                  <div className="space-y-1">
                    {allergies.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex items-center text-sm text-gray-700 dark:text-gray-300 bg-yellow-50 dark:bg-yellow-950/30 px-3 py-2 rounded">
                        <AlertCircle size={14} className="mr-2 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
                        {item}
                      </div>
                    ))}
                    {allergies.length > 3 && (
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        +{allergies.length - 3} mais
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4 flex items-center">
            <Bell size={20} className="mr-2 text-blue-600 dark:text-blue-400" />
            Notificações Recentes
          </h2>

          {notifications.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              Nenhuma notificação
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg"
                >
                  <AlertCircle
                    size={20}
                    className={`shrink-0 ${
                      notif.type === 'overdue' || notif.type === 'reminder'
                        ? 'text-orange-500 dark:text-orange-400'
                        : 'text-green-500 dark:text-green-400'
                    }`}
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-gray-900 dark:text-gray-100 break-words">{notif.message}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{notif.time}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};
