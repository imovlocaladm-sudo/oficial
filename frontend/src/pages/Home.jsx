import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import SearchBar from '../components/SearchBar';
import PropertyCard from '../components/PropertyCard';
import BannerDisplay from '../components/BannerDisplay';
import Footer from '../components/Footer';
import { propertiesAPI } from '../services/api';
import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';

const Home = () => {
  const [featuredProperties, setFeaturedProperties] = useState([]);
  const [launches, setLaunches] = useState([]);
  const [regularProperties, setRegularProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setLoading(true);
        
        // Fetch all properties
        const allProperties = await propertiesAPI.list({ limit: 50 });
        
        // Separar em 3 categorias distintas
        const featuredList = allProperties.filter(p => p.is_featured && !p.is_launch);
        const launchProperties = allProperties.filter(p => p.is_launch);
        const regularList = allProperties.filter(p => !p.is_launch && !p.is_featured);
        
        // Destaques: apenas imóveis marcados como destaque
        setFeaturedProperties(featuredList.slice(0, 8));
        
        // Lançamentos: apenas imóveis marcados como lançamento
        setLaunches(launchProperties.slice(0, 8));
        
        // Imóveis comuns: o resto
        setRegularProperties(regularList.slice(0, 12));
        
      } catch (error) {
        console.error('Error fetching properties:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProperties();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <SearchBar />
        <div className="container mx-auto px-4 py-12 text-center">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-64 mx-auto mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1,2,3,4,5,6,7,8].map(i => (
                <div key={i} className="bg-gray-200 rounded-lg h-64"></div>
              ))}
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
      <SearchBar />

      {/* Banner Topo */}
      <div className="container mx-auto px-4 py-4">
        <BannerDisplay position="home_topo" className="mb-4" />
      </div>

      {/* Main Content Area */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Main Column */}
          <div className="flex-1">
            {/* Featured Properties */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Imóveis em destaque</h2>
                <Link 
                  to="/destaques" 
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  + Destaques
                  <ArrowRight size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {featuredProperties.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </section>

            {/* Banner Meio */}
            <BannerDisplay position="home_meio" className="mb-12" />

            {/* Launches */}
            <section className="mb-12">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-3xl font-bold text-gray-800">Lançamentos</h2>
                <Link 
                  to="/lancamentos" 
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-semibold transition-colors"
                >
                  + Lançamentos
                  <ArrowRight size={18} />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-6">
                {launches.map(property => (
                  <PropertyCard key={property.id} property={property} />
                ))}
              </div>
            </section>
          </div>

          {/* Seção de Todos os Imóveis */}
          {regularProperties.length > 0 && (
            <div className="mb-12">
              <section className="bg-white p-6 rounded-lg shadow-md">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Todos os Imóveis</h2>
                  <Link 
                    to="/busca-detalhada"
                    className="text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors"
                  >
                    Ver todos →
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {regularProperties.map((property) => (
                    <PropertyCard key={property.id} property={property} />
                  ))}
                </div>
              </section>
            </div>
          )}

          {/* Sidebar */}
          <aside className="lg:w-80">
            {/* Client Area */}
            <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-xl font-bold mb-3">Cliente ImovLocal</h3>
              <p className="text-sm mb-4 text-blue-100">Administre seus imóveis no site.</p>
              <Link 
                to="/login" 
                className="block w-full bg-white text-blue-700 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition-colors text-center"
              >
                Área administrativa
              </Link>
            </div>

            {/* Quick Search */}
            <div className="bg-white p-6 rounded-lg shadow-lg mb-6">
              <h3 className="text-xl font-bold text-gray-800 mb-4">Busca Rápida</h3>
              <ul className="space-y-3">
                <li>
                  <Link 
                    to="/busca-detalhada"
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={16} />
                    Busca Detalhada
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/busca-mapa"
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={16} />
                    Busca no Mapa
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/destaques"
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={16} />
                    Ver Destaques
                  </Link>
                </li>
                <li>
                  <Link 
                    to="/lancamentos"
                    className="text-sm text-blue-600 hover:text-blue-700 font-semibold hover:underline transition-colors flex items-center gap-2"
                  >
                    <ArrowRight size={16} />
                    Ver Lançamentos
                  </Link>
                </li>
              </ul>
            </div>

            {/* Anunciar */}
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 text-white p-6 rounded-lg shadow-lg">
              <h3 className="text-xl font-bold mb-3">Anuncie seu imóvel</h3>
              <p className="text-sm mb-4 text-orange-100">Cadastre seu imóvel e alcance milhares de interessados.</p>
              <Link 
                to="/anunciar" 
                className="block w-full bg-white text-orange-600 font-semibold py-2 px-4 rounded hover:bg-gray-100 transition-colors text-center"
              >
                Anunciar agora
              </Link>
            </div>
          </aside>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Home;
