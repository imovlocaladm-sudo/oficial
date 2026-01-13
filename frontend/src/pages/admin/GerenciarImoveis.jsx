import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Plus, Edit, Trash2, Eye, Star, Lock } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

// Helper function to get full image URL
const getImageUrl = (imagePath) => {
  if (!imagePath) return null;
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }
  return `${BACKEND_URL}${imagePath}`;
};

const GerenciarImoveis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(null);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      const data = await propertiesAPI.getMyProperties();
      setProperties(data);
    } catch (error) {
      console.error('Error fetching properties:', error);
      toast.error('Erro ao carregar imóveis', {
        description: 'Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (propertyId) => {
    if (!window.confirm('Tem certeza que deseja excluir este imóvel?')) {
      return;
    }

    setDeleting(propertyId);
    try {
      await propertiesAPI.delete(propertyId);
      setProperties(properties.filter(p => p.id !== propertyId));
      toast.success('Imóvel excluído com sucesso!');
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Erro ao excluir imóvel', {
        description: error.response?.data?.detail || 'Tente novamente.',
      });
    } finally {
      setDeleting(null);
    }
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

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/dashboard">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gerenciar Imóveis</h1>
                <p className="text-blue-100 text-sm">{properties.length} imóveis cadastrados</p>
              </div>
            </div>
            <Link to="/admin/imoveis/novo">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus size={18} className="mr-2" />
                Novo Imóvel
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1,2,3].map(i => (
              <div key={i} className="bg-gray-200 rounded-lg h-32 animate-pulse"></div>
            ))}
          </div>
        ) : properties.length > 0 ? (
          <div className="grid grid-cols-1 gap-6">
            {properties.map(property => (
              <div key={property.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Image */}
                  <div className="md:w-64 h-48 md:h-auto">
                    <img
                      src={property.images?.[0] ? getImageUrl(property.images[0]) : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=400&h=300&fit=crop'}
                      alt={property.title}
                      className="w-full h-full object-cover"
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-3 py-1 rounded-md text-xs font-bold ${
                            property.purpose === 'VENDA' 
                              ? 'bg-green-100 text-green-700' 
                              : 'bg-blue-100 text-blue-700'
                          }`}>
                            {property.purpose}
                          </span>
                          {property.is_launch && (
                            <span className="px-3 py-1 rounded-md text-xs font-bold bg-orange-100 text-orange-700">
                              LANÇAMENTO
                            </span>
                          )}
                        </div>
                        <h3 className="text-xl font-bold text-gray-800 mb-1">{property.title}</h3>
                        <p className="text-sm text-gray-600">{property.property_type}</p>
                        <p className="text-sm text-gray-600">{property.neighborhood}, {property.city} - {property.state}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold text-blue-700">{formatPrice(property.price)}</p>
                      </div>
                    </div>

                    {/* Stats */}
                    <div className="flex gap-4 mb-4 text-sm text-gray-600">
                      {property.bedrooms && <span>🛏️ {property.bedrooms} quartos</span>}
                      {property.bathrooms && <span>🚿 {property.bathrooms} banheiros</span>}
                      {property.area && <span>📐 {property.area}m²</span>}
                      {property.garage && <span>🚗 {property.garage} vagas</span>}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/imovel/${property.id}`)}
                      >
                        <Eye size={16} className="mr-1" />
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/admin/imoveis/editar/${property.id}`)}
                      >
                        <Edit size={16} className="mr-1" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(property.id)}
                        disabled={deleting === property.id}
                        className="text-red-600 hover:text-red-700 hover:border-red-600"
                      >
                        <Trash2 size={16} className="mr-1" />
                        {deleting === property.id ? 'Excluindo...' : 'Excluir'}
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-lg p-12 text-center">
            <div className="text-gray-300 mb-4">
              <Plus size={64} className="mx-auto" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Nenhum imóvel cadastrado</h3>
            <p className="text-gray-600 mb-6">Comece cadastrando seu primeiro imóvel</p>
            <Link to="/admin/imoveis/novo">
              <Button className="bg-orange-500 hover:bg-orange-600">
                <Plus size={18} className="mr-2" />
                Cadastrar Imóvel
              </Button>
            </Link>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default GerenciarImoveis;
