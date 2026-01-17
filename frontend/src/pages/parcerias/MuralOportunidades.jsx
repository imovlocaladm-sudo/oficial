import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Badge } from '../../components/ui/badge';
import { ArrowLeft, Search, Filter, MapPin, DollarSign, Home, Eye, MessageSquare, TrendingUp } from 'lucide-react';
import { demandsAPI } from '../../services/api';
import { toast } from 'sonner';

const DemandCard = ({ demand, onClick }) => {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const getDaysAgo = (date) => {
    const days = Math.floor((new Date() - new Date(date)) / (1000 * 60 * 60 * 24));
    if (days === 0) return 'Hoje';
    if (days === 1) return 'Ontem';
    return `Há ${days} dias`;
  };

  return (
    <Card 
      className="hover:shadow-lg transition-all cursor-pointer border-l-4 border-l-blue-500"
      onClick={onClick}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Home className="text-blue-600" size={20} />
              Cliente busca {demand.tipo_imovel}
            </CardTitle>
            <CardDescription className="mt-2 flex items-center gap-1 text-sm">
              <MapPin size={14} />
              {demand.bairros_interesse.slice(0, 3).join(', ')}
              {demand.bairros_interesse.length > 3 && ` +${demand.bairros_interesse.length - 3}`}
            </CardDescription>
          </div>
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
            {demand.comissao_parceiro}% comissão
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center gap-2 text-gray-700">
            <DollarSign size={16} className="text-green-600" />
            <span className="font-semibold">
              {formatCurrency(demand.valor_minimo)} - {formatCurrency(demand.valor_maximo)}
            </span>
          </div>

          {(demand.dormitorios_min || demand.vagas_garagem_min) && (
            <div className="flex gap-4 text-sm text-gray-600">
              {demand.dormitorios_min && <span>🛏️ {demand.dormitorios_min}+ dorm.</span>}
              {demand.vagas_garagem_min && <span>🚗 {demand.vagas_garagem_min}+ vagas</span>}
              {demand.area_util_min && <span>📐 {demand.area_util_min}m²+</span>}
            </div>
          )}

          <div className="flex items-center justify-between pt-3 border-t">
            <div className="flex gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <MessageSquare size={14} />
                {demand.propostas_count || 0} propostas
              </span>
              <span className="flex items-center gap-1">
                <Eye size={14} />
                {demand.views || 0} views
              </span>
            </div>
            <span className="text-xs text-gray-500">
              {getDaysAgo(demand.created_at)}
            </span>
          </div>

          <Button className="w-full" size="sm">
            Ver Detalhes e Fazer Proposta
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const MuralOportunidades = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [demands, setDemands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tipo_imovel: '',
    bairro: '',
    valor_min: '',
    valor_max: ''
  });

  useEffect(() => {
    fetchDemands();
  }, []);

  const fetchDemands = async (appliedFilters = {}) => {
    try {
      setLoading(true);
      const data = await demandsAPI.listDemands(appliedFilters);
      setDemands(data);
    } catch (error) {
      console.error('Error fetching demands:', error);
      toast.error('Erro ao carregar demandas');
    } finally {
      setLoading(false);
    }
  };

  const handleFilter = () => {
    const appliedFilters = {};
    if (filters.tipo_imovel) appliedFilters.tipo_imovel = filters.tipo_imovel;
    if (filters.bairro) appliedFilters.bairro = filters.bairro;
    if (filters.valor_min) appliedFilters.valor_min = parseFloat(filters.valor_min);
    if (filters.valor_max) appliedFilters.valor_max = parseFloat(filters.valor_max);
    
    fetchDemands(appliedFilters);
  };

  const handleClearFilters = () => {
    setFilters({ tipo_imovel: '', bairro: '', valor_min: '', valor_max: '' });
    fetchDemands();
  };

  const handleDemandClick = (demand) => {
    // TODO: Navegar para detalhes
    toast.info('Página de detalhes em desenvolvimento');
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
            <h1 className="text-3xl font-bold text-gray-900">Mural de Oportunidades</h1>
            <p className="text-gray-600 mt-1">Encontre demandas compatíveis com seus imóveis</p>
          </div>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <Filter size={20} />
              Filtros
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <Select
                  value={filters.tipo_imovel}
                  onValueChange={(value) => setFilters({ ...filters, tipo_imovel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Tipo de imóvel" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Apartamento">Apartamento</SelectItem>
                    <SelectItem value="Casa-Térrea">Casa Térrea</SelectItem>
                    <SelectItem value="Casa-Térrea-Condomínio">Casa Condomínio</SelectItem>
                    <SelectItem value="Sobrado">Sobrado</SelectItem>
                    <SelectItem value="Kitnet">Kitnet</SelectItem>
                    <SelectItem value="Terreno">Terreno</SelectItem>
                    <SelectItem value="Imóvel Comercial">Comercial</SelectItem>
                    <SelectItem value="Apto. Cobertura / Duplex">Cobertura</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Input
                  placeholder="Bairro"
                  value={filters.bairro}
                  onChange={(e) => setFilters({ ...filters, bairro: e.target.value })}
                />
              </div>

              <div>
                <Input
                  type="number"
                  placeholder="Valor mínimo"
                  value={filters.valor_min}
                  onChange={(e) => setFilters({ ...filters, valor_min: e.target.value })}
                />
              </div>

              <div>
                <Input
                  type="number"
                  placeholder="Valor máximo"
                  value={filters.valor_max}
                  onChange={(e) => setFilters({ ...filters, valor_max: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-2 mt-4">
              <Button onClick={handleFilter} className="flex-1">
                <Search className="mr-2 h-4 w-4" />
                Filtrar
              </Button>
              <Button onClick={handleClearFilters} variant="outline">
                Limpar
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Results */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-lg h-64 animate-pulse"></div>
            ))}
          </div>
        ) : demands.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <TrendingUp className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center mb-4">
                Nenhuma demanda encontrada com os filtros selecionados.
              </p>
              <Button onClick={handleClearFilters} variant="outline">
                Limpar Filtros
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="mb-4 text-sm text-gray-600">
              {demands.length} oportunidade(s) encontrada(s)
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {demands.map((demand) => (
                <DemandCard
                  key={demand.id}
                  demand={demand}
                  onClick={() => handleDemandClick(demand)}
                />
              ))}
            </div>
          </>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default MuralOportunidades;