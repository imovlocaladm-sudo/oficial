import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { User, MapPin, Phone, Award, ArrowLeft, MessageCircle, Home, Share2, Copy, Check, X } from 'lucide-react';
import { propertiesAPI } from '../services/api';
import api from '../services/api';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http')) return imagePath;
  return `${BACKEND_URL}${imagePath}`;
};

const formatPrice = (price) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(price);
};

const PropertyMiniCard = ({ property }) => {
  const mainImage = property.images?.[0] || property.photos?.[0];
  
  return (
    <Link 
      to={`/imovel/${property.id}`}
      className="group bg-white rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow border border-gray-100"
      data-testid={`property-card-${property.id}`}
    >
      <div className="relative aspect-[4/3] bg-gray-100">
        {mainImage ? (
          <img 
            src={getImageUrl(mainImage)} 
            alt={property.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gray-200">
            <Home size={32} className="text-gray-400" />
          </div>
        )}
        <span className={`absolute top-2 left-2 px-2 py-1 text-xs font-bold rounded ${
          property.purpose === 'VENDA' ? 'bg-green-500 text-white' : 'bg-blue-500 text-white'
        }`}>
          {property.purpose === 'VENDA' ? 'VENDA' : 'ALUGUEL'}
        </span>
      </div>
      
      <div className="p-3">
        <p className="text-lg font-bold text-green-600 mb-1">
          {formatPrice(property.price)}
          {property.purpose !== 'VENDA' && <span className="text-xs font-normal text-gray-500">/mês</span>}
        </p>
        
        <p className="text-sm text-gray-600 flex items-center gap-1 mb-2">
          <MapPin size={14} className="text-gray-400 flex-shrink-0" />
          <span className="truncate">{property.neighborhood} - {property.city}</span>
        </p>
        
        <div className="flex items-center gap-3 text-xs text-gray-500 mb-3">
          {property.bedrooms && <span>{property.bedrooms} quartos</span>}
          {property.area && <span>{property.area}m²</span>}
        </div>
        
        <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded transition-colors">
          Ver Detalhes
        </button>
      </div>
    </Link>
  );
};

const AnunciantePerfil = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [activeFilter, setActiveFilter] = useState('todos');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, allProperties] = await Promise.all([
          api.get(`/auth/profile/${userId}`),
          propertiesAPI.list({ limit: 100 })
        ]);
        setProfile(profileRes.data);
        setProperties(allProperties.filter(p => p.owner_id === userId));
      } catch (err) {
        setError('Perfil não encontrado');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [userId]);

  const getProfilePhotoUrl = () => {
    if (!profile?.profile_photo) return null;
    return getImageUrl(profile.profile_photo);
  };

  const handleWhatsAppClick = () => {
    if (!profile?.phone) return;
    let phone = profile.phone.replace(/\D/g, '');
    if (phone.length <= 11) phone = '55' + phone;
    const message = encodeURIComponent(`Olá ${profile.name}! Vi seu perfil no ImovLocal e gostaria de informações sobre seus imóveis.`);
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar');
    }
  };

  const handleFilterClick = (filter) => {
    setActiveFilter(filter);
    // Scroll para o topo da seção de imóveis
    document.getElementById('properties-section')?.scrollIntoView({ behavior: 'smooth' });
  };

  const getFilteredProperties = () => {
    switch (activeFilter) {
      case 'venda':
        return properties.filter(p => p.purpose === 'VENDA');
      case 'aluguel':
        return properties.filter(p => p.purpose !== 'VENDA');
      default:
        return properties;
    }
  };

  const getUserTypeLabel = () => {
    if (profile?.user_type === 'corretor') return 'Corretor';
    if (profile?.user_type === 'imobiliaria') return 'Imobiliária';
    return 'Anunciante';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="bg-white rounded-lg p-6 mb-6">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1,2,3,4].map(i => (
                <div key={i} className="bg-white rounded-lg p-4">
                  <div className="aspect-[4/3] bg-gray-200 rounded mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <User size={48} className="text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-800 mb-2">Perfil não encontrado</h2>
          <Link to="/">
            <Button className="mt-4">
              <ArrowLeft size={16} className="mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      {/* Header Compacto do Corretor */}
      <div className="bg-white border-b sticky top-0 z-40 shadow-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            {/* Foto */}
            <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-gradient-to-br from-blue-500 to-blue-700 flex-shrink-0 shadow-md">
              {profile.profile_photo ? (
                <img src={getProfilePhotoUrl()} alt={profile.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <User className="text-white" size={32} />
                </div>
              )}
            </div>

            {/* Info Principal */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg md:text-xl font-bold text-gray-800 truncate">{profile.name}</h1>
                <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-semibold rounded-full flex items-center gap-1">
                  <Award size={12} />
                  {getUserTypeLabel()}
                </span>
              </div>
              
              <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                {profile.creci && (
                  <span className="text-green-700 font-medium">CRECI {profile.creci}</span>
                )}
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin size={14} />
                    {profile.city}/{profile.state}
                  </span>
                )}
              </div>
              
              <p className="text-sm text-gray-500 mt-1">
                {properties.length} imóve{properties.length !== 1 ? 'is' : 'l'} disponíve{properties.length !== 1 ? 'is' : 'l'}
              </p>
            </div>

            {/* Botões de Ação */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={handleCopyLink}
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
                title="Copiar link"
              >
                {copied ? <Check size={20} className="text-green-500" /> : <Share2 size={20} />}
              </button>
              
              {profile.phone && (
                <button
                  onClick={handleWhatsAppClick}
                  className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-full transition-colors shadow-sm"
                  data-testid="btn-whatsapp-header"
                >
                  <MessageCircle size={18} fill="white" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio / Descrição do Corretor */}
      {profile.bio && (
        <div className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="max-w-3xl">
              <h3 className="text-sm font-semibold text-gray-700 mb-2">Sobre</h3>
              <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
            </div>
          </div>
        </div>
      )}

      {/* Grade de Imóveis */}
      <div id="properties-section" className="container mx-auto px-4 py-6">
        {properties.length > 0 ? (
          <>
            {/* Filtros rápidos */}
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2">
              <span className="text-sm text-gray-600 flex-shrink-0">Filtrar:</span>
              <button 
                onClick={() => handleFilterClick('todos')}
                className={`px-3 py-1 rounded-full text-sm flex-shrink-0 transition-colors ${
                  activeFilter === 'todos' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Todos ({properties.length})
              </button>
              <button 
                onClick={() => handleFilterClick('venda')}
                className={`px-3 py-1 rounded-full text-sm flex-shrink-0 transition-colors ${
                  activeFilter === 'venda' 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Venda ({properties.filter(p => p.purpose === 'VENDA').length})
              </button>
              <button 
                onClick={() => handleFilterClick('aluguel')}
                className={`px-3 py-1 rounded-full text-sm flex-shrink-0 transition-colors ${
                  activeFilter === 'aluguel' 
                    ? 'bg-orange-500 text-white' 
                    : 'bg-white border border-gray-300 hover:bg-gray-50'
                }`}
              >
                Aluguel ({properties.filter(p => p.purpose !== 'VENDA').length})
              </button>
            </div>

            {/* Grid de Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-4">
              {getFilteredProperties().map(property => (
                <PropertyMiniCard key={property.id} property={property} />
              ))}
            </div>

            {/* Mensagem quando filtro não tem resultados */}
            {getFilteredProperties().length === 0 && (
              <div className="text-center py-8 bg-white rounded-lg mt-4">
                <p className="text-gray-500">Nenhum imóvel encontrado para este filtro.</p>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16 bg-white rounded-lg">
            <Home size={48} className="text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Nenhum imóvel anunciado</h3>
            <p className="text-gray-600">Este anunciante ainda não possui imóveis cadastrados.</p>
          </div>
        )}
      </div>

      {/* Botão Flutuante WhatsApp (Mobile) */}
      {profile.phone && (
        <button
          onClick={handleWhatsAppClick}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-500 hover:bg-green-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 md:hidden"
          data-testid="btn-whatsapp-float"
        >
          <MessageCircle size={24} fill="white" />
        </button>
      )}

      <Footer />
    </div>
  );
};

export default AnunciantePerfil;
