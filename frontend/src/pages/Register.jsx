import React, { useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { User, Mail, Phone, Lock, MapPin, Building, AlertTriangle, Info, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const Register = () => {
  const navigate = useNavigate();
  const { register } = useAuth();
  const [userType, setUserType] = useState('particular'); // 'particular', 'corretor' ou 'imobiliaria'
  const [showParticularWarning, setShowParticularWarning] = useState(true);
  const [emailValidation, setEmailValidation] = useState({ checking: false, valid: null, error: null });
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    cpf: '',
    city: '',
    state: 'MS',
    // Corretor specific
    creci: '',
    company: '',
    // Imobiliária specific
    cnpj: '',
    razao_social: ''
  });
  const [errors, setErrors] = useState({});

  const handleUserTypeChange = (type) => {
    setUserType(type);
    // Mostrar aviso ao selecionar "Particular"
    if (type === 'particular') {
      setShowParticularWarning(true);
    } else {
      setShowParticularWarning(false);
    }
  };

  // Validação de email em tempo real
  const validateEmailDomain = useCallback(async (email) => {
    if (!email || !email.includes('@')) {
      setEmailValidation({ checking: false, valid: null, error: null });
      return;
    }

    setEmailValidation({ checking: true, valid: null, error: null });

    try {
      const response = await axios.post(`${BACKEND_URL}/api/auth/validate-email`, { email });
      setEmailValidation({
        checking: false,
        valid: response.data.valid,
        error: response.data.error
      });
      
      if (!response.data.valid) {
        setErrors(prev => ({ ...prev, email: response.data.error }));
      } else {
        setErrors(prev => ({ ...prev, email: '' }));
      }
    } catch (error) {
      setEmailValidation({ checking: false, valid: null, error: null });
    }
  }, []);

  // Debounce para validação de email
  const [emailTimeout, setEmailTimeout] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }

    // Validar email com debounce
    if (name === 'email') {
      if (emailTimeout) clearTimeout(emailTimeout);
      setEmailValidation({ checking: false, valid: null, error: null });
      
      const timeout = setTimeout(() => {
        validateEmailDomain(value);
      }, 800); // Aguarda 800ms após parar de digitar
      
      setEmailTimeout(timeout);
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) newErrors.name = 'Nome é obrigatório';
    if (!formData.email.trim()) {
      newErrors.email = 'Email é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email inválido';
    }
    if (!formData.phone.trim()) newErrors.phone = 'Telefone é obrigatório';
    if (!formData.password) {
      newErrors.password = 'Senha é obrigatória';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }
    if (!formData.cpf.trim()) newErrors.cpf = 'CPF é obrigatório';
    if (!formData.city.trim()) newErrors.city = 'Cidade é obrigatória';

    if (userType === 'corretor') {
      if (!formData.creci.trim()) newErrors.creci = 'CRECI é obrigatório';
    }

    if (userType === 'imobiliaria') {
      if (!formData.creci.trim()) newErrors.creci = 'CRECI é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Verificar se email foi validado
    if (emailValidation.valid === false) {
      toast.error('Email inválido', {
        description: emailValidation.error || 'Por favor, use um email válido.',
      });
      return;
    }

    if (!validateForm()) {
      toast.error('Erro no cadastro', {
        description: 'Por favor, corrija os erros no formulário.',
      });
      return;
    }

    try {
      // Register user via API
      const response = await register({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cpf: formData.cpf,
        city: formData.city,
        state: formData.state,
        user_type: userType,
        creci: formData.creci || null,
        company: formData.company || null,
        cnpj: formData.cnpj || null,
        razao_social: formData.razao_social || null,
        password: formData.password
      });

      // Cadastro realizado - redirecionar para checkout do plano correspondente
      const planMap = {
        'particular': 'particular_trimestral',
        'corretor': 'corretor_trimestral',
        'imobiliaria': 'imobiliaria_anual'
      };
      
      const planId = planMap[userType] || 'particular_trimestral';
      
      toast.success('Cadastro realizado com sucesso!', {
        description: 'Agora complete seu pagamento para ativar sua conta.',
        duration: 5000,
      });

      // Redirecionar direto para o checkout com o plano selecionado
      setTimeout(() => {
        navigate(`/checkout?plan=${planId}`);
      }, 1500);
    } catch (error) {
      console.error('Registration error:', error);
      
      const errorMessage = error.response?.data?.detail || 'Erro ao realizar cadastro. Tente novamente.';
      
      toast.error(errorMessage, {
        description: 'Por favor, corrija os erros no formulário.',
      });
      
      // Set specific error if email already exists
      if (errorMessage.includes('already registered')) {
        setErrors({ email: 'Este email já está cadastrado' });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <img 
                src="/assets/images/logo/logo-principal.png" 
                alt="ImovLocal - Portal Imobiliário"
                className="h-20 w-auto"
                data-testid="logo-register"
              />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2 text-center">Cadastre-se</h1>
            <p className="text-gray-600 mb-6 text-center">Crie sua conta no ImovLocal</p>

            {/* Pricing Preview */}
            <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg">
              <h3 className="font-bold text-green-800 mb-3 text-center flex items-center justify-center gap-2">
                <span className="text-lg">💰</span> Valores dos Planos
              </h3>
              <div className="grid grid-cols-3 gap-3 text-center">
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Particular</p>
                  <p className="font-bold text-green-600">R$ 47,90</p>
                  <p className="text-xs text-gray-400">trimestral</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">1 anúncio</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Corretor</p>
                  <p className="font-bold text-green-600">R$ 197,90</p>
                  <p className="text-xs text-gray-400">trimestral</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">50 anúncios</p>
                </div>
                <div className="bg-white p-3 rounded-lg shadow-sm">
                  <p className="text-xs text-gray-500 mb-1">Imobiliária</p>
                  <p className="font-bold text-green-600">R$ 497,90</p>
                  <p className="text-xs text-gray-400">anual</p>
                  <p className="text-xs text-blue-600 font-medium mt-1">150 anúncios</p>
                </div>
              </div>
              <p className="text-center text-xs text-green-700 mt-3">
                📸 Todos os planos incluem até 20 fotos por anúncio
              </p>
              <div className="text-center mt-2">
                <Link to="/planos" className="text-sm text-green-600 hover:text-green-800 underline font-medium">
                  Ver detalhes dos planos →
                </Link>
              </div>
            </div>

            {/* User Type Selection */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              <button
                type="button"
                onClick={() => handleUserTypeChange('particular')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  userType === 'particular'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="btn-particular"
              >
                <User className="inline mr-2" size={20} />
                Particular
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange('corretor')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  userType === 'corretor'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="btn-corretor"
              >
                <Building className="inline mr-2" size={20} />
                Corretor
              </button>
              <button
                type="button"
                onClick={() => handleUserTypeChange('imobiliaria')}
                className={`py-3 px-4 rounded-lg font-semibold transition-all ${
                  userType === 'imobiliaria'
                    ? 'bg-red-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                data-testid="btn-imobiliaria"
              >
                <Building className="inline mr-2" size={20} />
                Imobiliária
              </button>
            </div>

            {/* Aviso para usuário Particular - Tarefa 1.3 */}
            {userType === 'particular' && showParticularWarning && (
              <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg" data-testid="particular-warning">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="font-semibold text-amber-800 mb-1">Atenção - Restrição de Anúncios</h3>
                    <p className="text-sm text-amber-700 mb-2">
                      Como usuário <strong>Particular</strong>, você poderá anunciar imóveis apenas nas seguintes modalidades:
                    </p>
                    <ul className="text-sm text-amber-700 list-disc list-inside mb-3 space-y-1">
                      <li><strong>Aluguel</strong> - Locação tradicional</li>
                      <li><strong>Aluguel por Temporada</strong> - Locação de curta duração</li>
                    </ul>
                    <div className="flex items-center gap-2 text-sm text-amber-800 bg-amber-100 p-2 rounded">
                      <Info size={16} />
                      <span>
                        Para anunciar imóveis à <strong>Venda</strong>, cadastre-se como <strong>Corretor/Imobiliária</strong>.
                      </span>
                    </div>
                    <button 
                      onClick={() => setShowParticularWarning(false)}
                      className="mt-3 text-sm text-amber-700 hover:text-amber-900 underline"
                    >
                      Entendi, continuar como Particular
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Info box for Corretor */}
            {userType === 'corretor' && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg" data-testid="corretor-info">
                <div className="flex items-start gap-3">
                  <Info className="text-blue-600 flex-shrink-0 mt-0.5" size={24} />
                  <div>
                    <h3 className="font-semibold text-blue-800 mb-1">Corretor / Imobiliária</h3>
                    <p className="text-sm text-blue-700">
                      Como <strong>Corretor</strong> ou <strong>Imobiliária</strong>, você terá acesso completo para anunciar:
                    </p>
                    <ul className="text-sm text-blue-700 list-disc list-inside mt-2 space-y-1">
                      <li><strong>Venda</strong> - Imóveis à venda</li>
                      <li><strong>Aluguel</strong> - Locação tradicional</li>
                      <li><strong>Aluguel por Temporada</strong> - Locação de curta duração</li>
                    </ul>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                    errors.name ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Seu nome completo"
                  data-testid="input-name"
                />
                {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email *
                </label>
                <div className="relative">
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.email ? 'border-red-500' : 
                      emailValidation.valid === true ? 'border-green-500' :
                      emailValidation.valid === false ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="seu@email.com"
                    data-testid="input-email"
                  />
                  {/* Indicador de validação */}
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {emailValidation.checking && (
                      <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />
                    )}
                    {!emailValidation.checking && emailValidation.valid === true && (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    )}
                    {!emailValidation.checking && emailValidation.valid === false && (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                </div>
                {/* Mensagens de feedback */}
                {emailValidation.valid === true && (
                  <p className="text-green-600 text-sm mt-1 flex items-center gap-1">
                    <CheckCircle className="w-4 h-4" /> Email válido
                  </p>
                )}
                {emailValidation.error && (
                  <p className="text-red-500 text-sm mt-1 flex items-center gap-1">
                    <XCircle className="w-4 h-4" /> {emailValidation.error}
                  </p>
                )}
                {errors.email && !emailValidation.error && (
                  <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                )}
              </div>

              {/* Phone and CPF */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Telefone *
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.phone ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="(67) 99999-9999"
                    data-testid="input-phone"
                  />
                  {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    CPF *
                  </label>
                  <input
                    type="text"
                    name="cpf"
                    value={formData.cpf}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.cpf ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="000.000.000-00"
                    data-testid="input-cpf"
                  />
                  {errors.cpf && <p className="text-red-500 text-sm mt-1">{errors.cpf}</p>}
                </div>
              </div>

              {/* City and State */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Cidade *
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.city ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Campo Grande"
                    data-testid="input-city"
                  />
                  {errors.city && <p className="text-red-500 text-sm mt-1">{errors.city}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    UF *
                  </label>
                  <select
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    data-testid="select-state"
                  >
                    <option value="AC">AC - Acre</option>
                    <option value="AL">AL - Alagoas</option>
                    <option value="AP">AP - Amapá</option>
                    <option value="AM">AM - Amazonas</option>
                    <option value="BA">BA - Bahia</option>
                    <option value="CE">CE - Ceará</option>
                    <option value="DF">DF - Distrito Federal</option>
                    <option value="ES">ES - Espírito Santo</option>
                    <option value="GO">GO - Goiás</option>
                    <option value="MA">MA - Maranhão</option>
                    <option value="MT">MT - Mato Grosso</option>
                    <option value="MS">MS - Mato Grosso do Sul</option>
                    <option value="MG">MG - Minas Gerais</option>
                    <option value="PA">PA - Pará</option>
                    <option value="PB">PB - Paraíba</option>
                    <option value="PR">PR - Paraná</option>
                    <option value="PE">PE - Pernambuco</option>
                    <option value="PI">PI - Piauí</option>
                    <option value="RJ">RJ - Rio de Janeiro</option>
                    <option value="RN">RN - Rio Grande do Norte</option>
                    <option value="RS">RS - Rio Grande do Sul</option>
                    <option value="RO">RO - Rondônia</option>
                    <option value="RR">RR - Roraima</option>
                    <option value="SC">SC - Santa Catarina</option>
                    <option value="SP">SP - São Paulo</option>
                    <option value="SE">SE - Sergipe</option>
                    <option value="TO">TO - Tocantins</option>
                  </select>
                </div>
              </div>

              {/* Corretor specific fields */}
              {userType === 'corretor' && (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CRECI *
                      </label>
                      <input
                        type="text"
                        name="creci"
                        value={formData.creci}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                          errors.creci ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="CRECI 12345-MS"
                        data-testid="input-creci"
                      />
                      {errors.creci && <p className="text-red-500 text-sm mt-1">{errors.creci}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Imobiliária (opcional)
                      </label>
                      <input
                        type="text"
                        name="company"
                        value={formData.company}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="Nome da imobiliária"
                        data-testid="input-company"
                      />
                    </div>
                  </div>
                </>
              )}

              {/* Imobiliária specific fields */}
              {userType === 'imobiliaria' && (
                <>
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-2">
                      <Info className="text-blue-600 mt-0.5" size={20} />
                      <div className="text-sm text-blue-800">
                        <p className="font-semibold mb-1">Conta Imobiliária / Corretor Autônomo</p>
                        <p>Esta categoria é ideal para corretores e imobiliárias. CRECI é obrigatório. CNPJ e Razão Social são opcionais.</p>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CRECI *
                      </label>
                      <input
                        type="text"
                        name="creci"
                        value={formData.creci}
                        onChange={handleChange}
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all ${
                          errors.creci ? 'border-red-500' : 'border-gray-300'
                        }`}
                        placeholder="CRECI 12345-MS"
                        data-testid="input-creci-imob"
                      />
                      {errors.creci && <p className="text-red-500 text-sm mt-1">{errors.creci}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        CNPJ (opcional)
                      </label>
                      <input
                        type="text"
                        name="cnpj"
                        value={formData.cnpj}
                        onChange={handleChange}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                        placeholder="00.000.000/0000-00"
                        data-testid="input-cnpj"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Razão Social / Nome da Empresa (opcional)
                    </label>
                    <input
                      type="text"
                      name="razao_social"
                      value={formData.razao_social}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Imobiliária XYZ Ltda ou Nome do Corretor"
                      data-testid="input-razao-social"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Nome Fantasia (opcional)
                    </label>
                    <input
                      type="text"
                      name="company"
                      value={formData.company}
                      onChange={handleChange}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                      placeholder="Nome comercial"
                      data-testid="input-company-imob"
                    />
                  </div>
                </>
              )}

              {/* Password */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Senha *
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.password ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Mínimo 6 caracteres"
                    data-testid="input-password"
                  />
                  {errors.password && <p className="text-red-500 text-sm mt-1">{errors.password}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Confirmar senha *
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                      errors.confirmPassword ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder="Confirme sua senha"
                    data-testid="input-confirm-password"
                  />
                  {errors.confirmPassword && <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>}
                </div>
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2">
                <input
                  type="checkbox"
                  id="terms"
                  required
                  className="mt-1"
                  data-testid="checkbox-terms"
                />
                <label htmlFor="terms" className="text-sm text-gray-600">
                  Eu aceito os <Link to="/termos" className="text-blue-600 hover:underline">termos de uso</Link> e a{' '}
                  <Link to="/privacidade" className="text-blue-600 hover:underline">política de privacidade</Link>
                </label>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-semibold py-3 text-lg"
                data-testid="btn-submit"
              >
                Criar conta
              </Button>

              <p className="text-center text-sm text-gray-600 mt-4">
                Já tem uma conta?{' '}
                <Link to="/login" className="text-blue-600 hover:underline font-semibold">
                  Faça login
                </Link>
              </p>
            </form>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Register;
