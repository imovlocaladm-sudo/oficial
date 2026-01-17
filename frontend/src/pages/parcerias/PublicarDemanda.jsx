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
    estado: 'MS',
    cidade: 'Campo Grande',
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

  const estados = [
    { sigla: 'AC', nome: 'Acre' },
    { sigla: 'AL', nome: 'Alagoas' },
    { sigla: 'AP', nome: 'Amapá' },
    { sigla: 'AM', nome: 'Amazonas' },
    { sigla: 'BA', nome: 'Bahia' },
    { sigla: 'CE', nome: 'Ceará' },
    { sigla: 'DF', nome: 'Distrito Federal' },
    { sigla: 'ES', nome: 'Espírito Santo' },
    { sigla: 'GO', nome: 'Goiás' },
    { sigla: 'MA', nome: 'Maranhão' },
    { sigla: 'MT', nome: 'Mato Grosso' },
    { sigla: 'MS', nome: 'Mato Grosso do Sul' },
    { sigla: 'MG', nome: 'Minas Gerais' },
    { sigla: 'PA', nome: 'Pará' },
    { sigla: 'PB', nome: 'Paraíba' },
    { sigla: 'PR', nome: 'Paraná' },
    { sigla: 'PE', nome: 'Pernambuco' },
    { sigla: 'PI', nome: 'Piauí' },
    { sigla: 'RJ', nome: 'Rio de Janeiro' },
    { sigla: 'RN', nome: 'Rio Grande do Norte' },
    { sigla: 'RS', nome: 'Rio Grande do Sul' },
    { sigla: 'RO', nome: 'Rondônia' },
    { sigla: 'RR', nome: 'Roraima' },
    { sigla: 'SC', nome: 'Santa Catarina' },
    { sigla: 'SP', nome: 'São Paulo' },
    { sigla: 'SE', nome: 'Sergipe' },
    { sigla: 'TO', nome: 'Tocantins' }
  ];

  const cidadesPorEstado = {
    'MS': ['Campo Grande', 'Dourados', 'Três Lagoas', 'Corumbá', 'Ponta Porã', 'Naviraí', 'Nova Andradina', 'Aquidauana', 'Sidrolândia', 'Paranaíba'],
    'SP': ['São Paulo', 'Campinas', 'Santos', 'Ribeirão Preto', 'Sorocaba'],
    'RJ': ['Rio de Janeiro', 'Niterói', 'Petrópolis', 'Campos dos Goytacazes'],
    'MG': ['Belo Horizonte', 'Uberlândia', 'Contagem', 'Juiz de Fora'],
    'PR': ['Curitiba', 'Londrina', 'Maringá', 'Ponta Grossa'],
    'RS': ['Porto Alegre', 'Caxias do Sul', 'Pelotas', 'Canoas'],
    'BA': ['Salvador', 'Feira de Santana', 'Vitória da Conquista'],
    'GO': ['Goiânia', 'Aparecida de Goiânia', 'Anápolis'],
    'SC': ['Florianópolis', 'Joinville', 'Blumenau'],
    'PE': ['Recife', 'Jaboatão dos Guararapes', 'Olinda'],
    'CE': ['Fortaleza', 'Caucaia', 'Juazeiro do Norte']
  };

  // Lista de comissões com valores quebrados
  const comissaoOptions = [
    0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9, 9.5,
    10, 12.5, 15, 17.5, 20, 22.5, 25, 27.5, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 100
  ];

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

  // Função para formatar valor monetário
  const formatCurrencyInput = (value) => {
    // Remove tudo que não é número
    const numericValue = value.replace(/\D/g, '');
    // Converte para número
    const number = parseInt(numericValue, 10) || 0;
    return number;
  };

  // Função para exibir valor formatado
  const displayCurrency = (value) => {
    if (!value) return '';
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const handleValorChange = (field, value) => {
    const numericValue = formatCurrencyInput(value);
    setFormData({ ...formData, [field]: numericValue });
  };

  // Quando muda o estado, atualiza as cidades disponíveis
  const handleEstadoChange = (estado) => {
    setFormData({
      ...formData,
      estado: estado,
      cidade: cidadesPorEstado[estado]?.[0] || ''
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validações
    if (!formData.tipo_imovel) {
      toast.error('Selecione o tipo de imóvel');
      return;
    }

    if (!formData.estado) {
      toast.error('Selecione o estado');
      return;
    }

    if (!formData.cidade) {
      toast.error('Selecione a cidade');
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
        estado: formData.estado,
        cidade: formData.cidade,
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

              {/* Estado e Cidade */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="estado">Estado *</Label>
                  <Select
                    value={formData.estado}
                    onValueChange={handleEstadoChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                    <SelectContent>
                      {estados.map((estado) => (
                        <SelectItem key={estado.sigla} value={estado.sigla}>
                          {estado.sigla} - {estado.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="cidade">Cidade *</Label>
                  <Select
                    value={formData.cidade}
                    onValueChange={(value) => setFormData({ ...formData, cidade: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a cidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {(cidadesPorEstado[formData.estado] || []).map((cidade) => (
                        <SelectItem key={cidade} value={cidade}>
                          {cidade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
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