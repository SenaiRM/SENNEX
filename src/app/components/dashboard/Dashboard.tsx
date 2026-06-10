import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Pill, Clock, CheckCircle, AlertCircle, Bell, Settings } from 'lucide-react';
import { toast } from 'sonner';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [takenMeds, setTakenMeds] = useState<any[]>([]);
  const [preferences, setPreferences] = useState<any>(null);

  const loadData = () => {
    const storedMeds = JSON.parse(localStorage.getItem('sennex_medications') || '[]');
    const userMeds = storedMeds.filter((m: any) => m.userId === user?.id);
    setMedications(userMeds);

    const storedNotifications = JSON.parse(localStorage.getItem('sennex_notifications') || '[]');
    const userNotifications = storedNotifications.filter((n: any) => n.userId === user?.id);
    setNotifications(userNotifications.reverse().slice(0, 5));

    const today = new Date().toISOString().split('T')[0];
    const storedTaken = JSON.parse(localStorage.getItem('sennex_taken_meds') || '[]');
    const todayTaken = storedTaken.filter(
      (t: any) => t.userId === user?.id && t.date === today
    );
    setTakenMeds(todayTaken);

    const storedPrefs = JSON.parse(localStorage.getItem('sennex_medical_preferences') || '{}');
    const userPrefs = storedPrefs[user?.id || ''];
    setPreferences(userPrefs);

    checkAndCreateNotifications(userMeds, todayTaken);
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  const getDayKey = () => {
    const days = ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'];
    return days[new Date().getDay()];
  };

  const isTimeReached = (medTime: string) => {
    const now = new Date();
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return currentTime >= medTime;
  };

  const checkAndCreateNotifications = (userMeds: any[], todayTaken: any[]) => {
    const today = new Date().toISOString().split('T')[0];
    const dayKey = getDayKey();
    const storedNotifications = JSON.parse(localStorage.getItem('sennex_notifications') || '[]');
    const notifiedToday = JSON.parse(localStorage.getItem('sennex_notified_today') || '{}');
    const todayNotified = notifiedToday[today] || [];

    userMeds.forEach((med) => {
      const shouldShowToday = !med.recurrence || med.recurrence.length === 0 || med.recurrence.includes(dayKey);

      if (shouldShowToday && isTimeReached(med.time)) {
        const alreadyTaken = todayTaken.some((t) => t.medId === med.id);
        const alreadyNotified = todayNotified.includes(med.id);

        if (!alreadyTaken && !alreadyNotified) {
          storedNotifications.push({
            id: Date.now().toString() + Math.random(),
            userId: user?.id,
            type: 'reminder',
            message: `Lembrete: Tomar ${med.name} (${med.dosage})`,
            time: new Date().toLocaleString('pt-BR'),
            date: today
          });

          todayNotified.push(med.id);
        }
      }
    });

    localStorage.setItem('sennex_notifications', JSON.stringify(storedNotifications));
    notifiedToday[today] = todayNotified;
    localStorage.setItem('sennex_notified_today', JSON.stringify(notifiedToday));
  };

  const todayMedications = medications
    .filter((med) => {
      const shouldShowToday = !med.recurrence || med.recurrence.length === 0 || med.recurrence.includes(getDayKey());
      return shouldShowToday && isTimeReached(med.time);
    })
    .sort((a, b) => a.time.localeCompare(b.time));

  const isMedTaken = (medId: string) => {
    return takenMeds.some((t) => t.medId === medId);
  };

  const handleMarkAsTaken = (med: any) => {
    const today = new Date().toISOString().split('T')[0];
    const storedTaken = JSON.parse(localStorage.getItem('sennex_taken_meds') || '[]');

    const newTaken = {
      id: Date.now().toString(),
      userId: user?.id,
      medId: med.id,
      medName: med.name,
      date: today,
      time: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
    };

    storedTaken.push(newTaken);
    localStorage.setItem('sennex_taken_meds', JSON.stringify(storedTaken));

    const storedNotifications = JSON.parse(localStorage.getItem('sennex_notifications') || '[]');
    storedNotifications.push({
      id: Date.now().toString(),
      userId: user?.id,
      type: 'taken',
      message: `${med.name} tomado às ${newTaken.time}`,
      time: new Date().toLocaleString('pt-BR'),
      date: today
    });
    localStorage.setItem('sennex_notifications', JSON.stringify(storedNotifications));

    toast.success(`${med.name} marcado como tomado`);
    loadData();
  };

  const handleUnmarkAsTaken = (med: any) => {
    const today = new Date().toISOString().split('T')[0];
    const storedTaken = JSON.parse(localStorage.getItem('sennex_taken_meds') || '[]');
    const updatedTaken = storedTaken.filter(
      (t: any) => !(t.userId === user?.id && t.medId === med.id && t.date === today)
    );
    localStorage.setItem('sennex_taken_meds', JSON.stringify(updatedTaken));

    toast.success(`${med.name} desmarcado`);
    loadData();
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          {getGreeting()}, {user?.name?.split(' ')[0]}!
        </h1>
        <p className="text-gray-600 mt-2">Aqui está um resumo da sua saúde hoje</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-blue-600 text-sm font-medium mb-1">Total de Medicamentos</p>
              <p className="text-3xl font-bold text-blue-900">{medications.length}</p>
            </div>
            <div className="bg-blue-200 p-3 rounded-lg">
              <Pill size={24} className="text-blue-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-green-600 text-sm font-medium mb-1">Tomados Hoje</p>
              <p className="text-3xl font-bold text-green-900">{takenMeds.length}</p>
            </div>
            <div className="bg-green-200 p-3 rounded-lg">
              <CheckCircle size={24} className="text-green-600" />
            </div>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-orange-600 text-sm font-medium mb-1">Pendentes Agora</p>
              <p className="text-3xl font-bold text-orange-900">
                {todayMedications.filter((med) => !isMedTaken(med.id)).length}
              </p>
            </div>
            <div className="bg-orange-200 p-3 rounded-lg">
              <Clock size={24} className="text-orange-600" />
            </div>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <AlertCircle size={20} className="mr-2 text-orange-600" />
            Medicamentos para Tomar Agora
          </h2>

          {todayMedications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhum medicamento no momento
            </p>
          ) : (
            <div className="space-y-3">
              {todayMedications.map((med) => {
                const taken = isMedTaken(med.id);
                return (
                  <div
                    key={med.id}
                    className={`flex items-center justify-between p-4 rounded-lg border-2 transition-all ${
                      taken
                        ? 'bg-green-50 border-green-200'
                        : 'bg-orange-50 border-orange-200'
                    }`}
                  >
                    <div className="flex items-center space-x-3 flex-1">
                      <div className={`p-2 rounded-lg ${taken ? 'bg-green-200' : 'bg-orange-200'}`}>
                        <Pill size={20} className={taken ? 'text-green-600' : 'text-orange-600'} />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${taken ? 'text-green-900' : 'text-gray-900'}`}>
                          {med.name}
                        </p>
                        <p className="text-sm text-gray-600">
                          {med.dosage} - {med.type} - {med.time}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant={taken ? 'secondary' : 'primary'}
                      size="sm"
                      onClick={() => taken ? handleUnmarkAsTaken(med) : handleMarkAsTaken(med)}
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
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Settings size={20} className="mr-2 text-blue-600" />
            Preferências Médicas
          </h2>

          {(() => {
            const foodRestrictions = Array.isArray(preferences?.foodRestrictions)
              ? preferences.foodRestrictions
              : (preferences?.foodRestrictions ? [preferences.foodRestrictions] : []);
            const medicalRestrictions = Array.isArray(preferences?.medicalRestrictions)
              ? preferences.medicalRestrictions
              : (preferences?.medicalRestrictions ? [preferences.medicalRestrictions] : []);
            const allergies = Array.isArray(preferences?.allergies)
              ? preferences.allergies
              : (preferences?.allergies ? [preferences.allergies] : []);

            const hasData = foodRestrictions.length > 0 || medicalRestrictions.length > 0 || allergies.length > 0;

            return !hasData ? (
              <p className="text-gray-500 text-center py-8">
                Nenhuma preferência cadastrada
              </p>
            ) : (
              <div className="space-y-4">
                {foodRestrictions.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Restrições Alimentares:</p>
                    <div className="space-y-1">
                      {foodRestrictions.slice(0, 3).map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center text-sm text-gray-700 bg-blue-50 px-3 py-2 rounded">
                          <AlertCircle size={14} className="mr-2 text-blue-600 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                      {foodRestrictions.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{foodRestrictions.length - 3} mais
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {medicalRestrictions.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Restrições Médicas:</p>
                    <div className="space-y-1">
                      {medicalRestrictions.slice(0, 3).map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center text-sm text-gray-700 bg-red-50 px-3 py-2 rounded">
                          <AlertCircle size={14} className="mr-2 text-red-600 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                      {medicalRestrictions.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{medicalRestrictions.length - 3} mais
                        </p>
                      )}
                    </div>
                  </div>
                )}
                {allergies.length > 0 && (
                  <div>
                    <p className="font-semibold text-gray-900 mb-2">Alergias:</p>
                    <div className="space-y-1">
                      {allergies.slice(0, 3).map((item: string, idx: number) => (
                        <div key={idx} className="flex items-center text-sm text-gray-700 bg-yellow-50 px-3 py-2 rounded">
                          <AlertCircle size={14} className="mr-2 text-yellow-600 flex-shrink-0" />
                          {item}
                        </div>
                      ))}
                      {allergies.length > 3 && (
                        <p className="text-xs text-gray-500 mt-1">
                          +{allergies.length - 3} mais
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
            <Bell size={20} className="mr-2 text-blue-600" />
            Notificações Recentes
          </h2>

          {notifications.length === 0 ? (
            <p className="text-gray-500 text-center py-8">
              Nenhuma notificação
            </p>
          ) : (
            <div className="space-y-3">
              {notifications.map((notif, index) => (
                <div
                  key={index}
                  className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg"
                >
                  <AlertCircle
                    size={20}
                    className={
                      notif.type === 'overdue' || notif.type === 'reminder'
                        ? 'text-orange-500'
                        : 'text-green-500'
                    }
                  />
                  <div className="flex-1">
                    <p className="text-gray-900">{notif.message}</p>
                    <p className="text-sm text-gray-500 mt-1">{notif.time}</p>
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
