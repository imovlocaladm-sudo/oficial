import React, { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { 
  Home, Users, Building, Shield, LogOut, Bell
} from 'lucide-react';

const AdminSeniorDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  useEffect(() => {
    // Verificar se é admin senior
    if (user?.user_type !== 'admin_senior') {
      navigate('/');
      return;
    }
  }, [user, navigate]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Admin Senior Header */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <Shield size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Painel Admin Sênior</h1>
                <p className="text-blue-100">Gerenciamento de Usuários e Imóveis - {user?.name}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Link to="/">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Home size={18} className="mr-2" />
                  Voltar ao Site
                </Button>
              </Link>
              <Button 
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-white/20"
                onClick={logout}
              >
                <LogOut size={18} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Card */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Bem-vindo, {user?.name}!</h2>
          <p className="text-gray-600">
            Você tem acesso às funcionalidades de gerenciamento de usuários e imóveis.
          </p>
          <div className="mt-4 p-4 bg-blue-50 border-l-4 border-blue-600 rounded">
            <p className="text-sm text-blue-800">
              <strong>Suas Permissões:</strong> Gerenciar Usuários, Gerenciar Imóveis, Gerenciar Banners
            </p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">Ações Rápidas</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Gerenciar Usuários */}
            <Link to="/admin/master/users">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-blue-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-blue-100 p-3 rounded-full">
                    <Users className="text-blue-600" size={24} />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">7</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Gerenciar Usuários</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Visualizar, adicionar, editar e gerenciar todos os usuários do sistema.
                </p>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  <Users size={18} className="mr-2" />
                  Gerenciar Usuários
                </Button>
              </div>
            </Link>

            {/* Gerenciar Imóveis */}
            <Link to="/admin/master/properties">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-green-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <Building className="text-green-600" size={24} />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">14</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Gerenciar Imóveis</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Visualizar e gerenciar todos os imóveis cadastrados na plataforma.
                </p>
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  <Building size={18} className="mr-2" />
                  Gerenciar Imóveis
                </Button>
              </div>
            </Link>

            {/* Gerenciar Banners */}
            <Link to="/admin/master/banners">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-purple-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-purple-100 p-3 rounded-full">
                    <Shield className="text-purple-600" size={24} />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">•••</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Gerenciar Banners</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Adicionar, editar e remover banners publicitários do site.
                </p>
                <Button className="w-full bg-purple-600 hover:bg-purple-700">
                  <Shield size={18} className="mr-2" />
                  Gerenciar Banners
                </Button>
              </div>
            </Link>

            {/* Enviar Notificações */}
            <Link to="/admin/senior/notificacoes">
              <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-xl transition-shadow cursor-pointer border-2 border-transparent hover:border-orange-500">
                <div className="flex items-center justify-between mb-4">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Bell className="text-orange-600" size={24} />
                  </div>
                  <span className="text-3xl font-bold text-gray-800">📢</span>
                </div>
                <h4 className="text-lg font-semibold text-gray-800 mb-2">Enviar Notificações</h4>
                <p className="text-sm text-gray-600 mb-4">
                  Enviar comunicados segmentados para usuários da plataforma.
                </p>
                <Button className="w-full bg-orange-600 hover:bg-orange-700">
                  <Bell size={18} className="mr-2" />
                  Enviar Notificações
                </Button>
              </div>
            </Link>
          </div>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">📋 Suas Responsabilidades</h3>
            <ul className="space-y-2 text-sm">
              <li>✅ Aprovar novos usuários</li>
              <li>✅ Gerenciar perfis de usuários</li>
              <li>✅ Moderar conteúdo de imóveis</li>
              <li>✅ Administrar banners publicitários</li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg shadow-lg p-6 text-white">
            <h3 className="text-xl font-bold mb-2">⚠️ Limitações de Acesso</h3>
            <ul className="space-y-2 text-sm">
              <li>❌ Dashboard Admin Master</li>
              <li>❌ Mural de Oportunidades</li>
              <li>❌ Editar Admin Master ou Admin Sênior</li>
              <li>❌ Configurações avançadas do sistema</li>
            </ul>
          </div>
        </div>

        {/* Help Section */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-4">💡 Precisa de Ajuda?</h3>
          <p className="text-gray-600 mb-4">
            Se você encontrar algum problema ou precisar de permissões adicionais, entre em contato com o Admin Master.
          </p>
          <div className="flex gap-4">
            <Button variant="outline">
              Documentação
            </Button>
            <Button variant="outline">
              Suporte
            </Button>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminSeniorDashboard;
