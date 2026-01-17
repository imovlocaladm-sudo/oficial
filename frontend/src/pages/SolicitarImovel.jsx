import React, { useState } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Send, MapPin, Home, DollarSign, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import api from '../services/api';

const SolicitarImovel = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    property_type: '',
    purpose: 'VENDA',
    city: '',
    neighborhood: '',
    min_price: '',
    max_price: '',
    bedrooms: '',
    description: ''
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validações básicas
    if (!formData.name || formData.name.trim().length < 2) {
      toast.error('Por favor, informe seu nome');
      return;
    }
    
    if (!formData.email || !formData.email.includes('@')) {
      toast.error('Por favor, informe um email válido');
      return;
    }
    
    if (!formData.phone || formData.phone.replace(/\D/g, '').length < 10) {
      toast.error('Por favor, informe um telefone válido');
      return;
    }
    
    setLoading(true);
    
    try {
      const requestData = {
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        property_type: formData.property_type || null,
        purpose: formData.purpose,
        city: formData.city || null,
        neighborhood: formData.neighborhood || null,
        min_price: formData.min_price ? parseFloat(formData.min_price) : null,
        max_price: formData.max_price ? parseFloat(formData.max_price) : null,
        bedrooms: formData.bedrooms ? parseInt(formData.bedrooms) : null,
        description: formData.description || null
      };
      
      await api.post('/properties/requests/solicitar', requestData);
      
      setSuccess(true);
      toast.success('Solicitação enviada com sucesso!', {
        description: 'Nossa equipe entrará em contato em breve.',
      });

      // Reset form
      setFormData({
        name: '',
        email: '',
        phone: '',
        property_type: '',
        purpose: 'VENDA',
        city: '',
        neighborhood: '',
        min_price: '',
        max_price: '',
        bedrooms: '',
        description: ''
      });
    } catch (error) {
      console.error('Error submitting request:', error);
      toast.error('Erro ao enviar solicitação', {
        description: error.response?.data?.detail || 'Tente novamente mais tarde.'
      });
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-lg mx-auto text-center">
            <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-6" />
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Solicitação Enviada!</h2>
            <p className="text-gray-600 mb-6">
              Obrigado pelo seu interesse! Nossa equipe analisará sua solicitação e entrará em contato em breve.
            </p>
            <div className="space-x-4">
              <Button onClick={() => setSuccess(false)} variant="outline">
                Nova Solicitação
              </Button>
              <Button onClick={() => window.location.href = '/'}>
                Voltar ao Início
              </Button>
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

      <div className="bg-gradient-to-br from-blue-600 to-blue-800 text-white py-12">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl font-bold mb-4">Solicite um Imóvel</h1>
          <p className="text-xl text-blue-100">Não encontrou o que procura? Fale conosco!</p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Descreva o Imóvel Ideal</h2>
              <p className="text-gray-600">Preencha o formulário e nossa equipe buscará opções para você</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Personal Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Nome Completo *</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Email *</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Telefone *</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Property Details */}
              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                  <Home size={20} />
                  Detalhes do Imóvel Desejado
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Finalidade *</label>
                    <select
                      name="purpose"
                      value={formData.purpose}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="VENDA">Comprar</option>
                      <option value="ALUGUEL">Alugar</option>
                    </select>
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
                      <option value="">Selecione</option>
                      <option value="Apartamento">Apartamento</option>
                      <option value="Casa">Casa</option>
                      <option value="Sobrado">Sobrado</option>
                      <option value="Kitnet">Kitnet</option>
                      <option value="Comercial">Comercial</option>
                      <option value="Terreno">Terreno</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin size={16} />
                      Cidade *
                    </label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      required
                      placeholder="Ex: Campo Grande"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Bairro (opcional)</label>
                    <input
                      type="text"
                      name="neighborhood"
                      value={formData.neighborhood}
                      onChange={handleChange}
                      placeholder="Ex: São Francisco"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <DollarSign size={16} />
                      Preço Mínimo (R$)
                    </label>
                    <input
                      type="number"
                      name="min_price"
                      value={formData.min_price}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Preço Máximo (R$)</label>
                    <input
                      type="number"
                      name="max_price"
                      value={formData.max_price}
                      onChange={handleChange}
                      placeholder="0"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Número de Quartos</label>
                    <select
                      name="bedrooms"
                      value={formData.bedrooms}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Qualquer</option>
                      <option value="1">1+</option>
                      <option value="2">2+</option>
                      <option value="3">3+</option>
                      <option value="4">4+</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Additional Info */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Informações Adicionais</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Descreva outras características importantes que você procura..."
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Submit */}
              <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 py-6 text-lg">
                <Send size={20} className="mr-2" />
                Enviar Solicitação
              </Button>

              <p className="text-sm text-gray-600 text-center">
                Nossa equipe entrará em contato em até 24 horas com opções de imóveis
              </p>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default SolicitarImovel;