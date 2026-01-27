import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import api from '../services/api';
import { toast } from 'sonner';

const EsqueceuSenha = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Digite seu email');
      return;
    }

    setLoading(true);
    try {
      await api.post('/password/forgot', { email });
      setSent(true);
      toast.success('Email enviado com sucesso!');
    } catch (error) {
      toast.error('Erro ao enviar email. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="text-green-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Enviado!</h1>
          <p className="text-gray-600 mb-6">
            Se o email <strong>{email}</strong> estiver cadastrado em nossa base, 
            você receberá um link para redefinir sua senha.
          </p>
          <p className="text-sm text-gray-500 mb-6">
            Verifique também a pasta de spam.
          </p>
          <Link to="/login">
            <Button className="w-full">
              Voltar para Login
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

        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="text-blue-600" size={32} />
          </div>
          <h1 className="text-2xl font-bold text-gray-800">Esqueceu sua senha?</h1>
          <p className="text-gray-600 mt-2">
            Digite seu email e enviaremos um link para redefinir sua senha.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
              data-testid="forgot-email"
            />
          </div>

          <Button 
            type="submit" 
            className="w-full bg-red-600 hover:bg-red-700"
            disabled={loading}
            data-testid="forgot-submit"
          >
            {loading ? 'Enviando...' : 'Enviar Link de Recuperação'}
          </Button>
        </form>

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
