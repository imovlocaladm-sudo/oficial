import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { Textarea } from '../../components/ui/textarea';
import { ArrowLeft, Send } from 'lucide-react';
import { demandsAPI } from '../../services/api';
import { toast } from 'sonner';

const PublicarDemanda = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    tipo_imovel: '',
    bairros_interesse: [],
    valor_minimo: '',
    valor_maximo: '',
    comissao_parceiro: 50,
    dormitorios_min: '',
    vagas_garagem_min: '',
    area_util_min: '',
    caracteristicas_essenciais: ''
  });

  const [bairroInput, setBairroInput] = useState('');

  const tiposImovel = [
    { value: 'Apartamento', label: 'Apartamento' },
    { value: 'Casa-Térrea', label: 'Casa Térrea' },
    { value: 'Casa-Térrea-Condomínio', label: 'Casa Térrea Condomínio' },
    { value: 'Casa de Vila', label: 'Casa de Vila' },
    { value: 'Sobrado', label: 'Sobrado' },
    { value: 'Sobrado-Condomínio', label: 'Sobrado Condomínio' },
    { value: 'Kitnet', label: 'Kitnet' },
    { value: 'Studio', label: 'Studio' },
    { value: 'Apart Hotel / Flat / Loft', label: 'Flat / Loft' },
    { value: 'Apto. Cobertura / Duplex', label: 'Cobertura / Duplex' },
    { value: 'Terreno', label: 'Terreno' },
    { value: 'Terreno-Condomínio', label: 'Terreno Condomínio' },
    { value: 'Imóvel Comercial', label: 'Imóvel Comercial' },
    { value: 'Sala / Salão / Loja', label: 'Sala / Loja' },
    { value: 'Galpão / Depósito', label: 'Galpão / Depósito' },
    { value: 'Sítio / Fazenda / Chácara', label: 'Sítio / Chácara' },
    { value: 'Espaço para Eventos', label: 'Espaço para Eventos' }
  ];

  const handleAddBairro = () => {
    if (bairroInput.trim() && !formData.bairros_interesse.includes(bairroInput.trim())) {
      setFormData({
        ...formData,
        bairros_interesse: [...formData.bairros_interesse, bairroInput.trim()]
      });
      setBairroInput('');
    }
  };

  const handleRemoveBairro = (bairro) => {
    setFormData({
      ...formData,
      bairros_interesse: formData.bairros_interesse.filter(b => b !== bairro)
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.tipo_imovel) {
      toast.error('Selecione o tipo de imóvel');
      return;
    }

    if (formData.bairros_interesse.length === 0) {
      toast.error('Adicione pelo menos um bairro de interesse');
      return;
    }

    if (!formData.valor_minimo || !formData.valor_maximo) {
      toast.error('Informe a faixa de valor');
      return;
    }

    if (parseFloat(formData.valor_minimo) >= parseFloat(formData.valor_maximo)) {
      toast.error('Valor mínimo deve ser menor que valor máximo');
      return;
    }

    try {
      setLoading(true);

      const demandData = {
        tipo_imovel: formData.tipo_imovel,
        bairros_interesse: formData.bairros_interesse,
        valor_minimo: parseFloat(formData.valor_minimo),
        valor_maximo: parseFloat(formData.valor_maximo),
        comissao_parceiro: parseInt(formData.comissao_parceiro),
        dormitorios_min: formData.dormitorios_min ? parseInt(formData.dormitorios_min) : null,
        vagas_garagem_min: formData.vagas_garagem_min ? parseInt(formData.vagas_garagem_min) : null,
        area_util_min: formData.area_util_min ? parseFloat(formData.area_util_min) : null,
        caracteristicas_essenciais: formData.caracteristicas_essenciais || null
      };

      await demandsAPI.createDemand(demandData);
      
      toast.success('Demanda publicada com sucesso!', {
        description: 'Corretores com imóveis compatíveis serão notificados.'
      });

      navigate('/admin/parcerias/minhas');
    } catch (error) {
      console.error('Error creating demand:', error);
      toast.error(error.response?.data?.detail || 'Erro ao publicar demanda');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/admin/parcerias')}
          className="mb-4"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Voltar
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Publicar Nova Demanda</CardTitle>
            <CardDescription>
              Descreva o que seu cliente procura e receba propostas de parceiros
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Tipo de Imóvel */}
              <div>
                <Label htmlFor="tipo_imovel">Tipo de Imóvel *</Label>
                <Select
                  value={formData.tipo_imovel}
                  onValueChange={(value) => setFormData({ ...formData, tipo_imovel: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    {tiposImovel.map((tipo) => (
                      <SelectItem key={tipo.value} value={tipo.value}>
                        {tipo.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Bairros de Interesse */}
              <div>
                <Label>Bairros de Interesse *</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    value={bairroInput}
                    onChange={(e) => setBairroInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddBairro())}
                    placeholder="Digite um bairro e pressione Enter"
                  />
                  <Button type="button" onClick={handleAddBairro}>
                    Adicionar
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.bairros_interesse.map((bairro) => (
                    <span
                      key={bairro}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                    >
                      {bairro}
                      <button
                        type="button"
                        onClick={() => handleRemoveBairro(bairro)}
                        className="ml-1 hover:text-blue-600"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                {formData.bairros_interesse.length === 0 && (
                  <p className="text-sm text-gray-500 mt-2">Adicione pelo menos um bairro</p>
                )}
              </div>

              {/* Faixa de Valor */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="valor_minimo">Valor Mínimo *</Label>
                  <Input
                    id="valor_minimo"
                    type="number"
                    value={formData.valor_minimo}
                    onChange={(e) => setFormData({ ...formData, valor_minimo: e.target.value })}
                    placeholder="R$ 200.000"
                    step="1000"
                  />
                </div>
                <div>
                  <Label htmlFor="valor_maximo">Valor Máximo *</Label>
                  <Input
                    id="valor_maximo"
                    type="number"
                    value={formData.valor_maximo}
                    onChange={(e) => setFormData({ ...formData, valor_maximo: e.target.value })}
                    placeholder="R$ 350.000"
                    step="1000"
                  />
                </div>
              </div>

              {/* Comissão */}
              <div>
                <Label htmlFor="comissao_parceiro">Comissão para o Parceiro * ({formData.comissao_parceiro}%)</Label>
                <Input
                  id="comissao_parceiro"
                  type="range"
                  min="10"
                  max="100"
                  step="5"
                  value={formData.comissao_parceiro}
                  onChange={(e) => setFormData({ ...formData, comissao_parceiro: e.target.value })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>10%</span>
                  <span>50%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Campos Opcionais */}
              <div className="border-t pt-4">
                <h3 className="font-semibold mb-4 text-gray-700">Critérios Opcionais</h3>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="dormitorios_min">Dormitórios Mínimo</Label>
                    <Select
                      value={formData.dormitorios_min}
                      onValueChange={(value) => setFormData({ ...formData, dormitorios_min: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                        <SelectItem value="4">4+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="vagas_garagem_min">Vagas Mínimo</Label>
                    <Select
                      value={formData.vagas_garagem_min}
                      onValueChange={(value) => setFormData({ ...formData, vagas_garagem_min: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Opcional" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1+</SelectItem>
                        <SelectItem value="2">2+</SelectItem>
                        <SelectItem value="3">3+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="area_util_min">Área Mín. (m²)</Label>
                    <Input
                      id="area_util_min"
                      type="number"
                      value={formData.area_util_min}
                      onChange={(e) => setFormData({ ...formData, area_util_min: e.target.value })}
                      placeholder="Ex: 80"
                    />
                  </div>
                </div>
              </div>

              {/* Características Essenciais */}
              <div>
                <Label htmlFor="caracteristicas">Características Essenciais</Label>
                <Textarea
                  id="caracteristicas"
                  value={formData.caracteristicas_essenciais}
                  onChange={(e) => setFormData({ ...formData, caracteristicas_essenciais: e.target.value })}
                  placeholder="Ex: Precisa de quintal, aceita permuta, andar alto..."
                  maxLength={500}
                  rows={4}
                />
                <p className="text-xs text-gray-500 mt-1">
                  {formData.caracteristicas_essenciais.length}/500 caracteres
                </p>
              </div>

              {/* Buttons */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/admin/parcerias')}
                  className="flex-1"
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  data-testid="submit-demand"
                >
                  {loading ? 'Publicando...' : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Publicar no Mural
                    </>
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      <Footer />
    </div>
  );
};

export default PublicarDemanda;