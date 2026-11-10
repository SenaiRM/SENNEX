import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS } from '../../lib/storage';
import { createNotification } from '../../lib/utils';
import {
  DAY_KEYS,
  DAY_LABELS,
  INTERVAL_OPTIONS,
  formatSchedule,
  getDoseTimes,
  getRemainingTreatmentDays,
  getTreatmentEndDate,
  toLocalISODate
} from '../../lib/medications';
import { Medication, NotificationItem } from '../../types';

const emptyFormData = () => ({
  name: '',
  dosage: '',
  type: '',
  time: '',
  recurrence: [...DAY_KEYS] as string[],
  startDate: '',
  intervalHours: 0,
  treatmentDays: ''
});

const formatDateBR = (isoDate: string) => new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR');

const plural = (n: number, word: string) => `${n} ${word}${n > 1 ? 's' : ''}`;

const TreatmentBadge: React.FC<{ med: Medication }> = ({ med }) => {
  const remaining = getRemainingTreatmentDays(med);
  if (remaining === undefined) return null;

  const [label, className] =
    remaining === 0
      ? ['Encerrado', 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300']
      : remaining > med.treatmentDays!
        ? ['Não iniciado', 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300']
        : [`${plural(remaining, 'dia')} restante${remaining > 1 ? 's' : ''}`, 'bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300'];

  return <span className={`px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap ${className}`}>{label}</span>;
};

export const Medications: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<Medication[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState<Medication | null>(null);
  const [formData, setFormData] = useState(emptyFormData());

  useEffect(() => {
    loadMedications();
  }, [user]);

  const loadMedications = () => {
    const storedMeds: Medication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICATIONS) || '[]');
    const userMeds = storedMeds.filter((m) => m.userId === user?.id);
    setMedications(userMeds);
  };

  const pushNotification = (notification: Omit<NotificationItem, 'id' | 'time' | 'userId'>) => {
    const storedNotifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    storedNotifications.push(createNotification({ userId: user?.id || '', ...notification }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(storedNotifications));
  };

  const handleSave = () => {
    if (!formData.name || !formData.dosage || !formData.type || !formData.time) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.recurrence.length === 0) {
      toast.error('Selecione pelo menos um dia da semana');
      return;
    }

    const treatmentDays = formData.treatmentDays ? Number(formData.treatmentDays) : undefined;
    if (treatmentDays !== undefined && (!Number.isInteger(treatmentDays) || treatmentDays < 1)) {
      toast.error('O tempo de tratamento deve ser um número inteiro de dias (mínimo 1)');
      return;
    }

    const allMeds: Medication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICATIONS) || '[]');
    const today = new Date().toISOString().split('T')[0];
    const medData = {
      ...formData,
      intervalHours: formData.intervalHours || undefined,
      treatmentDays,
      // O término é contado a partir do início; sem data informada, o tratamento começa hoje
      startDate: formData.startDate || (treatmentDays ? toLocalISODate() : '')
    };

    if (editingMed) {
      const updatedMeds = allMeds.map((m) =>
        m.id === editingMed.id ? { ...m, ...medData } : m
      );
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(updatedMeds));
      toast.success('Medicamento atualizado com sucesso');
      pushNotification({ type: 'update', message: `Medicamento ${formData.name} atualizado`, date: today });
    } else {
      const newMed: Medication = {
        id: Date.now().toString(),
        userId: user?.id || '',
        ...medData
      };
      allMeds.push(newMed);
      localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(allMeds));
      toast.success('Medicamento cadastrado com sucesso');
      pushNotification({ type: 'new', message: `Medicamento ${formData.name} cadastrado - ${formatSchedule(medData)}`, date: today });
    }

    loadMedications();
    setShowModal(false);
    setEditingMed(null);
    setFormData(emptyFormData());
  };

  const handleEdit = (med: Medication) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      type: med.type,
      time: med.time,
      recurrence: med.recurrence || [...DAY_KEYS],
      startDate: med.startDate || '',
      intervalHours: med.intervalHours || 0,
      treatmentDays: med.treatmentDays ? String(med.treatmentDays) : ''
    });
    setShowModal(true);
  };

  const handleDelete = (medId: string) => {
    if (!confirm('Deseja realmente excluir este medicamento?')) return;

    const allMeds: Medication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICATIONS) || '[]');
    const medToDelete = allMeds.find((m) => m.id === medId);
    const updatedMeds = allMeds.filter((m) => m.id !== medId);
    localStorage.setItem(STORAGE_KEYS.MEDICATIONS, JSON.stringify(updatedMeds));

    if (medToDelete) {
      pushNotification({
        type: 'delete',
        message: `Medicamento ${medToDelete.name} removido`,
        date: new Date().toISOString().split('T')[0]
      });
    }

    loadMedications();
    toast.success('Medicamento excluído com sucesso');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingMed(null);
    setFormData(emptyFormData());
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Medicamentos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerencie seus medicamentos</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto shrink-0">
          <Plus size={20} className="mr-2" />
          Adicionar Medicamento
        </Button>
      </div>

      {medications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Pill size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhum medicamento cadastrado</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">
              Adicionar Primeiro Medicamento
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map((med) => (
            <Card key={med.id} className="hover:shadow-md transition-shadow">
              {/* A etiqueta de tratamento desce para a linha de baixo quando falta espaço */}
              <div className="flex flex-wrap items-start justify-between gap-2 mb-4">
                <div className="flex items-center space-x-3 min-w-0 flex-1 basis-48">
                  <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg shrink-0">
                    <Pill size={24} className="text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 break-words">{med.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{med.type}</p>
                  </div>
                </div>
                <TreatmentBadge med={med} />
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Dosagem:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">{med.dosage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Horário:</span>
                  <span className="font-medium text-blue-600 dark:text-blue-400">{med.time}</span>
                </div>
                {med.intervalHours && (
                  <div className="text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">Frequência:</span>
                      <span className="font-medium text-gray-900 dark:text-gray-100">
                        De {med.intervalHours} em {med.intervalHours} horas
                      </span>
                    </div>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {getDoseTimes(med).map((t) => (
                        <span
                          key={t}
                          className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                {med.startDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Início:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {formatDateBR(med.startDate)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Tratamento:</span>
                  <span className="font-medium text-gray-900 dark:text-gray-100">
                    {med.treatmentDays
                      ? `${plural(med.treatmentDays, 'dia')} (até ${formatDateBR(getTreatmentEndDate(med)!)})`
                      : 'Uso contínuo'}
                  </span>
                </div>
                {med.recurrence && med.recurrence.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600 dark:text-gray-400">Dias:</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {med.recurrence.map((day) => (
                        <span
                          key={day}
                          className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 rounded text-xs font-medium"
                        >
                          {day.toUpperCase()}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="flex space-x-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleEdit(med)}
                >
                  <Edit size={16} className="mr-1" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleDelete(med.id)}
                >
                  <Trash2 size={16} className="mr-1" />
                  Excluir
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Modal open={showModal}>
        <Card className="w-full max-w-md">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            {editingMed ? 'Editar Medicamento' : 'Novo Medicamento'}
          </h2>

          <div className="space-y-4">
            <Input
              label="Nome do Medicamento"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Paracetamol"
            />

            <Input
              label="Dosagem"
              value={formData.dosage}
              onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
              placeholder="Ex: 500mg"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Tipo
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Selecione o tipo</option>
                <option value="Comprimido">Comprimido</option>
                <option value="Cápsula">Cápsula</option>
                <option value="Líquido">Líquido</option>
                <option value="Injetável">Injetável</option>
                <option value="Pomada">Pomada</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Frequência
              </label>
              <select
                value={formData.intervalHours}
                onChange={(e) => setFormData({ ...formData, intervalHours: Number(e.target.value) })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={0}>Uma vez ao dia (horário fixo)</option>
                {INTERVAL_OPTIONS.map((h) => (
                  <option key={h} value={h}>
                    De {h} em {h} hora{h > 1 ? 's' : ''}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Input
                label={formData.intervalHours ? 'Horário da Primeira Dose' : 'Horário'}
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
              {formData.intervalHours > 0 && formData.time && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Doses às: {getDoseTimes(formData).join(', ')}
                </p>
              )}
            </div>

            <div>
              <Input
                label="Data de Início do Tratamento (opcional)"
                type="date"
                value={formData.startDate}
                onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Informe quando iniciou este medicamento
              </p>
            </div>

            <div>
              <Input
                label="Tempo de Tratamento em dias (opcional)"
                type="number"
                min={1}
                step={1}
                value={formData.treatmentDays}
                onChange={(e) => setFormData({ ...formData, treatmentDays: e.target.value })}
                placeholder="Ex: 7"
              />
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {Number(formData.treatmentDays) >= 1
                  ? `Término previsto: ${formatDateBR(
                      getTreatmentEndDate({
                        startDate: formData.startDate || toLocalISODate(),
                        treatmentDays: Number(formData.treatmentDays)
                      })!
                    )}. Os lembretes param após essa data.`
                  : 'Deixe em branco para uso contínuo'}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Dias da Semana
              </label>
              <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                {DAY_KEYS.map((day) => {
                  const isSelected = formData.recurrence.includes(day);
                  return (
                    <button
                      key={day}
                      type="button"
                      onClick={() => {
                        const newRecurrence = isSelected
                          ? formData.recurrence.filter((d) => d !== day)
                          : [...formData.recurrence, day];
                        setFormData({ ...formData, recurrence: newRecurrence });
                      }}
                      className={`py-2 rounded-lg font-medium text-sm transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                      }`}
                    >
                      {DAY_LABELS[day]}
                    </button>
                  );
                })}
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                Selecione os dias em que deseja receber alertas
              </p>
            </div>

            <div className="flex space-x-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {editingMed ? 'Atualizar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  );
};
