import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WhatsAppButton from '../components/WhatsAppButton';
import { propertiesAPI, visitsAPI } from '../services/api';
import { MapPin, Bed, Bath, Square, Calendar, Phone, Mail, Share2, Heart, ArrowLeft, User, CheckCircle, AlertCircle, Copy, X, Facebook, Twitter, MessageCircle, Check, Map } from 'lucide-react';
import { Button } from '../components/ui/button';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default markers
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  // If already a full URL, return as-is
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  // If relative path, prefix with backend URL
  return `${BACKEND_URL}${imagePath}`;
};

const PropertyDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [property, setProperty] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isFavorite, setIsFavorite] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Estado do formulário de agendamento
  const [visitForm, setVisitForm] = useState({
    visitor_name: '',
    visitor_phone: '',
    visitor_email: '',
    visit_date: '',
    visit_time: '',
    message: ''
  });
  const [visitFormErrors, setVisitFormErrors] = useState({});
  const [submittingVisit, setSubmittingVisit] = useState(false);
  const [visitSuccess, setVisitSuccess] = useState(false);
  const [showMap, setShowMap] = useState(false);

  useEffect(() => {
    const fetchProperty = async () => {
      try {
        const data = await propertiesAPI.getById(id);
        setProperty(data);
      } catch (error) {
        console.error('Error fetching property:', error);
      }
    };

    if (id) {
      fetchProperty();
    }
  }, [id]);

  // Função para validar e enviar o formulário de visita
  const handleVisitSubmit = async (e) => {
    e.preventDefault();
    
    const errors = {};
    
    // Validar nome (obrigatório)
    if (!visitForm.visitor_name || visitForm.visitor_name.trim().length < 2) {
      errors.visitor_name = 'Nome é obrigatório (mínimo 2 caracteres)';
    }
    
    // Validar telefone (obrigatório)
    const phoneClean = visitForm.visitor_phone.replace(/\D/g, '');
    if (!phoneClean || phoneClean.length < 10) {
      errors.visitor_phone = 'Telefone é obrigatório (mínimo 10 dígitos)';
    }
    
    // Validar data
    if (!visitForm.visit_date) {
      errors.visit_date = 'Selecione uma data';
    }
    
    // Validar horário
    if (!visitForm.visit_time) {
      errors.visit_time = 'Selecione um horário';
    }
    
    if (Object.keys(errors).length > 0) {
      setVisitFormErrors(errors);
      return;
    }
    
    setSubmittingVisit(true);
    
    try {
      await visitsAPI.schedule({
        property_id: property.id,
        visitor_name: visitForm.visitor_name.trim(),
        visitor_phone: visitForm.visitor_phone.trim(),
        visitor_email: visitForm.visitor_email || null,
        visit_date: visitForm.visit_date,
        visit_time: visitForm.visit_time,
        message: visitForm.message || null
      });
      
      setVisitSuccess(true);
      toast.success('Visita agendada com sucesso!', {
        description: 'O anunciante será notificado e entrará em contato.'
      });
      
    } catch (error) {
      console.error('Error scheduling visit:', error);
      toast.error('Erro ao agendar visita', {
        description: error.response?.data?.detail || 'Tente novamente.'
      });
    } finally {
      setSubmittingVisit(false);
    }
  };

  // ==========================================
  // FUNÇÕES DE COMPARTILHAMENTO DO IMÓVEL
  // ==========================================
  
  const getPropertyUrl = () => window.location.href;
  
  const getShareText = () => {
    if (!property) return '';
    const purposeText = property.purpose === 'VENDA' ? 'Venda' : 'Aluguel';
    const price = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 0 }).format(property.price);
    return `🏠 ${property.title}\n📍 ${property.neighborhood} - ${property.city}/${property.state}\n💰 ${price} (${purposeText})\n\nConfira no ImovLocal:`;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getPropertyUrl());
      setCopied(true);
      toast.success('Link copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar link');
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()}\n${getPropertyUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(false);
  };

  const handleShareFacebook = () => {
    const url = encodeURIComponent(getPropertyUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareTwitter = () => {
    const text = encodeURIComponent(`${property?.title} - ${property?.city}/${property?.state}`);
    const url = encodeURIComponent(getPropertyUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Imóvel: ${property?.title}`);
    const body = encodeURIComponent(`${getShareText()}\n${getPropertyUrl()}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: property?.title,
          text: getShareText(),
          url: getPropertyUrl(),
        });
      } catch (err) {
        if (err.name !== 'AbortError') {
          setShowShareMenu(!showShareMenu);
        }
      }
    } else {
      setShowShareMenu(!showShareMenu);
    }
  };

  if (!property) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Imóvel não encontrado</h1>
          <Button onClick={() => navigate('/')}>Voltar para o início</Button>
        </div>
        <Footer />
      </div>
    );
  }

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Mock additional images (use property images or fallback)
  const images = property.images && property.images.length > 0
    ? property.images.map(img => getImageUrl(img))
    : [
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop',
        'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'
      ];

  // Mock property details or use from API
  const details = {
    bedrooms: property.bedrooms || null,
    bathrooms: property.bathrooms || null,
    area: property.area || null,
    garage: property.garage || null,
    yearBuilt: property.year_built || null,
    condominio: property.condominio,
    iptu: property.iptu || null
  };

  const features = property.features && property.features.length > 0
    ? property.features
    : [
        'Sala de estar ampla',
        'Cozinha planejada',
        'Área de serviço',
        'Sacada com churrasqueira',
        'Armários embutidos',
        'Piso porcelanato',
        'Ar condicionado',
        'Portaria 24h',
        'Academia',
        'Piscina',
        'Salão de festas',
        'Playground'
      ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium mb-6 transition-colors"
        >
          <ArrowLeft size={20} />
          Voltar
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            {/* Image Gallery */}
            <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
              <div className="relative h-96">
                <img
                  src={images[currentImageIndex]}
                  alt={property.title}
                  className="w-full h-full object-cover"
                />
                <div className={`absolute top-4 left-4 px-4 py-2 rounded-md font-bold text-sm ${
                  property.purpose === 'VENDA'
                    ? 'bg-green-600 text-white'
                    : 'bg-blue-600 text-white'
                }`}>
                  {property.purpose}
                </div>
                {property.isLaunch && (
                  <div className="absolute top-4 right-4 px-4 py-2 rounded-md font-bold text-sm bg-orange-500 text-white">
                    LANÇAMENTO
                  </div>
                )}
              </div>
              
              {/* Thumbnail Gallery */}
              <div className="grid grid-cols-4 gap-2 p-4">
                {images.map((img, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative h-20 rounded overflow-hidden border-2 transition-all ${
                      currentImageIndex === index ? 'border-blue-600' : 'border-gray-200'
                    }`}
                  >
                    <img src={img} alt={`View ${index + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Property Info */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm text-gray-600 font-medium mb-1">{property.type}</p>
                  <h1 className="text-3xl font-bold text-gray-800 mb-2">{property.title}</h1>
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin size={18} />
                    <span>{property.neighborhood} - {property.city}/{property.state}</span>
                  </div>
                </div>
                <button
                  onClick={() => setIsFavorite(!isFavorite)}
                  className="p-3 rounded-full hover:bg-gray-100 transition-colors"
                >
                  <Heart size={24} className={isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-400'} />
                </button>
              </div>

              <div className="border-t border-b border-gray-200 py-4 my-6">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {details.bedrooms && (
                    <div className="flex items-center gap-3">
                      <Bed size={24} className="text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Quartos</p>
                        <p className="font-bold text-gray-800">{details.bedrooms}</p>
                      </div>
                    </div>
                  )}
                  {details.bathrooms && (
                    <div className="flex items-center gap-3">
                      <Bath size={24} className="text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Banheiros</p>
                        <p className="font-bold text-gray-800">{details.bathrooms}</p>
                      </div>
                    </div>
                  )}
                  {details.area && (
                    <div className="flex items-center gap-3">
                      <Square size={24} className="text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Área</p>
                        <p className="font-bold text-gray-800">{details.area}m²</p>
                      </div>
                    </div>
                  )}
                  {details.yearBuilt && (
                    <div className="flex items-center gap-3">
                      <Calendar size={24} className="text-blue-600" />
                      <div>
                        <p className="text-sm text-gray-600">Ano</p>
                        <p className="font-bold text-gray-800">{details.yearBuilt}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Descrição</h2>
                <p className="text-gray-600 leading-relaxed">
                  {property.description}
                </p>
              </div>

              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800 mb-3">Características</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-2 text-gray-700">
                      <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                      <span className="text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-3">Valores</h2>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Valor do imóvel:</span>
                    <span className="text-2xl font-bold text-blue-700">{formatPrice(property.price)}</span>
                  </div>
                  {details.condominio && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Condomínio:</span>
                      <span className="font-semibold text-gray-800">{formatPrice(details.condominio)}</span>
                    </div>
                  )}
                  {details.iptu && (
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">IPTU (anual):</span>
                      <span className="font-semibold text-gray-800">{formatPrice(details.iptu)}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            {/* Contact Card */}
            <div className="bg-white rounded-lg shadow-lg p-6 mb-6 sticky top-24">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Entre em contato</h3>
              
              {/* Owner Info - Clicável para ir ao perfil */}
              {property.owner_name && (
                <Link 
                  to={`/anunciante/${property.owner_id}`}
                  className="flex items-center gap-3 mb-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer group"
                  data-testid="link-owner-profile"
                >
                  <div className="w-14 h-14 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center flex-shrink-0">
                    {property.owner_photo ? (
                      <img 
                        src={getImageUrl(property.owner_photo)} 
                        alt={property.owner_name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <User size={28} className="text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 group-hover:text-blue-600 transition-colors truncate">
                      {property.owner_name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {property.owner_user_type === 'corretor' ? 'Corretor' : 
                       property.owner_user_type === 'imobiliaria' ? 'Imobiliária' : 'Particular'}
                      {property.owner_creci && ` • CRECI: ${property.owner_creci}`}
                    </p>
                    {property.owner_company && (
                      <p className="text-xs text-gray-500 truncate">{property.owner_company}</p>
                    )}
                  </div>
                  <div className="text-blue-600 opacity-0 group-hover:opacity-100 transition-opacity">
                    →
                  </div>
                </Link>
              )}

              {/* Owner Bio Preview */}
              {property.owner_bio && (
                <div className="mb-4 p-3 bg-blue-50 rounded-lg">
                  <p className="text-xs text-blue-800 line-clamp-2">{property.owner_bio}</p>
                  <Link 
                    to={`/anunciante/${property.owner_id}`}
                    className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                  >
                    Ver perfil completo →
                  </Link>
                </div>
              )}
              
              <div className="space-y-4">
                {/* WhatsApp Button - Principal */}
                <WhatsAppButton 
                  property={property} 
                  ownerPhone={property.owner_phone}
                  variant="full"
                />
                
                {property.owner_phone && (
                  <Button 
                    className="w-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center gap-2"
                    onClick={() => window.location.href = `tel:${property.owner_phone}`}
                  >
                    <Phone size={18} />
                    {property.owner_phone}
                  </Button>
                )}
                
                {/* Botão de Compartilhar com Menu */}
                <div className="relative">
                  <Button 
                    variant="outline" 
                    className="w-full flex items-center justify-center gap-2"
                    onClick={handleNativeShare}
                    data-testid="btn-share-property"
                  >
                    <Share2 size={18} />
                    Compartilhar
                  </Button>

                  {/* Menu de Compartilhamento */}
                  {showShareMenu && (
                    <div className="absolute bottom-full left-0 mb-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 w-full min-w-[200px]">
                      <button
                        onClick={() => setShowShareMenu(false)}
                        className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                      >
                        <X size={16} />
                      </button>
                      
                      <p className="px-4 py-2 text-xs text-gray-500 font-medium border-b mb-2">
                        Compartilhar imóvel
                      </p>

                      <button
                        onClick={handleCopyLink}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        {copied ? (
                          <Check size={18} className="text-green-600" />
                        ) : (
                          <Copy size={18} className="text-gray-500" />
                        )}
                        {copied ? 'Link copiado!' : 'Copiar link'}
                      </button>

                      <button
                        onClick={handleShareWhatsApp}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <MessageCircle size={18} className="text-green-500" />
                        WhatsApp
                      </button>

                      <button
                        onClick={handleShareFacebook}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <Facebook size={18} className="text-blue-600" />
                        Facebook
                      </button>

                      <button
                        onClick={handleShareTwitter}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <Twitter size={18} className="text-sky-500" />
                        Twitter / X
                      </button>

                      <button
                        onClick={handleShareEmail}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                      >
                        <Mail size={18} className="text-red-500" />
                        Email
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Botão Ver no Mapa */}
              {property.latitude && property.longitude && (
                <Button 
                  variant="outline" 
                  className="w-full mt-4 flex items-center justify-center gap-2 border-green-500 text-green-700 hover:bg-green-50"
                  onClick={() => setShowMap(true)}
                  data-testid="btn-view-map"
                >
                  <MapPin size={18} />
                  Ver no Mapa
                </Button>
              )}

              <div className="mt-6 pt-6 border-t border-gray-200">
                <p className="text-sm text-gray-600 mb-3">Código do imóvel:</p>
                <p className="font-bold text-gray-800 text-lg">#{property.id.substring(0, 8)}</p>
              </div>

              {/* Formulário de Agendamento de Visita - Fase 4 */}
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <Calendar size={20} className="text-orange-500" />
                  Agendar visita
                </h4>

                {visitSuccess ? (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-center">
                    <CheckCircle className="mx-auto text-green-500 mb-2" size={40} />
                    <h5 className="font-semibold text-green-800 mb-1">Visita Agendada!</h5>
                    <p className="text-sm text-green-700">
                      O anunciante receberá uma notificação e entrará em contato com você.
                    </p>
                    <Button 
                      variant="outline" 
                      className="mt-3"
                      onClick={() => {
                        setVisitSuccess(false);
                        setVisitForm({
                          visitor_name: '',
                          visitor_phone: '',
                          visitor_email: '',
                          visit_date: '',
                          visit_time: '',
                          message: ''
                        });
                      }}
                    >
                      Agendar outra visita
                    </Button>
                  </div>
                ) : (
                  <form onSubmit={handleVisitSubmit} className="space-y-3">
                    {/* Nome - OBRIGATÓRIO */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seu Nome <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={visitForm.visitor_name}
                        onChange={(e) => {
                          setVisitForm({...visitForm, visitor_name: e.target.value});
                          if (visitFormErrors.visitor_name) {
                            setVisitFormErrors({...visitFormErrors, visitor_name: ''});
                          }
                        }}
                        placeholder="Digite seu nome completo"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          visitFormErrors.visitor_name ? 'border-red-500' : 'border-gray-300'
                        }`}
                        data-testid="visit-name"
                      />
                      {visitFormErrors.visitor_name && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {visitFormErrors.visitor_name}
                        </p>
                      )}
                    </div>

                    {/* Telefone - OBRIGATÓRIO */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seu Telefone <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="tel"
                        value={visitForm.visitor_phone}
                        onChange={(e) => {
                          setVisitForm({...visitForm, visitor_phone: e.target.value});
                          if (visitFormErrors.visitor_phone) {
                            setVisitFormErrors({...visitFormErrors, visitor_phone: ''});
                          }
                        }}
                        placeholder="(67) 99999-9999"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                          visitFormErrors.visitor_phone ? 'border-red-500' : 'border-gray-300'
                        }`}
                        data-testid="visit-phone"
                      />
                      {visitFormErrors.visitor_phone && (
                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                          <AlertCircle size={12} />
                          {visitFormErrors.visitor_phone}
                        </p>
                      )}
                    </div>

                    {/* Email - Opcional */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Seu Email <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <input
                        type="email"
                        value={visitForm.visitor_email}
                        onChange={(e) => setVisitForm({...visitForm, visitor_email: e.target.value})}
                        placeholder="seu@email.com"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        data-testid="visit-email"
                      />
                    </div>

                    {/* Data e Hora */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Data <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="date"
                          value={visitForm.visit_date}
                          onChange={(e) => {
                            setVisitForm({...visitForm, visit_date: e.target.value});
                            if (visitFormErrors.visit_date) {
                              setVisitFormErrors({...visitFormErrors, visit_date: ''});
                            }
                          }}
                          min={new Date().toISOString().split('T')[0]}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            visitFormErrors.visit_date ? 'border-red-500' : 'border-gray-300'
                          }`}
                          data-testid="visit-date"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Horário <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="time"
                          value={visitForm.visit_time}
                          onChange={(e) => {
                            setVisitForm({...visitForm, visit_time: e.target.value});
                            if (visitFormErrors.visit_time) {
                              setVisitFormErrors({...visitFormErrors, visit_time: ''});
                            }
                          }}
                          className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                            visitFormErrors.visit_time ? 'border-red-500' : 'border-gray-300'
                          }`}
                          data-testid="visit-time"
                        />
                      </div>
                    </div>

                    {/* Mensagem - Opcional */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mensagem <span className="text-gray-400 text-xs">(opcional)</span>
                      </label>
                      <textarea
                        value={visitForm.message}
                        onChange={(e) => setVisitForm({...visitForm, message: e.target.value})}
                        placeholder="Alguma observação ou pergunta?"
                        rows={2}
                        maxLength={500}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                        data-testid="visit-message"
                      />
                    </div>

                    <Button 
                      type="submit"
                      className="w-full bg-orange-500 hover:bg-orange-600"
                      disabled={submittingVisit}
                      data-testid="visit-submit"
                    >
                      {submittingVisit ? 'Agendando...' : 'Agendar visita'}
                    </Button>

                    <p className="text-xs text-gray-500 text-center">
                      <span className="text-red-500">*</span> Campos obrigatórios
                    </p>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modal do Mapa */}
      {showMap && property.latitude && property.longitude && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-lg text-gray-800">Localização do Imóvel</h3>
                <p className="text-sm text-gray-600">{property.neighborhood} - {property.city}/{property.state}</p>
              </div>
              <button 
                onClick={() => setShowMap(false)}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <X size={24} />
              </button>
            </div>
            <div className="h-[500px]">
              <MapContainer 
                center={[property.latitude, property.longitude]} 
                zoom={15} 
                style={{ height: '100%', width: '100%' }}
              >
                <TileLayer
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                />
                <Marker position={[property.latitude, property.longitude]}>
                  <Popup>
                    <div className="text-center">
                      <strong>{property.title}</strong>
                      <br />
                      <span className="text-sm text-gray-600">{property.neighborhood}</span>
                    </div>
                  </Popup>
                </Marker>
              </MapContainer>
            </div>
            <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${property.latitude},${property.longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline text-sm flex items-center gap-1"
              >
                <MapPin size={16} />
                Abrir no Google Maps
              </a>
              <Button variant="outline" onClick={() => setShowMap(false)}>
                Fechar
              </Button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default PropertyDetail;