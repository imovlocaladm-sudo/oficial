import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in on mount
    const storedUser = localStorage.getItem('imovlocal_user');
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData.user);
      } catch (error) {
        console.error('Error parsing stored user:', error);
        localStorage.removeItem('imovlocal_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    const response = await authAPI.login({ email, password });
    localStorage.setItem('imovlocal_user', JSON.stringify(response));
    setUser(response.user);
    return response;
  };

  const register = async (userData) => {
    const response = await authAPI.register(userData);
    
    // Fazer login automático (mesmo para usuários pending)
    if (response.access_token) {
      localStorage.setItem('imovlocal_user', JSON.stringify(response));
      setUser(response.user);
    }
    
    return response;
  };

  const logout = () => {
    localStorage.removeItem('imovlocal_user');
    setUser(null);
  };

  // Função para atualizar os dados do usuário no contexto e localStorage
  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    
    // Atualizar localStorage mantendo o token
    const storedData = localStorage.getItem('imovlocal_user');
    if (storedData) {
      try {
        const parsedData = JSON.parse(storedData);
        parsedData.user = updatedUserData;
        localStorage.setItem('imovlocal_user', JSON.stringify(parsedData));
      } catch (error) {
        console.error('Error updating stored user:', error);
      }
    }
  };

  const isAuthenticated = () => {
    return user !== null;
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
