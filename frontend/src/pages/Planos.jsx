import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { Check, Crown, Building, User, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const Planos = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const response = await axios.get(`${API_URL}/payments/plans`);
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
      toast.error('Erro ao carregar planos');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId) => {
    if (!isAuthenticated()) {
      toast.info('Faça login para assinar um plano', {
        description: 'Você será redirecionado para a página de login.'
      });
      navigate('/login', { state: { returnTo: `/checkout?plan=${planId}` } });
      return;
    }
    navigate(`/checkout?plan=${planId}`);
  };

  const getPlanIcon = (userType) => {
    switch (userType) {
      case 'particular':
        return <User className="w-12 h-12 text-blue-600" />;
      case 'corretor':
        return <Crown className="w-12 h-12 text-orange-600" />;
      case 'imobiliaria':
        return <Building className="w-12 h-12 text-purple-600" />;
      default:
        return <User className="w-12 h-12 text-gray-600" />;
    }
  };

  const getPlanColor = (userType) => {
    switch (userType) {
      case 'particular':
        return 'border-blue-500 bg-blue-50';
      case 'corretor':
        return 'border-orange-500 bg-orange-50';
      case 'imobiliaria':
        return 'border-purple-500 bg-purple-50';
      default:
        return 'border-gray-500 bg-gray-50';
    }
  };

  const getPlanButtonColor = (userType) => {
    switch (userType) {
      case 'particular':
        return 'bg-blue-600 hover:bg-blue-700';
      case 'corretor':
        return 'bg-orange-600 hover:bg-orange-700';
      case 'imobiliaria':
        return 'bg-purple-600 hover:bg-purple-700';
      default:
        return 'bg-gray-600 hover:bg-gray-700';
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-red-600 to-red-800 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha seu Plano
          </h1>
          <p className="text-xl text-red-100 max-w-2xl mx-auto">
            Anuncie seus imóveis na maior plataforma imobiliária da região.
            Escolha o plano ideal para você ou sua imobiliária.
          </p>
        </div>
      </div>

      {/* Plans Section */}
      <div className="container mx-auto px-4 py-16">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => (
              <div
                key={plan.id}
                className={`rounded-2xl border-2 p-8 transition-all hover:shadow-xl ${getPlanColor(plan.user_type)}`}
              >
                {/* Plan Header */}
                <div className="text-center mb-6">
                  <div className="flex justify-center mb-4">
                    {getPlanIcon(plan.user_type)}
                  </div>
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">
                    {plan.nome}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {plan.descricao}
                  </p>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-4xl font-bold text-gray-800">
                      {formatCurrency(plan.valor)}
                    </span>
                    <span className="text-gray-500">/{plan.periodo}</span>
                  </div>
                </div>

                {/* Features List */}
                <ul className="space-y-3 mb-8">
                  {plan.recursos.map((recurso, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-700">{recurso}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA Button */}
                <Button
                  onClick={() => handleSelectPlan(plan.id)}
                  className={`w-full text-white py-3 ${getPlanButtonColor(plan.user_type)}`}
                  disabled={user && user.user_type !== plan.user_type}
                >
                  {user && user.user_type !== plan.user_type ? (
                    `Apenas para ${plan.user_type}`
                  ) : (
                    <>
                      Assinar Agora
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </>
                  )}
                </Button>

                {user && user.user_type !== plan.user_type && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    Este plano é para usuários do tipo "{plan.user_type}"
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Info Section */}
        <div className="mt-16 max-w-4xl mx-auto">
          <div className="bg-white rounded-lg shadow-lg p-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
              Como funciona o pagamento?
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-red-600">1</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Escolha o Plano</h3>
                <p className="text-gray-600 text-sm">
                  Selecione o plano ideal para suas necessidades
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-red-600">2</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Pague via PIX</h3>
                <p className="text-gray-600 text-sm">
                  Realize o pagamento usando a chave PIX informada
                </p>
              </div>
              <div className="text-center">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl font-bold text-red-600">3</span>
                </div>
                <h3 className="font-semibold text-gray-800 mb-2">Envie o Comprovante</h3>
                <p className="text-gray-600 text-sm">
                  Envie o comprovante e aguarde a aprovação em até 24h
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-12 max-w-4xl mx-auto">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            Dúvidas Frequentes
          </h2>
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-2">
                Posso cancelar a qualquer momento?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode cancelar sua assinatura a qualquer momento. O acesso continua até o final do período contratado.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-2">
                Quanto tempo demora a aprovação do pagamento?
              </h3>
              <p className="text-gray-600">
                Após o envio do comprovante, a aprovação é feita em até 24 horas úteis. Você receberá uma notificação quando o plano for ativado.
              </p>
            </div>
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-2">
                Posso mudar de plano depois?
              </h3>
              <p className="text-gray-600">
                Sim! Você pode fazer upgrade ou downgrade do seu plano ao final do período atual.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Planos;
