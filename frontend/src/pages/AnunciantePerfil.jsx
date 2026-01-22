import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import { Button } from '../components/ui/button';
import WhatsAppButton from '../components/WhatsAppButton';
import { 
  User, MapPin, Phone, Building, Award, Calendar, 
  ArrowLeft, MessageCircle, Home, Star, Share2, Copy, 
  Check, X, Facebook, Twitter
} from 'lucide-react';
import { authAPI, propertiesAPI } from '../services/api';
import api from '../services/api';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const AnunciantePerfil = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetchProfile();
    fetchProperties();
  }, [userId]);

  // Fechar menu de compartilhamento ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (showShareMenu && !event.target.closest('[data-testid="btn-share"]') && !event.target.closest('.share-menu')) {
        setShowShareMenu(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [showShareMenu]);

  const fetchProfile = async () => {
    try {
      const response = await api.get(`/auth/profile/${userId}`);
      setProfile(response.data);
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError('Perfil não encontrado');
    }
  };

  const fetchProperties = async () => {
    try {
      const allProperties = await propertiesAPI.list({ limit: 100 });
      // Filtrar apenas as propriedades deste anunciante
      const ownerProperties = allProperties.filter(p => p.owner_id === userId);
      setProperties(ownerProperties);
    } catch (err) {
      console.error('Error fetching properties:', err);
    } finally {
      setLoading(false);
    }
  };

  const getProfilePhotoUrl = () => {
    if (!profile?.profile_photo) return null;
    if (profile.profile_photo.startsWith('http')) return profile.profile_photo;
    return `${BACKEND_URL}${profile.profile_photo}`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });
  };

  // URL do perfil para compartilhamento
  const getProfileUrl = () => {
    return window.location.href;
  };

  // Texto para compartilhamento
  const getShareText = () => {
    const typeText = profile?.user_type === 'corretor' ? 'Corretor' : 
                     profile?.user_type === 'imobiliaria' ? 'Imobiliária' : 'Anunciante';
    return `Confira o perfil de ${profile?.name} no ImovLocal! ${typeText} com ${profile?.total_properties || 0} imóveis disponíveis.`;
  };

  // Copiar link para a área de transferência
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(getProfileUrl());
      setCopied(true);
      toast.success('Link copiado!', {
        description: 'O link do perfil foi copiado para a área de transferência.'
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar', {
        description: 'Não foi possível copiar o link.'
      });
    }
  };

  // Compartilhar via WhatsApp
  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(`${getShareText()}\n\n${getProfileUrl()}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
    setShowShareMenu(false);
  };

  // Compartilhar via Facebook
  const handleShareFacebook = () => {
    const url = encodeURIComponent(getProfileUrl());
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  // Compartilhar via Twitter/X
  const handleShareTwitter = () => {
    const text = encodeURIComponent(getShareText());
    const url = encodeURIComponent(getProfileUrl());
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank', 'width=600,height=400');
    setShowShareMenu(false);
  };

  // Compartilhar via Email
  const handleShareEmail = () => {
    const subject = encodeURIComponent(`Perfil de ${profile?.name} no ImovLocal`);
    const body = encodeURIComponent(`${getShareText()}\n\nAcesse o perfil: ${getProfileUrl()}`);
    window.location.href = `mailto:?subject=${subject}&body=${body}`;
    setShowShareMenu(false);
  };

  // Usar API nativa de compartilhamento (mobile)
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile?.name} - ImovLocal`,
          text: getShareText(),
          url: getProfileUrl(),
        });
        setShowShareMenu(false);
      } catch (err) {
        if (err.name !== 'AbortError') {
          console.error('Error sharing:', err);
        }
      }
    } else {
      // Fallback para desktop - mostrar menu de opções
      setShowShareMenu(!showShareMenu);
    }
  };

  // WhatsApp com mensagem personalizada
  const handleWhatsAppClick = () => {
    if (!profile?.phone) {
      alert('Número de WhatsApp não disponível.');
      return;
    }
    
    let phone = profile.phone.replace(/\D/g, '');
    if (phone.length === 11 || phone.length === 10) {
      phone = '55' + phone;
    }
    
    const message = encodeURIComponent(
      `Olá ${profile.name}! 🏠\n\nVim pelo seu perfil no ImovLocal e gostaria de mais informações sobre seus imóveis disponíveis.`
    );
    
    window.open(`https://wa.me/${phone}?text=${message}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-lg p-8 animate-pulse">
              <div className="flex items-center gap-6">
                <div className="w-32 h-32 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-4">
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                </div>
              </div>
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
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-white rounded-lg shadow-lg p-12">
              <User size={64} className="text-gray-300 mx-auto mb-4" />
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Perfil não encontrado</h2>
              <p className="text-gray-600 mb-6">O anunciante que você está procurando não existe ou foi removido.</p>
              <Link to="/">
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar para Home
                </Button>
              </Link>
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

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-8">
        <div className="container mx-auto px-4">
          <Link to="/" className="inline-flex items-center text-white/80 hover:text-white mb-4">
            <ArrowLeft size={18} className="mr-2" />
            Voltar para busca
          </Link>
        </div>
      </div>

      <div className="container mx-auto px-4 -mt-8 pb-12">
        <div className="max-w-4xl mx-auto">
          
          {/* Profile Card */}
          <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
            <div className="flex flex-col md:flex-row items-start gap-6">
              
              {/* Photo */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center shadow-lg">
                  {profile.profile_photo ? (
                    <img 
                      src={getProfilePhotoUrl()} 
                      alt={profile.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="text-white" size={64} />
                  )}
                </div>
              </div>

              {/* Info */}
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <h1 className="text-2xl md:text-3xl font-bold text-gray-800">{profile.name}</h1>
                  {profile.user_type === 'corretor' && (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">
                      <Award size={12} className="inline mr-1" />
                      Corretor
                    </span>
                  )}
                </div>

                {profile.company && (
                  <p className="text-lg text-gray-600 mb-2">
                    <Building size={16} className="inline mr-2" />
                    {profile.company}
                  </p>
                )}

                {profile.creci && (
                  <p className="text-sm text-green-700 font-medium mb-2">
                    CRECI: {profile.creci}
                  </p>
                )}

                <div className="flex flex-wrap gap-4 text-sm text-gray-600 mb-4">
                  {profile.city && profile.state && (
                    <span className="flex items-center">
                      <MapPin size={16} className="mr-1 text-gray-400" />
                      {profile.city}/{profile.state}
                    </span>
                  )}
                  {profile.created_at && (
                    <span className="flex items-center">
                      <Calendar size={16} className="mr-1 text-gray-400" />
                      Membro desde {formatDate(profile.created_at)}
                    </span>
                  )}
                </div>

                {/* Stats */}
                <div className="flex gap-6 py-4 border-t border-b border-gray-200 mb-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">{profile.total_properties}</p>
                    <p className="text-xs text-gray-600">Imóveis Anunciados</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {properties.filter(p => p.purpose === 'VENDA').length}
                    </p>
                    <p className="text-xs text-gray-600">Para Venda</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-orange-600">
                      {properties.filter(p => p.purpose === 'ALUGUEL' || p.purpose === 'ALUGUEL_TEMPORADA').length}
                    </p>
                    <p className="text-xs text-gray-600">Para Aluguel</p>
                  </div>
                </div>

                {/* Bio */}
                {profile.bio && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-4">
                    <h3 className="font-semibold text-gray-800 mb-2">Sobre</h3>
                    <p className="text-gray-600 text-sm leading-relaxed">{profile.bio}</p>
                  </div>
                )}

                {/* Contact Buttons */}
                <div className="flex flex-wrap gap-3">
                  <Button 
                    onClick={handleWhatsAppClick}
                    className="bg-green-500 hover:bg-green-600 text-white"
                    data-testid="btn-whatsapp"
                  >
                    <MessageCircle size={18} className="mr-2" fill="white" />
                    Chamar no WhatsApp
                  </Button>
                  
                  {profile.phone && (
                    <Button 
                      variant="outline"
                      onClick={() => window.location.href = `tel:${profile.phone}`}
                      className="border-blue-600 text-blue-600 hover:bg-blue-50"
                    >
                      <Phone size={18} className="mr-2" />
                      {profile.phone}
                    </Button>
                  )}

                  {/* Botão de Compartilhar */}
                  <div className="relative">
                    <Button 
                      variant="outline"
                      onClick={handleNativeShare}
                      className="border-gray-300 text-gray-700 hover:bg-gray-50"
                      data-testid="btn-share"
                    >
                      <Share2 size={18} className="mr-2" />
                      Compartilhar
                    </Button>

                    {/* Menu de Compartilhamento */}
                    {showShareMenu && (
                      <div className="share-menu absolute top-full left-0 mt-2 bg-white rounded-lg shadow-xl border border-gray-200 py-2 z-50 min-w-[200px]">
                        <button
                          onClick={() => setShowShareMenu(false)}
                          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={16} />
                        </button>
                        
                        <p className="px-4 py-2 text-xs text-gray-500 font-medium border-b mb-2">
                          Compartilhar perfil
                        </p>

                        <button
                          onClick={handleCopyLink}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                          data-testid="share-copy"
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
                          data-testid="share-whatsapp"
                        >
                          <MessageCircle size={18} className="text-green-500" />
                          WhatsApp
                        </button>

                        <button
                          onClick={handleShareFacebook}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                          data-testid="share-facebook"
                        >
                          <Facebook size={18} className="text-blue-600" />
                          Facebook
                        </button>

                        <button
                          onClick={handleShareTwitter}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                          data-testid="share-twitter"
                        >
                          <Twitter size={18} className="text-sky-500" />
                          Twitter / X
                        </button>

                        <button
                          onClick={handleShareEmail}
                          className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center gap-3 text-gray-700"
                          data-testid="share-email"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-red-500">
                            <rect width="20" height="16" x="2" y="4" rx="2"/>
                            <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
                          </svg>
                          Email
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Properties Section */}
          <div className="bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800">
                <Home size={24} className="inline mr-2 text-blue-600" />
                Imóveis de {profile.name.split(' ')[0]}
              </h2>
              <span className="text-sm text-gray-600">
                {properties.length} imóve{properties.length !== 1 ? 'is' : 'l'}
              </span>
            </div>

            {properties.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {properties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Home size={48} className="text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Nenhum imóvel anunciado
                </h3>
                <p className="text-gray-600">
                  Este anunciante ainda não possui imóveis cadastrados.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AnunciantePerfil;
