import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { AlertCircle, Save, RotateCcw, Plus, Edit, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const Preferences: React.FC = () => {
  const { user } = useAuth();
  const [preferences, setPreferences] = useState({
    foodRestrictions: [] as string[],
    medicalRestrictions: [] as string[],
    allergies: [] as string[]
  });

  const [newItems, setNewItems] = useState({
    foodRestriction: '',
    medicalRestriction: '',
    allergy: ''
  });

  const [editing, setEditing] = useState<{ type: string; index: number; value: string } | null>(null);

  useEffect(() => {
    const storedPrefs = JSON.parse(localStorage.getItem('sennex_medical_preferences') || '{}');
    const userPrefs = storedPrefs[user?.id || ''];

    if (userPrefs) {
      // Migração de dados antigos (string) para novo formato (array)
      const migratedPrefs = {
        foodRestrictions: Array.isArray(userPrefs.foodRestrictions)
          ? userPrefs.foodRestrictions
          : (userPrefs.foodRestrictions ? [userPrefs.foodRestrictions] : []),
        medicalRestrictions: Array.isArray(userPrefs.medicalRestrictions)
          ? userPrefs.medicalRestrictions
          : (userPrefs.medicalRestrictions ? [userPrefs.medicalRestrictions] : []),
        allergies: Array.isArray(userPrefs.allergies)
          ? userPrefs.allergies
          : (userPrefs.allergies ? [userPrefs.allergies] : [])
      };
      setPreferences(migratedPrefs);
    }
  }, [user]);

  const handleSave = () => {
    const allPrefs = JSON.parse(localStorage.getItem('sennex_medical_preferences') || '{}');
    allPrefs[user?.id || ''] = preferences;
    localStorage.setItem('sennex_medical_preferences', JSON.stringify(allPrefs));
    toast.success('Preferências atualizadas com sucesso');
  };

  const handleRestore = () => {
    const defaultPrefs = {
      foodRestrictions: [],
      medicalRestrictions: [],
      allergies: []
    };
    setPreferences(defaultPrefs);

    const allPrefs = JSON.parse(localStorage.getItem('sennex_medical_preferences') || '{}');
    allPrefs[user?.id || ''] = defaultPrefs;
    localStorage.setItem('sennex_medical_preferences', JSON.stringify(allPrefs));
    toast.success('Preferências restauradas para o padrão');
  };

  const handleAddItem = (type: 'foodRestrictions' | 'medicalRestrictions' | 'allergies', inputKey: 'foodRestriction' | 'medicalRestriction' | 'allergy') => {
    const value = newItems[inputKey].trim();
    if (!value) {
      toast.error('Digite um valor antes de adicionar');
      return;
    }

    setPreferences({
      ...preferences,
      [type]: [...preferences[type], value]
    });

    setNewItems({ ...newItems, [inputKey]: '' });
    toast.success('Item adicionado');
  };

  const handleDeleteItem = (type: 'foodRestrictions' | 'medicalRestrictions' | 'allergies', index: number) => {
    setPreferences({
      ...preferences,
      [type]: preferences[type].filter((_, i) => i !== index)
    });
    toast.success('Item removido');
  };

  const handleStartEdit = (type: string, index: number, value: string) => {
    setEditing({ type, index, value });
  };

  const handleSaveEdit = () => {
    if (!editing) return;

    const { type, index, value } = editing;
    const updatedArray = [...preferences[type as keyof typeof preferences]];
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

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Preferências Médicas</h1>
          <p className="text-gray-600 mt-1">Informe suas restrições e alergias</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <AlertCircle size={24} className="text-blue-600" />
            <h2 className="text-xl font-bold text-gray-900">Informações Médicas</h2>
          </div>

          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Restrições Alimentares
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newItems.foodRestriction}
                  onChange={(e) => setNewItems({ ...newItems, foodRestriction: e.target.value })}
                  placeholder="Ex: Intolerância à lactose"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem('foodRestrictions', 'foodRestriction');
                    }
                  }}
                />
                <Button onClick={() => handleAddItem('foodRestrictions', 'foodRestriction')}>
                  <Plus size={20} />
                </Button>
              </div>
              {preferences.foodRestrictions.length > 0 && (
                <div className="space-y-2">
                  {preferences.foodRestrictions.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {editing?.type === 'foodRestrictions' && editing.index === index ? (
                        <>
                          <Input
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
                          <Button size="sm" variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-gray-900">{item}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit('foodRestrictions', index, item)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteItem('foodRestrictions', index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Restrições Médicas
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newItems.medicalRestriction}
                  onChange={(e) => setNewItems({ ...newItems, medicalRestriction: e.target.value })}
                  placeholder="Ex: Diabetes, hipertensão"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem('medicalRestrictions', 'medicalRestriction');
                    }
                  }}
                />
                <Button onClick={() => handleAddItem('medicalRestrictions', 'medicalRestriction')}>
                  <Plus size={20} />
                </Button>
              </div>
              {preferences.medicalRestrictions.length > 0 && (
                <div className="space-y-2">
                  {preferences.medicalRestrictions.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {editing?.type === 'medicalRestrictions' && editing.index === index ? (
                        <>
                          <Input
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
                          <Button size="sm" variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-gray-900">{item}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit('medicalRestrictions', index, item)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteItem('medicalRestrictions', index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Alergias
              </label>
              <div className="flex gap-2 mb-3">
                <Input
                  value={newItems.allergy}
                  onChange={(e) => setNewItems({ ...newItems, allergy: e.target.value })}
                  placeholder="Ex: Penicilina, amendoim"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddItem('allergies', 'allergy');
                    }
                  }}
                />
                <Button onClick={() => handleAddItem('allergies', 'allergy')}>
                  <Plus size={20} />
                </Button>
              </div>
              {preferences.allergies.length > 0 && (
                <div className="space-y-2">
                  {preferences.allergies.map((item, index) => (
                    <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                      {editing?.type === 'allergies' && editing.index === index ? (
                        <>
                          <Input
                            value={editing.value}
                            onChange={(e) => setEditing({ ...editing, value: e.target.value })}
                            className="flex-1"
                          />
                          <Button size="sm" onClick={handleSaveEdit}>Salvar</Button>
                          <Button size="sm" variant="secondary" onClick={handleCancelEdit}>Cancelar</Button>
                        </>
                      ) : (
                        <>
                          <span className="flex-1 text-gray-900">{item}</span>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleStartEdit('allergies', index, item)}
                          >
                            <Edit size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="danger"
                            onClick={() => handleDeleteItem('allergies', index)}
                          >
                            <Trash2 size={16} />
                          </Button>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Card>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start space-x-3">
            <AlertCircle size={20} className="text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-medium text-yellow-900 mb-1">Importante</h3>
              <p className="text-sm text-yellow-800">
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
