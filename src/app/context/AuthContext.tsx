import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from 'sonner';
import { STORAGE_KEYS, DEFAULT_ADMIN } from '../lib/storage';
import { UserRecord } from '../types';

type SessionUser = Omit<UserRecord, 'password'>;

interface AuthContextType {
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (name: string, email: string, password: string) => Promise<void>;
  resetPassword: (email: string, newPassword: string) => Promise<void>;
  updateUser: (updates: Partial<Pick<UserRecord, 'name' | 'email'>>) => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<SessionUser | null>(null);

  useEffect(() => {
    seedDefaultAdminIfNeeded();

    const savedUser = localStorage.getItem(STORAGE_KEYS.USER);
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const seedDefaultAdminIfNeeded = () => {
    const users: UserRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const hasAdmin = users.some((u) => u.profile === 'Administrador');
    const emailTaken = users.some((u) => u.email === DEFAULT_ADMIN.email);
    if (hasAdmin || emailTaken) return;

    const admin: UserRecord = {
      id: Date.now().toString(),
      name: DEFAULT_ADMIN.name,
      email: DEFAULT_ADMIN.email,
      password: DEFAULT_ADMIN.password,
      profile: 'Administrador',
      active: true
    };

    users.push(admin);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  };

  const login = async (email: string, password: string) => {
    const users: UserRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const foundUser = users.find((u) => u.email === email && u.password === password);

    if (foundUser) {
      const { password: _password, ...userWithoutPassword } = foundUser;
      setUser(userWithoutPassword);
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(userWithoutPassword));
    } else {
      throw new Error('E-mail ou senha incorretos');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEYS.USER);
    toast.success('Logout realizado com sucesso');
  };

  const register = async (name: string, email: string, password: string) => {
    const users: UserRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');

    if (users.find((u) => u.email === email)) {
      throw new Error('O e-mail informado já está cadastrado');
    }

    const newUser: UserRecord = {
      id: Date.now().toString(),
      name,
      email,
      password,
      profile: 'Paciente',
      active: true
    };

    users.push(newUser);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));

    const ficha = {
      userId: newUser.id,
      name: name.split(' ')[0] || '',
      surname: name.split(' ').slice(1).join(' ') || '',
      email: email
    };

    const fichas = JSON.parse(localStorage.getItem(STORAGE_KEYS.FICHAS) || '[]');
    fichas.push(ficha);
    localStorage.setItem(STORAGE_KEYS.FICHAS, JSON.stringify(fichas));
  };

  const resetPassword = async (email: string, newPassword: string) => {
    const users: UserRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userIndex = users.findIndex((u) => u.email === email);

    if (userIndex === -1) {
      throw new Error('E-mail não encontrado');
    }

    users[userIndex] = { ...users[userIndex], password: newPassword };
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  };

  const updateUser = (updates: Partial<Pick<UserRecord, 'name' | 'email'>>) => {
    if (!user) return;

    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updatedUser));

    const users: UserRecord[] = JSON.parse(localStorage.getItem(STORAGE_KEYS.USERS) || '[]');
    const userIndex = users.findIndex((u) => u.id === user.id);
    if (userIndex !== -1) {
      users[userIndex] = { ...users[userIndex], ...updates };
      localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        register,
        resetPassword,
        updateUser,
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
