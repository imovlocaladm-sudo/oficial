import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, User, Phone, Award, Check, X, Clock, 
  Home, MessageSquare, DollarSign, MapPin
} from 'lucide-react';
import { demandsAPI } from '../../services/api';
import { toast } from 'sonner';

const ProposalCard = ({ proposal, onAccept, onReject, loading }) => {
  const formatCurrency = (value) => {
    if (!value) return 'Não informado';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Aguardando', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      accepted: { label: 'Aceita', className: 'bg-green-100 text-green-800', icon: Check },
      rejected: { label: 'Recusada', className: 'bg-red-100 text-red-800', icon: X }
    };
    const { label, className, icon: Icon } = config[status] || config.pending;
    return (
      <Badge className={`${className} flex items-center gap-1`}>
        <Icon size={12} />
        {label}
      </Badge>
    );
  };

  return (
    <Card className={`transition-all ${proposal.status === 'pending' ? 'border-l-4 border-l-yellow-500' : ''}`}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="text-blue-600" size={24} />
            </div>
            <div>
              <CardTitle className="text-lg">{proposal.ofertante_name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                {proposal.ofertante_creci && (
                  <span className="flex items-center gap-1">
                    <Award size={14} />
                    CRECI: {proposal.ofertante_creci}
                  </span>
                )}
              </CardDescription>
            </div>
          </div>
          {getStatusBadge(proposal.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Contato - só mostra se aceita */}
        {proposal.status === 'accepted' ? (
          <div className="p-3 bg-green-50 rounded-lg border border-green-200">
            <p className="text-sm font-semibold text-green-800 mb-2">📞 Contato liberado:</p>
            <div className="flex items-center gap-2 text-green-700">
              <Phone size={16} />
              <span className="font-medium">{proposal.ofertante_phone}</span>
            </div>
          </div>
        ) : (
          <div className="p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center gap-2 text-gray-400">
              <Phone size={16} />
              <span className="blur-sm select-none">(**) *****-****</span>
            </div>
            <p className="text-xs text-gray-400 mt-1">Contato liberado após aceite</p>
          </div>
        )}

        {/* Imóvel vinculado */}
        {proposal.property_title && (
          <div className="p-3 bg-blue-50 rounded-lg">
            <p className="text-sm font-semibold text-blue-800 mb-1 flex items-center gap-1">
              <Home size={14} />
              Imóvel Oferecido:
            </p>
            <p className="text-blue-700">{proposal.property_title}</p>
            {proposal.property_price && (
              <p className="text-sm text-blue-600 flex items-center gap-1 mt-1">
                <DollarSign size={14} />
                {formatCurrency(proposal.property_price)}
              </p>
            )}
          </div>
        )}

        {/* Mensagem */}
        {proposal.message && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <MessageSquare size={14} />
              Mensagem:
            </p>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
              {proposal.message}
            </p>
          </div>
        )}

        {/* Data */}
        <p className="text-xs text-gray-400">
          Recebida em {formatDate(proposal.created_at)}
        </p>

        {/* Ações */}
        {proposal.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={() => onAccept(proposal.id)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-1 h-4 w-4" />
              Aceitar
            </Button>
            <Button
              onClick={() => onReject(proposal.id)}
              disabled={loading}
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              <X className="mr-1 h-4 w-4" />
              Recusar
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const VerPropostas = () => {
  const { demandId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demand, setDemand] = useState(null);
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [demandId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [demandData, proposalsData] = await Promise.all([
        demandsAPI.getDemand(demandId),
        demandsAPI.getProposals(demandId)
      ]);
      setDemand(demandData);
      setProposals(proposalsData);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar propostas');
      navigate('/admin/parcerias/minhas');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (proposalId) => {
    if (!window.confirm('Tem certeza que deseja ACEITAR esta proposta? O contato do corretor será liberado.')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await demandsAPI.acceptProposal(proposalId);
      toast.success('Proposta aceita! O contato foi liberado.');
      fetchData(); // Recarregar dados
    } catch (error) {
      console.error('Error accepting proposal:', error);
      toast.error(error.response?.data?.detail || 'Erro ao aceitar proposta');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (proposalId) => {
    if (!window.confirm('Tem certeza que deseja RECUSAR esta proposta?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await demandsAPI.rejectProposal(proposalId);
      toast.success('Proposta recusada.');
      fetchData(); // Recarregar dados
    } catch (error) {
      console.error('Error rejecting proposal:', error);
      toast.error(error.response?.data?.detail || 'Erro ao recusar proposta');
    } finally {
      setActionLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const pendingCount = proposals.filter(p => p.status === 'pending').length;
  const acceptedCount = proposals.filter(p => p.status === 'accepted').length;
  const rejectedCount = proposals.filter(p => p.status === 'rejected').length;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/parcerias/minhas')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar às Minhas Demandas
        </Button>

        {/* Info da Demanda */}
        {demand && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Home className="text-blue-600" />
                {demand.tipo_imovel} - {demand.cidade || 'MS'}
              </CardTitle>
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <MapPin size={14} />
                  {demand.bairros_interesse.join(', ')}
                </span>
                <span className="flex items-center gap-1">
                  <DollarSign size={14} />
                  {formatCurrency(demand.valor_minimo)} - {formatCurrency(demand.valor_maximo)}
                </span>
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-yellow-700">Aguardando Resposta</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-green-50 border-green-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{acceptedCount}</p>
                <p className="text-sm text-green-700">Aceitas</p>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-red-50 border-red-200">
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">{rejectedCount}</p>
                <p className="text-sm text-red-700">Recusadas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Propostas */}
        <h2 className="text-xl font-bold text-gray-900 mb-4">
          Propostas Recebidas ({proposals.length})
        </h2>

        {proposals.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                Você ainda não recebeu nenhuma proposta para esta demanda.
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Aguarde, corretores com imóveis compatíveis entrarão em contato.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {proposals.map((proposal) => (
              <ProposalCard
                key={proposal.id}
                proposal={proposal}
                onAccept={handleAccept}
                onReject={handleReject}
                loading={actionLoading}
              />
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default VerPropostas;
