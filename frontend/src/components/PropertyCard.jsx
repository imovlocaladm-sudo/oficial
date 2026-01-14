import React from 'react';
import { Link } from 'react-router-dom';
import { MapPin } from 'lucide-react';
import WhatsAppButton from './WhatsAppButton';

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

const PropertyCard = ({ property }) => {
  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  // Get first image or fallback
  const image = property.images && property.images.length > 0 
    ? getImageUrl(property.images[0])
    : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop';

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
      {/* Property Image - Clickable */}
      <Link to={`/imovel/${property.id}`}>
        <div className="relative h-48 overflow-hidden">
          <img 
            src={image} 
            alt={property.title}
            className="w-full h-full object-cover transition-transform duration-300 hover:scale-110"
          />
          {/* Purpose Badge */}
          <div className={`absolute top-3 left-3 px-3 py-1 rounded-md font-bold text-sm ${
            property.purpose === 'VENDA' 
              ? 'bg-green-600 text-white' 
              : property.purpose === 'ALUGUEL_TEMPORADA'
              ? 'bg-purple-600 text-white'
              : 'bg-blue-600 text-white'
          }`}>
            {property.purpose === 'ALUGUEL_TEMPORADA' ? 'ALUGUEL_TEMPORADA' : property.purpose}
          </div>
          {/* Launch Badge */}
          {property.is_launch && (
            <div className="absolute top-3 right-3 px-3 py-1 rounded-md font-bold text-sm bg-orange-500 text-white">
              LANÇAMENTO
            </div>
          )}
          {/* Exclusive Badge */}
          {property.is_exclusive_launch && (
            <div className="absolute top-14 right-3 px-3 py-1 rounded-md font-bold text-sm bg-purple-600 text-white shadow-lg flex items-center gap-1">
              🔒 EXCLUSIVO
            </div>
          )}
          {/* Featured Badge */}
          {property.is_featured && (
            <div className="absolute bottom-3 left-3 px-3 py-1 rounded-md font-bold text-sm bg-yellow-500 text-white shadow-lg flex items-center gap-1">
              ⭐ DESTAQUE
            </div>
          )}
        </div>
      </Link>

      {/* Property Details */}
      <div className="p-4">
        <Link to={`/imovel/${property.id}`}>
          <p className="text-sm text-gray-600 font-medium mb-1">{property.property_type}</p>
          <h3 className="font-semibold text-gray-800 mb-2 line-clamp-2 min-h-[3rem] hover:text-blue-600 transition-colors">
            {property.title}
          </h3>
        </Link>
        
        {/* Location */}
        <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
          <MapPin size={14} className="text-gray-400" />
          <span>{property.neighborhood}</span>
          <span className="mx-1">•</span>
          <span>{property.city} - {property.state}</span>
        </div>

        {/* Price with WhatsApp Button */}
        <div className="pt-3 border-t border-gray-200">
          <div className="flex items-center justify-between">
            <p className="text-2xl font-bold text-blue-700">
              {formatPrice(property.price)}
            </p>
            {/* WhatsApp Button - Mini variant */}
            <WhatsAppButton 
              property={property} 
              ownerPhone={property.owner_phone}
              variant="mini" 
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default PropertyCard;
