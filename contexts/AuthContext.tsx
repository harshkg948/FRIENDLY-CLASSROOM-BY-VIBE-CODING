import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { userService } from '../services/mockDatabase';

interface AuthContextType {
  user: User | null;
  login: (email: string) => Promise<boolean>;
  register: (user: User) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const storedUserId = localStorage.getItem('fc_user_id');
    if (storedUserId) {
      const u = userService.getUser(storedUserId);
      if (u) setUser(u);
    }
  }, []);

  const login = async (email: string) => {
    // Simulate API delay
    await new Promise(r => setTimeout(r, 500));
    const u = userService.login(email);
    if (u) {
      setUser(u);
      localStorage.setItem('fc_user_id', u.id);
      return true;
    }
    return false;
  };

  const register = async (newUser: User) => {
    await new Promise(r => setTimeout(r, 500));
    try {
      userService.register(newUser);
      setUser(newUser);
      localStorage.setItem('fc_user_id', newUser.id);
      return true;
    } catch (e) {
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('fc_user_id');
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
