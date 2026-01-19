import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Save, Upload, X, AlertCircle, Info } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
import api from '../../services/api';
import { toast } from 'sonner';
import { propertyTypes } from '../../data/mock';

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

const NovoImovel = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [imageFiles, setImageFiles] = useState([]);  // Store actual File objects
  const [imagePreviews, setImagePreviews] = useState([]);  // Store preview URLs
  const [limits, setLimits] = useState(null);
  const [loadingLimits, setLoadingLimits] = useState(true);

  // Buscar limites do usuário
  useEffect(() => {
    const fetchLimits = async () => {
      try {
        const response = await api.get('/properties/my-limits');
        setLimits(response.data);
      } catch (error) {
        console.error('Error fetching limits:', error);
      } finally {
        setLoadingLimits(false);
      }
    };
    fetchLimits();
  }, []);
  
  // Define o valor inicial de purpose baseado no tipo de usuário
  // Particulares não podem vender, então o padrão é ALUGUEL
  const getInitialPurpose = () => {
    if (user?.user_type === 'particular') {
      return 'ALUGUEL';
    }
    return 'VENDA';
  };

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    property_type: 'Apartamento',
    purpose: getInitialPurpose(),
    price: '',
    priceDisplay: '', // Campo para exibição formatada
    neighborhood: '',
    city: '',
    state: 'MS',
    bedrooms: '',
    bathrooms: '',
    area: '',
    garage: '',
    year_built: '',
    condominio: '',
    condominioDisplay: '',
    iptu: '',
    iptuDisplay: '',
    features: '',
    is_launch: false
  });

  // Função para formatar valor em moeda brasileira
  const formatCurrency = (value) => {
    if (!value) return '';
    // Remove tudo que não é número
    const numericValue = value.toString().replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Converte para número e formata
    const number = parseInt(numericValue, 10) / 100;
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter valor formatado para número
  const parseCurrency = (value) => {
    if (!value) return '';
    // Remove pontos e substitui vírgula por ponto
    const cleanValue = value.replace(/\./g, '').replace(',', '.');
    return cleanValue;
  };

  // Handler especial para campos de preço
  const handlePriceChange = (e) => {
    const { name, value } = e.target;
    const displayFieldName = `${name}Display`;
    
    // Formata o valor para exibição
    const formattedValue = formatCurrency(value);
    // Converte para valor numérico para o backend
    const numericValue = parseCurrency(formattedValue);
    
    setFormData(prev => ({
      ...prev,
      [name]: numericValue,
      [displayFieldName]: formattedValue
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    const maxPhotos = limits?.max_photos_per_property || 20;
    
    if (files.length > 0) {
      // Verificar limite de fotos
      const totalPhotos = imageFiles.length + files.length;
      if (totalPhotos > maxPhotos) {
        toast.error(`Máximo de ${maxPhotos} fotos permitidas. Você já tem ${imageFiles.length}.`);
        return;
      }
      
      // Store actual File objects
      setImageFiles(prev => [...prev, ...files]);
      
      // Create preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      
      toast.success(`${files.length} imagem(ns) adicionada(s). Total: ${totalPhotos}/${maxPhotos}`);
    }
  };

  const removeImage = (index) => {
    // Revoke the object URL to free memory
    URL.revokeObjectURL(imagePreviews[index]);
    
    setImageFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Prepare data
      const propertyData = {
        title: formData.title,
        description: formData.description,
        property_type: formData.property_type,
        purpose: formData.purpose,
        price: parseFloat(formData.price),
        neighborhood: formData.neighborhood,
        city: formData.city,
        state: formData.state,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        bathrooms: formData.bathrooms ? parseInt(formData.bathrooms) : null,
        area: formData.area ? parseFloat(formData.area) : null,
        garage: formData.garage ? parseInt(formData.garage) : null,
        year_built: formData.year_built ? parseInt(formData.year_built) : null,
        condominio: formData.condominio ? parseFloat(formData.condominio) : null,
        iptu: formData.iptu ? parseFloat(formData.iptu) : null,
        features: formData.features,  // Send as string, backend will split
        is_launch: formData.is_launch
      };

      // Use the new API with image upload
      await propertiesAPI.createWithImages(propertyData, imageFiles);

      toast.success('Imóvel cadastrado com sucesso!', {
        description: 'Seu imóvel já está disponível no site.',
      });

      setTimeout(() => {
        navigate('/admin/imoveis');
      }, 1500);
    } catch (error) {
      console.error('Error creating property:', error);
      toast.error('Erro ao cadastrar imóvel', {
        description: error.response?.data?.detail || 'Tente novamente.',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-6">
        <div className="container mx-auto px-4">
          <div className="flex items-center gap-4">
            <Link to="/admin/dashboard">
              <Button variant="outline" className="bg-white/10 border-white/20 text-white hover:bg-white/20">
                <ArrowLeft size={18} className="mr-2" />
                Voltar
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold">Cadastrar Novo Imóvel</h1>
              <p className="text-blue-100 text-sm">Preencha os dados do imóvel</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto bg-white rounded-lg shadow-lg p-8">
          {/* Alerta de Limites */}
          {limits && !limits.can_create && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={24} />
                <div>
                  <h3 className="font-bold text-red-800">Limite de Anúncios Atingido</h3>
                  <p className="text-red-700 text-sm mt-1">{limits.message}</p>
                  <Link to="/planos">
                    <Button className="mt-3 bg-red-600 hover:bg-red-700">
                      Fazer Upgrade do Plano
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}

          {/* Info de Limites */}
          {limits && limits.can_create && (
            <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start gap-3">
                <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="text-blue-800 text-sm">
                    <strong>Seus limites:</strong> {limits.current_properties} de {limits.max_properties} anúncios utilizados 
                    | Máximo de {limits.max_photos_per_property} fotos por imóvel
                  </p>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Info */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Informações Básicas</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Título do Anúncio *</label>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    required
                    disabled={limits && !limits.can_create}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                    placeholder="Ex: Apartamento moderno no centro"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Descrição *</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    required
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Descreva o imóvel em detalhes..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Finalidade *</label>
                  <select
                    name="purpose"
                    value={formData.purpose}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {/* Usuários Particulares só podem anunciar Aluguel e Aluguel Temporada */}
                    {user?.user_type !== 'particular' && (
                      <option value="VENDA">Venda</option>
                    )}
                    <option value="ALUGUEL">Aluguel</option>
                    <option value="ALUGUEL_TEMPORADA">Aluguel Temporada</option>
                  </select>
                  {user?.user_type === 'particular' && (
                    <p className="text-xs text-amber-600 mt-1">
                      ⚠️ Usuários Particulares podem anunciar apenas para Aluguel e Aluguel Temporada
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tipo de Imóvel *</label>
                  <select
                    name="property_type"
                    value={formData.property_type}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {propertyTypes.map((type, index) => (
                      <option key={index} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Preço (R$) *</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">R$</span>
                    <input
                      type="text"
                      name="price"
                      value={formData.priceDisplay}
                      onChange={handlePriceChange}
                      required
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0,00"
                      data-testid="input-price"
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Digite apenas números. Ex: 350000 para R$ 350.000,00</p>
                </div>
              </div>
            </div>

            {/* Location */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Localização</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado *</label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {states.map((state) => (
                      <option key={state.code} value={state.code}>{state.code} - {state.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Campo Grande"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Bairro *</label>
                  <input
                    type="text"
                    name="neighborhood"
                    value={formData.neighborhood}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: São Francisco"
                  />
                </div>
              </div>
            </div>

            {/* Details */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Detalhes do Imóvel</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quartos</label>
                  <input
                    type="number"
                    name="bedrooms"
                    value={formData.bedrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Banheiros</label>
                  <input
                    type="number"
                    name="bathrooms"
                    value={formData.bathrooms}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Vagas Garagem</label>
                  <input
                    type="number"
                    name="garage"
                    value={formData.garage}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Área (m²)</label>
                  <input
                    type="number"
                    name="area"
                    value={formData.area}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Ano Construção</label>
                  <input
                    type="number"
                    name="year_built"
                    value={formData.year_built}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="2020"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Condomínio (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="text"
                      name="condominio"
                      value={formData.condominioDisplay}
                      onChange={handlePriceChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IPTU Anual (R$)</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">R$</span>
                    <input
                      type="text"
                      name="iptu"
                      value={formData.iptuDisplay}
                      onChange={handlePriceChange}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0,00"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Images */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Fotos do Imóvel</h2>
              
              {/* Image Upload */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Adicionar Fotos da Galeria
                </label>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 transition-colors">
                    <Upload size={18} />
                    <span>Escolher Arquivos</span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </label>
                  <span className="text-sm text-gray-600">Selecione uma ou múltiplas imagens</span>
                </div>
              </div>

              {/* Image Preview Grid */}
              {imagePreviews.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {imagePreviews.map((preview, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={preview}
                        alt={`Preview ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Additional Info */}
            <div>
              <h2 className="text-xl font-bold text-gray-800 mb-4">Informações Adicionais</h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Características (separadas por vírgula)</label>
                  <textarea
                    name="features"
                    value={formData.features}
                    onChange={handleChange}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Ex: Piscina, Academia, Salão de festas"
                  />
                </div>

                {/* Checkbox de Lançamento - APENAS PARA IMOBILIÁRIA */}
                {user?.user_type === 'imobiliaria' && (
                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="is_launch"
                        checked={formData.is_launch}
                        onChange={handleChange}
                        className="rounded"
                      />
                      <span className="text-sm font-medium text-gray-700">Marcar como lançamento</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1 ml-6">
                      Imóveis marcados como lançamento aparecem em destaque na seção de Lançamentos
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex gap-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate('/admin/dashboard')}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                <Save size={18} className="mr-2" />
                {loading ? 'Salvando...' : 'Cadastrar Imóvel'}
              </Button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default NovoImovel;