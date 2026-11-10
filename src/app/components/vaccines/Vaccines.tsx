import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Plus, Edit, Trash2, Syringe, Search, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS } from '../../lib/storage';
import { createNotification } from '../../lib/utils';
import { toLocalISODate } from '../../lib/medications';
import { formatVaccineLocation, isLotExpiredAtApplication } from '../../lib/vaccines';
import { NotificationItem, VaccineRecord } from '../../types';

const DOSE_OPTIONS = ['1ª dose', '2ª dose', '3ª dose', 'Reforço', 'Dose única', 'Dose anual'];

const UF_OPTIONS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO'
];

const selectClassName =
  'w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500';

const emptyFormData = () => ({
  vaccine: '',
  manufacturer: '',
  dose: '',
  applicationDate: '',
  lot: '',
  lotExpiry: '',
  place: '',
  city: '',
  state: '',
  adverseReaction: ''
});

const formatDateBR = (isoDate: string) => new Date(isoDate + 'T00:00:00').toLocaleDateString('pt-BR');

const InfoRow: React.FC<{ label: string; children: React.ReactNode }> = ({ label, children }) => (
  <div className="flex justify-between gap-3 text-sm">
    <span className="text-gray-600 dark:text-gray-400 shrink-0">{label}:</span>
    <span className="font-medium text-gray-900 dark:text-gray-100 text-right break-words min-w-0">{children}</span>
  </div>
);

