import React, { useState, useEffect } from 'react';
import { bannersAPI } from '../services/api';
import { X } from 'lucide-react';

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

  useEffect(() => {
    loadBanners();
  }, [position]);

  useEffect(() => {
    // Register view when banner is displayed
    if (banners.length > 0 && visible) {
      const currentBanner = banners[currentIndex];
      bannersAPI.registerView(currentBanner.id);
    }
  }, [currentIndex, banners, visible]);

  useEffect(() => {
    // Auto-rotate banners
    if (autoRotate && banners.length > 1) {
      const interval = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % banners.length);
      }, rotateInterval);

      return () => clearInterval(interval);
    }
  }, [banners, autoRotate, rotateInterval]);

  const loadBanners = async () => {
    try {
      setLoading(true);
      const data = await bannersAPI.getActiveBanners(position);
      setBanners(data);
    } catch (error) {
      console.error('Error loading banners:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBannerClick = (banner) => {
    // Register click
    bannersAPI.registerClick(banner.id);
    
    // Open link in new tab
    window.open(banner.link_url, '_blank', 'noopener,noreferrer');
  };

  const handleClose = () => {
    setVisible(false);
  };

  // Don't render if no banners or not visible
  if (!visible || loading || banners.length === 0) {
    return null;
  }

  const currentBanner = banners[currentIndex];

  return (
    <div className={`banner-container relative ${className}`} data-testid={`banner-${position}`}>
      {/* Banner Image */}
      <div 
        className="banner-wrapper cursor-pointer overflow-hidden rounded-lg shadow-lg hover:shadow-xl transition-shadow duration-300 relative group"
        onClick={() => handleBannerClick(currentBanner)}
      >
        <img
          src={`${process.env.REACT_APP_BACKEND_URL}${currentBanner.image_url}`}
          alt={currentBanner.title}
          className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />
        
        {/* Overlay com efeito hover */}
        <div className="absolute inset-0 bg-black opacity-0 group-hover:opacity-10 transition-opacity duration-300"></div>
        
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
              onClick={() => setCurrentIndex(index)}
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
