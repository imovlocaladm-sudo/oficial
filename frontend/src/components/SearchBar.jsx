import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, MapPin, Filter } from 'lucide-react';
import { Button } from './ui/button';
import { propertyTypes } from '../data/mock';
import { propertiesAPI } from '../services/api';

const states = [
  { code: 'AC', name: 'Acre' },
  { code: 'AL', name: 'Alagoas' },
  { code: 'AP', name: 'Amapá' },
  { code: 'AM', name: 'Amazonas' },
  { code: 'BA', name: 'Bahia' },
  { code: 'CE', name: 'Ceará' },
  { code: 'DF', name: 'Distrito Federal' },
  { code: 'ES', name: 'Espírito Santo' },
  { code: 'GO', name: 'Goiás' },
  { code: 'MA', name: 'Maranhão' },
  { code: 'MT', name: 'Mato Grosso' },
  { code: 'MS', name: 'Mato Grosso do Sul' },
  { code: 'MG', name: 'Minas Gerais' },
  { code: 'PA', name: 'Pará' },
  { code: 'PB', name: 'Paraíba' },
  { code: 'PR', name: 'Paraná' },
  { code: 'PE', name: 'Pernambuco' },
  { code: 'PI', name: 'Piauí' },
  { code: 'RJ', name: 'Rio de Janeiro' },
  { code: 'RN', name: 'Rio Grande do Norte' },
  { code: 'RS', name: 'Rio Grande do Sul' },
  { code: 'RO', name: 'Rondônia' },
  { code: 'RR', name: 'Roraima' },
  { code: 'SC', name: 'Santa Catarina' },
  { code: 'SP', name: 'São Paulo' },
  { code: 'SE', name: 'Sergipe' },
  { code: 'TO', name: 'Tocantins' }
];

