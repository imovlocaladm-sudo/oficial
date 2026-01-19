import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { 
  Check, X, Star, Crown, Building2, User, 
  CreditCard, ArrowRight, Shield, Clock
} from 'lucide-react';
import api from '../services/api';
import { toast } from 'sonner';

const Planos = () => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPlan, setCurrentPlan] = useState(null);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated()) {
      fetchCurrentPlan();
    }
  }, [isAuthenticated]);

  const fetchPlans = async () => {
    try {
      const response = await api.get('/payments/plans');
      setPlans(response.data);
    } catch (error) {
      console.error('Error fetching plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentPlan = async () => {
    try {
      const response = await api.get('/payments/my-current-plan');
      setCurrentPlan(response.data);
    } catch (error) {
      console.error('Error fetching current plan:', error);
    }
  };

  const handleSelectPlan = (planId) => {
    if (!isAuthenticated()) {
      toast.info('Faça login para assinar um plano');
      navigate('/login', { state: { redirectTo: `/checkout/${planId}` } });
      return;
    }
    navigate(`/checkout/${planId}`);
  };

  const formatPrice = (price) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(price);
  };

  const getPlanIcon = (planId) => {
    if (planId.includes('particular')) return <User size={32} className="text-green-600" />;
    if (planId.includes('corretor')) return <Crown size={32} className="text-blue-600" />;
    if (planId.includes('imobiliaria')) return <Building2 size={32} className="text-orange-600" />;
    return <Star size={32} />;
  };

  const getPlanColor = (planId) => {
    if (planId.includes('particular')) return 'green';
    if (planId.includes('corretor')) return 'blue';
    if (planId.includes('imobiliaria')) return 'orange';
    return 'gray';
  };

  const getPlanFeatures = (planId) => {
    const baseFeatures = [
      'Cadastro de imóveis ilimitado',
      'Fotos em alta resolução',
      'Contato direto via WhatsApp',
      'Suporte por email'
    ];

    if (planId.includes('particular')) {
      return [
        ...baseFeatures,
        'Anúncios de Aluguel',
        'Aluguel por Temporada',
        'Perfil verificado'
      ];
    }
    
    if (planId.includes('corretor')) {
      return [
        ...baseFeatures,
        'Venda, Aluguel e Temporada',
        'Destaque nos resultados',
        'Hub de Parcerias',
        'Mural de Oportunidades',
        'Badge de Corretor verificado'
      ];
    }
    
    if (planId.includes('imobiliaria')) {
      return [
        ...baseFeatures,
        'Venda, Aluguel e Temporada',
        'Destaque premium nos resultados',
        'Hub de Parcerias completo',
        'Mural de Oportunidades',
        'Múltiplos corretores vinculados',
        'Relatórios de desempenho',
        'Badge de Imobiliária verificada',
        'Suporte prioritário'
      ];
    }
    
    return baseFeatures;
  };

  const isCurrentUserPlan = (planId) => {
    if (!user) return false;
    return planId.includes(user.user_type);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <Header />

      {/* Hero Section */}
      <div className="bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Escolha o Plano Ideal para Você
          </h1>
          <p className="text-xl text-blue-100 max-w-2xl mx-auto">
            Desbloqueie todo o potencial do ImovLocal e alcance mais clientes
          </p>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12">
        {/* Current Plan Info */}
        {currentPlan && currentPlan.plan_type !== 'free' && (
          <div className="max-w-4xl mx-auto mb-8">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Shield className="text-green-600" size={24} />
                <div>
                  <p className="font-semibold text-green-800">Plano Ativo: {currentPlan.plan_type}</p>
                  {currentPlan.plan_expires_at && (
                    <p className="text-sm text-green-600">
                      Válido até: {new Date(currentPlan.plan_expires_at).toLocaleDateString('pt-BR')}
                    </p>
                  )}
                </div>
              </div>
              <Check className="text-green-600" size={24} />
            </div>
          </div>
        )}

        {/* Plans Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const color = getPlanColor(plan.id);
              const isRecommended = plan.id.includes('corretor');
              const isUserPlan = isCurrentUserPlan(plan.id);
              
              return (
                <div
                  key={plan.id}
                  className={`relative bg-white rounded-2xl shadow-xl overflow-hidden transform transition-all duration-300 hover:scale-105 ${
                    isRecommended ? 'ring-2 ring-blue-500 md:-mt-4 md:mb-4' : ''
                  }`}
                >
                  {/* Recommended Badge */}
                  {isRecommended && (
                    <div className="absolute top-0 left-0 right-0 bg-blue-500 text-white text-center py-2 text-sm font-semibold">
                      ⭐ MAIS POPULAR
                    </div>
                  )}

                  <div className={`p-8 ${isRecommended ? 'pt-14' : ''}`}>
                    {/* Plan Header */}
                    <div className="text-center mb-6">
                      <div className={`inline-flex p-4 rounded-full bg-${color}-100 mb-4`}>
                        {getPlanIcon(plan.id)}
                      </div>
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">{plan.name}</h3>
                      <p className="text-gray-600 text-sm">{plan.description}</p>
                    </div>

                    {/* Price */}
                    <div className="text-center mb-6">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-lg text-gray-500">R$</span>
                        <span className={`text-5xl font-bold text-${color}-600`}>
                          {plan.price.toFixed(2).split('.')[0]}
                        </span>
                        <span className="text-xl text-gray-500">,{plan.price.toFixed(2).split('.')[1]}</span>
                      </div>
                      <p className="text-gray-500 mt-1">
                        <Clock size={14} className="inline mr-1" />
                        {plan.duration_days === 90 ? 'por 3 meses' : 'por 1 ano'}
                      </p>
                    </div>

                    {/* Features */}
                    <ul className="space-y-3 mb-8">
                      {getPlanFeatures(plan.id).map((feature, index) => (
                        <li key={index} className="flex items-start gap-3">
                          <Check className={`text-${color}-500 flex-shrink-0 mt-0.5`} size={18} />
                          <span className="text-gray-700 text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA Button */}
                    <Button
                      onClick={() => handleSelectPlan(plan.id)}
                      disabled={!isUserPlan && user?.user_type && !['admin', 'admin_senior'].includes(user.user_type)}
                      className={`w-full py-6 text-lg font-semibold ${
                        isRecommended
                          ? 'bg-blue-600 hover:bg-blue-700'
                          : `bg-${color}-600 hover:bg-${color}-700`
                      } ${!isUserPlan && user?.user_type ? 'opacity-50 cursor-not-allowed' : ''}`}
                      data-testid={`btn-select-${plan.id}`}
                    >
                      {currentPlan?.plan_type === 'free' || !currentPlan ? (
                        <>
                          Assinar Agora
                          <ArrowRight size={20} className="ml-2" />
                        </>
                      ) : (
                        'Renovar Plano'
                      )}
                    </Button>

                    {!isUserPlan && user?.user_type && !['admin', 'admin_senior'].includes(user.user_type) && (
                      <p className="text-xs text-center text-gray-500 mt-2">
                        Este plano é para {plan.user_type}s
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-4xl mx-auto mt-16">
          <h2 className="text-3xl font-bold text-center text-gray-800 mb-8">
            Perguntas Frequentes
          </h2>
          
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Como funciona o pagamento?</h3>
              <p className="text-gray-600">
                O pagamento é feito via Pix. Após selecionar seu plano, você receberá a chave Pix para efetuar o pagamento. 
                Depois, basta enviar o comprovante e aguardar a aprovação (em até 24h úteis).
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Posso cancelar a qualquer momento?</h3>
              <p className="text-gray-600">
                Sim! Você pode usar o plano até a data de vencimento. Não há renovação automática - 
                você escolhe se deseja renovar quando o período acabar.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-2">O que acontece quando meu plano vencer?</h3>
              <p className="text-gray-600">
                Seus anúncios continuam ativos, mas você volta para o plano gratuito com limitações. 
                Você pode renovar a qualquer momento para ter acesso completo novamente.
              </p>
            </div>

            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="font-semibold text-gray-800 mb-2">Posso mudar de plano?</h3>
              <p className="text-gray-600">
                Cada plano é específico para um tipo de conta (Particular, Corretor ou Imobiliária). 
                Se precisar mudar o tipo de conta, entre em contato com nosso suporte.
              </p>
            </div>
          </div>
        </div>

        {/* CTA Final */}
        <div className="max-w-4xl mx-auto mt-16 text-center">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white">
            <h2 className="text-2xl md:text-3xl font-bold mb-4">
              Ainda tem dúvidas?
            </h2>
            <p className="text-blue-100 mb-6">
              Nossa equipe está pronta para ajudar você a escolher o melhor plano.
            </p>
            <a 
              href="https://wa.me/5567982288883?text=Olá! Tenho dúvidas sobre os planos do ImovLocal."
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-6 text-lg">
                Falar com Suporte
              </Button>
            </a>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Planos;
