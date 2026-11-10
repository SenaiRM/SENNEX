import React from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface TagListEditorProps {
  label: string;
  items: string[];
  newValue: string;
  onNewValueChange: (value: string) => void;
  onAdd: () => void;
  placeholder: string;
  editingIndex: number | null;
  editingValue: string;
  onEditingValueChange: (value: string) => void;
  onStartEdit: (index: number, value: string) => void;
  onSaveEdit: () => void;
  onCancelEdit: () => void;
  onDelete: (index: number) => void;
}

export const TagListEditor: React.FC<TagListEditorProps> = ({
  label,
  items,
  newValue,
  onNewValueChange,
  onAdd,
  placeholder,
  editingIndex,
  editingValue,
  onEditingValueChange,
  onStartEdit,
  onSaveEdit,
  onCancelEdit,
  onDelete,
}) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">{label}</label>
      <div className="flex gap-2 mb-3">
        <Input
          value={newValue}
          onChange={(e) => onNewValueChange(e.target.value)}
          placeholder={placeholder}
          onKeyPress={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              onAdd();
            }
          }}
        />
        <Button onClick={onAdd}>
          <Plus size={20} />
        </Button>
      </div>
      {items.length > 0 && (
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={index} className="flex items-center gap-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              {editingIndex === index ? (
                <>
                  <Input
                    value={editingValue}
                    onChange={(e) => onEditingValueChange(e.target.value)}
                    className="flex-1"
                  />
                  <Button size="sm" onClick={onSaveEdit}>Salvar</Button>
                  <Button size="sm" variant="secondary" onClick={onCancelEdit}>Cancelar</Button>
                </>
              ) : (
                <>
                  <span className="flex-1 text-gray-900 dark:text-gray-100">{item}</span>
                  <Button size="sm" variant="ghost" onClick={() => onStartEdit(index, item)}>
                    <Edit size={16} />
                  </Button>
                  <Button size="sm" variant="danger" onClick={() => onDelete(index)}>
                    <Trash2 size={16} />
                  </Button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