const SearchBar = () => {
  const navigate = useNavigate();
  const [searchData, setSearchData] = useState({
    purpose: '',
    propertyType: '',
    state: '',
    city: '',
    neighborhood: '',
    priceRange: ''
  });
  
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);

  // Load cities when state changes
  useEffect(() => {
    const fetchCities = async () => {
      if (searchData.state) {
        setLoadingCities(true);
        try {
          const citiesList = await propertiesAPI.getCities(searchData.state);
          setCities(citiesList);
        } catch (error) {
          console.error('Error loading cities:', error);
          setCities([]);
        } finally {
          setLoadingCities(false);
        }
      } else {
        setCities([]);
      }
      // Reset city and neighborhood when state changes
      setSearchData(prev => ({ ...prev, city: '', neighborhood: '' }));
      setNeighborhoods([]);
    };
    
    fetchCities();
  }, [searchData.state]);

  // Load neighborhoods when city changes
  useEffect(() => {
    const fetchNeighborhoods = async () => {
      if (searchData.city && searchData.state) {
        setLoadingNeighborhoods(true);
        try {
          const neighborhoodsList = await propertiesAPI.getNeighborhoods(searchData.city, searchData.state);
          setNeighborhoods(neighborhoodsList);
        } catch (error) {
          console.error('Error loading neighborhoods:', error);
          setNeighborhoods([]);
        } finally {
          setLoadingNeighborhoods(false);
        }
      } else {
        setNeighborhoods([]);
      }
      // Reset neighborhood when city changes
      setSearchData(prev => ({ ...prev, neighborhood: '' }));
    };
    
    fetchNeighborhoods();
  }, [searchData.city, searchData.state]);

  const handleSearch = (e) => {
    e.preventDefault();
    
    const params = new URLSearchParams();
    
    if (searchData.purpose) {
      const purposeMap = {
        'Venda': 'VENDA',
        'Aluguel': 'ALUGUEL',
        'Aluguel Temporada': 'ALUGUEL_TEMPORADA'
      };
      params.set('purpose', purposeMap[searchData.purpose] || searchData.purpose);
    }
    
    if (searchData.propertyType) params.set('propertyType', searchData.propertyType);
    if (searchData.state) params.set('state', searchData.state);
    if (searchData.city) params.set('city', searchData.city);
    if (searchData.neighborhood) params.set('neighborhood', searchData.neighborhood);
    
    if (searchData.priceRange) {
      const [min, max] = searchData.priceRange.split('-');
      if (min) params.set('minPrice', min);
      if (max && max !== '+') params.set('maxPrice', max);
    }
    
    navigate(`/busca-detalhada?${params.toString()}`);
  };

  return (
    <div className="bg-gradient-to-br from-blue-50 to-blue-100 py-12">
      <div className="container mx-auto px-4">
        <div className="bg-white rounded-xl shadow-xl p-6 md:p-8">
          <h2 className="text-2xl md:text-3xl font-bold text-gray-800 mb-6 text-center">
            Busca de imóveis
          </h2>
          
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Purpose */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Finalidade:</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchData.purpose}
                  onChange={(e) => setSearchData({...searchData, purpose: e.target.value})}
                >
                  <option value="">Todas</option>
                  <option value="Venda">Comprar (Venda)</option>
                  <option value="Aluguel">Alugar</option>
                  <option value="Aluguel Temporada">Aluguel por Temporada</option>
                </select>
              </div>

              {/* Property Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tipo do imóvel:</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchData.propertyType}
                  onChange={(e) => setSearchData({...searchData, propertyType: e.target.value})}
                >
                  <option value="">Todos os tipos</option>
                  {propertyTypes.map((type, index) => (
                    <option key={index} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* State */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">UF:</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchData.state}
                  onChange={(e) => setSearchData({...searchData, state: e.target.value})}
                >
                  <option value="">Todos os estados</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.code} - {state.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* City */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cidade:</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={searchData.city}
                  onChange={(e) => setSearchData({...searchData, city: e.target.value})}
                  disabled={!searchData.state || loadingCities}
                >
                  <option value="">
                    {loadingCities ? 'Carregando...' : !searchData.state ? 'Selecione o estado' : 'Todas as cidades'}
                  </option>
                  {cities.map((city, index) => (
                    <option key={index} value={city}>{city}</option>
                  ))}
                </select>
              </div>

              {/* Neighborhood - NEW FIELD */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Bairro:</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
                  value={searchData.neighborhood}
                  onChange={(e) => setSearchData({...searchData, neighborhood: e.target.value})}
                  disabled={!searchData.city || loadingNeighborhoods}
                >
                  <option value="">
                    {loadingNeighborhoods ? 'Carregando...' : !searchData.city ? 'Selecione a cidade' : 'Todos os bairros'}
                  </option>
                  {neighborhoods.map((neighborhood, index) => (
                    <option key={index} value={neighborhood}>{neighborhood}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Faixa de preço:</label>
                <select
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  value={searchData.priceRange}
                  onChange={(e) => setSearchData({...searchData, priceRange: e.target.value})}
                >
                  <option value="">Qualquer valor</option>
                  <option value="0-200000">Até R$ 200.000</option>
                  <option value="200000-500000">R$ 200.000 - R$ 500.000</option>
                  <option value="500000-1000000">R$ 500.000 - R$ 1.000.000</option>
                  <option value="1000000-+">Acima de R$ 1.000.000</option>
                </select>
              </div>

              {/* Search Button */}
              <div className="flex items-end lg:col-span-2">
                <Button type="submit" className="w-full h-[50px] bg-orange-500 hover:bg-orange-600 text-white font-semibold text-lg">
                  <Search className="mr-2" size={20} />
                  BUSCAR
                </Button>
              </div>
            </div>

            {/* Additional Search Options */}
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={() => navigate('/busca-detalhada')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <Filter size={18} />
                Busca Detalhada
              </button>
              <button
                type="button"
                onClick={() => navigate('/busca-mapa')}
                className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors"
              >
                <MapPin size={18} />
                Busca no Mapa
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SearchBar;
