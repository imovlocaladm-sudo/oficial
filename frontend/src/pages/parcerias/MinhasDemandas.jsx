import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Plus, Edit, Trash2, Eye, MessageSquare, CheckCircle, XCircle, Clock } from 'lucide-react';
import { demandsAPI } from '../../services/api';
import { toast } from 'sonner';

const MyDemandCard = ({ demand, onDelete }) => {
  const navigate = useNavigate();

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      active: { label: 'Ativa', className: 'bg-green-100 text-green-800' },
      in_negotiation: { label: 'Em Negociação', className: 'bg-blue-100 text-blue-800' },
      closed: { label: 'Fechada', className: 'bg-gray-100 text-gray-800' },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800' }
    };

    const config = statusConfig[status] || statusConfig.active;
    return (
      <Badge className={`${config.className} hover:${config.className}`}>
        {config.label}
      </Badge>
    );
  };

  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta demanda?')) return;

    try {
      await demandsAPI.deleteDemand(demand.id);
      toast.success('Demanda excluída com sucesso!');
      onDelete(demand.id);
    } catch (error) {
      console.error('Error deleting demand:', error);
      toast.error('Erro ao excluir demanda');
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">
              {demand.tipo_imovel} em {demand.bairros_interesse[0]}
              {demand.bairros_interesse.length > 1 && ` +${demand.bairros_interesse.length - 1}`}
            </CardTitle>
            <CardDescription className="mt-2">
              {formatCurrency(demand.valor_minimo)} - {formatCurrency(demand.valor_maximo)}
            </CardDescription>
          </div>
          {getStatusBadge(demand.status)}
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex gap-4 text-sm">
            <span className="flex items-center gap-1 text-gray-600">
              <MessageSquare size={14} />
              {demand.propostas_count || 0} propostas
            </span>
            <span className="flex items-center gap-1 text-gray-600">
              <Eye size={14} />
              {demand.views || 0} visualizações
            </span>
          </div>

          <div className="flex items-center gap-2 text-sm">
            <span className="font-semibold text-green-600">
              {demand.comissao_parceiro}% de comissão
            </span>
          </div>

          {demand.caracteristicas_essenciais && (
            <p className="text-sm text-gray-600 line-clamp-2">
              {demand.caracteristicas_essenciais}
            </p>
          )}

          <div className="flex gap-2 pt-2">
            <Button
              size="sm"
              variant="outline"
              className="flex-1"
              onClick={() => navigate(`/admin/parcerias/propostas/${demand.id}`)}
            >
              <MessageSquare className="mr-1 h-4 w-4" />
              Ver Propostas ({demand.propostas_count || 0})
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const MinhasDemandas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ active: 0, in_negotiation: 0, closed: 0 });

  useEffect(() => {
    fetchMyDemands();
  }, []);

  const fetchMyDemands = async () => {
    try {
      setLoading(true);
      const data = await demandsAPI.getMyDemands();
      setDemands(data);

      // Calculate stats
      const statsCalc = {
        active: data.filter(d => d.status === 'active').length,
        in_negotiation: data.filter(d => d.status === 'in_negotiation').length,
        closed: data.filter(d => d.status === 'closed').length
      };
      setStats(statsCalc);
    } catch (error) {
      console.error('Error fetching my demands:', error);
      toast.error('Erro ao carregar suas demandas');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDemand = (demandId) => {
    setDemands(demands.filter(d => d.id !== demandId));
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <Button
              variant="ghost"
              onClick={() => navigate('/admin/parcerias')}
              className="mb-2"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Demandas</h1>
            <p className="text-gray-600 mt-1">Gerencie suas demandas e veja as propostas</p>
          </div>
          <Button onClick={() => navigate('/admin/parcerias/publicar')}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Demanda
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <CheckCircle className="text-green-600" size={18} />
                Ativas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <Clock className="text-blue-600" size={18} />
                Em Negociação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-600">{stats.in_negotiation}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600 flex items-center gap-2">
                <XCircle className="text-gray-600" size={18} />
                Fechadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-gray-600">{stats.closed}</div>
            </CardContent>
          </Card>
        </div>

        {/* List */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        ) : demands.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center mb-4">
                Você ainda não publicou nenhuma demanda.
              </p>
              <Button onClick={() => navigate('/admin/parcerias/publicar')}>
                <Plus className="mr-2 h-4 w-4" />
                Publicar Primeira Demanda
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {demands.map((demand) => (
              <MyDemandCard
                key={demand.id}
                demand={demand}
                onDelete={handleDeleteDemand}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MinhasDemandas;