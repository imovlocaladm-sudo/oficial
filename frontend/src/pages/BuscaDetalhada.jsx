import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import PropertyCard from '../components/PropertyCard';
import { Button } from '../components/ui/button';
import { Search, X } from 'lucide-react';
import { propertiesAPI } from '../services/api';
import { propertyTypes } from '../data/mock';

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

const BuscaDetalhada = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [properties, setProperties] = useState([]);
  const [searched, setSearched] = useState(false);
  
  // Dynamic location data
  const [cities, setCities] = useState([]);
  const [neighborhoods, setNeighborhoods] = useState([]);
  const [loadingCities, setLoadingCities] = useState(false);
  const [loadingNeighborhoods, setLoadingNeighborhoods] = useState(false);
  
  const [filters, setFilters] = useState({
    purpose: '',
    propertyType: '',
    state: '',
    city: '',
    neighborhood: '',
    minPrice: '',
    maxPrice: '',
    minBedrooms: '',
    minBathrooms: '',
    minArea: '',
    hasGarage: false,
    isLaunch: false
  });

  // Load filters from URL params on mount
  useEffect(() => {
    const purpose = searchParams.get('purpose') || '';
    const propertyType = searchParams.get('propertyType') || '';
    const state = searchParams.get('state') || '';
    const city = searchParams.get('city') || '';
    const neighborhood = searchParams.get('neighborhood') || '';
    const minPrice = searchParams.get('minPrice') || '';
    const maxPrice = searchParams.get('maxPrice') || '';

    const newFilters = {
      ...filters,
      purpose,
      propertyType,
      state,
      city,
      neighborhood,
      minPrice,
      maxPrice
    };

    setFilters(newFilters);

    // Load cities if state is set
    if (state) {
      loadCities(state);
    }

    // Auto-search if any filter is set from URL
    if (purpose || propertyType || state || city || neighborhood || minPrice || maxPrice) {
      setTimeout(() => executeSearch(newFilters), 100);
    }
  }, [searchParams]);

  // Load cities when state changes
  const loadCities = async (state) => {
    if (state) {
      setLoadingCities(true);
      try {
        const citiesList = await propertiesAPI.getCities(state);
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
  };

  // Load neighborhoods when city changes
  const loadNeighborhoods = async (city, state) => {
    if (city && state) {
      setLoadingNeighborhoods(true);
      try {
        const neighborhoodsList = await propertiesAPI.getNeighborhoods(city, state);
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
  };

  // Handle state change
  const handleStateChange = (e) => {
    const newState = e.target.value;
    setFilters(prev => ({ ...prev, state: newState, city: '', neighborhood: '' }));
    setNeighborhoods([]);
    loadCities(newState);
  };

  // Handle city change
  const handleCityChange = (e) => {
    const newCity = e.target.value;
    setFilters(prev => ({ ...prev, city: newCity, neighborhood: '' }));
    loadNeighborhoods(newCity, filters.state);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const executeSearch = async (searchFilters) => {
    setLoading(true);
    setSearched(true);

    try {
      const apiFilters = {};
      
      if (searchFilters.purpose) apiFilters.purpose = searchFilters.purpose;
      if (searchFilters.propertyType) apiFilters.property_type = searchFilters.propertyType;
      if (searchFilters.state) apiFilters.state = searchFilters.state;
      if (searchFilters.city) apiFilters.city = searchFilters.city;
      if (searchFilters.neighborhood) apiFilters.neighborhood = searchFilters.neighborhood;
      if (searchFilters.minPrice) apiFilters.min_price = parseFloat(searchFilters.minPrice);
      if (searchFilters.maxPrice) apiFilters.max_price = parseFloat(searchFilters.maxPrice);
      if (searchFilters.isLaunch) apiFilters.is_launch = true;

      console.log('Searching with filters:', apiFilters);
      const results = await propertiesAPI.list(apiFilters);
      
      // Apply frontend-only filters
      let filtered = results;
      if (searchFilters.minBedrooms) {
        filtered = filtered.filter(p => p.bedrooms >= parseInt(searchFilters.minBedrooms));
      }
      if (searchFilters.minBathrooms) {
        filtered = filtered.filter(p => p.bathrooms >= parseInt(searchFilters.minBathrooms));
      }
      if (searchFilters.minArea) {
        filtered = filtered.filter(p => p.area >= parseFloat(searchFilters.minArea));
      }
      if (searchFilters.hasGarage) {
        filtered = filtered.filter(p => p.garage && p.garage > 0);
      }

      setProperties(filtered);
    } catch (error) {
      console.error('Error searching properties:', error);
      setProperties([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    executeSearch(filters);
  };

  const clearFilters = () => {
    setFilters({
      purpose: '',
      propertyType: '',
      state: '',
      city: '',
      neighborhood: '',
      minPrice: '',
      maxPrice: '',
      minBedrooms: '',
      minBathrooms: '',
      minArea: '',
      hasGarage: false,
      isLaunch: false
    });
    setCities([]);
    setNeighborhoods([]);
    setProperties([]);
    setSearched(false);
    navigate('/busca-detalhada');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Busca Detalhada</h1>
          <p className="text-gray-600">Encontre o imóvel ideal com filtros avançados</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6 sticky top-4">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-gray-800">Filtros</h2>
                <button
                  onClick={clearFilters}
                  className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  <X size={16} />
                  Limpar
                </button>
              </div>

              <form onSubmit={handleSearch} className="space-y-4">
                {/* Purpose */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Finalidade</label>
                  <select
                    name="purpose"
                    value={filters.purpose}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todas</option>
                    <option value="VENDA">Comprar (Venda)</option>
                    <option value="ALUGUEL">Alugar</option>
                    <option value="ALUGUEL_TEMPORADA">Aluguel Temporada</option>
                  </select>
                </div>

                {/* Property Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                  <select
                    name="propertyType"
                    value={filters.propertyType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {propertyTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                {/* State */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    name="state"
                    value={filters.state}
                    onChange={handleStateChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Todos</option>
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>{state.code} - {state.name}</option>
                    ))}
                  </select>
                </div>

                {/* City - Dynamic */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade</label>
                  <select
                    name="city"
                    value={filters.city}
                    onChange={handleCityChange}
                    disabled={!filters.state || loadingCities}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingCities ? 'Carregando...' : !filters.state ? 'Selecione o estado' : 'Todas'}
                    </option>
                    {cities.map((city, index) => (
                      <option key={index} value={city}>{city}</option>
                    ))}
                  </select>
                </div>

                {/* Neighborhood - Dynamic NEW */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bairro</label>
                  <select
                    name="neighborhood"
                    value={filters.neighborhood}
                    onChange={handleChange}
                    disabled={!filters.city || loadingNeighborhoods}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  >
                    <option value="">
                      {loadingNeighborhoods ? 'Carregando...' : !filters.city ? 'Selecione a cidade' : 'Todos'}
                    </option>
                    {neighborhoods.map((neighborhood, index) => (
                      <option key={index} value={neighborhood}>{neighborhood}</option>
                    ))}
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço</label>
                  <div className="flex gap-2">
                    <input
                      type="number"
                      name="minPrice"
                      value={filters.minPrice}
                      onChange={handleChange}
                      placeholder="Mín"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      value={filters.maxPrice}
                      onChange={handleChange}
                      placeholder="Máx"
                      className="w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Bedrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quartos (mínimo)</label>
                  <select
                    name="minBedrooms"
                    value={filters.minBedrooms}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Qualquer</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                  </select>
                </div>

                {/* Bathrooms */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banheiros (mínimo)</label>
                  <select
                    name="minBathrooms"
                    value={filters.minBathrooms}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Qualquer</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                  </select>
                </div>

                {/* Area */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área mínima (m²)</label>
                  <input
                    type="number"
                    name="minArea"
                    value={filters.minArea}
                    onChange={handleChange}
                    placeholder="Ex: 50"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Checkboxes */}
                <div className="space-y-2">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="hasGarage"
                      checked={filters.hasGarage}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Com garagem</span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      name="isLaunch"
                      checked={filters.isLaunch}
                      onChange={handleChange}
                      className="rounded"
                    />
                    <span className="text-sm text-gray-700">Apenas lançamentos</span>
                  </label>
                </div>

                {/* Search Button */}
                <Button type="submit" className="w-full bg-orange-500 hover:bg-orange-600" disabled={loading}>
                  <Search className="mr-2" size={18} />
                  {loading ? 'Buscando...' : 'Buscar'}
                </Button>
              </form>
            </div>
          </div>

          {/* Results */}
          <div className="lg:col-span-3">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1,2,3,4,5,6].map(i => (
                  <div key={i} className="bg-gray-200 rounded-lg h-80 animate-pulse"></div>
                ))}
              </div>
            ) : searched ? (
              properties.length > 0 ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold text-gray-800">
                      {properties.length} {properties.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                    </h2>
                    {/* Active Filters Summary */}
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.purpose && (
                        <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-sm">
                          {filters.purpose === 'VENDA' ? 'Comprar' : filters.purpose === 'ALUGUEL' ? 'Alugar' : 'Temporada'}
                        </span>
                      )}
                      {filters.propertyType && (
                        <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-sm">
                          {filters.propertyType}
                        </span>
                      )}
                      {filters.city && (
                        <span className="px-2 py-1 bg-purple-100 text-purple-700 rounded text-sm">
                          {filters.city}
                        </span>
                      )}
                      {filters.neighborhood && (
                        <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded text-sm">
                          {filters.neighborhood}
                        </span>
                      )}
                      {filters.state && (
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-sm">
                          {filters.state}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {properties.map(property => (
                      <PropertyCard key={property.id} property={property} />
                    ))}
                  </div>
                </>
              ) : (
                <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                  <div className="text-gray-400 mb-4">
                    <Search size={64} className="mx-auto" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum imóvel encontrado</h3>
                  <p className="text-gray-600 mb-4">Tente ajustar os filtros para encontrar mais resultados</p>
                  <Button onClick={clearFilters} variant="outline">Limpar filtros</Button>
                </div>
              )
            ) : (
              <div className="bg-white rounded-lg shadow-lg p-12 text-center">
                <div className="text-blue-600 mb-4">
                  <Search size={64} className="mx-auto" />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Configure seus filtros</h3>
                <p className="text-gray-600">Use os filtros ao lado para buscar o imóvel ideal</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default BuscaDetalhada;
