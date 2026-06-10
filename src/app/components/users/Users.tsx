import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Search, UserPlus, Edit, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [formData, setFormData] = useState({ name: '', email: '', profile: 'Paciente' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const storedUsers = JSON.parse(localStorage.getItem('sennex_users') || '[]');
    setUsers(storedUsers);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingUser) {
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id ? { ...u, ...formData } : u
      );
      localStorage.setItem('sennex_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      toast.success('Usuário atualizado com sucesso');
    }

    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', profile: 'Paciente' });
  };

  const handleEdit = (user: any) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, profile: user.profile });
    setShowModal(true);
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, active: !u.active } : u
    );
    localStorage.setItem('sennex_users', JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    const user = users.find((u) => u.id === userId);
    toast.success(
      user?.active ? 'Usuário inativado com sucesso' : 'Usuário ativado com sucesso'
    );
  };

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 mt-1">Visualize e gerencie os usuários do sistema</p>
        </div>
      </div>

      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {filteredUsers.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 py-8">Nenhum usuário encontrado</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900">{user.name}</h3>
                    <p className="text-sm text-gray-600">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                        {user.profile}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          user.active
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit size={16} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={user.active ? 'danger' : 'secondary'}
                    size="sm"
                    onClick={() => toggleUserStatus(user.id)}
                  >
                    {user.active ? (
                      <>
                        <UserX size={16} className="mr-1" />
                        Inativar
                      </>
                    ) : (
                      <>
                        <UserCheck size={16} className="mr-1" />
                        Ativar
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-md">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">
              Editar Usuário
            </h2>

            <div className="space-y-4">
              <Input
                label="Nome Completo"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <Input
                label="E-mail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Perfil
                </label>
                <select
                  value={formData.profile}
                  onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Paciente">Paciente</option>
                  <option value="Médico">Médico</option>
                  <option value="Administrador">Administrador</option>
                </select>
              </div>

              <div className="flex space-x-3 mt-6">
                <Button
                  variant="secondary"
                  className="flex-1"
                  onClick={() => {
                    setShowModal(false);
                    setEditingUser(null);
                    setFormData({ name: '', email: '', profile: 'Paciente' });
                  }}
                >
                  Cancelar
                </Button>
                <Button className="flex-1" onClick={handleSave}>
                  Salvar
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
};
