import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { MapPin, X } from 'lucide-react';
import { propertiesAPI } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
});

// Custom colored markers using SVG
const createColoredIcon = (color) => {
  const svgIcon = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32">
      <path fill="${color}" stroke="#fff" stroke-width="1" d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/>
      <circle cx="12" cy="9" r="3" fill="#fff"/>
    </svg>
  `;
  
  return L.divIcon({
    html: svgIcon,
    className: 'custom-svg-marker',
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  });
};

const vendaIcon = createColoredIcon('#22c55e'); // green
const aluguelIcon = createColoredIcon('#3b82f6'); // blue
const lancamentoIcon = createColoredIcon('#f97316'); // orange

// Coordinates for cities in MS (approximate)
const cityCoordinates = {
  'Campo Grande': [-20.4697, -54.6201],
  'Dourados': [-22.2231, -54.8118],
  'Bonito': [-21.1261, -56.4836],
  'Três Lagoas': [-20.7849, -51.7014],
  'Corumbá': [-19.0078, -57.6547],
  'Ponta Porã': [-22.5362, -55.7256],
  'Aquidauana': [-20.4666, -55.7871],
  // Default for unknown cities
  'default': [-20.4697, -54.6201]
};

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${BACKEND_URL}${imagePath}`;
};

const BuscaMapa = () => {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedProperty, setSelectedProperty] = useState(null);
  const [mapCenter, setMapCenter] = useState([-20.4697, -54.6201]); // Campo Grande as default

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        const data = await propertiesAPI.list({ limit: 100 });
        // Usar coordenadas reais se disponíveis, senão usar aproximação por cidade
        const propertiesWithCoords = data.map(prop => ({
          ...prop,
          coordinates: (prop.latitude && prop.longitude) 
            ? [prop.latitude, prop.longitude]
            : cityCoordinates[prop.city] || cityCoordinates['default']
        }));
        setProperties(propertiesWithCoords);
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  const getMarkerIcon = (property) => {
    if (property.is_launch) return lancamentoIcon;
    if (property.purpose === 'ALUGUEL') return aluguelIcon;
    return vendaIcon;
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0
    }).format(price);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Busca no Mapa</h1>
          <p className="text-gray-600">Visualize os imóveis disponíveis por localização</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Map Section */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg overflow-hidden" style={{ height: '600px' }}>
              {loading ? (
                <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Carregando mapa...</p>
                  </div>
                </div>
              ) : (
                <MapContainer
                  center={mapCenter}
                  zoom={11}
                  style={{ height: '100%', width: '100%' }}
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  {properties.map((property) => (
                    <Marker
                      key={property.id}
                      position={property.coordinates}
                      icon={getMarkerIcon(property)}
                      eventHandlers={{
                        click: () => setSelectedProperty(property),
                      }}
                    >
                      <Popup>
                        <div className="min-w-[200px]">
                          <img
                            src={property.images?.[0] ? getImageUrl(property.images[0]) : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=200&h=150&fit=crop'}
                            alt={property.title}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                          <h4 className="font-bold text-sm mb-1">{property.title}</h4>
                          <p className="text-xs text-gray-600 mb-1">{property.neighborhood}, {property.city}</p>
                          <p className="text-sm font-bold text-blue-600">{formatPrice(property.price)}</p>
                          <span className={`inline-block mt-1 text-xs px-2 py-1 rounded ${
                            property.purpose === 'VENDA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                          }`}>
                            {property.purpose}
                          </span>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              )}
            </div>

            {/* Map Legend */}
            <div className="mt-4 bg-white rounded-lg shadow-lg p-4">
              <h4 className="font-semibold text-gray-800 mb-3">Legenda</h4>
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-green-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Venda</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Aluguel</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="text-sm text-gray-600">Lançamento</span>
                </div>
              </div>
            </div>
          </div>

          {/* Properties List */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-4" style={{ maxHeight: '650px', overflowY: 'auto' }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-800">
                  {properties.length} Imóveis
                </h3>
              </div>

              {loading ? (
                <div className="space-y-4">
                  {[1,2,3,4,5].map(i => (
                    <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
                  ))}
                </div>
              ) : (
                <div className="space-y-4">
                  {properties.map(property => (
                    <div
                      key={property.id}
                      onClick={() => setSelectedProperty(property)}
                      className={`border rounded-lg p-3 hover:border-blue-500 hover:shadow-md transition-all cursor-pointer ${
                        selectedProperty?.id === property.id ? 'border-blue-500 shadow-md bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex gap-3">
                        <img
                          src={property.images?.[0] ? getImageUrl(property.images[0]) : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=100&h=80&fit=crop'}
                          alt={property.title}
                          className="w-20 h-20 object-cover rounded"
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-1">
                            <span className={`text-xs px-2 py-1 rounded font-bold ${
                              property.purpose === 'VENDA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {property.purpose}
                            </span>
                          </div>
                          <h4 className="font-semibold text-sm text-gray-800 line-clamp-1 mb-1">
                            {property.title}
                          </h4>
                          <p className="text-xs text-gray-600 mb-1">
                            {property.neighborhood} - {property.city}
                          </p>
                          <p className="text-sm font-bold text-blue-700">
                            {formatPrice(property.price)}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Selected Property Detail */}
        {selectedProperty && (
          <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-96 bg-white rounded-lg shadow-2xl p-4 z-[1000]">
            <button
              onClick={() => setSelectedProperty(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
            >
              <X size={20} />
            </button>
            <div className="flex gap-4">
              <img
                src={selectedProperty.images?.[0] ? getImageUrl(selectedProperty.images[0]) : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&h=100&fit=crop'}
                alt={selectedProperty.title}
                className="w-32 h-24 object-cover rounded"
              />
              <div>
                <h4 className="font-bold text-gray-800 mb-1">{selectedProperty.title}</h4>
                <p className="text-sm text-gray-600">{selectedProperty.neighborhood}, {selectedProperty.city}</p>
                <p className="text-lg font-bold text-blue-600 mt-2">{formatPrice(selectedProperty.price)}</p>
                <a
                  href={`/imovel/${selectedProperty.id}`}
                  className="inline-block mt-2 text-sm text-blue-600 hover:underline"
                >
                  Ver detalhes →
                </a>
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default BuscaMapa;
