import React, { useState, useEffect } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { User, Save, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '../../context/AuthContext';

export const UserProfile: React.FC = () => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    surname: '',
    email: ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  useEffect(() => {
    const fichas = JSON.parse(localStorage.getItem('sennex_fichas') || '[]');
    const userFicha = fichas.find((f: any) => f.userId === user?.id);

    if (userFicha) {
      setFormData({
        name: userFicha.name || '',
        surname: userFicha.surname || '',
        email: userFicha.email || ''
      });
    } else if (user) {
      setFormData({
        name: user.name || '',
        surname: '',
        email: user.email || ''
      });
    }
  }, [user]);

  const handleSave = () => {
    if (!formData.name || !formData.email) {
      toast.error('Nome e e-mail são obrigatórios');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error('E-mail inválido');
      return;
    }

    const fichas = JSON.parse(localStorage.getItem('sennex_fichas') || '[]');
    const userFichaIndex = fichas.findIndex((f: any) => f.userId === user?.id);

    const userData = {
      userId: user?.id,
      name: formData.name,
      surname: formData.surname,
      email: formData.email
    };

    if (userFichaIndex !== -1) {
      fichas[userFichaIndex] = userData;
    } else {
      fichas.push(userData);
    }

    localStorage.setItem('sennex_fichas', JSON.stringify(fichas));
    toast.success('Dados atualizados com sucesso');
  };

  const handleChangePassword = () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('Preencha todos os campos de senha');
      return;
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('A nova senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    const users = JSON.parse(localStorage.getItem('sennex_users') || '[]');
    const userIndex = users.findIndex((u: any) => u.id === user?.id);

    if (userIndex === -1) {
      toast.error('Usuário não encontrado');
      return;
    }

    if (users[userIndex].password !== passwordData.currentPassword) {
      toast.error('Senha atual incorreta');
      return;
    }

    users[userIndex].password = passwordData.newPassword;
    localStorage.setItem('sennex_users', JSON.stringify(users));

    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    });

    toast.success('Senha alterada com sucesso');
  };

  return (
    <div className="p-8">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600 mt-1">Gerencie suas informações pessoais</p>
        </div>

        <Card className="mb-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <User size={24} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Dados Pessoais</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Nome"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Digite seu nome"
            />

            <Input
              label="Sobrenome"
              value={formData.surname}
              onChange={(e) => setFormData({ ...formData, surname: e.target.value })}
              placeholder="Digite seu sobrenome"
            />

            <Input
              label="E-mail"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="seu@email.com"
            />
          </div>

          <div className="mt-6">
            <Button onClick={handleSave} className="w-full">
              <Save size={20} className="mr-2" />
              Salvar Alterações
            </Button>
          </div>
        </Card>

        <Card>
          <div className="flex items-center space-x-3 mb-6">
            <div className="bg-blue-100 p-3 rounded-lg">
              <Lock size={24} className="text-blue-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Alterar Senha</h2>
          </div>

          <div className="space-y-4">
            <Input
              label="Senha Atual"
              type="password"
              value={passwordData.currentPassword}
              onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
              placeholder="Digite sua senha atual"
            />

            <Input
              label="Nova Senha"
              type="password"
              value={passwordData.newPassword}
              onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
              placeholder="Digite a nova senha"
            />

            <Input
              label="Confirmar Nova Senha"
              type="password"
              value={passwordData.confirmPassword}
              onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
              placeholder="Confirme a nova senha"
            />
          </div>

          <div className="mt-6">
            <Button onClick={handleChangePassword} className="w-full">
              <Lock size={20} className="mr-2" />
              Alterar Senha
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};