export const Vaccines: React.FC = () => {
  const { user } = useAuth();
  const [vaccines, setVaccines] = useState<VaccineRecord[]>([]);
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingVaccine, setEditingVaccine] = useState<VaccineRecord | null>(null);
  const [formData, setFormData] = useState(emptyFormData());

  useEffect(() => {
    loadVaccines();
  }, [user]);

  const loadVaccines = () => {
    const stored: VaccineRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACCINES) || '[]');
    const userVaccines = stored
      .filter((v) => v.userId === user?.id)
      // Aplicações mais recentes primeiro
      .sort((a, b) => b.applicationDate.localeCompare(a.applicationDate));
    setVaccines(userVaccines);
  };

  const pushNotification = (notification: Omit<NotificationItem, 'id' | 'time' | 'userId'>) => {
    const storedNotifications: NotificationItem[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS) || '[]');
    storedNotifications.push(createNotification({ userId: user?.id || '', ...notification }));
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(storedNotifications));
  };

  const handleSave = () => {
    if (!formData.vaccine.trim() || !formData.dose || !formData.applicationDate) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (formData.applicationDate > toLocalISODate()) {
      toast.error('A data de aplicação não pode ser no futuro');
      return;
    }

    const allVaccines: VaccineRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACCINES) || '[]');
    const today = toLocalISODate();
    const vaccineData = {
      ...formData,
      vaccine: formData.vaccine.trim(),
      adverseReaction: formData.adverseReaction.trim()
    };
    const label = `${vaccineData.vaccine} (${vaccineData.dose})`;

    if (editingVaccine) {
      const updated = allVaccines.map((v) => (v.id === editingVaccine.id ? { ...v, ...vaccineData } : v));
      localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(updated));
      toast.success('Vacina atualizada com sucesso');
      pushNotification({ type: 'update', message: `Vacina ${label} atualizada`, date: today });
    } else {
      const newVaccine: VaccineRecord = {
        id: Date.now().toString(),
        userId: user?.id || '',
        ...vaccineData
      };
      allVaccines.push(newVaccine);
      localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(allVaccines));
      toast.success('Vacina registrada com sucesso');
      pushNotification({ type: 'new', message: `Vacina ${label} registrada no cartão`, date: today });
    }

    if (isLotExpiredAtApplication(vaccineData)) {
      toast.warning('Atenção: o lote estava vencido na data de aplicação');
    }

    loadVaccines();
    closeModal();
  };

  const handleEdit = (vaccine: VaccineRecord) => {
    setEditingVaccine(vaccine);
    setFormData({
      vaccine: vaccine.vaccine,
      manufacturer: vaccine.manufacturer || '',
      dose: vaccine.dose,
      applicationDate: vaccine.applicationDate,
      lot: vaccine.lot || '',
      lotExpiry: vaccine.lotExpiry || '',
      place: vaccine.place || '',
      city: vaccine.city || '',
      state: vaccine.state || '',
      adverseReaction: vaccine.adverseReaction || ''
    });
    setShowModal(true);
  };

  const handleDelete = (vaccineId: string) => {
    if (!confirm('Deseja realmente excluir este registro de vacina?')) return;

    const allVaccines: VaccineRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.VACCINES) || '[]');
    const toDelete = allVaccines.find((v) => v.id === vaccineId);
    localStorage.setItem(STORAGE_KEYS.VACCINES, JSON.stringify(allVaccines.filter((v) => v.id !== vaccineId)));

    if (toDelete) {
      pushNotification({
        type: 'delete',
        message: `Vacina ${toDelete.vaccine} (${toDelete.dose}) removida do cartão`,
        date: toLocalISODate()
      });
    }

    loadVaccines();
    toast.success('Registro de vacina excluído com sucesso');
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingVaccine(null);
    setFormData(emptyFormData());
  };

  const query = search.trim().toLowerCase();
  const filteredVaccines = query
    ? vaccines.filter((v) =>
        [v.vaccine, v.manufacturer, v.lot, v.place, v.city].some((field) => field?.toLowerCase().includes(query))
      )
    : vaccines;

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Cartão de Vacina</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Registre e acompanhe suas vacinas</p>
        </div>
        <Button onClick={() => setShowModal(true)} className="w-full sm:w-auto shrink-0">
          <Plus size={20} className="mr-2" />
          Registrar Vacina
        </Button>
      </div>

      {vaccines.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Syringe size={48} className="mx-auto text-gray-400 dark:text-gray-500 mb-4" />
            <p className="text-gray-500 dark:text-gray-400">Nenhuma vacina registrada</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">
              Registrar Primeira Vacina
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
              placeholder="Buscar por vacina, fabricante, lote ou local"
              className="pl-10"
              aria-label="Buscar vacinas"
            />
          </div>

          {filteredVaccines.length === 0 ? (
            <Card>
              <p className="text-center text-gray-500 dark:text-gray-400 py-6">
                Nenhuma vacina encontrada para "{search}"
              </p>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredVaccines.map((v) => {
                const location = formatVaccineLocation(v);
                return (
                  <Card key={v.id} className="hover:shadow-md transition-shadow">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div className="flex items-center space-x-3 min-w-0 flex-1 basis-48">
                        <div className="bg-blue-100 dark:bg-blue-900/40 p-3 rounded-lg shrink-0">
                          <Syringe size={24} className="text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-bold text-gray-900 dark:text-gray-100 break-words">{v.vaccine}</h3>
                          {v.manufacturer && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 break-words">{v.manufacturer}</p>
                          )}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-xs font-medium whitespace-nowrap bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300">
                        {v.dose}
                      </span>
                    </div>

                    <div className="space-y-2">
                      <InfoRow label="Aplicação">{formatDateBR(v.applicationDate)}</InfoRow>
                      {v.lot && <InfoRow label="Lote">{v.lot}</InfoRow>}
                      {v.lotExpiry && <InfoRow label="Validade do lote">{formatDateBR(v.lotExpiry)}</InfoRow>}
                      {isLotExpiredAtApplication(v) && (
                        <div className="flex items-center gap-1.5 text-xs font-medium text-red-600 dark:text-red-400">
                          <AlertTriangle size={14} className="shrink-0" />
                          Lote vencido na data de aplicação
                        </div>
                      )}
                      {location && <InfoRow label="Local">{location}</InfoRow>}
                      {v.adverseReaction && (
                        <div className="text-sm pt-1">
                          <span className="text-gray-600 dark:text-gray-400">Reação adversa:</span>
                          <p className="mt-1 text-gray-900 dark:text-gray-100 whitespace-pre-wrap break-words">
                            {v.adverseReaction}
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-auto">
                      <Button variant="ghost" size="sm" className="flex-1" onClick={() => handleEdit(v)}>
                        <Edit size={16} className="mr-1" />
                        Editar
                      </Button>
                      <Button variant="danger" size="sm" className="flex-1" onClick={() => handleDelete(v.id)}>
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
            {editingVaccine ? 'Editar Vacina' : 'Registrar Vacina'}
          </h2>

          <div className="space-y-4">
            <Input
              label="Vacina *"
              value={formData.vaccine}
              onChange={(e) => setFormData({ ...formData, vaccine: e.target.value })}
              placeholder="Ex: Influenza"
            />

            <Input
              label="Nome comercial / Fabricante"
              value={formData.manufacturer}
              onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
              placeholder="Ex: Vaxigrip / Sanofi"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Dose *</label>
                <select
                  value={formData.dose}
                  onChange={(e) => setFormData({ ...formData, dose: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">Selecione a dose</option>
                  {DOSE_OPTIONS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </div>

              <Input
                label="Data de aplicação *"
                type="date"
                max={toLocalISODate()}
                value={formData.applicationDate}
                onChange={(e) => setFormData({ ...formData, applicationDate: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Lote"
                value={formData.lot}
                onChange={(e) => setFormData({ ...formData, lot: e.target.value })}
                placeholder="Ex: AB1234"
              />
              <Input
                label="Validade do lote"
                type="date"
                value={formData.lotExpiry}
                onChange={(e) => setFormData({ ...formData, lotExpiry: e.target.value })}
              />
            </div>
            {formData.applicationDate && isLotExpiredAtApplication(formData) && (
              <p className="-mt-2 flex items-center gap-1.5 text-sm text-red-600 dark:text-red-400">
                <AlertTriangle size={14} className="shrink-0" />
                A validade do lote é anterior à data de aplicação
              </p>
            )}

            <Input
              label="Local de aplicação (posto/clínica)"
              value={formData.place}
              onChange={(e) => setFormData({ ...formData, place: e.target.value })}
              placeholder="Ex: UBS Vila Mariana"
            />

            <div className="grid grid-cols-[1fr_6rem] gap-4">
              <Input
                label="Cidade"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: São Paulo"
              />
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">UF</label>
                <select
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  className={selectClassName}
                >
                  <option value="">--</option>
                  {UF_OPTIONS.map((uf) => (
                    <option key={uf} value={uf}>
                      {uf}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Reações adversas
              </label>
              <textarea
                value={formData.adverseReaction}
                onChange={(e) => setFormData({ ...formData, adverseReaction: e.target.value })}
                placeholder="Descreva sintomas após a vacina (deixe em branco se não houve)"
                rows={3}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-y"
              />
            </div>

            <div className="flex space-x-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {editingVaccine ? 'Atualizar' : 'Registrar'}
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  );
};
