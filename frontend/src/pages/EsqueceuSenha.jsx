import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle, Lock, KeyRound } from 'lucide-react';
import { Button } from '../components/ui/button';
import api from '../services/api';
import { toast } from 'sonner';

const EsqueceuSenha = () => {
  const [step, setStep] = useState(1); // 1: email, 2: código, 3: nova senha
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Passo 1: Solicitar código
  const handleRequestCode = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Digite seu email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/password/forgot', { email });
      toast.success('Código enviado para seu email!');
      setStep(2);
    } catch (error) {
      toast.error('Erro ao enviar código. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  // Passo 2: Verificar código
  const handleVerifyCode = async (e) => {
    e.preventDefault();
    
    if (!code || code.length !== 6) {
      toast.error('Digite o código de 6 dígitos');
      return;
    }

    setLoading(true);
    try {
      await api.post('/password/verify-code', { email, code });
      toast.success('Código válido!');
      setStep(3);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Código inválido');
    } finally {
      setLoading(false);
    }
  };

  // Passo 3: Redefinir senha
  const handleResetPassword = async (e) => {
    e.preventDefault();
    
    if (password.length < 6) {
      toast.error('A senha deve ter no mínimo 6 caracteres');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      await api.post('/password/reset', { email, code, new_password: password });
      toast.success('Senha redefinida com sucesso!');
      setSuccess(true);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao redefinir senha');
    } finally {
      setLoading(false);
    }
  };

  // Tela de sucesso
  if (success) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Senha Redefinida!</h1>
          <p className="text-gray-600 mb-6">
            Sua senha foi alterada com sucesso. Você já pode fazer login.
          </p>
          <Link to="/login">
            <Button className="w-full bg-green-600 hover:bg-green-700">
              Fazer Login
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <Link to="/login" className="inline-flex items-center text-gray-600 hover:text-gray-800 mb-6">
          <ArrowLeft size={18} className="mr-2" />
          Voltar para Login
        </Link>

        {/* Indicador de passos */}
        <div className="flex items-center justify-center mb-6">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 1 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
          <div className={`w-12 h-1 ${step >= 2 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 2 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
          <div className={`w-12 h-1 ${step >= 3 ? 'bg-red-600' : 'bg-gray-200'}`}></div>
          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${step >= 3 ? 'bg-red-600 text-white' : 'bg-gray-200 text-gray-500'}`}>3</div>
        </div>

        {/* Passo 1: Email */}
        {step === 1 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Mail className="text-blue-600" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Esqueceu sua senha?</h1>
              <p className="text-gray-600 mt-2">
                Digite seu email para receber um código de recuperação.
              </p>
            </div>

            <form onSubmit={handleRequestCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Código'}
              </Button>
            </form>
          </>
        )}

        {/* Passo 2: Código */}
        {step === 2 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <KeyRound className="text-yellow-600" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Digite o Código</h1>
              <p className="text-gray-600 mt-2">
                Enviamos um código de 6 dígitos para <strong>{email}</strong>
              </p>
            </div>

            <form onSubmit={handleVerifyCode} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código</label>
                <input
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="000000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-center text-2xl tracking-widest font-bold"
                  maxLength={6}
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? 'Verificando...' : 'Verificar Código'}
              </Button>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="w-full text-sm text-gray-500 hover:text-gray-700"
              >
                Não recebeu? Voltar e tentar novamente
              </button>
            </form>
          </>
        )}

        {/* Passo 3: Nova senha */}
        {step === 3 && (
          <>
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Lock className="text-green-600" size={32} />
              </div>
              <h1 className="text-2xl font-bold text-gray-800">Nova Senha</h1>
              <p className="text-gray-600 mt-2">
                Crie uma nova senha para sua conta.
              </p>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mínimo 6 caracteres"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  minLength={6}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Senha</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Digite novamente"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
              <Button type="submit" className="w-full bg-red-600 hover:bg-red-700" disabled={loading}>
                {loading ? 'Salvando...' : 'Redefinir Senha'}
              </Button>
            </form>
          </>
        )}

        <p className="text-center text-sm text-gray-500 mt-6">
          Lembrou sua senha?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">
            Fazer Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default EsqueceuSenha;
