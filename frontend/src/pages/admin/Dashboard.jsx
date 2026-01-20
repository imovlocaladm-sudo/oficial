import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Home, Plus, List, User, LogOut, Settings, BarChart3, Handshake, Calendar } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
import PropertyCard from '../../components/PropertyCard';

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [myProperties, setMyProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    venda: 0,
    aluguel: 0
  });

  useEffect(() => {
    // Redirect admin_senior to their dashboard
    if (user?.user_type === 'admin_senior') {
      navigate('/admin/senior');
      return;
    }
    // Redirect admin master to admin master dashboard
    if (user?.user_type === 'admin') {
      navigate('/admin/master');
      return;
    }
    fetchMyProperties();
  }, [user, navigate]);

  const fetchMyProperties = async () => {
    try {
      const properties = await propertiesAPI.getMyProperties();
      setMyProperties(properties);
      
      // Calculate stats
      const stats = {
        total: properties.length,
        venda: properties.filter(p => p.purpose === 'VENDA').length,
        aluguel: properties.filter(p => p.purpose === 'ALUGUEL' || p.purpose === 'ALUGUEL_TEMPORADA').length
      };
      setStats(stats);
    } catch (error) {
      console.error('Error fetching properties:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-3xl font-bold mb-2">Bem-vindo, {user?.name}!</h1>
              <p className="text-blue-100">
                {user?.user_type === 'corretor' 
                  ? 'Corretor de Imóveis' 
                  : user?.user_type === 'imobiliaria' 
                  ? 'Imobiliária' 
                  : 'Usuário Particular'}
                {user?.creci && ` - CRECI: ${user.creci}`}
              </p>
            </div>
            <div className="flex gap-3">
              <Link to="/">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <Home size={18} className="mr-2" />
                  Voltar ao site
                </Button>
              </Link>
              <Button onClick={handleLogout} variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <LogOut size={18} className="mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Total de Imóveis</p>
                <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <List className="text-blue-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Para Venda</p>
                <p className="text-3xl font-bold text-green-600">{stats.venda}</p>
              </div>
              <div className="bg-green-100 p-4 rounded-full">
                <BarChart3 className="text-green-600" size={24} />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-600 text-sm font-medium mb-1">Para Aluguel</p>
                <p className="text-3xl font-bold text-blue-600">{stats.aluguel}</p>
              </div>
              <div className="bg-blue-100 p-4 rounded-full">
                <BarChart3 className="text-blue-600" size={24} />
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <Link to="/admin/imoveis/novo">
              <Button className="w-full bg-orange-500 hover:bg-orange-600">
                <Plus size={18} className="mr-2" />
                Cadastrar Imóvel
              </Button>
            </Link>
            <Link to="/admin/imoveis">
              <Button className="w-full" variant="outline">
                <List size={18} className="mr-2" />
                Gerenciar Imóveis
              </Button>
            </Link>
            <Link to="/admin/visitas">
              <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white">
                <Calendar size={18} className="mr-2" />
                Minhas Visitas
              </Button>
            </Link>
            {(user?.user_type === 'corretor' || user?.user_type === 'imobiliaria') && (
              <Link to="/admin/parcerias">
                <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white">
                  <Handshake size={18} className="mr-2" />
                  Parcerias
                </Button>
              </Link>
            )}
            <Link to="/admin/perfil">
              <Button className="w-full" variant="outline">
                <Settings size={18} className="mr-2" />
                Meu Perfil
              </Button>
            </Link>
          </div>
        </div>

        {/* My Properties */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Meus Imóveis</h2>
            <Link to="/admin/imoveis">
              <Button variant="outline" size="sm">
                Ver todos
              </Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
              ))}
            </div>
          ) : myProperties.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {myProperties.slice(0, 4).map(property => (
                <PropertyCard key={property.id} property={property} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <List size={48} className="text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum imóvel cadastrado</h3>
              <p className="text-gray-600 mb-6">Comece cadastrando seu primeiro imóvel</p>
              <Link to="/admin/imoveis/novo">
                <Button className="bg-orange-500 hover:bg-orange-600">
                  <Plus size={18} className="mr-2" />
                  Cadastrar Imóvel
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Dashboard;