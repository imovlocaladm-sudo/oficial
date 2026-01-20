import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { Textarea } from '../../components/ui/textarea';
import { 
  ArrowLeft, MapPin, DollarSign, Home, User, Phone, Award,
  Bed, Car, Ruler, Send, Clock, CheckCircle, AlertCircle
} from 'lucide-react';
import { demandsAPI, propertiesAPI } from '../../services/api';
import { toast } from 'sonner';

const DetalheDemanda = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demand, setDemand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [proposalMessage, setProposalMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myProperties, setMyProperties] = useState([]);
  const [selectedProperty, setSelectedProperty] = useState('');
  const [alreadyProposed, setAlreadyProposed] = useState(false);

  useEffect(() => {
    fetchDemandDetails();
    fetchMyCompatibleProperties();
  }, [id]);

  const fetchDemandDetails = async () => {
    try {
      setLoading(true);
      const data = await demandsAPI.getDemand(id);
      setDemand(data);
      
      // Verificar se já fez proposta
      if (data.my_proposal) {
        setAlreadyProposed(true);
      }
    } catch (error) {
      console.error('Error fetching demand:', error);
      toast.error('Erro ao carregar demanda');
      navigate('/admin/parcerias/mural');
    } finally {
      setLoading(false);
    }
  };

  const fetchMyCompatibleProperties = async () => {
    try {
      const properties = await propertiesAPI.getMyProperties();
      setMyProperties(properties || []);
    } catch (error) {
      console.error('Error fetching properties:', error);
    }
  };

  const handleSubmitProposal = async () => {
    if (!proposalMessage.trim()) {
      toast.error('Por favor, escreva uma mensagem para sua proposta');
      return;
    }

    try {
      setSubmitting(true);
      await demandsAPI.createProposal(id, {
        mensagem: proposalMessage,
        imovel_id: selectedProperty || null
      });
      
      toast.success('Proposta enviada com sucesso!');
      setAlreadyProposed(true);
      setProposalMessage('');
    } catch (error) {
      console.error('Error submitting proposal:', error);
      const errorMsg = error.response?.data?.detail || 'Erro ao enviar proposta';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
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

  if (!demand) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8 text-center">
          <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
          <h2 className="text-xl font-semibold text-gray-700">Demanda não encontrada</h2>
          <Button onClick={() => navigate('/admin/parcerias/mural')} className="mt-4">
            Voltar ao Mural
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const isOwner = user?.id === demand.corretor_id;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/parcerias/mural')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Mural
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Detalhes da Demanda */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-2xl flex items-center gap-2">
                      <Home className="text-blue-600" />
                      Cliente busca {demand.tipo_imovel}
                    </CardTitle>
                    <CardDescription className="mt-2">
                      Publicado em {formatDate(demand.created_at)}
                    </CardDescription>
                  </div>
                  <Badge className="bg-green-100 text-green-800 text-lg px-4 py-2">
                    {demand.comissao_parceiro}% comissão
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Localização */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <MapPin className="text-red-500" size={18} />
                    Localização de Interesse
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {demand.cidade && (
                      <Badge variant="outline" className="bg-blue-50">
                        📍 {demand.cidade}
                      </Badge>
                    )}
                    {demand.bairros_interesse.map((bairro, idx) => (
                      <Badge key={idx} variant="outline">
                        {bairro}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Faixa de Preço */}
                <div>
                  <h3 className="font-semibold text-gray-700 mb-2 flex items-center gap-2">
                    <DollarSign className="text-green-500" size={18} />
                    Faixa de Preço
                  </h3>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(demand.valor_minimo)} - {formatCurrency(demand.valor_maximo)}
                  </p>
                </div>

                {/* Critérios */}
                {(demand.dormitorios_min || demand.vagas_garagem_min || demand.area_util_min) && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Critérios Mínimos</h3>
                    <div className="grid grid-cols-3 gap-4">
                      {demand.dormitorios_min && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Bed className="text-blue-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-500">Dormitórios</p>
                            <p className="font-semibold">{demand.dormitorios_min}+</p>
                          </div>
                        </div>
                      )}
                      {demand.vagas_garagem_min && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Car className="text-blue-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-500">Vagas</p>
                            <p className="font-semibold">{demand.vagas_garagem_min}+</p>
                          </div>
                        </div>
                      )}
                      {demand.area_util_min && (
                        <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                          <Ruler className="text-blue-500" size={20} />
                          <div>
                            <p className="text-sm text-gray-500">Área</p>
                            <p className="font-semibold">{demand.area_util_min}m²+</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Características */}
                {demand.caracteristicas_essenciais && (
                  <div>
                    <h3 className="font-semibold text-gray-700 mb-2">Características Desejadas</h3>
                    <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                      {demand.caracteristicas_essenciais}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Formulário de Proposta */}
            {!isOwner && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="text-blue-600" />
                    Fazer Proposta
                  </CardTitle>
                  <CardDescription>
                    Envie uma proposta para este cliente
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {alreadyProposed ? (
                    <div className="text-center py-8">
                      <CheckCircle className="mx-auto h-12 w-12 text-green-500 mb-4" />
                      <h3 className="text-lg font-semibold text-green-700">Proposta Enviada!</h3>
                      <p className="text-gray-600 mt-2">
                        Aguarde o retorno do demandante.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {/* Selecionar Imóvel (opcional) */}
                      {myProperties.length > 0 && (
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Vincular a um imóvel seu (opcional)
                          </label>
                          <select
                            value={selectedProperty}
                            onChange={(e) => setSelectedProperty(e.target.value)}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          >
                            <option value="">Nenhum imóvel selecionado</option>
                            {myProperties.map((prop) => (
                              <option key={prop.id} value={prop.id}>
                                {prop.title} - {formatCurrency(prop.price)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}

                      {/* Mensagem */}
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Mensagem *
                        </label>
                        <Textarea
                          value={proposalMessage}
                          onChange={(e) => setProposalMessage(e.target.value)}
                          placeholder="Descreva o imóvel que você tem disponível e por que ele atende às necessidades do cliente..."
                          rows={5}
                          className="w-full"
                        />
                      </div>

                      <Button 
                        onClick={handleSubmitProposal}
                        disabled={submitting}
                        className="w-full"
                      >
                        {submitting ? (
                          <>
                            <Clock className="mr-2 h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-4 w-4" />
                            Enviar Proposta
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar - Info do Corretor */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informações do Demandante</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <User className="text-blue-600" size={24} />
                  </div>
                  <div>
                    <p className="font-semibold">{demand.corretor_name}</p>
                    {demand.corretor_creci && (
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <Award size={14} />
                        CRECI: {demand.corretor_creci}
                      </p>
                    )}
                  </div>
                </div>

                {!isOwner && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-gray-500 mb-2">Contato após aceite</p>
                    <div className="flex items-center gap-2 text-gray-400">
                      <Phone size={16} />
                      <span className="blur-sm select-none">(**) *****-****</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      O telefone será liberado após sua proposta ser aceita
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Estatísticas */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Estatísticas</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{demand.propostas_count || 0}</p>
                    <p className="text-sm text-gray-500">Propostas</p>
                  </div>
                  <div className="text-center p-3 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{demand.views || 0}</p>
                    <p className="text-sm text-gray-500">Visualizações</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dicas */}
            <Card className="bg-blue-50 border-blue-200">
              <CardContent className="pt-6">
                <h4 className="font-semibold text-blue-800 mb-2">💡 Dicas para sua proposta</h4>
                <ul className="text-sm text-blue-700 space-y-1">
                  <li>• Seja específico sobre o imóvel</li>
                  <li>• Mencione diferenciais</li>
                  <li>• Destaque a localização</li>
                  <li>• Informe disponibilidade para visita</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default DetalheDemanda;
