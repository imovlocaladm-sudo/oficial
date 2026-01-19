import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  ArrowLeft, Calendar, Clock, User, Phone, Mail, Home, 
  Check, X, MessageSquare, MapPin, Eye
} from 'lucide-react';
import { visitsAPI } from '../../services/api';
import { toast } from 'sonner';

const VisitCard = ({ visit, onConfirm, onCancel, loading }) => {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const getStatusBadge = (status) => {
    const config = {
      pending: { label: 'Aguardando', className: 'bg-yellow-100 text-yellow-800', icon: Clock },
      confirmed: { label: 'Confirmada', className: 'bg-green-100 text-green-800', icon: Check },
      cancelled: { label: 'Cancelada', className: 'bg-red-100 text-red-800', icon: X },
      completed: { label: 'Realizada', className: 'bg-blue-100 text-blue-800', icon: Check }
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
    <Card className={`transition-all ${visit.status === 'pending' ? 'border-l-4 border-l-yellow-500' : ''}`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="text-blue-600" size={20} />
              {formatDate(visit.visit_date)}
            </CardTitle>
            <CardDescription className="flex items-center gap-2 mt-1">
              <Clock size={14} />
              {visit.visit_time}
            </CardDescription>
          </div>
          {getStatusBadge(visit.status)}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Imóvel */}
        <div className="p-3 bg-gray-50 rounded-lg">
          <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
            <Home size={14} />
            Imóvel
          </p>
          <p className="text-gray-800">{visit.property_title}</p>
          <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
            <MapPin size={12} />
            {visit.property_address}
          </p>
        </div>

        {/* Visitante */}
        <div className="p-3 bg-blue-50 rounded-lg">
          <p className="text-sm font-semibold text-blue-800 mb-2 flex items-center gap-1">
            <User size={14} />
            Dados do Visitante
          </p>
          <div className="space-y-1">
            <p className="text-blue-700 font-medium">{visit.visitor_name}</p>
            <p className="text-sm text-blue-600 flex items-center gap-1">
              <Phone size={12} />
              <a href={`tel:${visit.visitor_phone}`} className="hover:underline">
                {visit.visitor_phone}
              </a>
            </p>
            {visit.visitor_email && (
              <p className="text-sm text-blue-600 flex items-center gap-1">
                <Mail size={12} />
                <a href={`mailto:${visit.visitor_email}`} className="hover:underline">
                  {visit.visitor_email}
                </a>
              </p>
            )}
          </div>
        </div>

        {/* Mensagem */}
        {visit.message && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-1 flex items-center gap-1">
              <MessageSquare size={14} />
              Mensagem
            </p>
            <p className="text-gray-600 bg-gray-50 p-3 rounded-lg text-sm">
              {visit.message}
            </p>
          </div>
        )}

        {/* Ações */}
        {visit.status === 'pending' && (
          <div className="flex gap-2 pt-2 border-t">
            <Button
              onClick={() => onConfirm(visit.id)}
              disabled={loading}
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Check className="mr-1 h-4 w-4" />
              Confirmar
            </Button>
            <Button
              onClick={() => onCancel(visit.id)}
              disabled={loading}
              variant="outline"
              className="flex-1 text-red-600 border-red-300 hover:bg-red-50"
            >
              <X className="mr-1 h-4 w-4" />
              Cancelar
            </Button>
          </div>
        )}

        {/* WhatsApp */}
        <a
          href={`https://wa.me/55${visit.visitor_phone.replace(/\D/g, '')}?text=Olá ${visit.visitor_name}, sobre sua visita ao imóvel "${visit.property_title}" agendada para ${formatDate(visit.visit_date)} às ${visit.visit_time}...`}
          target="_blank"
          rel="noopener noreferrer"
          className="block"
        >
          <Button variant="outline" className="w-full bg-green-50 border-green-300 text-green-700 hover:bg-green-100">
            <MessageSquare className="mr-2 h-4 w-4" />
            Responder via WhatsApp
          </Button>
        </a>
      </CardContent>
    </Card>
  );
};

const MinhasVisitas = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchVisits();
  }, []);

  const fetchVisits = async () => {
    try {
      setLoading(true);
      const data = await visitsAPI.getMyVisits();
      setVisits(data);
    } catch (error) {
      console.error('Error fetching visits:', error);
      toast.error('Erro ao carregar visitas');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (visitId) => {
    try {
      setActionLoading(true);
      await visitsAPI.confirmVisit(visitId);
      toast.success('Visita confirmada!');
      fetchVisits();
    } catch (error) {
      console.error('Error confirming visit:', error);
      toast.error(error.response?.data?.detail || 'Erro ao confirmar visita');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async (visitId) => {
    if (!window.confirm('Tem certeza que deseja cancelar esta visita?')) {
      return;
    }
    
    try {
      setActionLoading(true);
      await visitsAPI.cancelVisit(visitId);
      toast.success('Visita cancelada');
      fetchVisits();
    } catch (error) {
      console.error('Error cancelling visit:', error);
      toast.error(error.response?.data?.detail || 'Erro ao cancelar visita');
    } finally {
      setActionLoading(false);
    }
  };

  const filteredVisits = visits.filter(v => {
    if (filter === 'all') return true;
    return v.status === filter;
  });

  const pendingCount = visits.filter(v => v.status === 'pending').length;
  const confirmedCount = visits.filter(v => v.status === 'confirmed').length;

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/dashboard')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar ao Painel
        </Button>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Minhas Visitas</h1>
            <p className="text-gray-600 mt-1">Gerencie os agendamentos de visita aos seus imóveis</p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card 
            className={`cursor-pointer transition-all ${filter === 'all' ? 'ring-2 ring-blue-500' : ''}`}
            onClick={() => setFilter('all')}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-gray-800">{visits.length}</p>
                <p className="text-sm text-gray-500">Total</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filter === 'pending' ? 'ring-2 ring-yellow-500' : ''}`}
            onClick={() => setFilter('pending')}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-yellow-600">{pendingCount}</p>
                <p className="text-sm text-yellow-700">Aguardando</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filter === 'confirmed' ? 'ring-2 ring-green-500' : ''}`}
            onClick={() => setFilter('confirmed')}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-green-600">{confirmedCount}</p>
                <p className="text-sm text-green-700">Confirmadas</p>
              </div>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all ${filter === 'cancelled' ? 'ring-2 ring-red-500' : ''}`}
            onClick={() => setFilter('cancelled')}
          >
            <CardContent className="pt-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-600">
                  {visits.filter(v => v.status === 'cancelled').length}
                </p>
                <p className="text-sm text-red-700">Canceladas</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Lista de Visitas */}
        {filteredVisits.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-600 text-center">
                {filter === 'all' 
                  ? 'Você ainda não recebeu nenhum agendamento de visita.'
                  : `Nenhuma visita com status "${filter}".`}
              </p>
              {filter !== 'all' && (
                <Button variant="link" onClick={() => setFilter('all')} className="mt-2">
                  Ver todas as visitas
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredVisits.map((visit) => (
              <VisitCard
                key={visit.id}
                visit={visit}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
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

export default MinhasVisitas;
