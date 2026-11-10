import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { Search, UserPlus, Edit, UserCheck, UserX } from 'lucide-react';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '../../lib/storage';
import { UserRecord, Ficha } from '../../types';

const DEFAULT_NEW_USER_PASSWORD = '123456';

export const Users: React.FC = () => {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRecord | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', profile: 'Paciente' });

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    const storedUsers: UserRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    setUsers(storedUsers);
  };

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openCreateModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', profile: 'Paciente' });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', profile: 'Paciente' });
  };

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    if (editingUser) {
      const updatedUsers = users.map((u) =>
        u.id === editingUser.id ? { ...u, ...formData } : u
      );
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);
      toast.success('Usuário atualizado com sucesso');
    } else {
      if (users.find((u) => u.email === formData.email)) {
        toast.error('O e-mail informado já está cadastrado');
        return;
      }

      const newUser: UserRecord = {
        id: Date.now().toString(),
        name: formData.name,
        email: formData.email,
        password: DEFAULT_NEW_USER_PASSWORD,
        profile: formData.profile,
        active: true
      };

      const updatedUsers = [...users, newUser];
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
      setUsers(updatedUsers);

      const fichas: Ficha[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.FICHAS) || '[]');
      fichas.push({
        userId: newUser.id,
        name: formData.name.split(' ')[0] || '',
        surname: formData.name.split(' ').slice(1).join(' ') || '',
        email: formData.email
      });
      localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));

      toast.success('Usuário cadastrado com sucesso');
    }

    closeModal();
  };

  const handleEdit = (user: UserRecord) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, profile: user.profile });
    setShowModal(true);
  };

  const toggleUserStatus = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    if (targetUser.active && !confirm('Deseja realmente inativar este usuário?')) return;

    const updatedUsers = users.map((u) =>
      u.id === userId ? { ...u, active: !u.active } : u
    );
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updatedUsers));
    setUsers(updatedUsers);

    toast.success(
      targetUser.active ? 'Usuário inativado com sucesso' : 'Usuário ativado com sucesso'
    );
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">Gerenciamento de Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Visualize e gerencie os usuários do sistema</p>
        </div>
        <Button onClick={openCreateModal} className="w-full sm:w-auto shrink-0">
          <UserPlus size={20} className="mr-2" />
          Novo Usuário
        </Button>
      </div>

      <Card className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={20} />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </Card>

      {filteredUsers.length === 0 ? (
        <Card>
          <p className="text-center text-gray-500 dark:text-gray-400 py-8">Nenhum usuário encontrado</p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredUsers.map((user) => (
            <Card key={user.id} className="hover:shadow-md transition-shadow">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center space-x-4 min-w-0">
                  <div className="w-12 h-12 shrink-0 bg-blue-100 dark:bg-blue-900/40 rounded-full flex items-center justify-center">
                    <span className="text-blue-600 dark:text-blue-400 font-bold text-lg">
                      {user.name.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-bold text-gray-900 dark:text-gray-100 break-words">{user.name}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 break-all">{user.email}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className="text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 px-2 py-1 rounded">
                        {user.profile}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          user.active
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300'
                            : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300'
                        }`}
                      >
                        {user.active ? 'Ativo' : 'Inativo'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    onClick={() => handleEdit(user)}
                  >
                    <Edit size={16} className="mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant={user.active ? 'danger' : 'secondary'}
                    size="sm"
                    className="flex-1 sm:flex-none"
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

      <Modal open={showModal}>
        <Card className="w-full max-w-md">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {editingUser ? 'Editar Usuário' : 'Novo Usuário'}
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                Perfil
              </label>
              <select
                value={formData.profile}
                onChange={(e) => setFormData({ ...formData, profile: e.target.value })}
                className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Paciente">Paciente</option>
                <option value="Médico">Médico</option>
                <option value="Administrador">Administrador</option>
              </select>
            </div>

            {!editingUser && (
              <p className="text-sm text-gray-500 dark:text-gray-400">
                O usuário será criado com a senha padrão "{DEFAULT_NEW_USER_PASSWORD}".
              </p>
            )}

            <div className="flex space-x-3 mt-6">
              <Button variant="secondary" className="flex-1" onClick={closeModal}>
                Cancelar
              </Button>
              <Button className="flex-1" onClick={handleSave}>
                {editingUser ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </div>
        </Card>
      </Modal>
    </div>
  );
};
