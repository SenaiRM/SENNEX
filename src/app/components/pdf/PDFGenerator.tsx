import React, { useState } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Download, FileText, User, Pill, AlertCircle, CheckCircle, Filter, Syringe, Stethoscope } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS } from '../../lib/storage';
import { normalizePreferences } from '../../lib/utils';
import { formatSchedule, getTreatmentEndDate } from '../../lib/medications';
import { buildPatientReport } from '../../lib/pdfTemplate';
import { sortConsultations } from '../../lib/consultations';
import { ConsultationRecord, Ficha, Medication, NotificationItem, TakenMed, VaccineRecord } from '../../types';

type SectionKey = 'medications' | 'preferences' | 'vaccines' | 'consultations' | 'taken' | 'history';

const SECTIONS: { key: SectionKey; label: string }[] = [
  { key: 'medications', label: 'Medicamentos' },
  { key: 'preferences', label: 'Preferências Médicas' },
  { key: 'vaccines', label: 'Cartão de Vacina' },
  { key: 'consultations', label: 'Histórico de Consultas' },
  { key: 'taken', label: 'Doses Tomadas' },
  { key: 'history', label: 'Histórico de Notificações' }
];

const PERIOD_PRESETS = [7, 15, 30, 90];

function toLocalISODate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function daysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  return toLocalISODate(date);
}

function formatDateBR(isoDate: string): string {
  return new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR');
}

/** Data (YYYY-MM-DD) da notificação, extraída de `time` (dd/mm/aaaa, hh:mm:ss) ou de `date`. */
function getNotificationDate(notif: NotificationItem): string | undefined {
  const match = notif.time?.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (match) return `${match[3]}-${match[2]}-${match[1]}`;
  return notif.date;
}

