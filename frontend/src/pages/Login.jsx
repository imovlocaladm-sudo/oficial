import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Mail, Lock, AlertCircle, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';

const Login = () => {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validação de campos vazios
    if (!formData.email.trim()) {
      setError('Por favor, informe seu email');
      return;
    }
    if (!formData.password.trim()) {
      setError('Por favor, informe sua senha');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const userData = await login(formData.email, formData.password);
      
      toast.success('Login realizado com sucesso!', {
        description: `Bem-vindo de volta, ${userData.user?.name || 'usuário'}!`,
      });

      // Redirecionamento inteligente baseado no tipo de usuário
      if (userData.user?.user_type === 'admin') {
        navigate('/admin/master');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (error) {
      console.error('Login error:', error);
      
      // Tratamento de mensagens de erro específicas
      let errorMessage = 'Email ou senha incorretos';
      
      if (error.response?.status === 403) {
        // Usuário pausado ou pendente
        errorMessage = error.response?.data?.detail || 'Sua conta está inativa. Entre em contato com o administrador.';
      } else if (error.response?.data?.detail) {
        errorMessage = error.response.data.detail;
      }
      
      setError(errorMessage);
      
      toast.error('Erro no login', {
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <div className="container mx-auto px-4 py-12">
        <div className="max-w-md mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <div className="text-center mb-8">
              <div className="flex justify-center mb-6">
                <img 
                  src="/assets/images/logo/logo-principal.png" 
                  alt="ImovLocal - Portal Imobiliário"
                  className="h-20 w-auto md:h-24"
                  data-testid="logo-login"
                />
              </div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">Acesse sua Conta</h1>
              <p className="text-gray-600">Entre com suas credenciais para acessar o painel</p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
                <AlertCircle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Email */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="seu@email.com"
                    autoComplete="email"
                  />
                </div>
              </div>

              {/* Password with show/hide toggle */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                    placeholder="Sua senha"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 text-lg"
                disabled={loading}
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Entrando...
                  </span>
                ) : (
                  'Entrar'
                )}
              </Button>

              <div className="text-center space-y-2 mt-4">
                <Link to="/recuperar-senha" className="text-sm text-blue-600 hover:underline block">
                  Esqueceu sua senha?
                </Link>
                <p className="text-sm text-gray-600">
                  Ainda não tem uma conta?{' '}
                  <Link to="/cadastro" className="text-blue-600 hover:underline font-semibold">
                    Cadastre-se
                  </Link>
                </p>
              </div>
            </form>

            {/* Divider */}
            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-200"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-white text-gray-500">ou</span>
              </div>
            </div>

            {/* Back to Home */}
            <div className="text-center">
              <Link 
                to="/" 
                className="text-gray-600 hover:text-gray-800 text-sm flex items-center justify-center gap-2"
              >
                ← Voltar para a página inicial
              </Link>
            </div>
          </div>

          {/* Info Box */}
          <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Tipos de Acesso</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• <strong>Particular:</strong> Gerencie seus imóveis pessoais</li>
              <li>• <strong>Corretor:</strong> Acesse recursos profissionais</li>
              <li>• <strong>Administrador:</strong> Controle total da plataforma</li>
            </ul>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Login;
