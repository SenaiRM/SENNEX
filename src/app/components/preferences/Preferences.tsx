import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { AlertCircle, Save, RotateCcw } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';
import { STORAGE_KEYS } from '../../lib/storage';
import { normalizePreferences } from '../../lib/utils';
import { MedicalPreferences } from '../../types';
import { TagListEditor } from './TagListEditor';

type PreferenceField = keyof MedicalPreferences;

export const Preferences: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState<MedicalPreferences>({
    foodRestrictions: [],
    medicalRestrictions: [],
    allergies: []
  });

  const [newItems, setNewItems] = useState({
    foodRestrictions: '',
    medicalRestrictions: '',
    allergies: ''
  });

  const [editing, setEditing] = useState<{ type: PreferenceField; index: number; value: string } | null>(null);

  useEffect(() => {
    const storedPrefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICAL_PREFERENCES) || '{}');
    const userPrefs = storedPrefs[user?.id || ''];

    if (userPrefs) {
      setPreferences(normalizePreferences(userPrefs));
    }
  }, [user]);

  const handleSave = () => {
    const allPrefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICAL_PREFERENCES) || '{}');
    allPrefs[user?.id || ''] = preferences;
    localStorage.setItem(STORAGE_KEYS.MEDICAL_PREFERENCES, JSON.stringify(allPrefs));
    toast.success('Preferências atualizadas com sucesso');
  };

  const handleRestore = () => {
    const defaultPrefs: MedicalPreferences = {
      foodRestrictions: [],
      medicalRestrictions: [],
      allergies: []
    };
    setPreferences(defaultPrefs);

    const allPrefs = JSON.parse(localStorage.getItem(STORAGE_KEYS.MEDICAL_PREFERENCES) || '{}');
    allPrefs[user?.id || ''] = defaultPrefs;
    localStorage.setItem(STORAGE_KEYS.MEDICAL_PREFERENCES, JSON.stringify(allPrefs));
    toast.success('Preferências restauradas para o padrão');
  };

  const handleAddItem = (type: PreferenceField) => {
    const value = newItems[type].trim();
    if (!value) {
      toast.error('Digite um valor antes de adicionar');
      return;
    }

    setPreferences({
      ...preferences,
      [type]: [...preferences[type], value]
    });

    setNewItems({ ...newItems, [type]: '' });
    toast.success('Item adicionado');
  };

  const handleDeleteItem = (type: PreferenceField, index: number) => {
    setPreferences({
      ...preferences,
      [type]: preferences[type].filter((_, i) => i !== index)
    });
    toast.success('Item removido');
  };

  const handleStartEdit = (type: PreferenceField, index: number, value: string) => {
    setEditing({ type, index, value });
  };

  const handleSaveEdit = () => {
    if (!editing) return;

    const { type, index, value } = editing;
    const updatedArray = [...preferences[type]];
    updatedArray[index] = value;

    setPreferences({
      ...preferences,
      [type]: updatedArray
    });

    setEditing(null);
    toast.success('Item atualizado');
  };

  const handleCancelEdit = () => {
    setEditing(null);
  };

  const fieldConfigs: { type: PreferenceField; label: string; placeholder: string }[] = [
    { type: 'foodRestrictions', label: 'Restrições Alimentares', placeholder: 'Ex: Intolerância à lactose' },
    { type: 'medicalRestrictions', label: 'Restrições Médicas', placeholder: 'Ex: Diabetes, hipertensão' },
    { type: 'allergies', label: 'Alergias', placeholder: 'Ex: Penicilina, amendoim' },
  ];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Preferências Médicas</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Informe suas restrições e alergias</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle size={24} className="text-blue-600 dark:text-blue-400" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Informações Médicas</h2>
          </div>

          <div className="space-y-6">
            {fieldConfigs.map(({ type, label, placeholder }) => (
              <TagListEditor
                key={type}
                label={label}
                items={preferences[type]}
                newValue={newItems[type]}
                onNewValueChange={(value) => setNewItems({ ...newItems, [type]: value })}
                onAdd={() => handleAddItem(type)}
                placeholder={placeholder}
                editingIndex={editing?.type === type ? editing.index : null}
                editingValue={editing?.type === type ? editing.value : ''}
                onEditingValueChange={(value) => setEditing((prev) => (prev ? { ...prev, value } : prev))}
                onStartEdit={(index, value) => handleStartEdit(type, index, value)}
                onSaveEdit={handleSaveEdit}
                onCancelEdit={handleCancelEdit}
                onDelete={(index) => handleDeleteItem(type, index)}
              />
            ))}
          </div>
        </Card>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6 dark:bg-yellow-950/30 dark:border-yellow-800">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-yellow-600 dark:text-yellow-400 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 dark:text-yellow-200 mb-1">Importante</h3>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                Essas informações são importantes para sua segurança. Mantenha sempre atualizadas
                e informe aos profissionais de saúde.
              </p>
            </div>
          </div>
        </div>

        <div className="flex space-x-3">
          <Button variant="secondary" className="flex-1" onClick={handleRestore}>
            <RotateCcw size={20} className="mr-2" />
            Limpar Tudo
          </Button>
          <Button className="flex-1" onClick={handleSave}>
            <Save size={20} className="mr-2" />
            Salvar Preferências
          </Button>
        </div>
      </div>
    </div>
  );
};
