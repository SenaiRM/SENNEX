import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { toast } from 'sonner';

interface ResetPasswordProps {
  onNavigate: (route: string) => void;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigate }) => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<any>({});

  const validate = () => {
    const newErrors: any = {};

    if (!password) {
      newErrors.password = 'Preencha todos os campos obrigatórios';
    } else if (password.length < 8) {
      newErrors.password = 'A senha deve conter no mínimo 8 caracteres';
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate()) return;

    toast.success('Senha redefinida com sucesso');
    setTimeout(() => onNavigate('login'), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src="/src/imports/Gemini_Generated_Image_91hvjp91hvjp91hv-removebg-preview.png"
            alt="SENNEX Logo"
            className="h-40 w-auto mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-gray-900">Redefinir Senha</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nova Senha"
            type="password"
            placeholder="Mínimo 8 caracteres"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={errors.password}
          />

          <Input
            label="Confirmar Nova Senha"
            type="password"
            placeholder="Digite a senha novamente"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={errors.confirmPassword}
          />

          <Button type="submit" className="w-full" size="lg">
            Redefinir Senha
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('login')}
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar para o login
          </button>
        </div>
      </Card>
    </div>
  );
};
