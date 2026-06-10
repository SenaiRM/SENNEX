import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';

interface User {
  id: string;
  name: string;
  email: string;
  profile: string;
  active: boolean;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('sennex_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('sennex_users') || '[]');
    const foundUser = users.find((u: any) => u.email === email && u.password === password);

    if (foundUser) {
      const userWithoutPassword = { ...foundUser };
      delete userWithoutPassword.password;
      setUser(userWithoutPassword);
      localStorage.setItem('sennex_user', JSON.stringify(userWithoutPassword));
    } else {
      throw new Error('E-mail ou senha incorretos');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('sennex_user');
    toast.success('Logout realizado com sucesso');
  };

  const register = async (name: string, email: string, password: string) => {
    const users = JSON.parse(localStorage.getItem('sennex_users') || '[]');

    if (users.find((u: any) => u.email === email)) {
      throw new Error('O e-mail informado já está cadastrado');
    }

    const newUser = {
      id: Date.now().toString(),
      name,
      email,
      password,
      profile: 'Paciente',
      active: true
    };

    users.push(newUser);
    localStorage.setItem('sennex_users', JSON.stringify(users));

    const ficha = {
      userId: newUser.id,
      name: name.split(' ')[0] || '',
      surname: name.split(' ').slice(1).join(' ') || '',
      email: email
    };

    const fichas = JSON.parse(localStorage.getItem('sennex_fichas') || '[]');
    fichas.push(ficha);
    localStorage.setItem('sennex_fichas', JSON.stringify(fichas));
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        isAuthenticated: !!user
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
