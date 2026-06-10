import React, { useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { toast } from 'sonner';

interface ForgotPasswordProps {
  onNavigate: (route: string) => void;
}

export const ForgotPassword: React.FC<ForgotPasswordProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email) {
      setError('Preencha todos os campos obrigatórios');
      return;
    }

    if (!/\S+@\S+\.\S+/.test(email)) {
      setError('E-mail inválido');
      return;
    }

    const users = JSON.parse(localStorage.getItem('sennex_users') || '[]');
    const userExists = users.find((u: any) => u.email === email);

    if (!userExists) {
      toast.error('E-mail não encontrado');
      return;
    }

    toast.success('Instruções para recuperação de senha enviadas para o e-mail informado');
    setTimeout(() => onNavigate('reset-password'), 1500);
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
          <h2 className="text-xl font-bold text-gray-900">Recuperar Senha</h2>
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
            className="text-blue-600 hover:text-blue-700 font-medium"
          >
            Voltar para o login
          </button>
        </div>
      </Card>
    </div>
  );
};
