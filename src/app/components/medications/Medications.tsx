import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Edit, Trash2, Pill } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const Medications: React.FC = () => {
  const { user } = useAuth();
  const [medications, setMedications] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingMed, setEditingMed] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    dosage: '',
    type: '',
    time: '',
    recurrence: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
    startDate: ''
  });

  useEffect(() => {
    loadMedications();
  }, [user]);

  const loadMedications = () => {
    const storedMeds = JSON.parse(localStorage.getItem('sennex_medications') || '[]');
    const userMeds = storedMeds.filter((m: any) => m.userId === user?.id);
    setMedications(userMeds);
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

    const allMeds = JSON.parse(localStorage.getItem('sennex_medications') || '[]');

    if (editingMed) {
      const updatedMeds = allMeds.map((m: any) =>
        m.id === editingMed.id ? { ...m, ...formData } : m
      );
      localStorage.setItem('sennex_medications', JSON.stringify(updatedMeds));
      toast.success('Medicamento atualizado com sucesso');

      const storedNotifications = JSON.parse(localStorage.getItem('sennex_notifications') || '[]');
      storedNotifications.push({
        id: Date.now().toString(),
        userId: user?.id,
        type: 'update',
        message: `Medicamento ${formData.name} atualizado`,
        time: new Date().toLocaleString('pt-BR'),
        date: new Date().toISOString().split('T')[0]
      });
      localStorage.setItem('sennex_notifications', JSON.stringify(storedNotifications));
    } else {
      const newMed = {
        id: Date.now().toString(),
        userId: user?.id,
        ...formData
      };
      allMeds.push(newMed);
      localStorage.setItem('sennex_medications', JSON.stringify(allMeds));
      toast.success('Medicamento cadastrado com sucesso');

      const storedNotifications = JSON.parse(localStorage.getItem('sennex_notifications') || '[]');
      storedNotifications.push({
        id: Date.now().toString(),
        userId: user?.id,
        type: 'new',
        message: `Medicamento ${formData.name} cadastrado - ${formData.time}`,
        time: new Date().toLocaleString('pt-BR'),
        date: new Date().toISOString().split('T')[0]
      });
      localStorage.setItem('sennex_notifications', JSON.stringify(storedNotifications));
    }

    loadMedications();
    setShowModal(false);
    setEditingMed(null);
    setFormData({ name: '', dosage: '', type: '', time: '', recurrence: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'], startDate: '' });
  };

  const handleEdit = (med: any) => {
    setEditingMed(med);
    setFormData({
      name: med.name,
      dosage: med.dosage,
      type: med.type,
      time: med.time,
      recurrence: med.recurrence || ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'],
      startDate: med.startDate || ''
    });
    setShowModal(true);
  };

  const handleDelete = (medId: string) => {
    if (!confirm('Deseja realmente excluir este medicamento?')) return;

    const allMeds = JSON.parse(localStorage.getItem('sennex_medications') || '[]');
    const medToDelete = allMeds.find((m: any) => m.id === medId);
    const updatedMeds = allMeds.filter((m: any) => m.id !== medId);
    localStorage.setItem('sennex_medications', JSON.stringify(updatedMeds));

    if (medToDelete) {
      const storedNotifications = JSON.parse(localStorage.getItem('sennex_notifications') || '[]');
      storedNotifications.push({
        id: Date.now().toString(),
        userId: user?.id,
        type: 'delete',
        message: `Medicamento ${medToDelete.name} removido`,
        time: new Date().toLocaleString('pt-BR'),
        date: new Date().toISOString().split('T')[0]
      });
      localStorage.setItem('sennex_notifications', JSON.stringify(storedNotifications));
    }

    loadMedications();
    toast.success('Medicamento excluído com sucesso');
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Medicamentos</h1>
          <p className="text-gray-600 mt-1">Gerencie seus medicamentos</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus size={24} className="mr-2" />
          Adicionar Medicamento
        </Button>
      </div>

      {medications.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <Pill size={48} className="mx-auto text-gray-400 mb-4" />
            <p className="text-gray-500">Nenhum medicamento cadastrado</p>
            <Button onClick={() => setShowModal(true)} className="mt-4">
              Adicionar Primeiro Medicamento
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {medications.map((med) => (
            <Card key={med.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <Pill size={24} className="text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{med.name}</h3>
                    <p className="text-sm text-gray-600">{med.type}</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Dosagem:</span>
                  <span className="font-medium text-gray-900">{med.dosage}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Horário:</span>
                  <span className="font-medium text-blue-600">{med.time}</span>
                </div>
                {med.startDate && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Início:</span>
                    <span className="font-medium text-gray-900">
                      {new Date(med.startDate + 'T00:00:00').toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                )}
                {med.recurrence && med.recurrence.length > 0 && (
                  <div className="text-sm">
                    <span className="text-gray-600">Dias:</span>
                    <div className="flex gap-1 mt-1 flex-wrap">
                      {med.recurrence.map((day: string) => (
                        <span
                          key={day}
                          className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs font-medium"
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

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
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
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Tipo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Selecione o tipo</option>
                  <option value="Comprimido">Comprimido</option>
                  <option value="Cápsula">Cápsula</option>
                  <option value="Líquido">Líquido</option>
                  <option value="Injetável">Injetável</option>
                  <option value="Pomada">Pomada</option>
                </select>
              </div>

              <Input
                label="Horário"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />

              <div>
                <Input
                  label="Data de Início do Tratamento (opcional)"
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Informe quando iniciou este medicamento
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Dias da Semana
                </label>
                <div className="grid grid-cols-7 gap-2">
                  {[
                    { key: 'dom', label: 'D' },
                    { key: 'seg', label: 'S' },
                    { key: 'ter', label: 'T' },
                    { key: 'qua', label: 'Q' },
                    { key: 'qui', label: 'Q' },
                    { key: 'sex', label: 'S' },
                    { key: 'sab', label: 'S' }
                  ].map((day) => {
                    const isSelected = formData.recurrence.includes(day.key);
                    return (
                      <button
                        key={day.key}
                        type="button"
                        onClick={() => {
                          const newRecurrence = isSelected
                            ? formData.recurrence.filter((d) => d !== day.key)
                            : [...formData.recurrence, day.key];
                          setFormData({ ...formData, recurrence: newRecurrence });
                        }}
                        className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                          isSelected
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {day.label}
                      </button>
                    );
                  })}
                </div>
                <p className="text-sm text-gray-500 mt-1.5">
                  Selecione os dias em que deseja receber alertas
                </p>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMed(null);
                    setFormData({ name: '', dosage: '', type: '', time: '', recurrence: ['dom', 'seg', 'ter', 'qua', 'qui', 'sex', 'sab'], startDate: '' });
                  }}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  {editingMed ? 'Atualizar' : 'Cadastrar'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
