import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, Stethoscope, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS } from '../../lib/storage';
import { createNotification } from '../../lib/utils';
import { toLocalISODate } from '../../lib/medications';
import { isUpcomingConsultation, sortConsultations } from '../../lib/consultations';
import { ConsultationRecord, NotificationItem } from '../../types';

const SPECIALTY_OPTIONS = [
  'Cardiologia', 'Clínico Geral', 'Dermatologia', 'Endocrinologia', 'Gastroenterologia',
  'Geriatria', 'Ginecologia', 'Neurologia', 'Oftalmologia', 'Ortopedia',
  'Otorrinolaringologia', 'Pediatria', 'Psiquiatria', 'Reumatologia', 'Urologia'
];

const emptyFormData = () => ({
  date: '',
  time: '',
  doctor: '',
  specialty: ''
});

const formatDateBR = (isoDate: string) => new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR');

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-gray-600 dark:text-gray-400 shrink-0">{label}:</span>
    <span className="font-medium text-gray-900 dark:text-gray-100 text-right break-words min-w-0">{children}</span>
  </div>
);

export const Consultations: React.FC = () => {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<ConsultationRecord[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingConsultation, setEditingConsultation] = useState<ConsultationRecord | null>(null);
  const [formData, setFormData] = useState(emptyFormData());

  useEffect(() => {
    loadConsultations();
  }, [user]);

  const loadConsultations = () => {
    const stored: ConsultationRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTATIONS) || '[]');
    setConsultations(sortConsultations(stored.filter((c) => c.userId === user?.id)));
  };

  const pushNotification = (notification: Omit<NotificationItem, 'id' | 'time' | 'userId'>) => {
    const storedNotifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    storedNotifications.push(createNotification({ userId: user?.id || '', ...notification }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(storedNotifications));
  };

  const handleSave = () => {
    if (!formData.date || !formData.time || !formData.doctor.trim() || !formData.specialty.trim()) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    const allConsultations: ConsultationRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTATIONS) || '[]');
    const today = toLocalISODate();
    const consultationData = {
      ...formData,
      doctor: formData.doctor.trim(),
      specialty: formData.specialty.trim()
    };
    const label = `com ${consultationData.doctor} (${consultationData.specialty})`;

    if (editingConsultation) {
      const updated = allConsultations.map((c) => (c.id === editingConsultation.id ? { ...c, ...consultationData } : c));
      localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(updated));
      toast.success('Consulta atualizada com sucesso');
      pushNotification({ type: 'update', message: `Consulta ${label} atualizada`, date: today });
    } else {
      const newConsultation: ConsultationRecord = {
        id: Date.now().toString(),
        userId: user?.id || '',
        ...consultationData
      };
      allConsultations.push(newConsultation);
      localStorage.setItem(STORAGE_KEYS.CONSULTATIONS, JSON.stringify(allConsultations));
      toast.success('Consulta registrada com sucesso');
      pushNotification({ type: 'new', message: `Consulta ${label} registrada no histórico`, date: today });
    }

    loadConsultations();
    closeModal();
  };

  const handleEdit = (consultation: ConsultationRecord) => {
    setEditingConsultation(consultation);
    setFormData({
      date: consultation.date,
      time: consultation.time,
      doctor: consultation.doctor,
      specialty: consultation.specialty
    });
    setShowModal(true);
  };

  const handleDelete = (consultationId: string) => {
    if (!confirm('Deseja realmente excluir esta consulta do histórico?')) return;

    const allConsultations: ConsultationRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTATIONS) || '[]');
    const toDelete = allConsultations.find((c) => c.id === consultationId);
    localStorage.setItem(
      STORAGE_KEYS.CONSULTATIONS,
      JSON.stringify(allConsultations.filter((c) => c.id !== consultationId))
    );

    if (toDelete) {
      pushNotification({
        type: 'delete',
        message: `Consulta com ${toDelete.doctor} (${toDelete.specialty}) removida do histórico`,
        date: toLocalISODate()
      });
    }

    loadConsultations();
    toast.success('Consulta excluída com sucesso');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingConsultation(null);
    setFormData(emptyFormData());
  };

  const query = search.trim().toLowerCase();
  const filteredConsultations = query
    ? consultations.filter((c) => [c.doctor, c.specialty].some((field) => field.toLowerCase().includes(query)))
    : consultations;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Histórico de Consultas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Registre e acompanhe suas consultas médicas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto shrink-0">
          <Plus size={20} className="mr-2" />
          Registrar Consulta
        </Button>
      </div>

      {consultations.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Stethoscope size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma consulta registrada</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">
              Registrar Primeira Consulta
            </Button>
          </div>
        </Card>
      ) : (
        <>
          <div className="relative mb-4 max-w-md">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por médico ou especialidade"
              className="pl-10"
              aria-label="Buscar consultas"
            />
          </div>

          {filteredConsultations.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                Nenhuma consulta encontrada para "{search}"
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredConsultations.map((c) => {
                const isUpcoming = isUpcomingConsultation(c);
                return (
                  <Card key={c.id} className="hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0 flex-1 basis-48">
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg shrink-0">
                          <Stethoscope size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 break-words">{c.doctor}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{c.specialty}</p>
                        </div>
                      </div>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${
                          isUpcoming
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                            : 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'
                        }`}
                      >
                        {isUpcoming ? 'Agendada' : 'Realizada'}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <InfoRow label="Data">{formatDateBR(c.date)}</InfoRow>
                      <InfoRow label="Horário">{c.time}</InfoRow>
                    </div>

                    <div className="flex space-x-2 mt-auto">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(c)}>
                        <Edit size={16} className="mr-1" />
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDelete(c.id)}>
                        <Trash2 size={16} className="mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}

      <Modal open={showModal}>
        <Card className="w-full max-w-lg">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingConsultation ? 'Editar Consulta' : 'Registrar Consulta'}
          </h2>

          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Data *"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
              <Input
                label="Horário *"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>

            <Input
              label="Médico *"
              value={formData.doctor}
              onChange={(e) => setFormData({ ...formData, doctor: e.target.value })}
              placeholder="Ex: Dra. Ana Souza"
            />

            <Input
              label="Especialidade *"
              list="specialty-options"
              value={formData.specialty}
              onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
              placeholder="Ex: Cardiologia"
            />
            <datalist id="specialty-options">
              {SPECIALTY_OPTIONS.map((s) => (
                <option key={s} value={s} />
              ))}
            </datalist>

            <div className="flex space-x-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {editingConsultation ? 'Atualizar' : 'Registrar'}
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  );
};
