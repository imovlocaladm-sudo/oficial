import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Eye, Trash2, Edit, RefreshCw, X, Search } from 'lucide-react';
import { adminAPIService } from '../../services/adminAPI';
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

const AdminGerenciarImoveis = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [properties, setProperties] = useState([]);
  const [filteredProperties, setFilteredProperties] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [propertyToDelete, setPropertyToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (user?.user_type !== 'admin') {
      navigate('/');
      return;
    }
    
    fetchProperties();
    
    // Set up auto-refresh
    const interval = setInterval(() => {
      fetchProperties(true); // Silent refresh
    }, 30000);
    
    return () => clearInterval(interval);
  }, [user, navigate]);

  // Filter properties when search term changes
  useEffect(() => {
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      const filtered = properties.filter(p => 
        p.title?.toLowerCase().includes(term) ||
        p.city?.toLowerCase().includes(term) ||
        p.owner_name?.toLowerCase().includes(term) ||
        p.owner_email?.toLowerCase().includes(term)
      );
      setFilteredProperties(filtered);
    } else {
      setFilteredProperties(properties);
    }
  }, [searchTerm, properties]);

  const fetchProperties = useCallback(async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await adminAPIService.getAllProperties();
      setProperties(data);
      setFilteredProperties(data);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('Error fetching properties:', error);
      if (!silent) toast.error('Erro ao carregar imóveis');
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  const confirmDelete = (property) => {
    setPropertyToDelete(property);
    setShowDeleteModal(true);
  };

  const handleDelete = async () => {
    if (!propertyToDelete) return;

    setDeleting(true);
    try {
      await adminAPIService.deleteProperty(propertyToDelete.id);
      toast.success('Imóvel excluído com sucesso!');
      setShowDeleteModal(false);
      setPropertyToDelete(null);
      fetchProperties();
    } catch (error) {
      console.error('Error deleting property:', error);
      toast.error('Erro ao excluir imóvel');
    } finally {
      setDeleting(false);
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

      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/admin/master">
                <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                  <ArrowLeft size={18} className="mr-2" />
                  Voltar
                </Button>
              </Link>
              <div>
                <h1 className="text-2xl font-bold">Gerenciar Imóveis</h1>
                <p className="text-red-100 text-sm">Administração de todos os imóveis da plataforma</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        {/* Search and Filters */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Buscar por título, cidade, proprietário..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <RefreshCw size={14} />
              <span>Atualizado: {lastUpdated ? lastUpdated.toLocaleTimeString() : '-'}</span>
              <Button size="sm" variant="outline" onClick={() => fetchProperties()}>
                <RefreshCw size={14} className="mr-1" />
                Atualizar
              </Button>
            </div>
          </div>
        </div>

        {/* Properties List */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="p-4 bg-gray-50 border-b">
            <h2 className="font-bold text-lg">
              Imóveis Cadastrados ({filteredProperties.length}
              {searchTerm && ` de ${properties.length}`})
            </h2>
          </div>

          {loading ? (
            <div className="p-12 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando imóveis...</p>
            </div>
          ) : filteredProperties.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-600">
                {searchTerm ? 'Nenhum imóvel encontrado para esta busca' : 'Nenhum imóvel cadastrado'}
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {filteredProperties.map(property => (
                <div key={property.id} className="p-4 hover:bg-gray-50 flex gap-4">
                  <img
                    src={property.images?.[0] ? getImageUrl(property.images[0]) : 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=150&h=100&fit=crop'}
                    alt={property.title}
                    className="w-32 h-24 object-cover rounded"
                  />
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-bold text-gray-800">{property.title}</h3>
                        <p className="text-sm text-gray-600">{property.property_type} - {property.city}/{property.state}</p>
                        <p className="text-xs text-gray-500 mt-1">
                          <span className="font-medium">Anunciante:</span> {property.owner_name} ({property.owner_email})
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blue-700">{formatPrice(property.price)}</p>
                        <span className={`px-2 py-1 rounded text-xs font-semibold ${
                          property.purpose === 'VENDA' ? 'bg-green-100 text-green-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          {property.purpose}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => navigate(`/imovel/${property.id}`)}
                      >
                        <Eye size={14} className="mr-1" />
                        Ver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => confirmDelete(property)}
                        className="text-red-600 hover:bg-red-50 border-red-200"
                      >
                        <Trash2 size={14} className="mr-1" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal: Confirm Delete */}
      {showDeleteModal && propertyToDelete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-red-100 rounded-full mb-4">
                <Trash2 className="text-red-600" size={24} />
              </div>
              <h3 className="text-xl font-bold text-center text-gray-800 mb-2">Confirmar Exclusão</h3>
              <p className="text-center text-gray-600 mb-2">
                Tem certeza que deseja excluir o imóvel:
              </p>
              <p className="text-center font-semibold text-gray-800 mb-4">
                "{propertyToDelete.title}"
              </p>
              <p className="text-center text-sm text-gray-500 mb-2">
                Proprietário: {propertyToDelete.owner_name}
              </p>
              <p className="text-center text-red-600 text-sm mb-6">
                ⚠️ Esta ação não pode ser desfeita!
              </p>
              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  className="flex-1"
                  onClick={() => { setShowDeleteModal(false); setPropertyToDelete(null); }}
                  disabled={deleting}
                >
                  Cancelar
                </Button>
                <Button 
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  onClick={handleDelete}
                  disabled={deleting}
                >
                  {deleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Excluindo...
                    </>
                  ) : (
                    'Excluir Imóvel'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
};

export default AdminGerenciarImoveis;
