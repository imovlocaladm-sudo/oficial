import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, LogIn, Bell, CreditCard } from 'lucide-react';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { notificationsAPI } from '../services/api';

const Header = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Buscar contagem de notificações não lidas
  useEffect(() => {
    const fetchUnreadCount = async () => {
      if (isAuthenticated() && user) {
        try {
          const data = await notificationsAPI.getUnreadCount();
          setUnreadCount(data.unread_count || 0);
        } catch (error) {
          console.error('Error fetching unread count:', error);
        }
      }
    };

    fetchUnreadCount();
    
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [isAuthenticated, user]);

  return (
    <>
      {/* Top Bar */}
      <div className="bg-gray-800 text-white py-2">
        <div className="container mx-auto px-4 flex justify-end items-center gap-4 text-sm">
          {isAuthenticated() && user && (
            <button
              onClick={() => navigate('/admin/notificacoes')}
              className="hover:text-red-400 transition-colors flex items-center gap-1 relative"
            >
              <Bell size={14} />
              Notificações
              {unreadCount > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}
          <button 
            onClick={() => navigate('/cadastro')}
            className="hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <User size={14} />
            Cadastre-se
          </button>
          <button
            onClick={() => navigate(isAuthenticated() ? '/admin/dashboard' : '/login')}
            className="hover:text-red-400 transition-colors flex items-center gap-1"
          >
            <LogIn size={14} />
            {isAuthenticated() ? 'Dashboard' : 'Área administrativa'}
          </button>
        </div>
      </div>

      {/* Main Header */}
      <header className="bg-white shadow-md sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between py-4">
            {/* Logo */}
            <Link to="/" className="flex items-center">
              <div className="flex items-center gap-3">
                <img 
                  src="/assets/images/logo/logo-principal.png" 
                  alt="ImovLocal - Portal Imobiliário"
                  className="h-12 w-auto md:h-14 lg:h-16 hover:scale-105 transition-transform duration-300"
                  data-testid="logo-header"
                />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-6">
              <Link to="/" className="text-gray-700 hover:text-red-600 transition-colors font-medium">Início</Link>
              <Link to="/destaques" className="text-gray-700 hover:text-red-600 transition-colors font-medium">Destaques</Link>
              <Link to="/lancamentos" className="text-gray-700 hover:text-red-600 transition-colors font-medium">Lançamentos</Link>
              <Link to="/busca-detalhada" className="text-gray-700 hover:text-red-600 transition-colors font-medium">Busca Detalhada</Link>
              <Link to="/planos" className="text-green-600 hover:text-green-700 transition-colors font-semibold flex items-center gap-1">
                <CreditCard size={16} />
                Planos
              </Link>
              <Link to="/anunciar" className="text-red-600 hover:text-red-700 transition-colors font-semibold">Anunciar</Link>
              <Link to="/solicitar" className="text-gray-700 hover:text-red-600 transition-colors font-medium">Solicite um imóvel</Link>
            </nav>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden text-gray-700 hover:text-red-600"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <nav className="lg:hidden py-4 border-t">
              <div className="flex flex-col gap-3">
                <Link to="/" className="text-gray-700 hover:text-red-600 transition-colors py-2">Início</Link>
                <Link to="/destaques" className="text-gray-700 hover:text-red-600 transition-colors py-2">Destaques</Link>
                <Link to="/lancamentos" className="text-gray-700 hover:text-red-600 transition-colors py-2">Lançamentos</Link>
                <Link to="/busca-detalhada" className="text-gray-700 hover:text-red-600 transition-colors py-2">Busca Detalhada</Link>
                <Link to="/anunciar" className="text-red-600 hover:text-red-700 transition-colors py-2 font-semibold">Anunciar</Link>
                <Link to="/solicitar" className="text-gray-700 hover:text-red-600 transition-colors py-2">Solicite um imóvel</Link>
              </div>
            </nav>
          )}
        </div>
      </header>
    </>
  );
};

export default Header;
