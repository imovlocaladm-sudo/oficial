import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Plus, List, TrendingUp, Handshake, Users, ArrowRight, ArrowLeft, LayoutDashboard } from 'lucide-react';
import { demandsAPI } from '../../services/api';
import { toast } from 'sonner';

const ParceriasHub = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar se é corretor ou imobiliária
    if (user && user.user_type !== 'corretor' && user.user_type !== 'imobiliaria') {
      toast.error('Apenas corretores e imobiliárias podem acessar Parcerias');
      navigate('/admin/dashboard');
      return;
    }
    fetchStats();
  }, [user, navigate]);

  const fetchStats = async () => {
    try {
      const data = await demandsAPI.getStats();
      setStats(data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1,2,3].map(i => (
                <div key={i} className="bg-white rounded-lg h-48"></div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2" data-testid="page-title">
            🤝 Mural de Oportunidades
          </h1>
          <p className="text-gray-600">
            Sistema de parcerias entre corretores - Encontre clientes e imóveis
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Minhas Demandas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats?.my_demands || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{stats?.my_active_demands || 0} ativas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Minhas Propostas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats?.my_proposals || 0}</div>
              <p className="text-xs text-gray-500 mt-1">{stats?.my_accepted_proposals || 0} aceitas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-600">Propostas Recebidas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats?.received_proposals || 0}</div>
              <p className="text-xs text-gray-500 mt-1">Em suas demandas</p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-orange-800">Taxa de Sucesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats?.my_proposals > 0 
                  ? Math.round((stats?.my_accepted_proposals / stats?.my_proposals) * 100)
                  : 0}%
              </div>
              <p className="text-xs text-orange-600 mt-1">Propostas aceitas</p>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/parcerias/publicar')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="text-green-600" size={24} />
                    Publicar Demanda
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Tem um cliente? Publique o que ele procura e receba propostas de parceiros
                  </CardDescription>
                </div>
                <ArrowRight className="text-gray-400" />
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/parcerias/mural')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <List className="text-blue-600" size={24} />
                    Ver Mural
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Explore demandas de outros corretores e envie seus imóveis
                  </CardDescription>
                </div>
                <ArrowRight className="text-gray-400" />
              </div>
            </CardHeader>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer" onClick={() => navigate('/admin/parcerias/minhas')}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="text-purple-600" size={24} />
                    Minhas Demandas
                  </CardTitle>
                  <CardDescription className="mt-2">
                    Gerencie suas demandas e veja as propostas recebidas
                  </CardDescription>
                </div>
                <ArrowRight className="text-gray-400" />
              </div>
            </CardHeader>
          </Card>
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <Users size={20} />
                Como Funciona - Demandante
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-blue-700 space-y-2">
              <p>1. 📝 Publique o que seu cliente procura</p>
              <p>2. 🔔 Receba notificações de imóveis compatíveis</p>
              <p>3. 📩 Analise as propostas dos parceiros</p>
              <p>4. ✅ Aceite a melhor proposta e negocie</p>
              <p>5. 🤝 Feche o negócio em parceria!</p>
            </CardContent>
          </Card>

          <Card className="bg-green-50 border-green-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Handshake size={20} />
                Como Funciona - Ofertante
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-green-700 space-y-2">
              <p>1. 🔔 Receba alertas de demandas compatíveis</p>
              <p>2. 🔍 Navegue pelo mural de oportunidades</p>
              <p>3. 🏠 Envie propostas com seus imóveis</p>
              <p>4. ⏰ Aguarde aprovação do demandante</p>
              <p>5. 🎉 Negocie e feche em parceria!</p>
            </CardContent>
          </Card>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default ParceriasHub;