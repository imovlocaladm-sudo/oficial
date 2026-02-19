import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';
import { 
  CreditCard, 
  Check, 
  ArrowLeft, 
  Loader2,
  Shield
} from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${BACKEND_URL}/api`;

const Checkout = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [stripeLoading, setStripeLoading] = useState(false);

  const planId = searchParams.get('plan');

  useEffect(() => {
    // Aguardar o carregamento da autenticação
    if (authLoading) return;
    
    if (!isAuthenticated()) {
      navigate('/login', { state: { returnTo: `/checkout?plan=${planId}` } });
      return;
    }
    
    if (!planId) {
      navigate('/planos');
      return;
    }

    fetchPlan();
  }, [planId, isAuthenticated, navigate, authLoading]);

  const fetchPlan = async () => {
    try {
      const plansResponse = await axios.get(`${API_URL}/payments/plans`);
      const selectedPlan = plansResponse.data.find(p => p.id === planId);
      
      if (!selectedPlan) {
        toast.error('Plano não encontrado');
        navigate('/planos');
        return;
      }
      
      setPlan(selectedPlan);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value || 0);
  };

  // Iniciar checkout Stripe
  const handleStripeCheckout = async () => {
    setStripeLoading(true);
    try {
      const token = JSON.parse(localStorage.getItem('imovlocal_user'))?.access_token;
      const response = await axios.post(
        `${API_URL}/stripe/checkout/session`,
        { 
          plan_id: planId,
          origin_url: window.location.origin
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Redirecionar para Stripe Checkout
      window.location.href = response.data.checkout_url;
    } catch (error) {
      console.error('Error creating Stripe checkout:', error);
      toast.error(error.response?.data?.detail || 'Erro ao iniciar pagamento');
      setStripeLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header />
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600"></div>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        {/* Voltar */}
        <Button
          variant="ghost"
          onClick={() => navigate('/planos')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar aos Planos
        </Button>

        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-red-600 to-red-700 px-6 py-8 text-white text-center">
              <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-90" />
              <h1 className="text-2xl font-bold">Finalizar Assinatura</h1>
              <p className="text-red-100 mt-1">Pagamento seguro via Stripe</p>
            </div>

            {/* Conteúdo */}
            <div className="p-6">
              {/* Resumo do Plano */}
              <div className="border rounded-lg p-5 mb-6 bg-gray-50">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg text-gray-800">{plan?.nome}</h3>
                    <p className="text-gray-500 text-sm">{plan?.descricao}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-red-600">{formatCurrency(plan?.valor)}</p>
                    <p className="text-xs text-gray-500">/{plan?.periodo}</p>
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <p className="text-xs text-gray-500 uppercase mb-2 font-semibold">Incluído no plano:</p>
                  <ul className="space-y-2">
                    {plan?.recursos?.slice(0, 5).map((recurso, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <Check className="w-4 h-4 text-green-600 mr-2 flex-shrink-0" />
                        {recurso}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Botão de Pagamento */}
              <Button
                onClick={handleStripeCheckout}
                disabled={stripeLoading}
                className="w-full bg-green-600 hover:bg-green-700 py-6 text-lg font-semibold"
                data-testid="checkout-button"
              >
                {stripeLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                    Redirecionando...
                  </>
                ) : (
                  <>
                    <CreditCard className="w-5 h-5 mr-2" />
                    Pagar {formatCurrency(plan?.valor)}
                  </>
                )}
              </Button>

              {/* Métodos aceitos */}
              <div className="mt-6 text-center">
                <p className="text-xs text-gray-400 mb-3">Formas de pagamento aceitas</p>
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <div className="bg-gray-100 rounded px-3 py-1.5 text-xs font-medium text-gray-600">
                    💳 Cartão de Crédito
                  </div>
                  <div className="bg-gray-100 rounded px-3 py-1.5 text-xs font-medium text-gray-600">
                    💳 Cartão de Débito
                  </div>
                  <div className="bg-gray-100 rounded px-3 py-1.5 text-xs font-medium text-gray-600">
                    🏦 PIX
                  </div>
                </div>
              </div>

              {/* Segurança */}
              <div className="mt-6 flex items-center justify-center gap-2 text-gray-400">
                <Shield className="w-4 h-4" />
                <span className="text-xs">Pagamento processado com segurança pela Stripe</span>
              </div>

              {/* Aviso de aprovação */}
              <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
                <p className="text-sm text-yellow-800">
                  <strong>Importante:</strong> Após o pagamento, seu acesso será liberado em até 24h úteis após aprovação da nossa equipe.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Checkout;
