import React, { useState, useEffect, useCallback } from 'react';
import { bannersAPI } from '../services/api';
import { X, RefreshCw } from 'lucide-react';

/**
 * Componente para exibir banners publicitários
 * 
 * Props:
 * - position: Posição do banner (home_topo, home_meio, busca_lateral, etc.)
 * - className: Classes CSS adicionais
 * - autoRotate: Se deve rotacionar automaticamente entre múltiplos banners (default: true)
 * - rotateInterval: Intervalo de rotação em ms (default: 5000)
 */
const BannerDisplay = ({ 
  position, 
  className = '', 
  autoRotate = true, 
  rotateInterval = 5000 
}) => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [visible, setVisible] = useState(true);
  const [error, setError] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const loadBanners = useCallback(async () => {
    try {
      setLoading(true);
      setError(false);
      const data = await bannersAPI.getActiveBanners(position);
      if (data && data.length > 0) {
        setBanners(data);
        setImageError(false);
      } else {
        setBanners([]);
      }
    } catch (err) {
      console.error('Error loading banners:', err);
      setError(true);
      // Retry after 5 seconds on error
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1);
        }, 5000);
      }
    } finally {
      setLoading(false);
    }
  }, [position, retryCount]);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  useEffect(() => {
    // Register view when banner is displayed
    if (banners.length > 0 && visible && !imageError) {
      const currentBanner = banners[currentIndex];
      if (currentBanner && currentBanner.id) {
        bannersAPI.registerView(currentBanner.id).catch(() => {});
      }
    }
  }, [currentIndex, banners, visible, imageError]);

  useEffect(() => {
    // Auto-rotate banners
    if (autoRotate && banners.length > 1 && visible) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        setImageError(false); // Reset image error on rotation
      }, rotateInterval);

      return () => clearInterval(interval);
    }
  }, [banners, autoRotate, rotateInterval, visible]);

  const handleBannerClick = (banner) => {
    if (!banner || !banner.link_url) return;
    
    // Register click
    bannersAPI.registerClick(banner.id).catch(() => {});
    
    // Open link in new tab
    window.open(banner.link_url, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    setVisible(false);
  };

  const handleImageError = () => {
    console.warn('Banner image failed to load');
    setImageError(true);
    // Try next banner if available
    if (banners.length > 1) {
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
        setImageError(false);
      }, 1000);
    }
  };

  const handleRetry = () => {
    setRetryCount(0);
    setError(false);
    setImageError(false);
    loadBanners();
  };

  // Don't render if not visible
  if (!visible) {
    return null;
  }

  // Show nothing while loading (avoid flicker)
  if (loading && banners.length === 0) {
    return null;
  }

  // No banners available
  if (!loading && banners.length === 0) {
    return null;
  }

  // Error state with retry option (only show if had banners before)
  if (error && banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  // Safety check
  if (!currentBanner) {
    return null;
  }

  const imageUrl = currentBanner.image_url?.startsWith('http') 
    ? currentBanner.image_url 
    : `${process.env.REACT_APP_BACKEND_URL}${currentBanner.image_url}`;

  return (
    <div className={`banner-container relative ${className}`} data-testid={`banner-${position}`}>
      {/* Banner Image */}
      <div 
        className="banner-wrapper cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 relative group"
        onClick={() => handleBannerClick(currentBanner)}
      >
        {!imageError ? (
          <img
            src={imageUrl}
            alt={currentBanner.title || 'Banner'}
            className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
            loading="lazy"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-32 bg-gray-100 flex items-center justify-center">
            <button 
              onClick={(e) => { e.stopPropagation(); handleRetry(); }}
              className="text-gray-400 hover:text-gray-600 flex items-center gap-2"
            >
              <RefreshCw size={20} />
              <span className="text-sm">Recarregar</span>
            </button>
          </div>
        )}
        
        {/* Overlay com efeito hover */}
        {!imageError && (
          <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        )}
        
        {/* Botão de fechar (opcional) */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleClose();
          }}
          className="absolute top-2 right-2 bg-black bg-opacity-50 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-opacity-70"
          aria-label="Fechar banner"
        >
          <X size={16} />
        </button>
      </div>

      {/* Indicadores de rotação (se houver múltiplos banners) */}
      {banners.length > 1 && (
        <div className="flex justify-center gap-2 mt-2">
          {banners.map((_, index) => (
            <button
              key={index}
              onClick={() => { setCurrentIndex(index); setImageError(false); }}
              className={`w-2 h-2 rounded-full transition-all duration-300 ${
                index === currentIndex 
                  ? 'bg-blue-600 w-4' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
              aria-label={`Ir para banner ${index + 1}`}
            />
          ))}
        </div>
      )}

      {/* Badge de publicidade (opcional) */}
      <div className="text-xs text-gray-400 text-center mt-1">
        Publicidade
      </div>
    </div>
  );
};

export default BannerDisplay;
