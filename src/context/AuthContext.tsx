import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, LoginDto, RegisterDto, UserRole } from '../types';
import { authApi } from '../api';
import { getStoredToken } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isResearcher: boolean;
  canEdit: boolean;
  login: (credentials: LoginDto) => Promise<void>;
  register: (data: RegisterDto) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const currentUser = await authApi.getCurrentUser();
      setUser(currentUser);
    } catch {
      // If token expired or network fails
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initSession();

    const handleUnauthorized = () => {
      setUser(null);
    };

    window.addEventListener('htr:auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('htr:auth:unauthorized', handleUnauthorized);
    };
  }, [initSession]);

  const login = async (credentials: LoginDto) => {
    setIsLoading(true);
    try {
      const response = await authApi.login(credentials);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterDto) => {
    setIsLoading(true);
    try {
      const response = await authApi.register(data);
      setUser(response.user);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const updated = await authApi.getCurrentUser();
      setUser(updated);
    } catch {
      // ignored
    }
  };

  const isAdmin = user?.role === 'admin';
  const isResearcher = user?.role === 'researcher' || isAdmin;
  const canEdit = user?.role === 'admin' || user?.role === 'researcher' || user?.role === 'annotator';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isAdmin,
        isResearcher,
        canEdit,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
