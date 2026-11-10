import React, { useEffect, useState } from 'react';
import { Input } from '../ui/Input';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { toast } from 'sonner';
import logo from '../../assets/logo';
import { useAuth } from '../../context/AuthContext';
import { validatePassword, validatePasswordsMatch } from '../../lib/validation';
import { RESET_EMAIL_SESSION_KEY } from '../../lib/storage';

interface ResetPasswordProps {
  onNavigate: (route: string) => void;
}

interface ResetPasswordErrors {
  password?: string;
  confirmPassword?: string;
}

export const ResetPassword: React.FC<ResetPasswordProps> = ({ onNavigate }) => {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState<string | null>(null);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<ResetPasswordErrors>({});

  useEffect(() => {
    const resetEmail = sessionStorage.getItem(RESET_EMAIL_SESSION_KEY);
    if (!resetEmail) {
      onNavigate('forgot-password');
      return;
    }
    setEmail(resetEmail);
  }, [onNavigate]);

  const validate = () => {
    const newErrors: ResetPasswordErrors = {};

    const passwordError = validatePassword(password);
    if (passwordError) newErrors.password = passwordError;

    const confirmError = validatePasswordsMatch(password, confirmPassword);
    if (confirmError) newErrors.confirmPassword = confirmError;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email || !validate()) return;

    try {
      await resetPassword(email, password);
      sessionStorage.removeItem(RESET_EMAIL_SESSION_KEY);
      toast.success('Senha redefinida com sucesso');
      setTimeout(() => onNavigate('login'), 1500);
    } catch (error: any) {
      toast.error(error.message);
    }
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
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Redefinir Senha</h2>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nova Senha"
            type="password"
            placeholder="Mínimo 6 caracteres"
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
            className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
          >
            Voltar para o login
          </button>
        </div>
      </Card>
    </div>
  );
};