export const PDFGenerator: React.FC = () => {
  const { user } = useAuth();
  const [generating, setGenerating] = useState(false);
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(toLocalISODate(new Date()));
  const [sections, setSections] = useState<Record<SectionKey, boolean>>({
    medications: true,
    preferences: true,
    vaccines: true,
    consultations: true,
    taken: true,
    history: true
  });

  const isInPeriod = (date: string | undefined) => {
    if (!date) return !startDate && !endDate;
    return (!startDate || date >= startDate) && (!endDate || date <= endDate);
  };

  const fichas: Ficha[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FICHAS) || '[]');
  const userFicha = fichas.find((f) => f.userId === user?.id);

  const medications: Medication[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICATIONS) || '[]');
  // Medicamentos cujo tratamento se sobrepõe ao período escolhido
  const userMedications = medications.filter((m) => {
    const treatmentEnd = getTreatmentEndDate(m);
    return (
      m.userId === user?.id &&
      (!m.startDate || !endDate || m.startDate <= endDate) &&
      (!treatmentEnd || !startDate || treatmentEnd >= startDate)
    );
  });

  const storedPreferences = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICAL_PREFERENCES) || '{}');
  const userPreferences = normalizePreferences(storedPreferences[user?.id || '']);
  const hasPreferences =
    userPreferences.foodRestrictions.length > 0 ||
    userPreferences.medicalRestrictions.length > 0 ||
    userPreferences.allergies.length > 0;

  // O cartão de vacina sai completo, sem filtro de período: é um histórico de imunização
  const vaccines: VaccineRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACCINES) || '[]');
  const userVaccines = vaccines
    .filter((v) => v.userId === user?.id)
    .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate));

  const consultations: ConsultationRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.CONSULTATIONS) || '[]');
  const userConsultations = sortConsultations(
    consultations.filter((c) => c.userId === user?.id && isInPeriod(c.date))
  );

  const takenMeds: TakenMed[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.TAKEN_MEDS) || '[]');
  const userTakenMeds = takenMeds
    .filter((t) => t.userId === user?.id && isInPeriod(t.date))
    .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));

  const notifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
  const userNotifications = notifications
    .filter((n) => n.userId === user?.id && isInPeriod(getNotificationDate(n)))
    .reverse();

  const periodLabel =
    startDate || endDate
      ? `${startDate ? formatDateBR(startDate) : 'início'} a ${endDate ? formatDateBR(endDate) : 'hoje'}`
      : 'Todo o período';

  const selectedCount = Object.values(sections).filter(Boolean).length;

  const toggleSection = (key: SectionKey) => {
    setSections((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const applyPreset = (days: number | null) => {
    if (days === null) {
      setStartDate('');
      setEndDate('');
    } else {
      setStartDate(daysAgo(days));
      setEndDate(toLocalISODate(new Date()));
    }
  };

  const isPresetActive = (days: number | null) =>
    days === null
      ? !startDate && !endDate
      : startDate === daysAgo(days) && endDate === toLocalISODate(new Date());

  const generatePDF = () => {
    if (selectedCount === 0) {
      toast.error('Selecione ao menos uma informação para exportar');
      return;
    }

    if (startDate && endDate && startDate > endDate) {
      toast.error('A data inicial deve ser anterior à data final');
      return;
    }

    setGenerating(true);

    setTimeout(() => {
      const doc = buildPatientReport({
        patientName: `${userFicha?.name || user?.name || ''} ${userFicha?.surname || ''}`.trim(),
        email: userFicha?.email || user?.email || '',
        periodLabel,
        generatedAt: new Date(),
        medications: sections.medications ? userMedications : undefined,
        preferences: sections.preferences ? userPreferences : undefined,
        vaccines: sections.vaccines ? userVaccines : undefined,
        consultations: sections.consultations ? userConsultations : undefined,
        taken: sections.taken ? userTakenMeds : undefined,
        notifications: sections.history ? userNotifications : undefined
      });

      const fileName = `ficha-paciente-${user?.name?.replace(/\s+/g, '-') || 'sennex'}.pdf`;
      doc.save(fileName);

      setGenerating(false);
      toast.success('PDF gerado com sucesso');
    }, 1500);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Gerar PDF</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Exporte sua ficha completa em PDF</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
              <Filter size={24} className="text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Filtros de Exportação</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Escolha o período e as informações que deseja exportar
              </p>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Período</label>
              <div className="flex flex-wrap gap-2 mb-3">
                {PERIOD_PRESETS.map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => applyPreset(days)}
                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                      isPresetActive(days)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                    }`}
                  >
                    Últimos {days} dias
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => applyPreset(null)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    isPresetActive(null)
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                  }`}
                >
                  Todo o período
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Data inicial"
                  type="date"
                  value={startDate}
                  max={endDate || undefined}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <Input
                  label="Data final"
                  type="date"
                  value={endDate}
                  min={startDate || undefined}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1.5">
                O período filtra as consultas, as doses tomadas, o histórico de notificações e os medicamentos
                em tratamento dentro do intervalo. O cartão de vacina é exportado com o histórico completo
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Informações a exportar
              </label>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                Os dados pessoais são incluídos em todos os relatórios
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {SECTIONS.map(({ key, label }) => (
                  <label
                    key={key}
                    className="flex items-center space-x-2 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 text-sm text-gray-700 dark:text-gray-300"
                  >
                    <input
                      type="checkbox"
                      checked={sections[key]}
                      onChange={() => toggleSection(key)}
                      className="w-4 h-4 accent-blue-600"
                    />
                    <span>{label}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        </Card>

        <Card className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg">
                <FileText size={24} className="text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Prévia do Documento</h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Período: {periodLabel}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6 [&>*:not(:last-child)]:pb-4 [&>*:not(:last-child)]:border-b [&>*:not(:last-child)]:border-gray-200 dark:[&>*:not(:last-child)]:border-gray-700">
            <div>
              <div className="flex items-center space-x-2 mb-3">
                <User size={18} className="text-blue-600 dark:text-blue-400" />
                <h3 className="font-bold text-gray-900 dark:text-gray-100">Dados Pessoais</h3>
              </div>
              {userFicha ? (
                <div className="ml-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                  <p>
                    Nome: {userFicha.name} {userFicha.surname}
                  </p>
                  <p>E-mail: {userFicha.email}</p>
                </div>
              ) : (
                <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">Sem dados cadastrados</p>
              )}
            </div>

            {selectedCount === 0 && (
              <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-4">
                Selecione ao menos uma informação para exportar
              </p>
            )}

            {sections.medications && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Pill size={18} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    Medicamentos ({userMedications.length})
                  </h3>
                </div>
                {userMedications.length > 0 ? (
                  <div className="ml-6 space-y-2">
                    {userMedications.slice(0, 3).map((med) => (
                      <div key={med.id} className="text-sm text-gray-600 dark:text-gray-400">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{med.name}</p>
                        <p>
                          {med.dosage} - {med.type} - {formatSchedule(med)}
                        </p>
                        {med.startDate && (
                          <p className="text-xs text-gray-500 dark:text-gray-400">
                            Início: {formatDateBR(med.startDate)}
                          </p>
                        )}
                        {med.recurrence && med.recurrence.length > 0 && (
                          <p className="text-xs text-blue-600 dark:text-blue-400">
                            Dias: {med.recurrence.join(', ').toUpperCase()}
                          </p>
                        )}
                      </div>
                    ))}
                    {userMedications.length > 3 && (
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        +{userMedications.length - 3} medicamentos
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">Nenhum medicamento no período</p>
                )}
              </div>
            )}

            {sections.preferences && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <AlertCircle size={18} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">Preferências Médicas</h3>
                </div>
                {hasPreferences ? (
                  <div className="ml-6 space-y-2 text-sm text-gray-600 dark:text-gray-400">
                    {userPreferences.foodRestrictions.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Restrições Alimentares:</p>
                        <ul className="list-disc list-inside">
                          {userPreferences.foodRestrictions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {userPreferences.medicalRestrictions.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Restrições Médicas:</p>
                        <ul className="list-disc list-inside">
                          {userPreferences.medicalRestrictions.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {userPreferences.allergies.length > 0 && (
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">Alergias:</p>
                        <ul className="list-disc list-inside">
                          {userPreferences.allergies.map((item, idx) => (
                            <li key={idx}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">Nenhuma preferência cadastrada</p>
                )}
              </div>
            )}

            {sections.vaccines && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Syringe size={18} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    Cartão de Vacina ({userVaccines.length})
                  </h3>
                </div>
                {userVaccines.length > 0 ? (
                  <div className="ml-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {userVaccines.slice(0, 3).map((v) => (
                      <p key={v.id}>
                        {formatDateBR(v.applicationDate)} - {v.vaccine} ({v.dose})
                        {v.lot ? ` - Lote ${v.lot}` : ''}
                      </p>
                    ))}
                    {userVaccines.length > 3 && (
                      <p className="text-gray-500 dark:text-gray-400">+{userVaccines.length - 3} vacinas</p>
                    )}
                  </div>
                ) : (
                  <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">Nenhuma vacina registrada</p>
                )}
              </div>
            )}

            {sections.consultations && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <Stethoscope size={18} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    Histórico de Consultas ({userConsultations.length})
                  </h3>
                </div>
                {userConsultations.length > 0 ? (
                  <div className="ml-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {userConsultations.slice(0, 3).map((c) => (
                      <p key={c.id}>
                        {formatDateBR(c.date)} às {c.time} - {c.doctor} ({c.specialty})
                      </p>
                    ))}
                    {userConsultations.length > 3 && (
                      <p className="text-gray-500 dark:text-gray-400">+{userConsultations.length - 3} consultas</p>
                    )}
                  </div>
                ) : (
                  <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">Nenhuma consulta no período</p>
                )}
              </div>
            )}

            {sections.taken && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <CheckCircle size={18} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    Doses Tomadas ({userTakenMeds.length})
                  </h3>
                </div>
                {userTakenMeds.length > 0 ? (
                  <div className="ml-6 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {userTakenMeds.slice(0, 3).map((taken) => (
                      <p key={taken.id}>
                        {formatDateBR(taken.date)} às {taken.time} - {taken.medName}
                        {taken.doseTime ? ` (dose das ${taken.doseTime})` : ''}
                      </p>
                    ))}
                    {userTakenMeds.length > 3 && (
                      <p className="text-gray-500 dark:text-gray-400">+{userTakenMeds.length - 3} doses</p>
                    )}
                  </div>
                ) : (
                  <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">Nenhuma dose registrada no período</p>
                )}
              </div>
            )}

            {sections.history && (
              <div>
                <div className="flex items-center space-x-2 mb-3">
                  <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                  <h3 className="font-bold text-gray-900 dark:text-gray-100">
                    Histórico ({userNotifications.length} notificações)
                  </h3>
                </div>
                {userNotifications.length > 0 ? (
                  <p className="ml-6 text-sm text-gray-600 dark:text-gray-400">
                    {userNotifications.length} notificações do período serão incluídas
                  </p>
                ) : (
                  <p className="ml-6 text-sm text-gray-500 dark:text-gray-400">Sem histórico no período</p>
                )}
              </div>
            )}
          </div>
        </Card>

        <Button
          onClick={generatePDF}
          disabled={generating || selectedCount === 0}
          className="w-full"
          size="lg"
        >
          <Download size={24} className="mr-2" />
          {generating ? 'Gerando PDF...' : 'Gerar e Baixar PDF'}
        </Button>

        <p className="text-center text-sm text-gray-500 dark:text-gray-400 mt-4">
          O arquivo será baixado automaticamente após a geração
        </p>
      </div>
    </div>
  );
};
