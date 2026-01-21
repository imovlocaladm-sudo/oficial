import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { ArrowLeft, Save, Upload, X } from 'lucide-react';
import { propertiesAPI } from '../../services/api';
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
  const [cities, setCities] = useState([]);  // Lista de cidades do estado
  const [loadingCities, setLoadingCities] = useState(false);
  const [citySearch, setCitySearch] = useState('');  // Busca de cidade
  const [showCityDropdown, setShowCityDropdown] = useState(false);
  
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
    priceDisplay: '',  // Valor formatado para exibição
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

  // Buscar cidades do IBGE quando o estado mudar
  useEffect(() => {
    const fetchCities = async () => {
      if (!formData.state) {
        setCities([]);
        return;
      }
      
      setLoadingCities(true);
      try {
        const response = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${formData.state}/municipios?orderBy=nome`
        );
        const data = await response.json();
        setCities(data.map(city => city.nome));
      } catch (error) {
        console.error('Erro ao buscar cidades:', error);
        toast.error('Erro ao carregar lista de cidades');
      } finally {
        setLoadingCities(false);
      }
    };
    
    fetchCities();
    // Limpar cidade quando mudar o estado
    setFormData(prev => ({ ...prev, city: '' }));
    setCitySearch('');
  }, [formData.state]);

  // Função para formatar valor monetário (R$ 1.500.000,00)
  const formatCurrency = (value) => {
    if (!value) return '';
    // Remove tudo que não é número
    const numericValue = value.toString().replace(/\D/g, '');
    if (!numericValue) return '';
    
    // Converte para número e formata
    const number = parseInt(numericValue) / 100;
    return number.toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Função para converter valor formatado para número
  const parseCurrency = (formattedValue) => {
    if (!formattedValue) return '';
    // Remove pontos e substitui vírgula por ponto
    const numericString = formattedValue.replace(/\./g, '').replace(',', '.');
    return parseFloat(numericString) || '';
  };

  // Handler para campos de valor monetário
  const handleCurrencyChange = (e, fieldName, displayFieldName) => {
    const { value } = e.target;
    const formatted = formatCurrency(value);
    const numericValue = parseCurrency(formatted);
    
    setFormData(prev => ({
      ...prev,
      [fieldName]: numericValue,
      [displayFieldName]: formatted
    }));
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handler para seleção de cidade
  const handleCitySelect = (city) => {
    setFormData(prev => ({ ...prev, city }));
    setCitySearch(city);
    setShowCityDropdown(false);
  };

  // Filtrar cidades baseado na busca
  const filteredCities = cities.filter(city =>
    city.toLowerCase().includes(citySearch.toLowerCase())
  ).slice(0, 10);  // Limitar a 10 resultados

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    
    if (files.length > 0) {
      // Store actual File objects
      setImageFiles(prev => [...prev, ...files]);
      
      // Create preview URLs
      const newPreviews = files.map(file => URL.createObjectURL(file));
      setImagePreviews(prev => [...prev, ...newPreviews]);
      
      toast.success(`${files.length} imagem(ns) adicionada(s)`);
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                  <input
                    type="text"
                    name="priceDisplay"
                    value={formData.priceDisplay}
                    onChange={(e) => handleCurrencyChange(e, 'price', 'priceDisplay')}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0,00"
                  />
                  <p className="text-xs text-gray-500 mt-1">Digite apenas números. Ex: 150000000 = R$ 1.500.000,00</p>
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

                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cidade *</label>
                  <input
                    type="text"
                    name="citySearch"
                    value={citySearch}
                    onChange={(e) => {
                      setCitySearch(e.target.value);
                      setShowCityDropdown(true);
                      // Se o valor digitado for exatamente uma cidade válida, seleciona
                      const exactMatch = cities.find(c => c.toLowerCase() === e.target.value.toLowerCase());
                      if (exactMatch) {
                        setFormData(prev => ({ ...prev, city: exactMatch }));
                      } else {
                        setFormData(prev => ({ ...prev, city: '' }));
                      }
                    }}
                    onFocus={() => setShowCityDropdown(true)}
                    onBlur={() => setTimeout(() => setShowCityDropdown(false), 200)}
                    required={!formData.city}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder={loadingCities ? "Carregando cidades..." : "Digite para buscar..."}
                    disabled={loadingCities || cities.length === 0}
                    autoComplete="off"
                  />
                  {/* Dropdown de cidades */}
                  {showCityDropdown && filteredCities.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {filteredCities.map((city, index) => (
                        <button
                          key={index}
                          type="button"
                          onClick={() => handleCitySelect(city)}
                          className={`w-full px-4 py-2 text-left hover:bg-blue-50 ${
                            formData.city === city ? 'bg-blue-100 font-medium' : ''
                          }`}
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  )}
                  {/* Indicador de cidade selecionada */}
                  {formData.city && (
                    <p className="text-xs text-green-600 mt-1">✓ Cidade selecionada: {formData.city}</p>
                  )}
                  {!formData.city && citySearch && !loadingCities && (
                    <p className="text-xs text-red-500 mt-1">Selecione uma cidade válida da lista</p>
                  )}
                  {/* Campo hidden para o valor real */}
                  <input type="hidden" name="city" value={formData.city} />
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
                  <input
                    type="number"
                    name="condominio"
                    value={formData.condominio}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">IPTU Anual (R$)</label>
                  <input
                    type="number"
                    name="iptu"
                    value={formData.iptu}
                    onChange={handleChange}
                    step="0.01"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
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