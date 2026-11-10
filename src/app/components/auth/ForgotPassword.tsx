import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { toast } from 'sonner';
import logo from '../../assets/logo';
import { validateEmail } from '../../lib/validation';
import { STORAGE_KEYS, RESET_EMAIL_SESSION_KEY } from '../../lib/storage';
import { UserRecord } from '../../types';

interface ForgotPasswordProps {
  onNavigate: (route: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const users: UserRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userExists = users.find((u) => u.email === email);

    if (!userExists) {
      toast.error('E-mail não encontrado');
      return;
    }

    sessionStorage.setItem(RESET_EMAIL_SESSION_KEY, email);
    toast.success('Instruções para recuperação de senha enviadas para o e-mail informado');
    setTimeout(() => onNavigate('reset-password'), 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <div className="text-center mb-8">
          <img
            src={logo}
            alt="SENNEX Logo"
            className="h-40 w-auto mx-auto mb-4"
          />
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Recuperar Senha</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="E-mail"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setError('');
            }}
            error={error}
          />

          <Button type="submit" className="w-full" size="lg">
            Enviar Instruções
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => onNavigate('login')}
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Voltar para o login
          </button>
        </div>
      </Card>
    </div>
  );
};
