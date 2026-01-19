import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { 
  Home, Users, Building, BarChart3, 
  UserCheck, AlertCircle, TrendingUp, Shield, Image, CreditCard
} from 'lucide-react';
import { adminAPIService } from '../../services/adminAPI';
import { toast } from 'sonner';

const AdminMasterDashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState(null);

  useEffect(() => {
    // Verificar se é admin
    if (user?.user_type !== 'admin') {
      toast.error('Acesso negado. Apenas administradores.');
      navigate('/');
      return;
    }
    
    fetchDashboard();
  }, [user, navigate]);

  const fetchDashboard = async () => {
    try {
      const data = await adminAPIService.getDashboard();
      setStats(data);
    } catch (error) {
      console.error('Error fetching dashboard:', error);
      if (error.response?.status === 403) {
        toast.error('Acesso negado. Privilégios de admin necessários.');
        navigate('/');
      } else {
        toast.error('Erro ao carregar dashboard');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando Dashboard Master...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Admin Header */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="bg-white/20 p-4 rounded-full">
                <Shield size={32} />
              </div>
              <div>
                <h1 className="text-3xl font-bold">Painel Admin Master</h1>
                <p className="text-red-100">Controle Total do Sistema - {user?.name}</p>
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
                onClick={logout}
                variant="outline" 
                className="bg-white/10 border-white/20 text-white hover:bg-red-600 hover:border-red-600"
              >
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-blue-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total de Imóveis</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.total_properties || 0}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <Building className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-green-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total de Usuários</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.total_users || 0}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <Users className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6 border-l-4 border-orange-600">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Usuários Pendentes</p>
                <p className="text-3xl font-bold text-gray-800">{stats?.pending_users || 0}</p>
              </div>
              <div className="bg-orange-100 p-4 rounded-full">
                <AlertCircle className="text-orange-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ações Rápidas - Admin Master</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link to="/admin/master/users">
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                <Users size={18} className="mr-2" />
                Gerenciar Usuários
              </Button>
            </Link>
            <Link to="/admin/master/properties">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <Building size={18} className="mr-2" />
                Gerenciar Imóveis
              </Button>
            </Link>
            <Link to="/admin/master/banners">
              <Button className="w-full bg-purple-600 hover:bg-purple-700">
                <Image size={18} className="mr-2" />
                Gerenciar Banners
              </Button>
            </Link>
            <Link to="/admin/master/oportunidades">
              <Button className="w-full bg-indigo-600 hover:bg-indigo-700">
                <TrendingUp size={18} className="mr-2" />
                Mural de Oportunidades
              </Button>
            </Link>
            <Link to="/admin/master/notificacoes">
              <Button className="w-full bg-orange-600 hover:bg-orange-700">
                <AlertCircle size={18} className="mr-2" />
                Enviar Notificações
              </Button>
            </Link>
            <Link to="/admin/master/pagamentos">
              <Button className="w-full bg-green-600 hover:bg-green-700">
                <CreditCard size={18} className="mr-2" />
                Gerenciar Pagamentos
              </Button>
            </Link>
          </div>
        </div>

        {/* Statistics Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Properties by Purpose */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <TrendingUp size={20} />
              Imóveis por Finalidade
            </h3>
            <div className="space-y-3">
              {stats?.properties_by_purpose && Object.entries(stats.properties_by_purpose).map(([purpose, count]) => (
                <div key={purpose} className="flex justify-between items-center">
                  <span className="text-gray-700">{purpose}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-32 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(count / stats.total_properties) * 100}%` }}
                      ></div>
                    </div>
                    <span className="font-bold text-gray-800 w-12 text-right">{count}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Registrations */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <UserCheck size={20} />
              Registros Recentes (7 dias)
            </h3>
            <div className="space-y-3">
              {stats?.recent_registrations && stats.recent_registrations.length > 0 ? (
                stats.recent_registrations.map((reg, index) => (
                  <div key={index} className="flex justify-between items-center border-b pb-2">
                    <div>
                      <p className="font-semibold text-gray-800">{reg.name}</p>
                      <p className="text-xs text-gray-600">{reg.email}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2 py-1 rounded text-xs font-semibold ${
                        reg.type === 'corretor' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                      }`}>
                        {reg.type}
                      </span>
                      <p className="text-xs text-gray-500 mt-1">{reg.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-center py-4">Nenhum registro recente</p>
              )}
            </div>
          </div>
        </div>

        {/* Properties by City */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h3 className="text-lg font-bold text-gray-800 mb-4">Top 5 Cidades com Mais Imóveis</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {stats?.properties_by_city && Object.entries(stats.properties_by_city).map(([city, count]) => (
              <div key={city} className="text-center p-4 bg-gray-50 rounded-lg">
                <p className="text-2xl font-bold text-blue-600">{count}</p>
                <p className="text-sm text-gray-600">{city}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AdminMasterDashboard;
