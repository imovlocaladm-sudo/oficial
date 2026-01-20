import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { ArrowLeft, TrendingUp, Users, FileText, CheckCircle, XCircle, Clock, BarChart3 } from 'lucide-react';
import { adminAPIService } from '../../services/adminAPI';
import { toast } from 'sonner';

const MuralOportunidades = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (user?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchData();
  }, [user, navigate]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const result = await adminAPIService.getOpportunitiesBoard();
      setData(result);
    } catch (error) {
      console.error('Error fetching opportunities board:', error);
      toast.error('Erro ao carregar mural de oportunidades');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando dados...</p>
        </div>
      </div>
    );
  }

  const stats = data?.statistics || {};

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <Link to="/admin/dashboard">
            <Button variant="outline" className="mb-4">
              <ArrowLeft size={18} className="mr-2" />
              Voltar ao Dashboard
            </Button>
          </Link>
          
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Mural de Oportunidades</h1>
              <p className="text-gray-600 mt-2">Análise de parcerias e networking entre corretores</p>
            </div>
            <Button onClick={fetchData} variant="outline">
              Atualizar
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Demandas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <FileText className="text-blue-600" size={32} />
              <span className="text-2xl font-bold text-gray-800">{stats.demands?.total || 0}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total de Demandas</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-green-600">Ativas:</span>
                <span className="font-semibold">{stats.demands?.active || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-blue-600">Concluídas:</span>
                <span className="font-semibold">{stats.demands?.fulfilled || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Canceladas:</span>
                <span className="font-semibold">{stats.demands?.cancelled || 0}</span>
              </div>
            </div>
          </div>

          {/* Propostas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <Users className="text-purple-600" size={32} />
              <span className="text-2xl font-bold text-gray-800">{stats.proposals?.total || 0}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600 mb-2">Total de Propostas</h3>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-yellow-600">Pendentes:</span>
                <span className="font-semibold">{stats.proposals?.pending || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-green-600">Aceitas:</span>
                <span className="font-semibold">{stats.proposals?.accepted || 0}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-red-600">Rejeitadas:</span>
                <span className="font-semibold">{stats.proposals?.rejected || 0}</span>
              </div>
            </div>
          </div>

          {/* Taxa de Conversão */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <TrendingUp className="text-green-600" size={32} />
              <span className="text-2xl font-bold text-gray-800">{stats.conversion_rate || 0}%</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Taxa de Conversão</h3>
            <p className="text-xs text-gray-500 mt-2">
              Porcentagem de propostas aceitas
            </p>
          </div>

          {/* Parcerias Realizadas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center justify-between mb-4">
              <CheckCircle className="text-blue-600" size={32} />
              <span className="text-2xl font-bold text-gray-800">{stats.proposals?.accepted || 0}</span>
            </div>
            <h3 className="text-sm font-semibold text-gray-600">Parcerias Realizadas</h3>
            <p className="text-xs text-gray-500 mt-2">
              Total de propostas aceitas
            </p>
          </div>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Demandas por Tipo */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Demandas por Tipo de Imóvel
            </h3>
            <div className="space-y-3">
              {data?.demands_by_type?.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.type}</span>
                    <span className="font-semibold text-gray-800">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(item.count / Math.max(...(data?.demands_by_type?.map(d => d.count) || [1]))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Demandas por Cidade */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <BarChart3 size={20} />
              Top 5 Cidades
            </h3>
            <div className="space-y-3">
              {data?.demands_by_city?.map((item, index) => (
                <div key={index}>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">{item.city}</span>
                    <span className="font-semibold text-gray-800">{item.count}</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${(item.count / Math.max(...(data?.demands_by_city?.map(d => d.count) || [1]))) * 100}%`
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Usuários Mais Ativos */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <Users size={20} />
            Usuários Mais Ativos
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Nome</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-700">Email</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-700">Demandas Criadas</th>
                </tr>
              </thead>
              <tbody>
                {data?.active_users?.map((user, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-800">{user.name}</td>
                    <td className="py-3 px-4 text-sm text-gray-600">{user.email}</td>
                    <td className="py-3 px-4 text-sm text-center">
                      <span className="inline-block px-3 py-1 bg-blue-100 text-blue-700 rounded-full font-semibold">
                        {user.demand_count}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Parcerias Realizadas */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
            <CheckCircle size={20} />
            Últimas Parcerias Realizadas
          </h3>
          {data?.partnerships && data.partnerships.length > 0 ? (
            <div className="space-y-4">
              {data.partnerships.map((partnership, index) => (
                <div key={index} className="border-l-4 border-green-500 bg-gray-50 p-4 rounded-r-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold text-gray-800">{partnership.demand_title}</h4>
                      <p className="text-sm text-gray-600">{partnership.property_type}</p>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(partnership.created_at).toLocaleDateString('pt-BR')}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-gray-600">Solicitante:</p>
                      <p className="font-medium text-gray-800">{partnership.demander_name}</p>
                      <p className="text-xs text-gray-500">{partnership.demander_email}</p>
                    </div>
                    <div>
                      <p className="text-gray-600">Proponente:</p>
                      <p className="font-medium text-gray-800">{partnership.proposer_name}</p>
                      <p className="text-xs text-gray-500">{partnership.proposer_email}</p>
                    </div>
                  </div>
                  {partnership.message && (
                    <p className="mt-2 text-sm text-gray-600 italic">"{partnership.message}"</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">Nenhuma parceria realizada ainda</p>
          )}
        </div>

        {/* Demandas Recentes */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Demandas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FileText size={20} />
              Demandas Recentes
            </h3>
            <div className="space-y-3">
              {data?.recent_demands?.slice(0, 5).map((demand, index) => (
                <div key={index} className="border-l-4 border-blue-500 bg-gray-50 p-3 rounded-r">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-semibold text-sm text-gray-800">{demand.title}</h4>
                      <p className="text-xs text-gray-600">{demand.property_type} - {demand.city}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      demand.status === 'active' ? 'bg-green-100 text-green-700' :
                      demand.status === 'fulfilled' ? 'bg-blue-100 text-blue-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {demand.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Propostas */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
              <Users size={20} />
              Propostas Recentes
            </h3>
            <div className="space-y-3">
              {data?.recent_proposals?.slice(0, 5).map((proposal, index) => (
                <div key={index} className="border-l-4 border-purple-500 bg-gray-50 p-3 rounded-r">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-gray-600">ID: {proposal.id.substring(0, 8)}...</p>
                      <p className="text-xs text-gray-500">{proposal.corretor_email}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${
                      proposal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      proposal.status === 'accepted' ? 'bg-green-100 text-green-700' :
                      'bg-red-100 text-red-700'
                    }`}>
                      {proposal.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default MuralOportunidades;
