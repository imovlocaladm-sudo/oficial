import React from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { XCircle } from 'lucide-react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Button } from '../components/ui/button';

const PagamentoCancelado = () => {
  const [searchParams] = useSearchParams();
  const paymentId = searchParams.get('payment_id');

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
          
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-8 h-8 text-gray-500" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Pagamento Cancelado
          </h1>
          
          <p className="text-gray-600 mb-6">
            Você cancelou o processo de pagamento. Nenhuma cobrança foi realizada.
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-700">
              Caso tenha tido algum problema, entre em contato conosco pelo WhatsApp ou email.
            </p>
          </div>
          
          <div className="space-y-3">
            <Link to="/planos">
              <Button className="w-full bg-red-600 hover:bg-red-700">
                Ver Planos Novamente
              </Button>
            </Link>
            <Link to="/">
              <Button variant="outline" className="w-full">
                Voltar ao Início
              </Button>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PagamentoCancelado;
