import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { CheckCircle, Clock, Loader2 } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PagamentoSucesso = () => {
  const [searchParams] = useSearchParams();
  const [status, setStatus] = useState('loading');
  const [paymentInfo, setPaymentInfo] = useState(null);
  const [pollCount, setPollCount] = useState(0);

  const sessionId = searchParams.get('session_id');
  const paymentId = searchParams.get('payment_id');

  useEffect(() => {
    if (!sessionId) {
      setStatus('error');
      return;
    }

    const checkPaymentStatus = async () => {
      try {
        const response = await fetch(`${API_URL}/api/stripe/checkout/status/${sessionId}`);
        
        if (!response.ok) {
          throw new Error('Erro ao verificar pagamento');
        }

        const data = await response.json();
        setPaymentInfo(data);

        if (data.payment_status === 'paid' || data.status === 'awaiting_approval') {
          setStatus('paid');
        } else if (data.status === 'expired' || data.status === 'failed') {
          setStatus('failed');
        } else if (pollCount < 5) {
          // Continuar polling se ainda pendente
          setTimeout(() => setPollCount(prev => prev + 1), 2000);
        } else {
          setStatus('pending');
        }
      } catch (error) {
        console.error('Erro:', error);
        if (pollCount < 3) {
          setTimeout(() => setPollCount(prev => prev + 1), 2000);
        } else {
          setStatus('error');
        }
      }
    };

    checkPaymentStatus();
  }, [sessionId, pollCount]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          
          {status === 'loading' && (
            <>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Verificando pagamento...
              </h1>
              <p className="text-gray-600">
                Aguarde enquanto confirmamos seu pagamento.
              </p>
            </>
          )}

          {status === 'paid' && (
            <>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Pagamento Recebido!
              </h1>
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <div className="flex items-center justify-center gap-2 text-yellow-700 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="font-semibold">Aguardando Aprovação</span>
                </div>
                <p className="text-sm text-yellow-600">
                  Seu pagamento foi confirmado com sucesso. Agora nossa equipe irá analisar e aprovar seu acesso em até 24 horas úteis.
                </p>
              </div>
              {paymentInfo && (
                <div className="bg-gray-50 rounded-lg p-4 mb-6 text-left">
                  <h3 className="font-semibold text-gray-700 mb-2">Detalhes:</h3>
                  <p className="text-sm text-gray-600">
                    <strong>Plano:</strong> {paymentInfo.plan_nome}
                  </p>
                  <p className="text-sm text-gray-600">
                    <strong>Valor:</strong> R$ {paymentInfo.valor?.toFixed(2)}
                  </p>
                </div>
              )}
              <p className="text-gray-600 mb-6">
                Você receberá uma notificação assim que seu acesso for liberado.
              </p>
              <div className="space-y-3">
                <Link to="/admin/dashboard">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Ir para Meu Painel
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    Voltar ao Início
                  </Button>
                </Link>
              </div>
            </>
          )}

          {status === 'pending' && (
            <>
              <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Pagamento em Processamento
              </h1>
              <p className="text-gray-600 mb-6">
                Seu pagamento está sendo processado. Isso pode levar alguns minutos para pagamentos via PIX.
              </p>
              <Link to="/admin/dashboard">
                <Button className="w-full bg-red-600 hover:bg-red-700">
                  Verificar Status no Painel
                </Button>
              </Link>
            </>
          )}

          {(status === 'error' || status === 'failed') && (
            <>
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <span className="text-3xl">❌</span>
              </div>
              <h1 className="text-2xl font-bold text-gray-800 mb-2">
                Erro no Pagamento
              </h1>
              <p className="text-gray-600 mb-6">
                Não foi possível confirmar seu pagamento. Por favor, tente novamente ou entre em contato com o suporte.
              </p>
              <div className="space-y-3">
                <Link to="/planos">
                  <Button className="w-full bg-red-600 hover:bg-red-700">
                    Tentar Novamente
                  </Button>
                </Link>
                <Link to="/">
                  <Button variant="outline" className="w-full">
                    Voltar ao Início
                  </Button>
                </Link>
              </div>
            </>
          )}

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PagamentoSucesso;
